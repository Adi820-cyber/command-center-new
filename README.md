# Command Center — configurable KPI workspace

This source has been refactored toward a multi-organization KPI product. Each customer configures its own organization units, members, roles, measures, KPI definitions, reporting inputs, approvals and follow-up actions. The former hospital ERP is no longer part of the active application routes.

> **Current status: working prototype, not a hosted or production-ready SaaS.** The fresh-project Supabase migration and tenant-separated APIs are prepared, and the source has been exercised locally with synthetic data. A new hosted project was not created: the selected `gbtech` Supabase organization is at the Free-plan limit of two active projects. Hosted migration, database-login grants, authentication, storage, backup and recovery checks remain open.

## Start here

- [Implementation tasks](docs/saas-tasks.md) — completed source work, open release gates and developer steps.
- [Architecture](docs/saas-architecture.md) — product boundary, tenant model, KPI calculation and honest privacy limits.
- [First deployment runbook](docs/saas-runbook.md) — fresh Supabase setup and safe credential separation.
- [Product decision](docs/decisions/0025-generic-kpi-platform.md) — current product scope supersedes older hospital-specific planning documents.

Older hospital plans under `docs/orbit/` and the root `supabase/` migration history are retained for reference. They are historical; the current product documentation and the fresh migration under `database/supabase/` take precedence.

## Current capabilities

- Multiple organizations per account, customer-owned members and configurable roles.
- Platform-side organization setup and configuration proposals, with customer review and activation.
- Tenant-scoped units, measures and versioned KPI definitions using bounded arithmetic formulas.
- Manual entry and CSV text-paste for aggregate measures, reviewer approval, calculation, result evidence and actions. Private file storage/import staging is not implemented.
- Customer workspace and a distinct operator console; restricted database roles and forced row-level security policies are in the fresh-project migration.

## Important limits

- Only a small arithmetic expression set is supported. Unsupported aggregation, joins, distinct counts, forecasting and connectors require reviewed product work; the system must not guess a result.
- Platform account separation is designed and locally exercised. A hosted Supabase deployment and a real database-role/RLS test have not yet been completed.
- This does not prove that a provider or infrastructure administrator can never access plaintext. Do not make that promise for managed hosting.
- The migration in `database/supabase/migrations/20261015000100_kpi_platform.sql` is a **fresh-project bootstrap**. It is not a migration plan for the ZIP's old hospital database. Never push the historical `supabase/` migration chain into a new SaaS project.
- Included legacy datasets/workbooks have unresolved source and redistribution status. Do not use them as customer data or include them in a public SaaS source release until reviewed.

## Requirements and setup

- Node.js `>=22.18 <23`.
- Install the locked dependencies with `npm ci` and use the workspace scripts for typecheck, lint, tests and builds.
- Use a fresh Supabase project and follow [the runbook](docs/saas-runbook.md) before connecting any real organization.

No production API credential belongs in a browser `VITE_*` variable. The customer-data API and the control API use different restricted database credentials and must be deployed as separate API processes.
