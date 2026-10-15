-- Fresh SaaS project bootstrap. Do NOT run the legacy hospital migrations here.
-- No passwords, customer values, fixtures or legacy data deletions.
begin;
create schema if not exists kpi;
create schema if not exists kpi_control;
do $$ begin
  if not exists (select from pg_roles where rolname='kpi_app') then create role kpi_app nologin nosuperuser nobypassrls; end if;
  if not exists (select from pg_roles where rolname='kpi_control_app') then create role kpi_control_app nologin nosuperuser nobypassrls; end if;
end $$;
revoke all on schema kpi, kpi_control from public, anon, authenticated;
grant usage on schema kpi to kpi_app;
grant usage on schema kpi_control to kpi_control_app;
alter default privileges in schema kpi revoke execute on functions from public;
alter default privileges in schema kpi_control revoke execute on functions from public;

create table kpi_control.operators (subject uuid primary key, active boolean not null default true);
create table kpi_control.registry (id uuid primary key, name text not null, created_by uuid not null);
create table kpi.organizations (
 id uuid primary key default gen_random_uuid(), name text not null check(length(name) between 1 and 120),
 allow_self_approval boolean not null default false, created_at timestamptz not null default now()
);
create table kpi.memberships (
 id uuid primary key default gen_random_uuid(), tenant_id uuid not null references kpi.organizations,
 subject uuid not null, display_name text not null default 'Member', owner boolean not null default false, active boolean not null default true,
 unique(tenant_id,subject), unique(tenant_id,id)
);
create table kpi.units (
 id uuid primary key default gen_random_uuid(), tenant_id uuid not null references kpi.organizations,
 name text not null, kind text not null, parent_id uuid, unique(tenant_id,id),
 foreign key(tenant_id,parent_id) references kpi.units(tenant_id,id), check(parent_id is distinct from id)
);
create unique index one_root_per_tenant on kpi.units(tenant_id) where parent_id is null;
create table kpi.roles (id uuid primary key default gen_random_uuid(), tenant_id uuid not null references kpi.organizations, name text not null, unique(tenant_id,id), unique(tenant_id,name));
create table kpi.member_roles (
 tenant_id uuid not null, member_id uuid not null, role_id uuid not null,
 primary key(tenant_id,member_id,role_id), foreign key(tenant_id,member_id) references kpi.memberships(tenant_id,id),
 foreign key(tenant_id,role_id) references kpi.roles(tenant_id,id)
);
create table kpi.measures (tenant_id uuid not null references kpi.organizations, key text not null check(key ~ '^[a-z][a-z0-9_]{0,63}$'), name text not null, unit text not null, primary key(tenant_id,key));
create table kpi.definitions (
 id uuid primary key default gen_random_uuid(), tenant_id uuid not null references kpi.organizations,
 key text not null, version integer not null check(version>0), name text not null, description text not null, unit text not null,
 formula jsonb not null, direction text not null check(direction in ('higher','lower','neutral')), target numeric(30,10),
 state text not null default 'draft' check(state in ('draft','active','retired')),
 created_by uuid not null, approved_by uuid, created_at timestamptz not null default now(),
 unique(tenant_id,id), unique(tenant_id,key,version)
);
create unique index one_active_definition on kpi.definitions(tenant_id,key) where state='active';
create table kpi.grants (
 id uuid primary key default gen_random_uuid(), tenant_id uuid not null, role_id uuid not null,
 capability text not null check(capability in ('configure','submit','approve','view','act')),
 unit_id uuid, kpi_id uuid,
 foreign key(tenant_id,role_id) references kpi.roles(tenant_id,id),
 foreign key(tenant_id,unit_id) references kpi.units(tenant_id,id),
 foreign key(tenant_id,kpi_id) references kpi.definitions(tenant_id,id),
 -- Raw input permissions are unit-wide; never infer input access from KPI view.
 check(capability not in ('configure','submit','approve') or kpi_id is null),
 check(capability <> 'configure' or unit_id is null)
);
create table kpi.invitations (
 id uuid primary key default gen_random_uuid(), tenant_id uuid not null references kpi.organizations,
 email text not null, token_hash text not null unique, owner boolean not null default false,
 role_ids uuid[] not null default '{}', expires_at timestamptz not null default now()+interval '7 days',
 accepted_at timestamptz, created_at timestamptz not null default now()
);
create table kpi.batches (
 id uuid primary key default gen_random_uuid(), tenant_id uuid not null references kpi.organizations,
 unit_id uuid not null, period_start date not null, period_end date not null check(period_end>=period_start),
 status text not null default 'submitted' check(status in ('submitted','approved','rejected')),
 origin text not null check(origin in ('manual','import','synthetic')), submitted_by uuid not null,
 approved_by uuid, approved_at timestamptz, idempotency_key uuid not null, payload_hash text not null,
 created_at timestamptz not null default now(), unique(tenant_id,id), unique(tenant_id,idempotency_key),
 foreign key(tenant_id,unit_id) references kpi.units(tenant_id,id)
);
create table kpi.inputs (
 id uuid primary key default gen_random_uuid(), tenant_id uuid not null, batch_id uuid not null,
 measure text not null, value numeric(30,10) not null,
 unique(tenant_id,id), unique(tenant_id,batch_id,measure),
 foreign key(tenant_id,batch_id) references kpi.batches(tenant_id,id),
 foreign key(tenant_id,measure) references kpi.measures(tenant_id,key)
);
create table kpi.results (
 id uuid primary key default gen_random_uuid(), tenant_id uuid not null, kpi_id uuid not null, unit_id uuid not null,
 period_start date not null, period_end date not null, value jsonb not null, input_ids uuid[] not null,
 origin text[] not null, target numeric(30,10), direction text not null, on_target boolean,
 computed_at timestamptz not null default clock_timestamp(), run_id uuid not null,
 unique(tenant_id,id), unique(tenant_id,run_id,kpi_id),
 foreign key(tenant_id,kpi_id) references kpi.definitions(tenant_id,id),
 foreign key(tenant_id,unit_id) references kpi.units(tenant_id,id)
);
create table kpi.actions (
 id uuid primary key default gen_random_uuid(), tenant_id uuid not null, result_id uuid not null,
 title text not null, assignee_id uuid not null, due_date date not null,
 state text not null default 'open' check(state in ('open','in_progress','done')), version integer not null default 1,
 created_by uuid not null, unique(tenant_id,id),
 foreign key(tenant_id,result_id) references kpi.results(tenant_id,id),
 foreign key(tenant_id,assignee_id) references kpi.memberships(tenant_id,id)
);
create table kpi.proposals (
 id uuid primary key default gen_random_uuid(), tenant_id uuid not null references kpi.organizations,
 configuration jsonb not null, state text not null default 'pending' check(state in ('pending','accepted','rejected')),
 created_at timestamptz not null default now()
);
create table kpi.audit (
 id uuid primary key default gen_random_uuid(), tenant_id uuid not null references kpi.organizations,
 subject uuid not null, event text not null, resource_id uuid, created_at timestamptz not null default now()
);
create table kpi.period_locks (
 tenant_id uuid not null, unit_id uuid not null, period_start date not null, period_end date not null,
 primary key(tenant_id,unit_id,period_start,period_end),
 foreign key(tenant_id,unit_id) references kpi.units(tenant_id,id)
);

create function kpi.subject() returns uuid language sql stable as $$ select nullif(current_setting('kpi.subject',true),'')::uuid $$;
create function kpi.is_platform() returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from kpi_control.operators where subject=kpi.subject() and active)
$$;
create function kpi.is_member(t uuid) returns boolean language sql stable security definer set search_path='' as $$
 select not kpi.is_platform() and exists(select 1 from kpi.memberships where tenant_id=t and subject=kpi.subject() and active)
$$;
create function kpi.is_owner(t uuid) returns boolean language sql stable security definer set search_path='' as $$
 select not kpi.is_platform() and exists(select 1 from kpi.memberships where tenant_id=t and subject=kpi.subject() and active and owner)
$$;
create function kpi.allowed(t uuid, c text, u uuid default null, k uuid default null) returns boolean
 language sql stable security definer set search_path='' as $$
 select kpi.is_member(t) and (kpi.is_owner(t) or exists(
  select 1 from kpi.memberships m join kpi.member_roles mr on mr.tenant_id=m.tenant_id and mr.member_id=m.id
  join kpi.grants g on g.tenant_id=mr.tenant_id and g.role_id=mr.role_id
  where m.tenant_id=t and m.subject=kpi.subject() and m.active and g.capability=c
    and (g.kpi_id is null or exists(select 1 from kpi.definitions anchor join kpi.definitions requested on requested.tenant_id=anchor.tenant_id and requested.key=anchor.key where anchor.tenant_id=t and anchor.id=g.kpi_id and requested.id=k))
    and (g.unit_id is null or g.unit_id in (
      with recursive ancestors as (
       select id,parent_id from kpi.units where tenant_id=t and id=u
       union all select p.id,p.parent_id from kpi.units p join ancestors a on a.parent_id=p.id where p.tenant_id=t
      ) select id from ancestors
    ))
 ))
$$;
create function kpi.can_view_definition(t uuid,k uuid) returns boolean language sql stable security definer set search_path='' as $$
 select kpi.allowed(t,'configure') or exists(select 1 from kpi.units u where u.tenant_id=t and kpi.allowed(t,'view',u.id,k))
$$;

-- Enforce append-only evidence, and freeze active definition semantics.
create function kpi.freeze_definition() returns trigger language plpgsql set search_path='' as $$ begin
 if (to_jsonb(new)-'state'-'approved_by') is distinct from (to_jsonb(old)-'state'-'approved_by') then
  raise exception 'Create a new definition version instead';
 end if;
 if old.state='retired' or (old.state='active' and new.state<>'retired') then raise exception 'Invalid definition transition'; end if;
 return new;
end $$;
create trigger freeze_definition before update on kpi.definitions for each row execute function kpi.freeze_definition();

-- No API grants for hierarchy updates: parents are immutable in this release.
-- Inserts can only refer to existing nodes, preventing cycles.
do $$ declare tab text; begin
 foreach tab in array array['organizations','memberships','units','roles','member_roles','measures','definitions','grants','invitations','batches','inputs','results','actions','audit','period_locks','proposals'] loop
  execute format('alter table kpi.%I enable row level security',tab);
  execute format('alter table kpi.%I force row level security',tab);
 end loop;
end $$;
alter table kpi_control.operators enable row level security;
alter table kpi_control.operators force row level security;
create function kpi_control.is_operator() returns boolean language sql stable security definer set search_path='' as $$ select kpi.is_platform() $$;
alter table kpi_control.registry enable row level security;
alter table kpi_control.registry force row level security;
create policy registry_read on kpi_control.registry for select to kpi_control_app using(kpi_control.is_operator());
create policy proposal_read on kpi.proposals for select to kpi_app using(kpi.is_owner(tenant_id));
create policy proposal_decide on kpi.proposals for update to kpi_app using(kpi.is_owner(tenant_id) and state='pending') with check(kpi.is_owner(tenant_id) and state in ('accepted','rejected'));
create policy settings_change on kpi.organizations for update to kpi_app using(kpi.is_owner(id)) with check(kpi.is_owner(id));
create policy org_read on kpi.organizations for select to kpi_app using(kpi.is_member(id));
create policy member_read on kpi.memberships for select to kpi_app using(kpi.is_member(tenant_id));
create policy member_change on kpi.memberships for update to kpi_app using(kpi.is_owner(tenant_id) and not owner) with check(kpi.is_owner(tenant_id) and not owner);
create policy unit_read on kpi.units for select to kpi_app using(kpi.is_member(tenant_id));
create policy unit_create on kpi.units for insert to kpi_app with check(kpi.allowed(tenant_id,'configure'));
create policy role_read on kpi.roles for select to kpi_app using(kpi.is_owner(tenant_id));
create policy role_create on kpi.roles for insert to kpi_app with check(kpi.is_owner(tenant_id));
create policy grant_read on kpi.grants for select to kpi_app using(kpi.is_owner(tenant_id));
create policy grant_create on kpi.grants for insert to kpi_app with check(kpi.is_owner(tenant_id));
create policy binding_create on kpi.member_roles for insert to kpi_app with check(kpi.is_owner(tenant_id));
create policy binding_delete on kpi.member_roles for delete to kpi_app using(kpi.is_owner(tenant_id));
create policy binding_read on kpi.member_roles for select to kpi_app using(kpi.is_owner(tenant_id));
create policy measure_read on kpi.measures for select to kpi_app using(kpi.is_member(tenant_id));
create policy measure_create on kpi.measures for insert to kpi_app with check(kpi.allowed(tenant_id,'configure'));
create policy definition_read on kpi.definitions for select to kpi_app using(kpi.can_view_definition(tenant_id,id));
create policy definition_create on kpi.definitions for insert to kpi_app with check(kpi.allowed(tenant_id,'configure') and state='draft' and created_by=kpi.subject());
create policy definition_approve on kpi.definitions for update to kpi_app using(kpi.is_owner(tenant_id)) with check(kpi.is_owner(tenant_id));
create policy invite_create on kpi.invitations for insert to kpi_app with check(kpi.is_owner(tenant_id) and not owner);
create policy batch_read on kpi.batches for select to kpi_app using(kpi.allowed(tenant_id,'submit',unit_id) or kpi.allowed(tenant_id,'approve',unit_id));
create policy batch_create on kpi.batches for insert to kpi_app with check(kpi.allowed(tenant_id,'submit',unit_id) and submitted_by=kpi.subject() and status='submitted');
-- Approval is through the narrowly granted function, not arbitrary table update.
create policy input_read on kpi.inputs for select to kpi_app using(exists(select 1 from kpi.batches b where b.tenant_id=inputs.tenant_id and b.id=inputs.batch_id));
create policy input_create on kpi.inputs for insert to kpi_app with check(exists(select 1 from kpi.batches b where b.tenant_id=inputs.tenant_id and b.id=inputs.batch_id and b.status='submitted' and b.submitted_by=kpi.subject() and kpi.allowed(b.tenant_id,'submit',b.unit_id)));
create policy result_read on kpi.results for select to kpi_app using(kpi.allowed(tenant_id,'view',unit_id,kpi_id));
create policy result_create on kpi.results for insert to kpi_app with check(kpi.allowed(tenant_id,'approve',unit_id));
create policy action_read on kpi.actions for select to kpi_app using(exists(select 1 from kpi.results r where r.tenant_id=actions.tenant_id and r.id=actions.result_id));
create policy action_create on kpi.actions for insert to kpi_app with check(created_by=kpi.subject() and exists(select 1 from kpi.results r where r.tenant_id=actions.tenant_id and r.id=actions.result_id and kpi.allowed(r.tenant_id,'act',r.unit_id,r.kpi_id)));
create policy action_change on kpi.actions for update to kpi_app using(exists(select 1 from kpi.results r where r.tenant_id=actions.tenant_id and r.id=actions.result_id and kpi.allowed(r.tenant_id,'act',r.unit_id,r.kpi_id))) with check(exists(select 1 from kpi.results r where r.tenant_id=actions.tenant_id and r.id=actions.result_id and kpi.allowed(r.tenant_id,'act',r.unit_id,r.kpi_id)));
create policy audit_read on kpi.audit for select to kpi_app using(kpi.is_owner(tenant_id));
create policy audit_create on kpi.audit for insert to kpi_app with check(kpi.is_member(tenant_id) and subject=kpi.subject());
create policy lock_read on kpi.period_locks for select to kpi_app using(kpi.is_member(tenant_id));
create policy lock_create on kpi.period_locks for insert to kpi_app with check(kpi.is_owner(tenant_id));

create function kpi.approve_batch(t uuid,b uuid) returns void language plpgsql security definer set search_path='' as $$
 declare batch kpi.batches; self_allowed boolean;
 begin
  select * into batch from kpi.batches where tenant_id=t and id=b for update;
  if not found or not kpi.allowed(t,'approve',batch.unit_id) then raise exception 'Approval forbidden' using errcode='42501'; end if;
  if batch.status<>'submitted' then raise exception 'Batch already decided' using errcode='23505'; end if;
  select allow_self_approval into self_allowed from kpi.organizations where id=t;
  if batch.submitted_by=kpi.subject() and not self_allowed then raise exception 'Another reviewer must approve this batch' using errcode='42501'; end if;
  if exists(select 1 from kpi.period_locks where tenant_id=t and unit_id=batch.unit_id and period_start<=batch.period_end and period_end>=batch.period_start) then raise exception 'Period is locked' using errcode='23505'; end if;
  update kpi.batches set status='approved',approved_by=kpi.subject(),approved_at=clock_timestamp() where tenant_id=t and id=b;
 end
$$;
create function kpi.calculation_definitions(t uuid,u uuid)
returns table(id uuid,formula jsonb,target text,direction text) language plpgsql security definer set search_path='' as $$ begin
 if not kpi.allowed(t,'approve',u) then raise exception 'Approval forbidden' using errcode='42501'; end if;
 return query select d.id,d.formula,d.target::text,d.direction from kpi.definitions d where d.tenant_id=t and d.state='active';
end $$;
create function kpi.reject_batch(t uuid,b uuid) returns void language plpgsql security definer set search_path='' as $$
 declare batch kpi.batches;
 begin
  select * into batch from kpi.batches where tenant_id=t and id=b for update;
  if not found or not kpi.allowed(t,'approve',batch.unit_id) then raise exception 'Review forbidden' using errcode='42501'; end if;
  if batch.status<>'submitted' then raise exception 'Batch already decided' using errcode='23505'; end if;
  update kpi.batches set status='rejected',approved_by=kpi.subject() where tenant_id=t and id=b;
 end
$$;
create function kpi.accept_invitation(h text,e text) returns uuid language plpgsql security definer set search_path='' as $$
 declare inv kpi.invitations; mid uuid;
 begin
  if kpi.subject() is null or kpi.is_platform() then raise exception 'Invitation forbidden' using errcode='42501'; end if;
  select * into inv from kpi.invitations where token_hash=h and lower(email)=lower(e) and accepted_at is null and expires_at>now() for update;
  if not found then raise exception 'Invitation unavailable' using errcode='42501'; end if;
  insert into kpi.memberships(tenant_id,subject,owner,display_name) values(inv.tenant_id,kpi.subject(),inv.owner,split_part(e,'@',1)) returning id into mid;
  insert into kpi.member_roles(tenant_id,member_id,role_id) select inv.tenant_id,mid,unnest(inv.role_ids);
  update kpi.invitations set accepted_at=now() where id=inv.id;
  insert into kpi.audit(tenant_id,subject,event,resource_id) values(inv.tenant_id,kpi.subject(),'invitation.accepted',mid);
  return inv.tenant_id;
 end
$$;
create function kpi_control.provision(n text,e text,h text) returns uuid language plpgsql security definer set search_path='' as $$
 declare t uuid;
 begin
  if not kpi.is_platform() then raise exception 'Operator required' using errcode='42501'; end if;
  insert into kpi.organizations(name) values(n) returning id into t;
  insert into kpi_control.registry(id,name,created_by) values(t,n,kpi.subject());
  insert into kpi.units(tenant_id,name,kind) values(t,n,'Organization');
  insert into kpi.invitations(tenant_id,email,token_hash,owner) values(t,e,h,true);
  return t;
 end
$$;

create function kpi_control.propose(t uuid,p jsonb) returns uuid language plpgsql security definer set search_path='' as $$
 declare id uuid;
 begin
  if not kpi.is_platform() or not exists(select 1 from kpi_control.registry where registry.id=t) then raise exception 'Operator required' using errcode='42501'; end if;
  insert into kpi.proposals(tenant_id,configuration) values(t,p) returning proposals.id into id;
  return id;
 end
$$;
-- No control-plane listing of tenant content, definitions, files or results.
revoke all on all tables in schema kpi, kpi_control from public,anon,authenticated,service_role;
revoke all on all functions in schema kpi, kpi_control from public,anon,authenticated,service_role;
grant select on kpi_control.registry to kpi_control_app;
grant select on kpi.proposals to kpi_app;
grant update(state) on kpi.proposals to kpi_app;
grant update(allow_self_approval) on kpi.organizations to kpi_app;
grant select on kpi.organizations,kpi.memberships,kpi.units,kpi.roles,kpi.member_roles,kpi.measures,kpi.definitions,kpi.grants,kpi.batches,kpi.inputs,kpi.results,kpi.actions,kpi.audit,kpi.period_locks to kpi_app;
grant insert on kpi.units,kpi.roles,kpi.measures,kpi.definitions,kpi.grants,kpi.invitations,kpi.batches,kpi.inputs,kpi.results,kpi.actions,kpi.audit,kpi.period_locks to kpi_app;
grant update(state,approved_by) on kpi.definitions to kpi_app;
grant insert,delete on kpi.member_roles to kpi_app;
grant update(active) on kpi.memberships to kpi_app;
grant update(state,version) on kpi.actions to kpi_app;
grant execute on function kpi.subject(),kpi.is_platform(),kpi.is_member(uuid),kpi.is_owner(uuid),kpi.allowed(uuid,text,uuid,uuid),kpi.can_view_definition(uuid,uuid),kpi.approve_batch(uuid,uuid),kpi.accept_invitation(text,text),kpi.calculation_definitions(uuid,uuid),kpi.reject_batch(uuid,uuid) to kpi_app;
grant execute on function kpi_control.provision(text,text,text),kpi_control.is_operator(),kpi_control.propose(uuid,jsonb) to kpi_control_app;
create index membership_subject on kpi.memberships(subject,tenant_id) where active;
create index input_batch on kpi.inputs(tenant_id,batch_id);
create index batch_period on kpi.batches(tenant_id,unit_id,period_start,period_end,approved_at desc);
create index result_series on kpi.results(tenant_id,kpi_id,unit_id,period_start,computed_at desc);
commit;
