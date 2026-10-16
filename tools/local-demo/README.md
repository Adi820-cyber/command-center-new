# Local demo stack

Runs the whole platform on one computer with no Supabase account: a throwaway Postgres, a stand-in login server, the two APIs and the web app. It exists so the multi-tenant flow can be tested end to end, and so anyone can click through the product without credentials.

**Local only.** The stand-in login accepts any email and any password. It listens on 127.0.0.1. Never deploy it, never point it at real data.

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

4. **APIs** (two processes, each with only its own database credential):

   ```
   cd services/api
   SUPABASE_URL=http://127.0.0.1:54321 ALLOWED_ORIGINS=http://localhost:5174 PORT=3100 \
     KPI_DATABASE_URL=postgresql://cc_kpi_data_login:demo-data@127.0.0.1:<port>/<database> node src/app.ts
   SUPABASE_URL=http://127.0.0.1:54321 ALLOWED_ORIGINS=http://localhost:5174 PORT=3101 \
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

The same database rules are also checked, inside a transaction that is rolled back, by `database/tests/v2-smoke.sql`.
