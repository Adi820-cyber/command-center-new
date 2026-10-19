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

## 5. Deploy three API processes and one web app

Use separate API services built from `services/api`:

### Customer data API

- Set shared auth values `SUPABASE_URL`, `SUPABASE_JWKS_URL` (or allow the derived JWKS URL), `ALLOWED_ORIGINS`, and `PORT`.
- Set `KPI_DATABASE_URL` to the `cc_kpi_data_login` connection only.
- Leave `CONTROL_DATABASE_URL` empty.
- Set `VITE_API_BASE_URL` in the web build to this service's HTTPS origin.
- Once emailed codes work (see section 6b), set `ENFORCE_PASSWORD_CHANGE=true`. This API then refuses all data to anyone who still has a temporary password. Do not turn it on before email works, or new people will be locked out.

### Identity API (owners create logins)

The same code as the other two, started with only:

- `SUPABASE_URL`, `ALLOWED_ORIGINS` (the web origin), `PORT`
- `IDENTITY_DATABASE_URL`: a login that is a member of `kpi_identity_app` and nothing else (create it like the others: `create role cc_kpi_identity_login login noinherit nosuperuser nobypassrls password '...'; grant kpi_identity_app to cc_kpi_identity_login;`)
- `SUPABASE_SECRET_KEY` (sensitive)
- For emailed codes (section 6b): `MAIL_PROVIDER=brevo`, `BREVO_API_KEY` (sensitive) and `MAIL_FROM` (a sender address verified in Brevo), plus optionally `MAIL_FROM_NAME` (default "Command Center"). Without them, the change-password page falls back to changing the password directly, without a code.

Set `VITE_IDENTITY_API_BASE_URL` in the web build to its HTTPS origin. Without it, owners add people by invitation link only. The database login can ask whether someone owns an organization and add people to it; it cannot read any table. The API refuses to start with more than one database credential, and refuses the secret key next to `KPI_DATABASE_URL`.

### Platform control API

- Set the same verified Supabase Auth project values and its exact allowed web origin.
- Set `CONTROL_DATABASE_URL` to the `cc_kpi_control_login` connection only.
- Leave `KPI_DATABASE_URL` empty.
- Optionally set `SUPABASE_SECRET_KEY` (Dashboard → Project Settings → API Keys → secret key) to let operators give people a login with a temporary password; see section 6a. Without it, people are added by invitation link. **Only the control and identity APIs may hold it.** The API refuses to start if it is set next to `KPI_DATABASE_URL`. Store it as a sensitive variable, never in a `VITE_*` variable, never in Git.
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
4. Press **Create organization**. What happens next depends on whether the control API has `SUPABASE_SECRET_KEY`:

   - **With the key (temporary logins).** The control API creates a login in Supabase Auth for the owner and every person, each with its own random temporary password, and makes them members with their roles at once. The page lists each email with its temporary password, once. **Copy message** gives a ready-to-send note (sign-in address, email, password); **Download all (CSV)** saves everything. Nobody has to accept an invitation. The first time someone signs in they are taken to a page to choose their own password before they see anything else. Until they do, the temporary password is the only way in.
   - **Without the key (invitation links).** The page lists one invitation link per person, once. Each works once, for the matching email, and expires in seven days.

   Either way, someone who already has an account cannot be given a new password silently, so they get an invitation link instead and the console says so. The same email cannot be added to an organization twice.

   **Never use a platform operator's email for an owner or member.** Operator accounts cannot join organizations, so such an invitation could never be accepted. The database refuses it, and the console says: "That email belongs to a platform operator account. Use a separate email for the organization's owner and members." Use a separate address (for testing, a second mailbox or a `+` alias such as `you+owner@gmail.com`).

   If creating any one login fails, the ones already made are removed and nothing is saved.

**What the secret key can do, and why it is only on the control API.** It can create, change and delete any login in the project, which is far more than this feature needs. That is why the customer API (which reads customer data) must never have it, and why the configuration enforces that. It is a deliberate widening of what the control API can do: with the key, a compromise of the control API could alter logins, though it still has no read access to customer figures. If that is not acceptable for a customer, leave the key out and use invitation links. Rotate the key in Supabase if it is ever exposed.

**Temporary passwords are only as private as the way you send them.** Send each person their own details, not a list. Treat the temporary password as a short-lived secret and ask people to sign in soon. Each login carries a `must_change_password` flag in `app_metadata`, which only the server can change. With `ENFORCE_PASSWORD_CHANGE=true` on the customer API, nobody sees any data until they replace the temporary password through an emailed code (section 6b). Without it, the flag is only a prompt in the web app.

## 6b. Password changes with an emailed code

Whenever anyone changes their password, whether it's the first change from a temporary password or any later one, the change-password page first emails them a 6-digit code:

1. They press **Email me a code**. The identity API makes a random code, stores only a hash of it, and emails it to the address on their account.
2. They type the code and their new password (at least 12 characters, not their email). The identity API checks the code. If it is right, the API sets the password and clears the `must_change_password` flag.

Limits, enforced in the database: a code lasts 10 minutes and allows 5 wrong attempts; one code a minute and 5 an hour per person; a new code cancels the previous one; each code works once.

**Setting up free email (Brevo, 300 emails a day on the free plan):**

1. Create a free account at brevo.com.
2. **Senders, Domains & Dedicated IPs → Senders → Add a sender**: add the address codes will come from, and confirm it from that mailbox. A sender on your own domain (with Brevo's domain authentication) lands in inboxes more reliably than a Gmail address.
3. **SMTP & API → API Keys → Generate a new API key.** Copy it once.
4. On the identity API, set `MAIL_PROVIDER=brevo`, `BREVO_API_KEY` (sensitive) and `MAIL_FROM` (the verified sender), then redeploy.
5. Test it: sign in, open **Change password**, press **Email me a code**, and check that the email arrives (and its spam folder).
6. Only then set `ENFORCE_PASSWORD_CHANGE=true` on the customer API and redeploy it.

If the email cannot be sent, the person sees "The email could not be sent. Try again in a minute." The API log shows the provider's status code, never the key or the code. To switch provider later, only `services/api/src/modules/saas/mail.ts` changes.

**What this does not cover.** Someone who is already signed in holds a Supabase session, and Supabase itself would accept a direct password change on that session without a code. The app never offers that path when codes are set up. To close it completely, turn on **Secure password change** in Supabase (Authentication → Providers → Email), which makes Supabase require a recent sign-in for any direct change. The temporary-password case is fully covered, because the server-only flag is what the customer API checks.

The console creates the organization, its roles and the invitations through database functions that return only ids. It cannot read the organization's figures.

### Organization lifecycle (operator)

In `/operator`, every organization shows its status and owner email (with when the email was verified). Actions:

| Status | Actions |
|---|---|
| pending | Activate, Delete |
| active | Suspend, Delete |
| suspended | Activate, Delete |
| deleted | Restore (back to suspended), Delete permanently after 30 days |

Delete and Delete permanently ask for the organization's exact name. Anyone in an organization that is not active is refused by the database and sees a page saying it is pending, suspended or removed. Permanent deletion erases the organization's data and the logins that belong to no other organization; the history of what happened stays in the operator's lifecycle log.

### What the owner manages

When the owner signs in they land on **Organization**, their own management page:

- **Overview**: rename the organization, see people, roles, KPIs and units at a glance, and a set-up checklist (structure, roles, people with roles, targets, first figures). The approval policy and setup proposals are here too.
- **Roles & KPIs**: for every role, what it can do (see results, assign actions, upload data, approve data, set up KPIs and units), where (the whole organization, or one unit and everything under it), and exactly which KPIs it sees (or every KPI, including ones added later). Roles from a template can be edited the same way. A role someone holds cannot be deleted.
- **People**: everyone's email and roles, change a person's roles, revoke access and restore it (roles are kept).
- **Units**: the structure as a tree, and adding units.

In **KPI library** the owner runs the KPIs:

- **Predefined KPIs**: from the catalog, **Add & activate** puts one to work at once.
- **Their own KPIs**: write a formula and **Create and activate**.
- **Edit** opens a KPI's formula and details; saving makes the next version (the old one is kept as history).
- **Who sees it** chooses, from the KPI, which roles see it. A role that sees every KPI always does.
- **Stop using** retires a KPI; a draft can be **Discarded**. Past results are kept. Retired versions are hidden unless "Show retired" is ticked.

In **Units**, a unit can be renamed, or deleted when nothing depends on it (no units under it, no figures or results, no locked periods, no role limited to it; never the top unit).

In **People**, **Reset password** gives a person a new temporary password (identity API). This works only for someone who belongs to this organization alone, so one owner can never take over an account that also works elsewhere; such a person resets their own password, or the service provider does.

Every change is checked for ownership in the database as well as the API, and recorded in **Activity**. Other members do not see colleagues' emails or roles.

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
