-- ============================================================================
-- 20261028000100_owner_template.sql
--
-- The platform operator creates an organization with its owner only. The owner
-- then sets it up: either starting from an industry template (its KPIs, roles
-- and what each role sees, all of which the owner can change afterwards), or
-- building roles and KPIs from scratch.
--
-- A template can be applied only while the organization has no KPIs and no
-- roles, so it never duplicates or overwrites what the owner already made.
-- ============================================================================
begin;

create function kpi.start_from_template(t uuid, tpl text) returns void
language plpgsql security definer set search_path='' as $$
begin
 if not kpi.is_owner(t) then raise exception 'Owner required' using errcode='42501'; end if;
 perform 1 from kpi.organizations where id=t for update;
 if exists(select 1 from kpi.definitions where tenant_id=t) or exists(select 1 from kpi.roles where tenant_id=t) then
  raise exception 'A template can only be used before any KPIs or roles exist. Add KPIs from the KPI library instead.' using errcode='55000';
 end if;
 perform kpi.apply_template(t, tpl, kpi.subject());
 update kpi_control.registry set template_id=tpl where id=t;
 insert into kpi.audit(tenant_id,subject,event,resource_id) values(t, kpi.subject(), 'template.applied', null);
end $$;

grant execute on function kpi.start_from_template(uuid,text) to kpi_app;
revoke execute on all functions in schema kpi, kpi_control, kpi_catalog from public;

commit;
