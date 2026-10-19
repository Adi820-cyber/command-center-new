-- ============================================================================
-- 20261020000100_owner_management.sql
--
-- What an organization owner needs to run their own organization:
--   * rename it
--   * change a role: its name, what it can do, and which KPIs it sees
--   * delete a role nobody uses
--
-- Roles and grants were insert-only, so a role could never be changed. These
-- functions do the whole change in one step, for the owner of that organization
-- only. The foreign keys and checks on kpi.grants still decide what is valid
-- (a grant can only point at this organization's own units and KPIs).
-- ============================================================================
begin;

create function kpi.rename_organization(t uuid, n text) returns void
language plpgsql security definer set search_path='' as $$
begin
 if not kpi.is_owner(t) then raise exception 'Owner required' using errcode='42501'; end if;
 if n is null or char_length(btrim(n)) not between 1 and 120 then raise exception 'Invalid name' using errcode='22023'; end if;
 update kpi.organizations set name = btrim(n) where id = t;
 -- the platform operator's registry shows the same name
 update kpi_control.registry set name = btrim(n) where id = t;
 insert into kpi.audit(tenant_id,subject,event) values(t, kpi.subject(), 'organization.renamed');
end $$;

-- Creates a role (rid null) or replaces an existing role's name and grants.
-- grants: [{"capability": "view", "unitId": null, "kpiId": "<uuid>"}, ...]
create function kpi.save_role(t uuid, rid uuid, n text, grants jsonb) returns uuid
language plpgsql security definer set search_path='' as $$
declare g jsonb;
begin
 if not kpi.is_owner(t) then raise exception 'Owner required' using errcode='42501'; end if;
 if n is null or char_length(btrim(n)) not between 1 and 120 then raise exception 'Invalid name' using errcode='22023'; end if;
 if grants is null or jsonb_typeof(grants) <> 'array' or jsonb_array_length(grants) > 2000 then
  raise exception 'Invalid grants' using errcode='22023';
 end if;
 if rid is null then
  insert into kpi.roles(tenant_id,name) values(t, btrim(n)) returning id into rid;
 else
  perform 1 from kpi.roles where tenant_id=t and id=rid for update;
  if not found then raise exception 'Role not found' using errcode='22023'; end if;
  update kpi.roles set name = btrim(n) where tenant_id=t and id=rid;
  delete from kpi.grants where tenant_id=t and role_id=rid;
 end if;
 for g in select * from jsonb_array_elements(grants) loop
  insert into kpi.grants(tenant_id,role_id,capability,unit_id,kpi_id)
   values(t, rid, g->>'capability', nullif(g->>'unitId','')::uuid, nullif(g->>'kpiId','')::uuid);
 end loop;
 insert into kpi.audit(tenant_id,subject,event,resource_id) values(t, kpi.subject(), 'role.saved', rid);
 return rid;
end $$;

-- Deletes a role that nobody holds and no pending invitation offers.
create function kpi.delete_role(t uuid, rid uuid) returns void
language plpgsql security definer set search_path='' as $$
begin
 if not kpi.is_owner(t) then raise exception 'Owner required' using errcode='42501'; end if;
 perform 1 from kpi.roles where tenant_id=t and id=rid for update;
 if not found then raise exception 'Role not found' using errcode='22023'; end if;
 if exists(select 1 from kpi.member_roles where tenant_id=t and role_id=rid)
    or exists(select 1 from kpi.invitations where tenant_id=t and accepted_at is null and expires_at>now() and rid = any(role_ids)) then
  raise exception 'Role is in use' using errcode='23503';
 end if;
 delete from kpi.grants where tenant_id=t and role_id=rid;
 delete from kpi.roles where tenant_id=t and id=rid;
 insert into kpi.audit(tenant_id,subject,event,resource_id) values(t, kpi.subject(), 'role.deleted', rid);
end $$;

grant execute on function
 kpi.rename_organization(uuid,text),
 kpi.save_role(uuid,uuid,text,jsonb),
 kpi.delete_role(uuid,uuid)
 to kpi_app;

-- Every function must be closed to PUBLIC; the database smoke test fails if one is not.
revoke execute on all functions in schema kpi, kpi_control, kpi_catalog from public;

commit;
