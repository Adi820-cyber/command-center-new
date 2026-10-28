# Orbit Command Center — MySQL Database Setup

This directory contains the production-ready MySQL 8.0 schema and seed definitions for Orbit Command Center, replacing Supabase / PostgreSQL.

## Prerequisites
- MySQL Server 8.0+ or AWS RDS MySQL 8.4 (e.g. `ecovisrkca-rmt-com.cdeky8oy4qrz.ap-south-1.rds.amazonaws.com:3306`).
- Database name: `orbit_kpi`.

## Files
- `schema.sql`: Complete DDL schema creating database `orbit_kpi`, all 27 core tables, constraints, foreign keys, and auth seeds.
- `catalog-seed-mysql.sql`: 623 KPIs, 554 measures, and 21 industry templates formatted for MySQL 8.0/8.4 JSON.
- `seed-org.sql`: Organization, units, roles, grants, measures, definitions, and memberships for demo organization.
- `setup.ps1`: Automated PowerShell setup script to initialize and seed MySQL.
- `convert-catalog.mjs`: Node.js utility to re-generate `catalog-seed-mysql.sql` whenever `database/catalog-seed.sql` changes.

## Quick Execution
Open PowerShell in the repository root and run:

```powershell
.\database\mysql\setup.ps1 -Host "ecovisrkca-rmt-com.cdeky8oy4qrz.ap-south-1.rds.amazonaws.com" -User "echo_rmt_user" -Password "your_password"
```

## Tables Included

| Table | Purpose |
|---|---|
| `auth_users` | Replaces Supabase Auth: user logins, scrypt/pbkdf2 password hashes, roles |
| `kpi_control_operators` | Platform operator authorization registry |
| `kpi_control_registry` | Commercial tenant profiles, plans, owner email verification |
| `kpi_control_lifecycle` | Tenant lifecycle events audit trail |
| `kpi_organizations` | Multi-tenant business organizations |
| `kpi_units` | Hierarchical organizational units (hospitals, facilities, departments) |
| `kpi_roles` | Role studio definitions |
| `kpi_memberships` | Active user memberships per tenant |
| `kpi_member_roles` | Role assignments for tenant members |
| `kpi_measures` | Raw metric definitions |
| `kpi_definitions` | Mathematical KPI formulas, targets, and directions |
| `kpi_grants` | Scoped capability matrix (configure, submit, approve, view, act) |
| `kpi_invitations` | Pending organization invitations |
| `kpi_batches` | Periodic measure submission batches |
| `kpi_inputs` | Actual measure data points |
| `kpi_results` | Computed and evaluated KPI outputs |
| `kpi_actions` | Remedial leadership action tracker |
| `kpi_proposals` | Tenant onboarding proposals |
| `kpi_audit` | Append-only governance audit log |
| `kpi_period_locks` | Data freeze / locks per period |
| `kpi_email_codes` | OTP email verification tokens |
| `kpi_knowledge_chunks` | Grounding chunks and embeddings for AI Assistant |
| `kpi_catalog_*` | Global reference templates, roles, KPIs, and measures |
