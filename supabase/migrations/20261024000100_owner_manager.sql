-- ============================================================================
-- 20261024000100_owner_manager.sql
--
-- The owner manages everything in their organization:
--   * stop using a KPI (or discard a draft); its history stays
--   * decide, from the KPI itself, which roles see it
--   * rename a unit, or delete one that nothing depends on
--   * reset a person's password (the identity API creates the new one)
--
-- Each function checks the owner (or the configure capability for units) in
-- the database, so the API layer is not the only guard.
-- ============================================================================
begin;

-- Stop using a KPI. Works on a draft (discard) or the active version. Stored
-- results are kept as history; a retired KPI is no longer calculated or shown.
create function kpi.retire_kpi(t uuid, d uuid) returns void
language plpgsql security definer set search_path='' as $$
declare st text;
begin
 if not kpi.is_owner(t) then raise exception 'Owner required' using errcode='42501'; end if;
 select state into st from kpi.definitions where tenant_id=t and id=d for update;
 if st is null then raise exception 'KPI not found' using errcode='22023'; end if;
 if st = 'retired' then raise exception 'That KPI is already retired' using errcode='55000'; end if;
 update kpi.definitions set state='retired' where tenant_id=t and id=d;
 insert into kpi.audit(tenant_id,subject,event,resource_id)
  values(t, kpi.subject(), case when st='draft' then 'kpi.discarded' else 'kpi.retired' end, d);
end $$;

-- Which roles see a KPI, decided from the KPI. Grants match a KPI by its key across
-- versions, so this works on every version. A role that sees every KPI is left as
-- it is. A role given the KPI gets "see results" for it in the place it already
-- works, and "assign actions" too if it can act on its KPIs.
create function kpi.set_kpi_audience(t uuid, d uuid, role_ids uuid[]) returns void
language plpgsql security definer set search_path='' as $$
declare k text; r record; scope uuid; acts boolean;
begin
 if not kpi.is_owner(t) then raise exception 'Owner required' using errcode='42501'; end if;
 select key into k from kpi.definitions where tenant_id=t and id=d and state='active';
 if k is null then raise exception 'Only an active KPI can be shown to roles' using errcode='55000'; end if;
 if exists(select 1 from unnest(coalesce(role_ids,'{}')) x(id) where not exists(select 1 from kpi.roles where tenant_id=t and roles.id=x.id)) then
  raise exception 'Unknown role' using errcode='22023';
 end if;
 for r in select id from kpi.roles where tenant_id=t loop
  -- a role that sees every KPI needs nothing
  if exists(select 1 from kpi.grants g where g.tenant_id=t and g.role_id=r.id and g.capability='view' and g.kpi_id is null) then continue; end if;
  -- remove this KPI (any version) from the role, then add it back if chosen
  delete from kpi.grants g using kpi.definitions v
   where g.tenant_id=t and g.role_id=r.id and g.capability in ('view','act')
     and v.tenant_id=t and v.id=g.kpi_id and v.key=k;
  if r.id = any(coalesce(role_ids,'{}')) then
   select g.unit_id into scope from kpi.grants g where g.tenant_id=t and g.role_id=r.id and g.capability <> 'configure' limit 1;
   acts := exists(select 1 from kpi.grants g where g.tenant_id=t and g.role_id=r.id and g.capability='act');
   insert into kpi.grants(tenant_id,role_id,capability,unit_id,kpi_id) values(t, r.id, 'view', scope, d);
   if acts and not exists(select 1 from kpi.grants g where g.tenant_id=t and g.role_id=r.id and g.capability='act' and g.kpi_id is null) then
    insert into kpi.grants(tenant_id,role_id,capability,unit_id,kpi_id) values(t, r.id, 'act', scope, d);
   end if;
  end if;
 end loop;
 insert into kpi.audit(tenant_id,subject,event,resource_id) values(t, kpi.subject(), 'kpi.audience_changed', d);
end $$;

create function kpi.rename_unit(t uuid, u uuid, n text, kd text) returns void
language plpgsql security definer set search_path='' as $$
begin
 if not kpi.allowed(t,'configure') then raise exception 'Configuration forbidden' using errcode='42501'; end if;
 if n is null or char_length(btrim(n)) not between 1 and 120 or kd is null or char_length(btrim(kd)) not between 1 and 60 then
  raise exception 'Invalid name' using errcode='22023';
 end if;
 update kpi.units set name=btrim(n), kind=btrim(kd) where tenant_id=t and id=u;
 if not found then raise exception 'Unit not found' using errcode='22023'; end if;
 insert into kpi.audit(tenant_id,subject,event,resource_id) values(t, kpi.subject(), 'unit.renamed', u);
end $$;

-- Deletes a unit only when nothing depends on it: not the top unit, no units under
-- it, no figures, results or locked periods, and no role limited to it.
create function kpi.delete_unit(t uuid, u uuid) returns void
language plpgsql security definer set search_path='' as $$
declare parent uuid;
begin
 if not kpi.allowed(t,'configure') then raise exception 'Configuration forbidden' using errcode='42501'; end if;
 select parent_id into parent from kpi.units where tenant_id=t and id=u for update;
 if not found then raise exception 'Unit not found' using errcode='22023'; end if;
 if parent is null then raise exception 'The top unit cannot be deleted' using errcode='55000'; end if;
 if exists(select 1 from kpi.units where tenant_id=t and parent_id=u) then raise exception 'Unit is in use: it has units under it' using errcode='55000'; end if;
 if exists(select 1 from kpi.batches where tenant_id=t and unit_id=u) or exists(select 1 from kpi.results where tenant_id=t and unit_id=u) then
  raise exception 'Unit is in use: it has figures or results' using errcode='55000';
 end if;
 if exists(select 1 from kpi.period_locks where tenant_id=t and unit_id=u) then raise exception 'Unit is in use: it has locked periods' using errcode='55000'; end if;
 if exists(select 1 from kpi.grants where tenant_id=t and unit_id=u) then raise exception 'Unit is in use: a role is limited to it' using errcode='55000'; end if;
 delete from kpi.units where tenant_id=t and id=u;
 insert into kpi.audit(tenant_id,subject,event,resource_id) values(t, kpi.subject(), 'unit.deleted', u);
end $$;

-- Before the identity API resets a person's password: the caller must own the
-- organization, and the person must be an active non-owner member who belongs to
-- no other organization and is not a platform operator. Otherwise one owner could
-- take over an account that also works somewhere else. Returns the login id.
create function kpi.prepare_password_reset(t uuid, member uuid) returns uuid
language plpgsql security definer set search_path='' as $$
declare sub uuid; is_owner_member boolean;
begin
 if not kpi.is_owner(t) then raise exception 'Owner required' using errcode='42501'; end if;
 select subject, owner into sub, is_owner_member from kpi.memberships where tenant_id=t and id=member and active;
 if sub is null then raise exception 'That person is not an active member' using errcode='22023'; end if;
 if is_owner_member then raise exception 'The owner changes their own password' using errcode='55000'; end if;
 if exists(select 1 from kpi.memberships where subject=sub and tenant_id<>t) then
  raise exception 'This person also belongs to another organization, so only they or the service provider can reset their password' using errcode='55000';
 end if;
 if exists(select 1 from kpi_control.operators where subject=sub) then raise exception 'Not allowed for this account' using errcode='55000'; end if;
 insert into kpi.audit(tenant_id,subject,event,resource_id) values(t, kpi.subject(), 'member.password_reset', member);
 return sub;
end $$;

grant execute on function
 kpi.retire_kpi(uuid,uuid),
 kpi.set_kpi_audience(uuid,uuid,uuid[]),
 kpi.rename_unit(uuid,uuid,text,text),
 kpi.delete_unit(uuid,uuid)
 to kpi_app;
grant execute on function kpi.prepare_password_reset(uuid,uuid) to kpi_identity_app;

revoke execute on all functions in schema kpi, kpi_control, kpi_catalog from public;

commit;
