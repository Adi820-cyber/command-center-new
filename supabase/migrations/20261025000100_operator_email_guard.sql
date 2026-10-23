-- ============================================================================
-- 20261025000100_operator_email_guard.sql
--
-- A platform operator's own email must never be used as an organization's owner
-- or member. An operator account cannot join an organization (by design), so such
-- an invitation could never be accepted and only produced a confusing refusal.
--
-- One trigger on kpi.invitations covers every way an invitation is created: the
-- operator console, provisioning, and an owner inviting someone. (Memberships
-- created with a login already refuse operator accounts in kpi_control.add_people.)
-- Supabase keeps emails in auth.users; a database without that table (a local
-- test copy) simply skips the lookup.
-- ============================================================================
begin;

create function kpi.refuse_operator_invitation() returns trigger
language plpgsql security definer set search_path='' as $$
declare is_operator boolean := false;
begin
 if to_regclass('auth.users') is not null then
  execute 'select exists(select 1 from kpi_control.operators o join auth.users u on u.id = o.subject where lower(u.email) = lower($1))'
   into is_operator using new.email;
 end if;
 if is_operator then
  raise exception 'This email belongs to a platform operator account. Use a separate email for the organization.' using errcode='22023';
 end if;
 return new;
end $$;

create trigger refuse_operator_invitation before insert on kpi.invitations
 for each row execute function kpi.refuse_operator_invitation();

revoke execute on all functions in schema kpi, kpi_control, kpi_catalog from public;

commit;
