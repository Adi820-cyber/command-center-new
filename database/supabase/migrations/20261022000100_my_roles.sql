-- ============================================================================
-- 20261022000100_my_roles.sql
--
-- A person's own roles, so the workspace can say "you are signed in as an
-- Operations head". Roles and role bindings are readable by owners only, so a
-- member cannot read their own. This returns exactly the caller's own roles in
-- an organization they belong to, and nothing about anyone else.
-- ============================================================================
begin;

create function kpi.my_roles(t uuid) returns table(id uuid, name text)
language sql stable security definer set search_path='' as $$
 select r.id, r.name
 from kpi.memberships m
 join kpi.member_roles mr on mr.tenant_id=m.tenant_id and mr.member_id=m.id
 join kpi.roles r on r.tenant_id=mr.tenant_id and r.id=mr.role_id
 where m.tenant_id=t and m.subject=kpi.subject() and m.active and kpi.is_member(t)
 order by r.name
$$;

grant execute on function kpi.my_roles(uuid) to kpi_app;
revoke execute on all functions in schema kpi, kpi_control, kpi_catalog from public;

commit;
