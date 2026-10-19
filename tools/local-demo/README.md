# Local demo stack

Runs the whole platform on one computer with no Supabase account: a throwaway Postgres, a stand-in login server, the two APIs and the web app. It exists so the multi-tenant flow can be tested end to end, and so anyone can click through the product without credentials.

**Local only.** The stand-in login accepts any email and any password, with one exception: an account created through its admin call (as the control API does for a new person) needs the password it was created with and carries the "must change password" flag, like the real thing. Those accounts are kept in `users.json`, which is not committed. It listens on 127.0.0.1. Never deploy it, never point it at real data.

## What you need

- Node 22 (see the root `package.json` engines) and `npm install` done at the repo root.
- PostgreSQL 15 or newer with SSL enabled. The API connects with TLS required, so a throwaway server needs a self-signed certificate (`ssl = on` with `server.crt` and `server.key`).

## Steps

1. **Database.** Create a cluster and a database, then create the roles Supabase provides and apply the migrations and the catalog:

   ```sql
   create role anon nologin; create role authenticated nologin; create role service_role nologin;
   ```

   ```
   psql -f database/supabase/migrations/20261015000100_kpi_platform.sql
   psql -f database/supabase/migrations/20261016000100_catalog_templates_rollup.sql
   psql -f database/catalog-seed.sql
   ```

   Then create the two login roles the APIs use (passwords are local-only):

   ```sql
   create role cc_kpi_data_login login noinherit nosuperuser nobypassrls password 'demo-data';
   create role cc_kpi_control_login login noinherit nosuperuser nobypassrls password 'demo-control';
   grant kpi_app to cc_kpi_data_login;
   grant kpi_control_app to cc_kpi_control_login;
   ```

2. **Platform operator.** The stand-in login derives a user id from the email. Print the id for `operator@demo.local` and add it to the operators table:

   ```
   node -e "const {createHash}=require('crypto');const h=createHash('sha256').update('operator@demo.local').digest('hex');console.log(`${h.slice(0,8)}-${h.slice(8,12)}-4${h.slice(13,16)}-a${h.slice(17,20)}-${h.slice(20,32)}`)"
   ```

   ```sql
   insert into kpi_control.operators(subject) values ('<the id printed above>');
   ```

3. **Login stand-in:** `node tools/local-demo/auth-server.mjs` (port 54321).

4. **APIs** (two processes, each with only its own database credential). Add `SUPABASE_SECRET_KEY=demo-secret` to the **control** process to turn on temporary logins; leave it out for invitation links:

   ```
   cd services/api
   SUPABASE_URL=http://127.0.0.1:54321 ALLOWED_ORIGINS=http://localhost:5174 PORT=3100 \
     KPI_DATABASE_URL=postgresql://cc_kpi_data_login:demo-data@127.0.0.1:<port>/<database> node src/app.ts
   SUPABASE_URL=http://127.0.0.1:54321 ALLOWED_ORIGINS=http://localhost:5174 PORT=3101 SUPABASE_SECRET_KEY=demo-secret \
     CONTROL_DATABASE_URL=postgresql://cc_kpi_control_login:demo-control@127.0.0.1:<port>/<database> node src/app.ts
   ```

5. **Web app:**

   ```
   cd apps/web
   VITE_SUPABASE_URL=http://127.0.0.1:54321 VITE_SUPABASE_PUBLISHABLE_KEY=demo VITE_API_BASE_URL=http://localhost:3100 \
     VITE_CONTROL_API_BASE_URL=http://localhost:3101 npx vite --host 127.0.0.1 --port 5174
   ```

   Open http://localhost:5174 and sign in as `operator@demo.local` with any password.

## The end-to-end suite

`node tools/local-demo/e2e.mjs` provisions an organization from a template with members and roles, accepts the invitations, uploads data, approves it, and checks roll-up to parent units, period comparisons, role-limited visibility, Ask, the catalog, targets and the operator's limits. It prints PASS or FAIL for each check and exits non-zero on any failure. It creates a new organization each time, so it can be run repeatedly.

`node tools/local-demo/e2e-logins.mjs` does the same for temporary logins and needs the control API started with the key: each new person gets their own password, signs in with it, sees only their role's KPIs, can be added later, and a failed step leaves no stray logins. `node tools/local-demo/e2e-owner.mjs` (also with the key) checks what an owner manages: renaming, changing which KPIs a role sees and where, creating and deleting roles, revoking and restoring people, and that members cannot do any of it. Run `e2e.mjs` against a control API **without** the key, since it exercises invitation links.

`e2e-lifecycle.mjs` checks pending, active, suspended, deleted, restore and permanent deletion (with the control API's key). `e2e-identity.mjs` checks owner-issued logins; it needs the identity API on port 3102, started with `IDENTITY_DATABASE_URL` (a login granted `kpi_identity_app`) and `SUPABASE_SECRET_KEY=demo-secret`.

`e2e-otp.mjs` checks password changes with an emailed code. Start the identity API with `MAIL_PROVIDER=outbox MAIL_OUTBOX=<a file>`: codes are written to that file, one JSON line per email, instead of being sent. Also start a second customer API on port 3103 with `ENFORCE_PASSWORD_CHANGE=true`. Set `OUTBOX` to the same file when running the test. It checks that a temporary password opens no data, that the code is emailed and stored only as a hash, the one-a-minute limit, wrong-code counting and the five-attempt lock, single use, that one person's code does not work for another, and that a platform operator's email is refused as an owner or member. It uses the superuser connection (`PGPASSWORD=demo-superuser-pw`, port 54329) to look inside the table and to skip the one-minute wait. Set `PSQL` if `psql` is elsewhere.

With `VITE_IDENTITY_API_BASE_URL` set, the web app's change-password page uses the emailed code. Without it, the page changes the password directly.

Run `e2e.mjs` with `CONTROL_API=http://localhost:3104` pointing at a control API started without the key.

The same database rules are also checked, inside a transaction that is rolled back, by `database/tests/v2-smoke.sql`.
