-- ============================================================================
-- 20261023000100_owner_logins.sql
--
-- An owner can give the people they add a login with a temporary password.
--
-- Creating a login needs Supabase's admin key, which must never sit in the
-- customer API. A third process, the identity API, holds it. This is its
-- database role: it can check that someone owns an organization and add people
-- to that organization, and nothing else. It has no table access at all.
--
-- add_people (written for the operator) is extended, not copied: members may now
-- carry role ids as well as template role keys, and the audit entry says who did it.
-- ============================================================================
begin;

create or replace function kpi_control.add_people(t uuid, members jsonb) returns integer
language plpgsql security definer set search_path='' as $$
declare m jsonb; keys text[]; ids_in uuid[]; rids uuid[]; sub uuid; mid uuid; n integer := 0; is_owner boolean;
begin
 if members is null or jsonb_typeof(members) <> 'array' or jsonb_array_length(members) = 0 then
  raise exception 'Invalid members' using errcode='22023';
 end if;
 if jsonb_array_length(members) > 500 then raise exception 'Too many members' using errcode='22023'; end if;
 for m in select * from jsonb_array_elements(members) loop
  if coalesce(m->>'email','') !~ '^[^@[:space:]]+@[^@[:space:]]+[.][^@[:space:]]+$' then raise exception 'Invalid email' using errcode='22023'; end if;
  is_owner := coalesce((m->>'owner')::boolean, false);
  keys := '{}';
  ids_in := '{}';
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
    values(t, sub, is_owner, split_part(m->>'email','@',1), lower(m->>'email')) returning id into mid;
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

-- The one thing the identity API may do to an organization's people. The owner check
-- is repeated here, in the database, even though the API checks it first.
create function kpi.add_people_as_owner(t uuid, members jsonb) returns integer
language plpgsql security definer set search_path='' as $$
begin
 if not kpi.is_owner(t) then raise exception 'Owner required' using errcode='42501'; end if;
 if members is null or jsonb_typeof(members) <> 'array' or jsonb_array_length(members) not between 1 and 100 then
  raise exception 'Invalid members' using errcode='22023';
 end if;
 -- An owner chooses roles by id and cannot create another owner.
 if exists(select 1 from jsonb_array_elements(members) m where coalesce((m->>'owner')::boolean,false) or m ? 'roleKeys') then
  raise exception 'An owner can only give people roles by id' using errcode='22023';
 end if;
 return kpi_control.add_people(t, members);
end $$;

do $$ begin
 if not exists (select from pg_roles where rolname='kpi_identity_app') then
  create role kpi_identity_app nologin nosuperuser nobypassrls;
 end if;
end $$;
grant usage on schema kpi to kpi_identity_app;
grant execute on function kpi.is_owner(uuid), kpi.add_people_as_owner(uuid,jsonb) to kpi_identity_app;

revoke execute on all functions in schema kpi, kpi_control, kpi_catalog from public;

commit;
