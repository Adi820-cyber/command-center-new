-- ============================================================================
-- 20261026000100_email_codes.sql
--
-- One-time codes sent by email before anyone changes their password (the first
-- change from a temporary password, and every change after).
--
-- Only a hash of each code is stored. A code lasts 10 minutes and allows 5 wrong
-- attempts. A person may ask for at most 5 codes an hour, and not more than one a
-- minute. Asking for a new code cancels the previous one. Nobody can read this
-- table: the identity API uses two functions, as the person themselves.
-- ============================================================================
begin;

create table kpi.email_codes (
 id uuid primary key default gen_random_uuid(),
 subject uuid not null,
 purpose text not null check (purpose in ('password')),
 code_hash text not null,
 created_at timestamptz not null default now(),
 expires_at timestamptz not null,
 attempts integer not null default 0,
 used_at timestamptz
);
create index email_codes_subject on kpi.email_codes(subject, created_at desc);
alter table kpi.email_codes enable row level security;
alter table kpi.email_codes force row level security;
-- no policies and no grants: only the functions below touch it

create function kpi.issue_email_code(h text) returns void
language plpgsql security definer set search_path='' as $$
declare sub uuid := kpi.subject();
begin
 if sub is null then raise exception 'Sign in first' using errcode='42501'; end if;
 if h is null or h !~ '^[a-f0-9]{64}$' then raise exception 'Invalid code' using errcode='22023'; end if;
 if exists(select 1 from kpi.email_codes where subject=sub and created_at > now() - interval '1 minute') then
  raise exception 'Wait a minute before asking for another code.' using errcode='55000';
 end if;
 if (select count(*) from kpi.email_codes where subject=sub and created_at > now() - interval '1 hour') >= 5 then
  raise exception 'Too many codes asked for. Try again in an hour.' using errcode='55000';
 end if;
 update kpi.email_codes set expires_at = now() where subject=sub and used_at is null and expires_at > now();
 insert into kpi.email_codes(subject, purpose, code_hash, expires_at) values(sub, 'password', h, now() + interval '10 minutes');
end $$;

-- True when the code is right (and it is used up). False when it is wrong (the
-- attempt is counted). Raises when there is no usable code. The caller must commit
-- a false result, so that wrong attempts are counted.
create function kpi.use_email_code(h text) returns boolean
language plpgsql security definer set search_path='' as $$
declare sub uuid := kpi.subject(); c kpi.email_codes;
begin
 if sub is null then raise exception 'Sign in first' using errcode='42501'; end if;
 select * into c from kpi.email_codes
  where subject=sub and used_at is null and expires_at > now()
  order by created_at desc limit 1 for update;
 if not found then raise exception 'There is no valid code. Ask for a new one.' using errcode='55000'; end if;
 if c.attempts >= 5 then raise exception 'Too many wrong codes. Ask for a new one.' using errcode='55000'; end if;
 if c.code_hash = h then
  update kpi.email_codes set used_at = now() where id = c.id;
  return true;
 end if;
 update kpi.email_codes set attempts = attempts + 1 where id = c.id;
 return false;
end $$;

grant execute on function kpi.issue_email_code(text), kpi.use_email_code(text) to kpi_identity_app;
revoke execute on all functions in schema kpi, kpi_control, kpi_catalog from public;

commit;
