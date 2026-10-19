-- ============================================================================
-- 20261027000100_kpi_scope.sql
--
-- Some KPIs only make sense for the whole organization: an agency's gross
-- margin after payroll, its revenue against the monthly target, its pipeline.
-- Their inputs are reported at the top unit, while other inputs they read (such
-- as revenue) are also reported by every client or branch. Without a scope,
-- each branch would show such a KPI as "waiting for" the top-level input.
--
-- scope 'all' (the default, as before): calculated for every unit.
-- scope 'top': calculated only for units without a parent.
--
-- Additive: existing KPIs and catalog entries become 'all'. A new version of a
-- KPI keeps the scope of the version before it.
-- ============================================================================
begin;

alter table kpi_catalog.kpis add column scope text not null default 'all' check (scope in ('all','top'));
alter table kpi.definitions add column scope text not null default 'all' check (scope in ('all','top'));

-- A new version keeps the scope of the latest earlier version.
create function kpi.inherit_definition_scope() returns trigger
language plpgsql set search_path='' as $$
begin
 if new.version > 1 then
  select d.scope into new.scope from kpi.definitions d
   where d.tenant_id = new.tenant_id and d.key = new.key and d.version < new.version
   order by d.version desc limit 1;
  new.scope := coalesce(new.scope, 'all');
 end if;
 return new;
end $$;
create trigger definitions_inherit_scope before insert on kpi.definitions
 for each row execute function kpi.inherit_definition_scope();

-- Templates and catalog additions copy the scope.
create or replace function kpi.apply_template(t uuid, tpl text, actor uuid) returns void
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

 insert into kpi.definitions(tenant_id,key,version,name,description,unit,formula,direction,target,state,created_by,domain,catalog_id,sort_order,scope)
  select t, lower(replace(c.id,'-','_')), 1, c.name, c.description, c.unit, c.formula, c.direction, null, 'draft', actor, c.domain, c.id,
         (select min(x2.position) from kpi_catalog.template_role_kpis x2 where x2.template_id=tpl and x2.kpi_id=c.id),
         c.scope
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

create or replace function kpi.add_catalog_kpi(t uuid, cid text) returns uuid
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
 insert into kpi.definitions(tenant_id,key,version,name,description,unit,formula,direction,target,state,created_by,domain,catalog_id,scope)
  values(t,k,v,c.name,c.description,c.unit,c.formula,c.direction,null,'draft',kpi.subject(),c.domain,c.id,c.scope)
  returning id into did;
 insert into kpi.audit(tenant_id,subject,event,resource_id) values(t, kpi.subject(), 'kpi.added_from_catalog', did);
 return did;
end $$;

-- The calculation needs the scope.
drop function kpi.calculation_definitions(uuid,uuid);
create function kpi.calculation_definitions(t uuid,u uuid)
returns table(id uuid,formula jsonb,target text,direction text,scope text) language plpgsql security definer set search_path='' as $$ begin
 if not kpi.allowed(t,'approve',u) then raise exception 'Approval forbidden' using errcode='42501'; end if;
 return query select d.id,d.formula,d.target::text,d.direction,d.scope from kpi.definitions d where d.tenant_id=t and d.state='active';
end $$;
grant execute on function kpi.calculation_definitions(uuid,uuid) to kpi_app;

revoke execute on all functions in schema kpi, kpi_control, kpi_catalog from public;

commit;
