-- ============================================================================
-- 20261015000100_command_center_saas_multi_tenant_kpis.sql
--
-- Upgrades the Command Center (formerly Orbit) schema for multi-tenant SaaS
-- KPI management:
--   1. Adds Command Center KPI catalog metadata (`catalog_id` RKM-001..RKM-109,
--      `domain`, `agg_type`, `unit`, `direction`, `drill_mode`, `measure_key`,
--      `real_notes`) to `orbit.role_kpi_assignments`.
--   2. Creates tenant-scoped SaaS tables (`orbit.org_roles`,
--      `orbit.org_kpi_definitions`, `orbit.org_role_kpi_assignments`) with
--      `organization_id` on every row and forced Row-Level Security so each
--      customer organization can configure custom roles and select which KPIs
--      from the master catalog (or custom org definitions) are active for each
--      role.
--   3. Expands `orbit.kpi_observations` provenance check to support `'live'`,
--      `'proxy'`, `'illustrative'`, and `'sample'` values written by
--      calculation and import jobs.
--   4. Relaxes `org_memberships_one_active_per_subject` to
--      `(subject, organization_id) where status = 'active'` so operators and
--      multi-org users can belong to multiple organizations.
-- ============================================================================

-- 1. Enrich role_kpi_assignments with Command Center catalog metadata
alter table orbit.role_kpi_assignments
  add column if not exists catalog_id   text,
  add column if not exists domain       text,
  add column if not exists agg_type     text,
  add column if not exists unit         text,
  add column if not exists direction    text,
  add column if not exists drill_mode   text not null default 'generic',
  add column if not exists measure_key  text,
  add column if not exists real_notes   jsonb;

alter table orbit.role_kpi_assignments
  add constraint role_kpi_assignments_agg_type_check
    check (agg_type is null or agg_type in ('sum', 'ratio', 'average', 'snapshot', 'count')),
  add constraint role_kpi_assignments_direction_check
    check (direction is null or direction in ('higher', 'lower', 'range')),
  add constraint role_kpi_assignments_drill_mode_check
    check (drill_mode in ('full', 'generic'));

create index if not exists role_kpi_assignments_catalog_idx
  on orbit.role_kpi_assignments (framework_version_id, catalog_id);

create index if not exists role_kpi_assignments_domain_idx
  on orbit.role_kpi_assignments (framework_version_id, domain);

-- 2. Tenant-scoped roles (`orbit.org_roles`) with organization_id on every row
create table if not exists orbit.org_roles (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references orbit.organizations (id) on delete cascade,
  role_id         text not null references orbit.role_ids (role_id),
  display_name    text not null,
  level           text not null,
  reports_to      text not null,
  cadence         text not null default 'Monthly',
  is_enabled      boolean not null default true,
  created_at      timestamptz not null default now(),
  unique (organization_id, role_id)
);

-- 3. Tenant-scoped KPI definitions (`orbit.org_kpi_definitions`) with organization_id on every row
create table if not exists orbit.org_kpi_definitions (
  id                            uuid primary key default gen_random_uuid(),
  organization_id               uuid not null references orbit.organizations (id) on delete cascade,
  catalog_id                    text not null,
  family                        text not null,
  label                         text not null,
  domain                        text not null,
  standard_definition           text not null,
  numerator_denominator_control text not null default '',
  agg_type                      text not null default 'sum',
  unit                          text not null default 'count',
  direction                     text not null default 'higher',
  primary_source                text not null default '',
  is_active                     boolean not null default true,
  created_at                    timestamptz not null default now(),
  constraint org_kpi_definitions_agg_check check (agg_type in ('sum', 'ratio', 'average', 'snapshot', 'count')),
  constraint org_kpi_definitions_dir_check check (direction in ('higher', 'lower', 'range')),
  unique (organization_id, catalog_id)
);

-- 4. Tenant-scoped Role-KPI assignments & selection (`orbit.org_role_kpi_assignments`)
create table if not exists orbit.org_role_kpi_assignments (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references orbit.organizations (id) on delete cascade,
  role_id         text not null references orbit.role_ids (role_id),
  assignment_id   text not null,
  catalog_id      text not null,
  weight          numeric(6, 5) not null,
  target_basis    text not null default '',
  is_selected     boolean not null default true,
  grains          text[] not null default array['group', 'region', 'facility']::text[],
  breakdowns      text[] not null default array['region', 'facility']::text[],
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint org_role_kpi_weight_range check (weight > 0 and weight <= 1),
  unique (organization_id, role_id, assignment_id)
);

create index if not exists org_role_kpi_assignments_lookup_idx
  on orbit.org_role_kpi_assignments (organization_id, role_id, is_selected);

-- Enable & Force Row-Level Security on all new multi-tenant tables
alter table orbit.org_roles                enable row level security;
alter table orbit.org_kpi_definitions      enable row level security;
alter table orbit.org_role_kpi_assignments enable row level security;

alter table orbit.org_roles                force row level security;
alter table orbit.org_kpi_definitions      force row level security;
alter table orbit.org_role_kpi_assignments force row level security;

create policy org_roles_select_own_org
  on orbit.org_roles for select to orbit_app
  using (organization_id = orbit.current_org());

create policy org_kpi_definitions_select_own_org
  on orbit.org_kpi_definitions for select to orbit_app
  using (organization_id = orbit.current_org());

create policy org_role_kpi_assignments_select_own_org_and_role
  on orbit.org_role_kpi_assignments for select to orbit_app
  using (
    organization_id = orbit.current_org()
    and role_id = orbit.current_role_id()
  );

grant select on orbit.org_roles, orbit.org_kpi_definitions, orbit.org_role_kpi_assignments to orbit_app;

-- 5. Support 'live', 'proxy', 'illustrative', and 'sample' provenance on KPI observations & exceptions
alter table orbit.kpi_observations
  drop constraint if exists kpi_observations_illustrative;

alter table orbit.kpi_observations
  add constraint kpi_observations_provenance_check
  check (provenance in ('live', 'proxy', 'illustrative', 'sample'));

alter table orbit.exceptions
  drop constraint if exists exceptions_illustrative;

alter table orbit.exceptions
  add constraint exceptions_provenance_check
  check (provenance in ('live', 'proxy', 'illustrative', 'sample'));

-- 6. Allow a user/operator subject to hold active memberships across multiple organizations
drop index if exists orbit.org_memberships_one_active_per_subject;

create unique index org_memberships_one_active_per_subject_org
  on orbit.org_memberships (subject, organization_id)
  where status = 'active';
