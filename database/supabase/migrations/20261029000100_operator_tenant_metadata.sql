-- ============================================================================
-- 20261029000100_operator_tenant_metadata.sql
--
-- Operator-safe commercial metadata and owner credential status. The control
-- plane may see these fields and aggregate headcounts, but never definitions,
-- inputs, results, actions, or other customer business data.
-- ============================================================================
begin;

alter table kpi_control.registry
 add column industry text not null default 'Other',
 add column plan text not null default 'Pilot',
 add column subscription_status text not null default 'trial'
   check (subscription_status in ('trial','active','past_due','cancelled')),
 add column owner_name text,
 add column owner_password_reset_at timestamptz;

-- Submission is KPI-scoped just like viewing. Migrate legacy contributor
-- roles that viewed selected KPIs but could previously submit every measure.
alter table kpi.grants drop constraint if exists grants_check;
alter table kpi.grants add constraint grants_kpi_scope_check
 check(capability not in ('configure','approve') or kpi_id is null);

insert into kpi.grants(tenant_id,role_id,capability,unit_id,kpi_id)
select distinct s.tenant_id, s.role_id, 'submit', s.unit_id, v.kpi_id
from kpi.grants s
join kpi.grants v on v.tenant_id=s.tenant_id and v.role_id=s.role_id
where s.capability='submit' and s.kpi_id is null
 and v.capability='view' and v.kpi_id is not null
 and not exists(
  select 1 from kpi.grants all_view
  where all_view.tenant_id=s.tenant_id and all_view.role_id=s.role_id
   and all_view.capability='view' and all_view.kpi_id is null
 )
 and not exists(
  select 1 from kpi.grants existing
  where existing.tenant_id=s.tenant_id and existing.role_id=s.role_id
   and existing.capability='submit' and existing.unit_id is not distinct from s.unit_id
   and existing.kpi_id=v.kpi_id
 );

delete from kpi.grants s
where s.capability='submit' and s.kpi_id is null
 and exists(
  select 1 from kpi.grants v
  where v.tenant_id=s.tenant_id and v.role_id=s.role_id
   and v.capability='view' and v.kpi_id is not null
 )
 and not exists(
  select 1 from kpi.grants all_view
  where all_view.tenant_id=s.tenant_id and all_view.role_id=s.role_id
   and all_view.capability='view' and all_view.kpi_id is null
 );

-- A batch is a container for several measure rows, so its authorization check
-- has no single KPI id. A matching KPI-scoped submit grant may create that
-- container; the input policy below still validates every measure in it.
create or replace function kpi.allowed(t uuid, c text, u uuid default null, k uuid default null) returns boolean
language sql stable security definer set search_path='' as $$
 select kpi.is_member(t) and (kpi.is_owner(t) or exists(
  select 1 from kpi.memberships m join kpi.member_roles mr on mr.tenant_id=m.tenant_id and mr.member_id=m.id
  join kpi.grants g on g.tenant_id=mr.tenant_id and g.role_id=mr.role_id
  where m.tenant_id=t and m.subject=kpi.subject() and m.active and g.capability=c
   and (g.kpi_id is null or (c='submit' and k is null) or exists(
    select 1 from kpi.definitions anchor join kpi.definitions requested
     on requested.tenant_id=anchor.tenant_id and requested.key=anchor.key
    where anchor.tenant_id=t and anchor.id=g.kpi_id and requested.id=k
   ))
   and (g.unit_id is null or g.unit_id in (
    with recursive ancestors as (
     select id,parent_id from kpi.units where tenant_id=t and id=u
     union all select p.id,p.parent_id from kpi.units p join ancestors a on a.parent_id=p.id where p.tenant_id=t
    ) select id from ancestors
   ))
 ))
$$;

-- Preserve the owner/member name supplied during login provisioning. Existing
-- scripted clients may omit it, in which case the email prefix remains the
-- display name for backwards compatibility.
create or replace function kpi_control.add_people(t uuid, members jsonb) returns integer
language plpgsql security definer set search_path='' as $$
declare m jsonb; keys text[]; ids_in uuid[]; rids uuid[]; sub uuid; mid uuid; n integer := 0; is_owner boolean; display text;
begin
 if members is null or jsonb_typeof(members) <> 'array' or jsonb_array_length(members) = 0 then
  raise exception 'Invalid members' using errcode='22023';
 end if;
 if jsonb_array_length(members) > 500 then raise exception 'Too many members' using errcode='22023'; end if;
 for m in select * from jsonb_array_elements(members) loop
  if coalesce(m->>'email','') !~ '^[^@[:space:]]+@[^@[:space:]]+[.][^@[:space:]]+$' then raise exception 'Invalid email' using errcode='22023'; end if;
  display := coalesce(nullif(btrim(m->>'displayName'),''), split_part(m->>'email','@',1));
  if length(display) > 120 then raise exception 'Invalid display name' using errcode='22023'; end if;
  is_owner := coalesce((m->>'owner')::boolean, false);
  keys := '{}'; ids_in := '{}';
  if jsonb_typeof(m->'roleKeys') = 'array' then
   select coalesce(array_agg(distinct k), '{}') into keys from jsonb_array_elements_text(m->'roleKeys') as e(k);
  end if;
  if jsonb_typeof(m->'roleIds') = 'array' then
   select coalesce(array_agg(distinct r::uuid), '{}') into ids_in from jsonb_array_elements_text(m->'roleIds') as e(r);
  end if;
  if not is_owner and cardinality(keys) + cardinality(ids_in) = 0 then raise exception 'Choose at least one role' using errcode='22023'; end if;
  if exists(select 1 from kpi.memberships where tenant_id=t and lower(email)=lower(m->>'email'))
     or exists(select 1 from kpi.invitations where tenant_id=t and lower(email)=lower(m->>'email') and accepted_at is null and expires_at>now()) then
   raise exception 'This person is already in the organization or already invited' using errcode='23505';
  end if;
  rids := '{}';
  if cardinality(keys) > 0 then
   select coalesce(array_agg(id), '{}') into rids from kpi.roles where tenant_id=t and template_key = any(keys);
   if cardinality(rids) <> cardinality(keys) then raise exception 'Unknown role' using errcode='22023'; end if;
  end if;
  if cardinality(ids_in) > 0 then
   if (select count(*) from kpi.roles where tenant_id=t and id = any(ids_in)) <> cardinality(ids_in) then
    raise exception 'Unknown role' using errcode='22023';
   end if;
   rids := (select array_agg(distinct x) from unnest(rids || ids_in) as u(x));
  end if;
  if m ? 'subject' then
   sub := (m->>'subject')::uuid;
   if exists(select 1 from kpi_control.operators where subject=sub) then
    raise exception 'An operator account cannot join an organization' using errcode='22023';
   end if;
   insert into kpi.memberships(tenant_id,subject,owner,display_name,email)
    values(t, sub, is_owner, display, lower(m->>'email')) returning id into mid;
   insert into kpi.member_roles(tenant_id,member_id,role_id) select t, mid, unnest(rids);
   insert into kpi.audit(tenant_id,subject,event,resource_id)
    values(t, kpi.subject(), case when kpi.is_platform() then 'member.created_by_operator' else 'member.created_by_owner' end, mid);
  else
   if coalesce(m->>'tokenHash','') !~ '^[a-f0-9]{64}$' then raise exception 'Invalid token' using errcode='22023'; end if;
   insert into kpi.invitations(tenant_id,email,token_hash,owner,role_ids)
    values(t, m->>'email', m->>'tokenHash', is_owner, rids);
  end if;
  n := n + 1;
 end loop;
 return n;
end $$;

create function kpi_control.record_profile(
 t uuid, industry_in text, plan_in text, owner_name_in text, subscription_status_in text
) returns void
language plpgsql security definer set search_path='' as $$
begin
 if not kpi.is_platform() or not exists(select 1 from kpi_control.registry where id=t) then
  raise exception 'Operator required' using errcode='42501';
 end if;
 if nullif(btrim(industry_in),'') is null or length(btrim(industry_in)) > 120 then
  raise exception 'Invalid industry' using errcode='22023';
 end if;
 if nullif(btrim(plan_in),'') is null or length(btrim(plan_in)) > 80 then
  raise exception 'Invalid plan' using errcode='22023';
 end if;
 if nullif(btrim(owner_name_in),'') is null or length(btrim(owner_name_in)) > 120 then
  raise exception 'Invalid owner name' using errcode='22023';
 end if;
 if subscription_status_in not in ('trial','active','past_due','cancelled') then
  raise exception 'Invalid subscription status' using errcode='22023';
 end if;
 update kpi_control.registry set
  industry=btrim(industry_in), plan=btrim(plan_in), owner_name=btrim(owner_name_in),
  subscription_status=subscription_status_in
 where id=t;
end $$;

-- Called only after the identity API has accepted an emailed code and changed
-- the caller's password. It marks every organization that caller owns without
-- exposing membership or customer data to the identity process.
create function kpi.mark_owner_credentials_verified() returns void
language sql security definer set search_path='' as $$
 update kpi_control.registry r set owner_password_reset_at=coalesce(r.owner_password_reset_at, now())
 where exists(
  select 1 from kpi.memberships m
  where m.tenant_id=r.id and m.subject=kpi.subject() and m.owner and m.active
 )
$$;

-- Returns only input keys the caller may submit at this unit. It deliberately
-- does not return KPI definitions or formula trees to submit-only roles.
create function kpi.submittable_measure_keys(t uuid, u uuid)
returns table(measure_key text)
language sql stable security definer set search_path='' as $$
 with recursive permitted as (
  select d.formula as node
  from kpi.definitions d
  where d.tenant_id=t and d.state='active' and kpi.allowed(t,'submit',u,d.id)
 ), nodes(node) as (
  select node from permitted
  union all
  select child.node
  from nodes n
  cross join lateral (
   select n.node->'left' as node where n.node ? 'left'
   union all select n.node->'right' where n.node ? 'right'
   union all select n.node->'arg' where n.node ? 'arg'
  ) child
 )
 select distinct node->>'key' from nodes
 where node->>'op'='measure' and node->>'key' is not null
 order by 1
$$;

-- Contributors see their own check-ins and can write only formula inputs for
-- KPIs assigned to them. Approvers and owners retain unit-wide review access.
drop policy batch_read on kpi.batches;
create policy batch_read on kpi.batches for select to kpi_app using(
 kpi.allowed(tenant_id,'approve',unit_id)
 or (submitted_by=kpi.subject() and kpi.allowed(tenant_id,'submit',unit_id))
);
drop policy input_read on kpi.inputs;
create policy input_read on kpi.inputs for select to kpi_app using(exists(
 select 1 from kpi.batches b where b.tenant_id=inputs.tenant_id and b.id=inputs.batch_id
 and (kpi.allowed(b.tenant_id,'approve',b.unit_id)
  or (b.submitted_by=kpi.subject() and inputs.measure in (
   select measure_key from kpi.submittable_measure_keys(b.tenant_id,b.unit_id)
  )))
));
drop policy input_create on kpi.inputs;
create policy input_create on kpi.inputs for insert to kpi_app with check(exists(
 select 1 from kpi.batches b where b.tenant_id=inputs.tenant_id and b.id=inputs.batch_id
 and b.status='submitted' and b.submitted_by=kpi.subject()
 and kpi.allowed(b.tenant_id,'submit',b.unit_id)
 and inputs.measure in (select measure_key from kpi.submittable_measure_keys(b.tenant_id,b.unit_id))
));

drop function kpi_control.list_organizations();
create or replace function kpi_control.list_organizations() returns table(
 id uuid, name text, industry text, plan text, subscription_status text,
 template_id text, status text, status_changed_at timestamptz, purge_after timestamptz,
 owner_name text, owner_email text, owner_email_verified_at timestamptz,
 credential_status text, user_count integer, role_count integer)
language sql stable security definer set search_path='' as $$
 select r.id, o.name, r.industry, r.plan, r.subscription_status,
  r.template_id, o.status, o.status_changed_at, o.purge_after,
  r.owner_name, r.owner_email, r.owner_email_verified_at,
  case when r.owner_password_reset_at is null then 'pending_reset' else 'verified' end,
  (select count(*)::integer from kpi.memberships m where m.tenant_id=r.id and m.active),
  (select count(*)::integer from kpi.roles x where x.tenant_id=r.id)
 from kpi_control.registry r join kpi.organizations o on o.id=r.id
 where kpi.is_platform() order by o.name, r.id
$$;

grant execute on function
 kpi_control.record_profile(uuid,text,text,text,text),
 kpi_control.list_organizations()
 to kpi_control_app;
grant execute on function kpi.mark_owner_credentials_verified() to kpi_identity_app;
grant execute on function kpi.submittable_measure_keys(uuid,uuid) to kpi_app;

revoke execute on all functions in schema kpi, kpi_control, kpi_catalog from public;

commit;
