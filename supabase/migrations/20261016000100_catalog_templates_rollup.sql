-- ============================================================================
-- 20261016000100_catalog_templates_rollup.sql
--
-- Version 2 of the KPI platform:
--   1. kpi_catalog: platform-wide, read-only reference data (measures, KPIs,
--      industry templates, role templates). Loaded by database/catalog-seed.sql.
--   2. Tenant tables remember where a KPI or role came from.
--   3. Provisioning: an operator creates an organisation from a template, with
--      the owner and any number of members, each with roles. The operator never
--      reads customer values; the functions return only ids.
--   4. Roll-up: a parent unit's inputs can be calculated from its children.
--   5. Customers can add a catalog KPI to their own organisation.
-- ============================================================================
begin;

-- 1. Catalog (global reference data, never tenant data) ---------------------
create schema if not exists kpi_catalog;
revoke all on schema kpi_catalog from public, anon, authenticated, service_role;
grant usage on schema kpi_catalog to kpi_app, kpi_control_app;

create table kpi_catalog.measures (
 key text primary key check(key ~ '^[a-z][a-z0-9_]{0,63}$'),
 name text not null, unit text not null, description text not null,
 rolls_up boolean not null default true, domain text not null
);
create table kpi_catalog.kpis (
 id text primary key check(id ~ '^[A-Z]{2,4}-[0-9]{3}$'),
 name text not null, description text not null, domain text not null,
 industries text[] not null, formula jsonb not null, formula_text text not null,
 unit text not null,
 direction text not null check(direction in ('higher','lower','neutral')),
 measures text[] not null, needs_history boolean not null default false,
 sources text[] not null default '{}'
);
create index catalog_kpis_domain on kpi_catalog.kpis(domain);
create table kpi_catalog.templates (
 id text primary key, name text not null, industry text not null, description text not null
);
create table kpi_catalog.template_roles (
 template_id text not null references kpi_catalog.templates on delete cascade,
 role_key text not null check(role_key ~ '^[a-z][a-z0-9_]{0,40}$'),
 name text not null, description text not null,
 capabilities text[] not null, position integer not null,
 primary key(template_id, role_key)
);
create table kpi_catalog.template_role_kpis (
 template_id text not null, role_key text not null,
 kpi_id text not null references kpi_catalog.kpis, position integer not null,
 primary key(template_id, role_key, kpi_id),
 foreign key(template_id, role_key) references kpi_catalog.template_roles on delete cascade
);
revoke all on all tables in schema kpi_catalog from public, anon, authenticated, service_role;
grant select on all tables in schema kpi_catalog to kpi_app, kpi_control_app;

-- 2. Provenance on tenant tables -------------------------------------------
alter table kpi.measures
 add column description text not null default '',
 add column rolls_up boolean not null default true;
alter table kpi.definitions
 add column domain text,
 add column catalog_id text,
 add column sort_order integer not null default 0;
alter table kpi.roles add column template_key text;
create unique index roles_template_key on kpi.roles(tenant_id, template_key) where template_key is not null;

alter table kpi_control.registry add column template_id text;

-- 3. Templates ---------------------------------------------------------------
-- Copies a template into a new organisation: its measures, active KPI
-- definitions, roles and grants. Called only from provisioning (definer).
create function kpi.apply_template(t uuid, tpl text, actor uuid) returns void
language plpgsql security definer set search_path='' as $$
declare r record; rid uuid; cap text;
begin
 if not exists(select 1 from kpi_catalog.templates where id=tpl) then
  raise exception 'Unknown template' using errcode='22023';
 end if;

 insert into kpi.measures(tenant_id,key,name,unit,description,rolls_up)
  select distinct t, m.key, m.name, m.unit, m.description, m.rolls_up
  from kpi_catalog.template_role_kpis x
  join kpi_catalog.kpis c on c.id=x.kpi_id
  cross join lateral unnest(c.measures) as u(mkey)
  join kpi_catalog.measures m on m.key=u.mkey
  where x.template_id=tpl
 on conflict (tenant_id,key) do nothing;

 insert into kpi.definitions(tenant_id,key,version,name,description,unit,formula,direction,target,state,created_by,domain,catalog_id,sort_order)
  select t, lower(replace(c.id,'-','_')), 1, c.name, c.description, c.unit, c.formula, c.direction, null, 'draft', actor, c.domain, c.id,
         (select min(x2.position) from kpi_catalog.template_role_kpis x2 where x2.template_id=tpl and x2.kpi_id=c.id)
  from kpi_catalog.kpis c
  where c.id in (select kpi_id from kpi_catalog.template_role_kpis where template_id=tpl);
 update kpi.definitions set state='active', approved_by=actor
  where tenant_id=t and catalog_id is not null and state='draft';

 for r in select * from kpi_catalog.template_roles where template_id=tpl order by position loop
  insert into kpi.roles(tenant_id,name,template_key) values(t, r.name, r.role_key) returning id into rid;
  foreach cap in array r.capabilities loop
   insert into kpi.grants(tenant_id,role_id,capability) values(t, rid, cap);
  end loop;
  insert into kpi.grants(tenant_id,role_id,capability,kpi_id)
   select t, rid, 'view', d.id
   from kpi_catalog.template_role_kpis x
   join kpi.definitions d on d.tenant_id=t and d.catalog_id=x.kpi_id
   where x.template_id=tpl and x.role_key=r.role_key;
 end loop;
end $$;

-- Validates a members array and creates one pending invitation for each.
-- members: [{"email": "...", "roleKeys": ["coo"], "tokenHash": "<64 hex>"}]
create function kpi_control.add_invitations(t uuid, members jsonb) returns integer
language plpgsql security definer set search_path='' as $$
declare m jsonb; keys text[]; rids uuid[]; n integer := 0;
begin
 if members is null or jsonb_typeof(members) <> 'array' then raise exception 'Invalid members' using errcode='22023'; end if;
 if jsonb_array_length(members) > 500 then raise exception 'Too many members' using errcode='22023'; end if;
 for m in select * from jsonb_array_elements(members) loop
  if coalesce(m->>'email','') !~ '^[^@[:space:]]+@[^@[:space:]]+[.][^@[:space:]]+$' then raise exception 'Invalid email' using errcode='22023'; end if;
  if coalesce(m->>'tokenHash','') !~ '^[a-f0-9]{64}$' then raise exception 'Invalid token' using errcode='22023'; end if;
  if jsonb_typeof(m->'roleKeys') <> 'array' or jsonb_array_length(m->'roleKeys') < 1 then raise exception 'Choose at least one role' using errcode='22023'; end if;
  select array_agg(distinct k) into keys from jsonb_array_elements_text(m->'roleKeys') as e(k);
  select array_agg(id) into rids from kpi.roles where tenant_id=t and template_key = any(keys);
  if coalesce(array_length(rids,1),0) <> array_length(keys,1) then raise exception 'Unknown role' using errcode='22023'; end if;
  insert into kpi.invitations(tenant_id,email,token_hash,role_ids) values(t, m->>'email', m->>'tokenHash', rids);
  n := n + 1;
 end loop;
 return n;
end $$;

-- Operator: new organisation from a template, with its owner and members.
create function kpi_control.provision_with_template(n text, e text, h text, tpl text, members jsonb) returns uuid
language plpgsql security definer set search_path='' as $$
declare t uuid;
begin
 if not kpi.is_platform() then raise exception 'Operator required' using errcode='42501'; end if;
 t := kpi_control.provision(n, e, h);
 if tpl is not null then
  perform kpi.apply_template(t, tpl, kpi.subject());
  update kpi_control.registry set template_id=tpl where id=t;
  perform kpi_control.add_invitations(t, coalesce(members,'[]'::jsonb));
 end if;
 return t;
end $$;

-- Operator: add more members to an organisation they provisioned.
create function kpi_control.invite_members(t uuid, members jsonb) returns integer
language plpgsql security definer set search_path='' as $$
begin
 if not kpi.is_platform() or not exists(select 1 from kpi_control.registry where id=t) then
  raise exception 'Operator required' using errcode='42501';
 end if;
 insert into kpi.audit(tenant_id,subject,event) values(t, kpi.subject(), 'members.invited_by_operator');
 return kpi_control.add_invitations(t, members);
end $$;

-- 4. Customer adds a catalog KPI as a draft -------------------------------
create function kpi.add_catalog_kpi(t uuid, cid text) returns uuid
language plpgsql security definer set search_path='' as $$
declare c kpi_catalog.kpis; did uuid; v integer; k text;
begin
 if not kpi.allowed(t,'configure') then raise exception 'Configuration forbidden' using errcode='42501'; end if;
 select * into c from kpi_catalog.kpis where id=cid;
 if not found then raise exception 'Unknown catalog KPI' using errcode='22023'; end if;
 insert into kpi.measures(tenant_id,key,name,unit,description,rolls_up)
  select t, m.key, m.name, m.unit, m.description, m.rolls_up
  from kpi_catalog.measures m where m.key = any(c.measures)
 on conflict (tenant_id,key) do nothing;
 k := lower(replace(cid,'-','_'));
 select coalesce(max(version),0)+1 into v from kpi.definitions where tenant_id=t and key=k;
 insert into kpi.definitions(tenant_id,key,version,name,description,unit,formula,direction,target,state,created_by,domain,catalog_id)
  values(t,k,v,c.name,c.description,c.unit,c.formula,c.direction,null,'draft',kpi.subject(),c.domain,c.id)
  returning id into did;
 insert into kpi.audit(tenant_id,subject,event,resource_id) values(t, kpi.subject(), 'kpi.added_from_catalog', did);
 return did;
end $$;

-- 5. Roll-up ----------------------------------------------------------------
-- The unit, then its parent, up to the root. Empty unless the caller belongs to the tenant.
create function kpi.unit_chain(t uuid, u uuid) returns setof uuid
language sql stable security definer set search_path='' as $$
 with recursive up(id, parent_id) as (
  select x.id, x.parent_id from kpi.units x where x.tenant_id=t and x.id=u
  union all
  select p.id, p.parent_id from kpi.units p join up on p.id=up.parent_id where p.tenant_id=t
 ) select up.id from up where kpi.is_member(t)
$$;

-- Measure values for `target` over one exact period. A unit's own approved
-- figure wins; otherwise it is the sum of the units beneath it, counting the
-- topmost figure on each branch once. Measures that do not roll up use the
-- unit's own figure only. Caller must be able to approve for `source`, which is
-- `target` itself or one of its descendants.
create function kpi.rollup_inputs(t uuid, source uuid, target uuid, ps date, pe date)
returns table(measure text, value text, input_ids uuid[], origins text[])
language plpgsql stable security definer set search_path='' as $$
#variable_conflict use_column
begin
 if not kpi.allowed(t,'approve',source) then raise exception 'Approval forbidden' using errcode='42501'; end if;
 if target <> source and not exists(select 1 from kpi.unit_chain(t,source) as c(x) where c.x=target) then
  raise exception 'Not an ancestor of the source unit' using errcode='42501';
 end if;
 return query
 with recursive sub(id, parent_id) as (
  select u.id, u.parent_id from kpi.units u where u.tenant_id=t and u.id=target
  union all
  select u.id, u.parent_id from kpi.units u join sub s on u.parent_id=s.id where u.tenant_id=t
 ),
 own as (
  select distinct on (b.unit_id, i.measure) b.unit_id as unit_id, i.measure as measure, i.value as value, i.id as input_id, b.origin as origin
  from kpi.inputs i join kpi.batches b on b.tenant_id=i.tenant_id and b.id=i.batch_id
  where i.tenant_id=t and b.status='approved' and b.period_start=ps and b.period_end=pe
    and b.unit_id in (select id from sub)
  order by b.unit_id, i.measure, b.approved_at desc, b.id desc
 ),
 chain(unit_id, up_id) as (
  select s.id, s.id from sub s
  union all
  select c.unit_id, s.parent_id from chain c join sub s on s.id=c.up_id where c.up_id <> target and s.parent_id is not null
 ),
 usable as (
  select o.* from own o join kpi.measures m on m.tenant_id=t and m.key=o.measure
  where (m.rolls_up or o.unit_id=target)
    and not exists (
     select 1 from chain c join own o2 on o2.unit_id=c.up_id and o2.measure=o.measure
     where c.unit_id=o.unit_id and c.up_id <> o.unit_id)
 )
 select u.measure, sum(u.value)::text, array_agg(u.input_id), array_agg(distinct u.origin)
 from usable u group by u.measure;
end $$;

-- Stores one calculated result, for the source unit or one of its ancestors.
create function kpi.publish_result(t uuid, source uuid, target uuid, k uuid, ps date, pe date, val jsonb,
  input_ids uuid[], origins text[], tgt numeric, dir text, ontarget boolean, run uuid) returns uuid
language plpgsql security definer set search_path='' as $$
declare rid uuid;
begin
 if not kpi.allowed(t,'approve',source) then raise exception 'Approval forbidden' using errcode='42501'; end if;
 if target <> source and not exists(select 1 from kpi.unit_chain(t,source) as c(x) where c.x=target) then
  raise exception 'Not an ancestor of the source unit' using errcode='42501';
 end if;
 if not exists(select 1 from kpi.definitions d where d.tenant_id=t and d.id=k and d.state='active') then
  raise exception 'KPI is not active' using errcode='23503';
 end if;
 insert into kpi.results(tenant_id,kpi_id,unit_id,period_start,period_end,value,input_ids,origin,target,direction,on_target,run_id)
  values(t,k,target,ps,pe,val,input_ids,origins,tgt,dir,ontarget,run)
  returning id into rid;
 return rid;
end $$;

grant execute on function
 kpi.add_catalog_kpi(uuid,text), kpi.unit_chain(uuid,uuid),
 kpi.rollup_inputs(uuid,uuid,uuid,date,date),
 kpi.publish_result(uuid,uuid,uuid,uuid,date,date,jsonb,uuid[],text[],numeric,text,boolean,uuid)
 to kpi_app;
grant execute on function
 kpi_control.provision_with_template(text,text,text,text,jsonb),
 kpi_control.invite_members(uuid,jsonb)
 to kpi_control_app;

-- 6. A target can change without a new KPI version ---------------------------
-- The formula stays frozen. Only the target may change, and only the owner can
-- change it. Stored results are brought in line so the dashboard never shows a
-- stale on-target flag.
create or replace function kpi.freeze_definition() returns trigger language plpgsql set search_path='' as $$ begin
 if (to_jsonb(new)-'state'-'approved_by'-'target') is distinct from (to_jsonb(old)-'state'-'approved_by'-'target') then
  raise exception 'Create a new definition version instead';
 end if;
 if old.state='retired' or (old.state='active' and new.state not in ('active','retired')) then raise exception 'Invalid definition transition'; end if;
 return new;
end $$;

create function kpi.set_target(t uuid, d uuid, tgt numeric) returns void
language plpgsql security definer set search_path='' as $$
declare st text;
begin
 if not kpi.is_owner(t) then raise exception 'Owner required' using errcode='42501'; end if;
 select state into st from kpi.definitions where tenant_id=t and id=d for update;
 if st is null or st='retired' then raise exception 'Definition unavailable' using errcode='22023'; end if;
 update kpi.definitions set target=tgt where tenant_id=t and id=d;
 update kpi.results r set target=tgt, on_target = case
   when tgt is null or r.direction='neutral' or r.value->>'status' <> 'available' then null
   when r.direction='higher' then (r.value->>'value')::numeric >= tgt
   else (r.value->>'value')::numeric <= tgt end
  where r.tenant_id=t and r.kpi_id=d;
 insert into kpi.audit(tenant_id,subject,event,resource_id) values(t, kpi.subject(), 'kpi.target_changed', d);
end $$;
grant execute on function kpi.set_target(uuid,uuid,numeric) to kpi_app;

commit;

