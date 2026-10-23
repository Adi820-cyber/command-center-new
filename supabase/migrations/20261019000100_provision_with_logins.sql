-- ============================================================================
-- 20261019000100_provision_with_logins.sql
--
-- An operator can now create an organisation whose people already have logins.
-- The control API creates each login in Supabase Auth, then calls these
-- functions with the new user ids, so memberships and roles exist at once and
-- nobody has to accept an invitation link.
--
-- A person with an existing account cannot be given a password silently, so a
-- member entry may carry either:
--   {"email", "owner", "roleKeys", "subject"}      -> a membership right now
--   {"email", "owner", "roleKeys", "tokenHash"}    -> an invitation (existing accounts)
--
-- The operator still reads no customer values: the functions return only ids.
-- ============================================================================
begin;

-- A member's email, so the same person cannot be added to an organization twice
-- (whether they have a login now or get an invitation for an existing account).
alter table kpi.memberships add column email text;
create unique index memberships_tenant_email on kpi.memberships(tenant_id, lower(email)) where email is not null;

-- Accepting an invitation records the email too.
create or replace function kpi.accept_invitation(h text,e text) returns uuid language plpgsql security definer set search_path='' as $$
 declare inv kpi.invitations; mid uuid;
 begin
  if kpi.subject() is null or kpi.is_platform() then raise exception 'Invitation forbidden' using errcode='42501'; end if;
  select * into inv from kpi.invitations where token_hash=h and lower(email)=lower(e) and accepted_at is null and expires_at>now() for update;
  if not found then raise exception 'Invitation unavailable' using errcode='42501'; end if;
  insert into kpi.memberships(tenant_id,subject,owner,display_name,email) values(inv.tenant_id,kpi.subject(),inv.owner,split_part(e,'@',1),lower(e)) returning id into mid;
  insert into kpi.member_roles(tenant_id,member_id,role_id) select inv.tenant_id,mid,unnest(inv.role_ids);
  update kpi.invitations set accepted_at=now() where id=inv.id;
  insert into kpi.audit(tenant_id,subject,event,resource_id) values(inv.tenant_id,kpi.subject(),'invitation.accepted',mid);
  return inv.tenant_id;
 end
$$;

create function kpi_control.add_people(t uuid, members jsonb) returns integer
language plpgsql security definer set search_path='' as $$
declare m jsonb; keys text[]; rids uuid[]; sub uuid; mid uuid; n integer := 0; is_owner boolean;
begin
 if members is null or jsonb_typeof(members) <> 'array' or jsonb_array_length(members) = 0 then
  raise exception 'Invalid members' using errcode='22023';
 end if;
 if jsonb_array_length(members) > 500 then raise exception 'Too many members' using errcode='22023'; end if;
 for m in select * from jsonb_array_elements(members) loop
  if coalesce(m->>'email','') !~ '^[^@[:space:]]+@[^@[:space:]]+[.][^@[:space:]]+$' then raise exception 'Invalid email' using errcode='22023'; end if;
  is_owner := coalesce((m->>'owner')::boolean, false);
  keys := '{}';
  if jsonb_typeof(m->'roleKeys') = 'array' then
   select coalesce(array_agg(distinct k), '{}') into keys from jsonb_array_elements_text(m->'roleKeys') as e(k);
  end if;
  if not is_owner and cardinality(keys) = 0 then raise exception 'Choose at least one role' using errcode='22023'; end if;
  if exists(select 1 from kpi.memberships where tenant_id=t and lower(email)=lower(m->>'email'))
     or exists(select 1 from kpi.invitations where tenant_id=t and lower(email)=lower(m->>'email') and accepted_at is null and expires_at>now()) then
   raise exception 'This person is already in the organization or already invited' using errcode='23505';
  end if;
  rids := '{}';
  if cardinality(keys) > 0 then
   select coalesce(array_agg(id), '{}') into rids from kpi.roles where tenant_id=t and template_key = any(keys);
   if cardinality(rids) <> cardinality(keys) then raise exception 'Unknown role' using errcode='22023'; end if;
  end if;

  if m ? 'subject' then
   sub := (m->>'subject')::uuid;
   if exists(select 1 from kpi_control.operators where subject=sub) then
    raise exception 'An operator account cannot join an organization' using errcode='22023';
   end if;
   insert into kpi.memberships(tenant_id,subject,owner,display_name,email)
    values(t, sub, is_owner, split_part(m->>'email','@',1), lower(m->>'email')) returning id into mid;
   insert into kpi.member_roles(tenant_id,member_id,role_id) select t, mid, unnest(rids);
   insert into kpi.audit(tenant_id,subject,event,resource_id) values(t, kpi.subject(), 'member.created_by_operator', mid);
  else
   if coalesce(m->>'tokenHash','') !~ '^[a-f0-9]{64}$' then raise exception 'Invalid token' using errcode='22023'; end if;
   insert into kpi.invitations(tenant_id,email,token_hash,owner,role_ids)
    values(t, m->>'email', m->>'tokenHash', is_owner, rids);
  end if;
  n := n + 1;
 end loop;
 return n;
end $$;

-- New organisation with its owner and people. Exactly one member must be the owner.
create function kpi_control.provision_with_people(n text, tpl text, members jsonb) returns uuid
language plpgsql security definer set search_path='' as $$
declare t uuid; owners integer;
begin
 if not kpi.is_platform() then raise exception 'Operator required' using errcode='42501'; end if;
 select count(*) into owners from jsonb_array_elements(members) m where coalesce((m->>'owner')::boolean,false);
 if owners <> 1 then raise exception 'Exactly one owner is required' using errcode='22023'; end if;
 if tpl is null and jsonb_array_length(members) > 1 then
  raise exception 'Choose a template to give members their roles' using errcode='22023';
 end if;
 insert into kpi.organizations(name) values(n) returning id into t;
 insert into kpi_control.registry(id,name,created_by) values(t, n, kpi.subject());
 insert into kpi.units(tenant_id,name,kind) values(t, n, 'Organization');
 if tpl is not null then
  perform kpi.apply_template(t, tpl, kpi.subject());
  update kpi_control.registry set template_id=tpl where id=t;
 end if;
 perform kpi_control.add_people(t, members);
 return t;
end $$;

-- More people for an organisation the operator created.
create function kpi_control.add_people_to(t uuid, members jsonb) returns integer
language plpgsql security definer set search_path='' as $$
begin
 if not kpi.is_platform() or not exists(select 1 from kpi_control.registry where id=t) then
  raise exception 'Operator required' using errcode='42501';
 end if;
 if exists(select 1 from jsonb_array_elements(members) m where coalesce((m->>'owner')::boolean,false)) then
  raise exception 'An organization has one owner, chosen at creation' using errcode='22023';
 end if;
 insert into kpi.audit(tenant_id,subject,event) values(t, kpi.subject(), 'members.added_by_operator');
 return kpi_control.add_people(t, members);
end $$;

grant execute on function
 kpi_control.provision_with_people(text,text,jsonb),
 kpi_control.add_people_to(uuid,jsonb)
 to kpi_control_app;

-- Close a gap in the earlier migrations. A new function is executable by every
-- role unless that is revoked explicitly; 'alter default privileges in schema'
-- cannot remove Postgres's built-in default. That left internal functions such as
-- kpi.apply_template and kpi_control.add_people callable by the API's database
-- roles. Each role keeps the explicit grants it was given; only PUBLIC loses
-- execute. Every future migration that adds a function must repeat this line,
-- and database/tests/v2-smoke.sql fails if one forgets.
revoke execute on all functions in schema kpi, kpi_control, kpi_catalog from public;

commit;
