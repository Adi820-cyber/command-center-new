-- ============================================================================
-- 20261021000100_org_lifecycle.sql
--
-- The service provider's lifecycle for a business organization:
--
--   pending -> active <-> suspended -> deleted -> (restored to suspended)
--                                          \-> permanently deleted after 30 days
--
-- ONE enforcement point. kpi.is_member and kpi.is_owner are what every access
-- rule already calls, so requiring an active organization there stops everyone
-- in a pending, suspended or deleted organization at the database. No route has
-- to remember a check.
--
-- Permanent deletion erases the organization's data and returns the logins that
-- belong to no other organization, so the control API can remove them too.
-- ============================================================================
begin;

alter table kpi.organizations
 add column status text not null default 'active' check (status in ('pending','active','suspended','deleted')),
 add column status_changed_at timestamptz not null default now(),
 add column deleted_at timestamptz,
 add column purge_after timestamptz;

-- The operator states that they verified the owner's email, and when.
alter table kpi_control.registry
 add column owner_email text,
 add column owner_email_verified_by uuid,
 add column owner_email_verified_at timestamptz;

-- What happened to each organization, kept even after it is permanently deleted.
create table kpi_control.lifecycle (
 id uuid primary key default gen_random_uuid(),
 tenant_id uuid not null, name text not null, event text not null,
 actor uuid not null, at timestamptz not null default now()
);
alter table kpi_control.lifecycle enable row level security;
alter table kpi_control.lifecycle force row level security;
create policy lifecycle_read on kpi_control.lifecycle for select to kpi_control_app using(kpi_control.is_operator());
grant select on kpi_control.lifecycle to kpi_control_app;
create index lifecycle_tenant on kpi_control.lifecycle(tenant_id, at desc);

-- Access rules: a member or owner of an organization that is not active has no access.
create or replace function kpi.is_member(t uuid) returns boolean language sql stable security definer set search_path='' as $$
 select not kpi.is_platform() and exists(
  select 1 from kpi.memberships m join kpi.organizations o on o.id=m.tenant_id
  where m.tenant_id=t and m.subject=kpi.subject() and m.active and o.status='active')
$$;
create or replace function kpi.is_owner(t uuid) returns boolean language sql stable security definer set search_path='' as $$
 select not kpi.is_platform() and exists(
  select 1 from kpi.memberships m join kpi.organizations o on o.id=m.tenant_id
  where m.tenant_id=t and m.subject=kpi.subject() and m.active and m.owner and o.status='active')
$$;

-- The person's own organizations with their status, so the web can explain "suspended"
-- instead of showing an empty page. Lists only organizations the caller belongs to.
create function kpi.my_organizations() returns table(id uuid, name text, owner boolean, status text)
language sql stable security definer set search_path='' as $$
 select o.id, o.name, m.owner, o.status
 from kpi.memberships m join kpi.organizations o on o.id=m.tenant_id
 where m.subject=kpi.subject() and m.active and not kpi.is_platform()
$$;

-- Records how an organization was created: its first status and the operator's
-- statement that the owner's email was verified. Runs in the same step as creation.
create function kpi_control.record_creation(t uuid, do_activate boolean, email_in text, verified boolean) returns void
language plpgsql security definer set search_path='' as $$
declare nm text;
begin
 if not kpi.is_platform() or not exists(select 1 from kpi_control.registry where id=t) then
  raise exception 'Operator required' using errcode='42501';
 end if;
 if verified is not true then raise exception 'Confirm that the owner''s email was verified' using errcode='22023'; end if;
 update kpi.organizations set status = case when do_activate then 'active' else 'pending' end, status_changed_at = now() where id=t returning name into nm;
 update kpi_control.registry set owner_email = lower(btrim(email_in)), owner_email_verified_by = kpi.subject(), owner_email_verified_at = now() where id=t;
 insert into kpi_control.lifecycle(tenant_id,name,event,actor) values(t, nm, 'created', kpi.subject());
 if do_activate then insert into kpi_control.lifecycle(tenant_id,name,event,actor) values(t, nm, 'activated', kpi.subject()); end if;
end $$;

-- The operator's list: every organization with its status. No customer data.
create function kpi_control.list_organizations() returns table(
 id uuid, name text, template_id text, status text, status_changed_at timestamptz, purge_after timestamptz,
 owner_email text, owner_email_verified_at timestamptz)
language sql stable security definer set search_path='' as $$
 select r.id, o.name, r.template_id, o.status, o.status_changed_at, o.purge_after, r.owner_email, r.owner_email_verified_at
 from kpi_control.registry r join kpi.organizations o on o.id=r.id
 where kpi.is_platform() order by o.name, r.id
$$;

-- Moves an organization to a new status. Only these moves are allowed:
--   pending -> active | deleted      active -> suspended | deleted
--   suspended -> active | deleted    deleted -> suspended (restore)
create function kpi_control.set_org_status(t uuid, s text) returns void
language plpgsql security definer set search_path='' as $$
declare cur text; nm text;
begin
 if not kpi.is_platform() or not exists(select 1 from kpi_control.registry where id=t) then
  raise exception 'Operator required' using errcode='42501';
 end if;
 if s not in ('active','suspended','deleted') then raise exception 'Unknown status' using errcode='22023'; end if;
 select status, name into cur, nm from kpi.organizations where id=t for update;
 if not found then raise exception 'Unknown organization' using errcode='22023'; end if;
 if not ((cur='pending' and s in ('active','deleted'))
      or (cur='active' and s in ('suspended','deleted'))
      or (cur='suspended' and s in ('active','deleted'))
      or (cur='deleted' and s='suspended')) then
  raise exception 'An organization cannot move from % to %', cur, s using errcode='55000';
 end if;
 update kpi.organizations set status=s, status_changed_at=now(),
   deleted_at = case when s='deleted' then now() else null end,
   purge_after = case when s='deleted' then now() + interval '30 days' else null end
  where id=t;
 insert into kpi_control.lifecycle(tenant_id,name,event,actor)
  values(t, nm, case when cur='deleted' then 'restored' else s end, kpi.subject());
 insert into kpi.audit(tenant_id,subject,event) values(t, kpi.subject(), 'organization.status.' || s);
end $$;

-- Erases a deleted organization after its 30 days. Returns the logins that belong
-- to no other organization and are not operators, for the control API to remove.
create function kpi_control.purge_organization(t uuid) returns uuid[]
language plpgsql security definer set search_path='' as $$
declare st text; purge_at timestamptz; nm text; orphans uuid[];
begin
 if not kpi.is_platform() or not exists(select 1 from kpi_control.registry where id=t) then
  raise exception 'Operator required' using errcode='42501';
 end if;
 select status, purge_after, name into st, purge_at, nm from kpi.organizations where id=t for update;
 if not found then raise exception 'Unknown organization' using errcode='22023'; end if;
 if st <> 'deleted' then raise exception 'Delete the organization first' using errcode='55000'; end if;
 if purge_at is null or purge_at > now() then raise exception 'The 30-day retention period has not ended' using errcode='55000'; end if;

 select coalesce(array_agg(distinct m.subject), '{}') into orphans
 from kpi.memberships m
 where m.tenant_id=t
   and not exists(select 1 from kpi.memberships o where o.subject=m.subject and o.tenant_id<>t)
   and not exists(select 1 from kpi_control.operators op where op.subject=m.subject);

 delete from kpi.actions where tenant_id=t;
 delete from kpi.results where tenant_id=t;
 delete from kpi.inputs where tenant_id=t;
 delete from kpi.batches where tenant_id=t;
 delete from kpi.period_locks where tenant_id=t;
 delete from kpi.grants where tenant_id=t;
 delete from kpi.member_roles where tenant_id=t;
 delete from kpi.roles where tenant_id=t;
 delete from kpi.invitations where tenant_id=t;
 delete from kpi.proposals where tenant_id=t;
 delete from kpi.audit where tenant_id=t;
 delete from kpi.definitions where tenant_id=t;
 delete from kpi.measures where tenant_id=t;
 delete from kpi.units where tenant_id=t;
 delete from kpi.memberships where tenant_id=t;
 delete from kpi.organizations where id=t;
 delete from kpi_control.registry where id=t;
 insert into kpi_control.lifecycle(tenant_id,name,event,actor) values(t, nm, 'purged', kpi.subject());
 return orphans;
end $$;

grant execute on function kpi.my_organizations() to kpi_app;
grant execute on function
 kpi_control.record_creation(uuid,boolean,text,boolean),
 kpi_control.list_organizations(),
 kpi_control.set_org_status(uuid,text),
 kpi_control.purge_organization(uuid)
 to kpi_control_app;

revoke execute on all functions in schema kpi, kpi_control, kpi_catalog from public;

commit;
