-- ============================================================================
-- 20261030000100_member_role_visibility.sql
--
-- 1. Non-owner members (CEO, CFO, Operations, etc.) need read visibility on
--    roles, grants, and member_roles within their tenant so their workspace
--    can display their role, permissions, and available roles.
-- 2. Enhance kpi_control.add_people to gracefully update existing memberships
--    when an owner re-assigns or provisions a role login for an existing email.
-- ============================================================================
begin;

-- Allow all active members of an organization to see its roles, grants, and bindings
drop policy if exists role_read on kpi.roles;
create policy role_read on kpi.roles for select to kpi_app using(kpi.is_member(tenant_id));

drop policy if exists grant_read on kpi.grants;
create policy grant_read on kpi.grants for select to kpi_app using(kpi.is_member(tenant_id));

drop policy if exists binding_read on kpi.member_roles;
create policy binding_read on kpi.member_roles for select to kpi_app using(kpi.is_member(tenant_id));

-- Update kpi_control.add_people
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

  select id into mid from kpi.memberships where tenant_id=t and lower(email)=lower(m->>'email');
  if mid is not null then
   if m ? 'subject' then
    sub := (m->>'subject')::uuid;
    if exists(select 1 from kpi_control.operators where subject=sub) then
     raise exception 'An operator account cannot join an organization' using errcode='22023';
    end if;
    update kpi.memberships set display_name=coalesce(display, display_name), subject=sub, active=true where id=mid;
   end if;
   insert into kpi.member_roles(tenant_id,member_id,role_id)
    select t, mid, unnest(rids)
    on conflict do nothing;
   insert into kpi.audit(tenant_id,subject,event,resource_id)
    values(t, kpi.subject(), case when kpi.is_platform() then 'member.updated_by_operator' else 'member.updated_by_owner' end, mid);
  else
   if exists(select 1 from kpi.invitations where tenant_id=t and lower(email)=lower(m->>'email') and accepted_at is null and expires_at>now()) then
    raise exception 'This person is already invited' using errcode='23505';
   end if;
   if m ? 'subject' then
    sub := (m->>'subject')::uuid;
    if exists(select 1 from kpi_control.operators where subject=sub) then
     raise exception 'An operator account cannot join an organization' using errcode='22023';
    end if;
    insert into kpi.memberships(tenant_id,subject,owner,display_name,email)
     values(t, sub, is_owner, display, lower(m->>'email')) returning id into mid;
    insert into kpi.member_roles(tenant_id,member_id,role_id) select t, mid, unnest(rids) on conflict do nothing;
    insert into kpi.audit(tenant_id,subject,event,resource_id)
     values(t, kpi.subject(), case when kpi.is_platform() then 'member.created_by_operator' else 'member.created_by_owner' end, mid);
   else
    if coalesce(m->>'tokenHash','') !~ '^[a-f0-9]{64}$' then raise exception 'Invalid token' using errcode='22023'; end if;
    insert into kpi.invitations(tenant_id,email,token_hash,owner,role_ids)
     values(t, m->>'email', m->>'tokenHash', is_owner, rids);
   end if;
  end if;
  n := n + 1;
 end loop;
 return n;
end $$;

commit;
