# Generic KPI platform — 2026-10-15

The user's current instruction supersedes the hospital-only scope in earlier specifications. Implement the generic platform described in `docs/saas-architecture.md`; retire ERP from active routes and deployments. Historical migrations and source remain available for controlled legacy export, not for new customer provisioning.

Keep React, Fastify, Zod, postgres.js and Supabase Auth. Add no production dependencies. New tenants use the isolated `kpi` schema; the customer API switches into the non-login `kpi_app` role, reached through a separately provisioned restricted login. The browser never receives that credential. Use transaction-local verified subject context, explicit grants and forced RLS. See [Supabase RLS documentation](https://supabase.com/docs/guides/database/postgres/row-level-security).

Initial deployment enforces no platform-account access to customer values. It does not claim provider inability to access plaintext. Customer-controlled deployment remains a separate release gate. Platform subjects are explicitly excluded from membership and data policies.

The intended new Supabase project starts from `database/supabase/migrations/20261015000100_kpi_platform.sql`, not the historical hospital migration chain. The project could not be created because the selected `gbtech` organization reached its Free-plan two-project limit, so the migration has not been run remotely. Existing projects must use a separately reviewed migration/cutover. No historical customer rows are deleted by this refactor.

Initial supported formulas: direct measure, addition, subtraction, multiplication, division and percentage, expressed as a bounded JSON expression; never executable code. This is arithmetic over input values, not a general sum/rollup aggregator. Decimal arithmetic uses exact BigInt fractions, rounded only at publication. Inputs are aggregate measures at an explicit unit and period. Cross-unit rollups, joins, distinct people counts and forecasting require additional reviewed semantics and are not silently approximated.

Ownership: current project owner. Dependencies: locked installation with Node 22.18 or newer in the 22 series. Runtime installed locally for this work: 22.23.3. Deployment target requested by user: a new Supabase project in gbtech, Mumbai.

Local database verification uses PGlite in an isolated tool directory (not shipped as a production dependency). It runs PostgreSQL SQL/RLS and the actual Fastify routes with synthetic users. This supplements, and does not replace, hosted Supabase checks. The control and customer schemas currently share one Supabase database; this enforces normal application-account separation, not provider-inability to read plaintext. Official reference: https://pglite.dev/docs/.
