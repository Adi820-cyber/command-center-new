# First hosted pilot runbook

**Status:** preparation only. No new hosted project or real-tenant data exists yet. The requested project could not be created because the `gbtech` Supabase organization has reached the Free-plan limit of two active projects. Resolve project capacity in the Supabase account before following the deployment steps. Do not pause or delete an existing project without an explicit decision.

This runbook is for a **new, empty Supabase project** in `gbtech`, Mumbai (`ap-south-1`). The one new migration under `database/supabase/migrations` is the only migration source for this product. The historical `supabase/migrations` directory belongs to the former hospital application and must not be pushed to the new project.

## 1. Create an empty Supabase project

After project capacity is available:

1. Create a project in organization `gbtech`, region Mumbai (`ap-south-1`). Save the project reference and database password in the organization's approved secret manager.
2. Enable the required Supabase Auth login methods and configure the allowed callback URLs for the web deployment.
3. Do not import an old hospital database or legacy KPI data. The source provenance and redistribution rights for included legacy datasets are unresolved.

## 2. Apply and inspect the fresh schema

From the repository root, authenticate the Supabase CLI if needed, link `database/supabase` to the new project, inspect the pending migration list, and dry-run before applying:

```powershell
npx supabase --workdir database link --project-ref <new-project-ref>
npx supabase --workdir database db push --dry-run
npx supabase --workdir database db push
```

The CLI records successful migrations in the remote migration history and skips them on later pushes. Confirm that it applies only `20261015000100_kpi_platform.sql` and `20261016000100_catalog_templates_rollup.sql`; stop if it proposes any hospital migration. The working directory is `database` (the folder that contains `supabase/`), not `database/supabase`. The Supabase CLI documents the `db push` and `--dry-run` behavior in its [database migration reference](https://supabase.com/docs/reference/cli/supabase-db-push).

The migration creates schemas `kpi` and `kpi_control`, forced RLS policies, non-login permission roles `kpi_app` and `kpi_control_app`, and no demo organization, operator, seed records, or customer data.

### 2a. Load the KPI catalog

The second migration creates the `kpi_catalog` schema, which is empty until the catalog is loaded. The seed file is generated from `packages/kpi-catalog` and is safe to run again:

```powershell
npx supabase --workdir database db query --linked -f catalog-seed.sql
```

Check the counts: 592 KPIs, 521 measures, 20 templates. Re-run the seed after the catalog changes (see [kpi-catalog.md](kpi-catalog.md)). Organizations that already used a template keep their own copy, so reseeding never changes a customer's KPIs.

## 3. Create two restricted database login roles

The migration intentionally creates permission roles with `NOLOGIN`. Create two separate login roles in the project database administration workflow, then grant membership:

| Login role | Member of | Used only by |
|---|---|---|
| `cc_kpi_data_login` | `kpi_app` | Customer data API |
| `cc_kpi_control_login` | `kpi_control_app` | Platform control API |

Both login roles must be `LOGIN`, `NOINHERIT`, `NOSUPERUSER`, and `NOBYPASSRLS`. Grant only the matching permission role (`GRANT kpi_app TO cc_kpi_data_login` and `GRANT kpi_control_app TO cc_kpi_control_login`). Never use the `postgres`, `service_role`, or browser-facing Supabase key as either runtime credential. The API switches to the matching `kpi_*` role inside each transaction; Supavisor transaction pooling discards transaction-local state at the end of that transaction.

Generate two unrelated, high-entropy passwords and keep them only in the deployment secret manager. Do not put passwords in `.env.example`, migrations, SQL checked into the repository, screenshots, chat, or source control. If the role-creation interface records SQL history, create roles through an approved secure administration path and rotate the password after provisioning. Validate the roles by connecting as each login and confirming `current_user` changes to the expected `kpi_*` role during an API transaction, with no owner or `BYPASSRLS` privileges.

Supabase documents custom roles and transaction-pooler connection strings [here](https://supabase.com/docs/guides/storage/schema/custom-roles) and [here](https://supabase.com/docs/guides/database/connecting-to-postgres). Copy the pooler host, port, and username from the Dashboard's **Connect** dialog; do not construct the host from the region. Shared transaction pooler custom-role usernames include the project reference.

## 4. Seed the first platform operator

1. Create/invite the intended platform operator through Supabase Auth. The person signs in once; use the verified `auth.users.id` UUID for that account.
2. Using the trusted database administrator path, add **only that reviewed subject** to `kpi_control.operators`:

```sql
insert into kpi_control.operators(subject)
values ('<reviewed-auth-user-uuid>');
```

3. Verify `/api/control/me` accepts that operator and rejects a normal customer subject. Never create an operator from a request, grant an operator customer membership, or seed operators in application migrations.

The operator console can provision organization metadata and send configuration proposals. It has no ordinary query permissions for customer KPI inputs, results, actions, or tenant uploads. This is account-level separation; it does not make a managed-hosting provider technically incapable of accessing plaintext.

## 5. Deploy two API processes and one web app

Use separate API services built from `services/api`:

### Customer data API

- Set shared auth values `SUPABASE_URL`, `SUPABASE_JWKS_URL` (or allow the derived JWKS URL), `ALLOWED_ORIGINS`, and `PORT`.
- Set `KPI_DATABASE_URL` to the `cc_kpi_data_login` connection only.
- Leave `CONTROL_DATABASE_URL` empty.
- Set `VITE_API_BASE_URL` in the web build to this service's HTTPS origin.

### Platform control API

- Set the same verified Supabase Auth project values and its exact allowed web origin.
- Set `CONTROL_DATABASE_URL` to the `cc_kpi_control_login` connection only.
- Leave `KPI_DATABASE_URL` empty.
- Set `VITE_CONTROL_API_BASE_URL` in the web build to this service's HTTPS origin.

The backend refuses to start if both database credentials are set in one process. The frontend receives only the Supabase URL and publishable key; database passwords and Supabase service-role secrets never go into `VITE_*` variables. Transaction pooling uses port 6543 where available, TLS, and disabled prepared statements in the existing Postgres client.

## 6. Invite a first organization owner

1. Sign in to the control console as the seeded operator.
2. Create the organization with its owner's email. The API returns a one-time invitation token; deliver the invite link through an approved secure channel. There is not yet an integrated email-delivery service.
3. The organization owner signs in or creates their Supabase Auth account with that email and accepts the invitation. The verified JWT email must match the invitation.
4. The owner configures their organization units, roles, measures and KPI definitions, or reviews and accepts a platform configuration proposal. Customer owners approve KPI definitions and input batches.
5. Add further members through owner-managed invitations. A tenant can have 3, 7, or a different number of members; no fixed fourteen-role catalog is required. The current CSV flow pastes aggregate rows into the app; it does not store uploaded files.

## 6a. Create organizations from a template (version 2)

In the control console (`/operator`):

1. Enter the organization name and the owner's email.
2. Choose an industry template. It brings the KPIs, the roles and what each role can see.
3. Add people: type them row by row, or paste a list, one person per line: `anita@acme.com, operations; data reviewer`. Roles may be written as the key or the name. Any number of people can be added now, or later with **Add people**.
4. Press **Create organization**. The page shows one invitation link per person, once. Send each link privately; each works once, for the matching email, and expires in seven days. **Download all links (CSV)** saves them.

The console creates the organization, its roles and the invitations through database functions that return only ids. It cannot read the organization's figures.

### How data gets in (CSV only)

Members with the data-contributor role open **Data & approvals**, choose the KPIs and units they report on, and download the CSV format. It has one column for each input those KPIs need and one row for each unit. A second download explains every column. They fill it in, upload it, see every problem listed row by row, and submit. A data reviewer approves, which calculates every KPI for that unit and for each parent unit above it. A contributor cannot approve their own upload unless the owner allows it in the approval policy.

### Targets

Template KPIs start without targets, so nothing is "off target" until the owner sets them. The owner sets a target on any KPI under **KPI library, Your KPIs**. Changing a target does not create a new version; the formula stays frozen.

### Ask

Ask answers from the same figures the person's own role can see. The answer is built from stored results; no model is involved unless you configure one. To let a model reword answers, set `GROQ_API_KEY` (and optionally `OPENROUTER_API_KEY` with `OPENROUTER_MODEL`) on the customer API. The model receives only the finished answer text and may not add a number that is not already in it. This sends that text to the provider, so decide whether that is acceptable for your customers before enabling it. Leave the keys unset to keep every answer inside your own systems.

## 7. Verify before using real data

The remaining hosted release checks are mandatory:

- Run the migration against a disposable Supabase project and validate both SQL login memberships and `SET LOCAL ROLE` behavior.
- Run allow/deny tests using real authenticated Supabase JWTs: cross-tenant reads/writes, platform-to-customer data routes, revoked members, role scopes, owner approvals, invitation email mismatch, and concurrent input approvals.
- Confirm API access to the Supabase Data API, logs, traces and backups matches the privacy promise. No routine operator tool should expose business values.
- Exercise the actual web sign-in, password reset, invite acceptance, customer workspace and control console on deployed HTTPS origins.
- Demonstrate backups, restore, deletion/offboarding, retention, rate limits, migration rollback and sanitized incident diagnostics. None is complete merely because the local prototype passes synthetic checks.
- Agree retention, residency, quotas and the commercial/privacy promise before inviting an external customer.

## Current verification boundary

Local verification uses a disposable PGlite database and synthetic identities; it is not a hosted Supabase deployment. The Supabase project limit prevented applying this migration remotely. Do not describe the hosted setup, production RLS, recovery, or customer-data privacy as verified until the checks above are completed.
