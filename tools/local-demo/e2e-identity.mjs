// Owner-issued logins through the identity API. LOCAL demo stack. Needs the control API and the identity API
// (port 3102) both started with SUPABASE_SECRET_KEY=demo-secret.
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
const AUTH = "http://127.0.0.1:54321/auth/v1", API = "http://localhost:3100", CTL = "http://localhost:3101", IDN = "http://localhost:3102";
// Path to psql; set PSQL to override. Used only to inspect the local test database.
const PSQL = process.env.PSQL ?? "C:/Program Files/PostgreSQL/18/bin/psql.exe";
const USERS = new URL("./users.json", import.meta.url);
let pass = 0, fail = 0;
const ok = (cond, label) => { cond ? pass++ : fail++; console.log(`${cond ? "PASS" : "FAIL"}  ${label}`); };
const token = async (email, password) => (await (await fetch(`${AUTH}/token?grant_type=password`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) })).json());
const raw = async (base, s, method, path, body) => {
  const r = await fetch(base + path, { method, headers: { ...(s ? { Authorization: `Bearer ${s.access_token}` } : {}), "Content-Type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
  return { status: r.status, body: await r.json().catch(() => ({})) };
};
const call = async (...a) => { const r = await raw(...a); if (r.status >= 300) throw new Error(`${a[2]} ${a[3]} -> ${r.status} ${JSON.stringify(r.body)}`); return r.body; };
const registry = () => JSON.parse(readFileSync(USERS, "utf8"));
const attempts = async () => (await (await fetch(`${AUTH}/admin/attempts`)).json()).attempts;
const admin = (method, path, body) => fetch(`${AUTH}/admin/users${path}`, { method, headers: { Authorization: "Bearer demo-secret", "Content-Type": "application/json" }, body: body && JSON.stringify(body) });
const stamp = Date.now().toString(36);
const mail = (n) => `${n}.${stamp}@idn.test`;
const op = await token("operator@demo.local", "x");
const make = (name, owner, members = []) => call(CTL, op, "POST", "/api/control/organizations", { name, ownerEmailVerified: true, ownerEmail: owner, templateId: "diagnostics-lab", members });

const A = await make(`Identity ${stamp}`, mail("owner"), [{ email: mail("ceo"), roleKeys: ["executive"] }]);
const B = await make(`Other ${stamp}`, mail("otherowner"));
const pwA = Object.fromEntries([A.owner, ...A.members].map((p) => [p.email, p.temporaryPassword]));
const owner = await token(mail("owner"), pwA[mail("owner")]);
const ceo = await token(mail("ceo"), pwA[mail("ceo")]);
const otherOwner = await token(mail("otherowner"), B.owner.temporaryPassword);
const T = `/api/saas/${A.id}`;
const w = await call(API, owner, "GET", `${T}/workspace`);
const roleId = (key) => w.roles.find((r) => r.templateKey === key).id;
const wB = await call(API, otherOwner, "GET", `/api/saas/${B.id}/workspace`);

// 1. each process serves only its own routes
ok((await raw(API, owner, "POST", `/api/identity/organizations/${A.id}/people`, { members: [] })).status === 404, "the customer API has no identity route");
ok((await raw(CTL, op, "POST", `/api/identity/organizations/${A.id}/people`, { members: [] })).status === 404, "the control API has no identity route");
ok((await raw(IDN, owner, "GET", `${T}/workspace`)).status === 404, "the identity API has no customer routes");
ok((await raw(IDN, op, "GET", "/api/control/organizations")).status === 404, "and no operator routes");

// 2. an owner creates logins with roles
const people = [{ displayName: "Operations Lead", email: mail("coo"), roleIds: [roleId("operations")] }, { displayName: "Dual Role Lead", email: mail("two"), roleIds: [roleId("executive"), roleId("quality_head")] }];
const made = await call(IDN, owner, "POST", `/api/identity/organizations/${A.id}/people`, { members: people });
ok(made.mode === "logins" && made.members.length === 2 && made.members.every((m) => /^[A-Za-z0-9]{4}-[A-Za-z0-9]{4}-[A-Za-z0-9]{4}$/.test(m.temporaryPassword ?? "")), "the owner creates two logins, each with a temporary password");
const byEmail = Object.fromEntries(made.members.map((m) => [m.email, m]));
const coo = await token(mail("coo"), byEmail[mail("coo")].temporaryPassword);
const two = await token(mail("two"), byEmail[mail("two")].temporaryPassword);
ok(coo.access_token && coo.user.user_metadata.must_change_password === true, "they sign in with it and are asked to choose their own");
const wc = await call(API, coo, "GET", `${T}/workspace`);
const w2 = await call(API, two, "GET", `${T}/workspace`);
ok(wc.kpis.length > 0 && wc.me.roles.length === 1 && /Operations/.test(wc.me.roles[0].name), `no invitation to accept: the operations head is in and sees their ${wc.kpis.length} KPIs`);
ok(w2.me.roles.length === 2 && w2.kpis.length > wc.kpis.length, "someone with two roles sees what both allow");
const refreshed = await call(API, owner, "GET", `${T}/workspace`);
ok(refreshed.members.find((m) => m.email === mail("coo"))?.roleIds.length === 1, "the owner sees them in People with their roles");
ok(refreshed.members.find((m) => m.email === mail("coo"))?.displayName === "Operations Lead", "the employee's name is preserved with their login");
const log = await call(API, owner, "GET", `${T}/audit`);
ok(log.filter((a) => a.event === "member.created_by_owner").length === 2, "the activity log says the owner created them");

// 3. nobody but the owner can cause a login to be created
const body = (n) => ({ members: [{ email: mail(`intruder${n}`), roleIds: [roleId("executive")] }] });
let before = await attempts();
const anon = await raw(IDN, null, "POST", `/api/identity/organizations/${A.id}/people`, body(1));
ok(anon.status === 401, `no sign-in: refused (${anon.status})`);
const asMember = await raw(IDN, ceo, "POST", `/api/identity/organizations/${A.id}/people`, body(2));
ok(asMember.status === 403, `a member: refused (${asMember.status})`);
const asOther = await raw(IDN, otherOwner, "POST", `/api/identity/organizations/${A.id}/people`, body(3));
ok(asOther.status === 403, `another organization's owner: refused (${asOther.status})`);
const asOp = await raw(IDN, op, "POST", `/api/identity/organizations/${A.id}/people`, body(4));
ok(asOp.status === 403, `the platform operator: refused (${asOp.status})`);
ok((await attempts()) === before, "and none of those tried to create a login");
ok(!(mail("intruder2") in registry()) && !(mail("intruder3") in registry()), "no stray accounts exist");

// 4. suspended organizations cannot add people
await call(CTL, op, "POST", `/api/control/organizations/${A.id}/status`, { status: "suspended" });
const suspended = await raw(IDN, owner, "POST", `/api/identity/organizations/${A.id}/people`, body(5));
ok(suspended.status === 403 && (await attempts()) === before, "an owner of a suspended organization cannot add people, and no login is attempted");
await call(CTL, op, "POST", `/api/control/organizations/${A.id}/status`, { status: "active" });

// 5. all or nothing, and sensible refusals
before = await attempts();
const noSuchRole = await raw(IDN, owner, "POST", `/api/identity/organizations/${A.id}/people`, { members: [{ email: mail("ghost"), roleIds: ["aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"] }] });
ok(noSuchRole.status >= 400 && !(mail("ghost") in registry()), `a role that does not exist is refused (${noSuchRole.status}) and the login created for it is removed`);
const foreignRole = await raw(IDN, owner, "POST", `/api/identity/organizations/${A.id}/people`, { members: [{ email: mail("spy"), roleIds: [wB.roles[0].id] }] });
ok(foreignRole.status >= 400 && !(mail("spy") in registry()), "a role from another organization is refused, with no stray login");
const twice = await raw(IDN, owner, "POST", `/api/identity/organizations/${A.id}/people`, { members: [{ email: mail("coo"), roleIds: [roleId("executive")] }] });
ok(twice.status === 409 && /already/.test(twice.body.error?.message), `adding someone who is already in is refused clearly (${twice.body.error?.message})`);
const dupInRequest = await raw(IDN, owner, "POST", `/api/identity/organizations/${A.id}/people`, { members: [{ email: mail("d"), roleIds: [roleId("executive")] }, { email: mail("D"), roleIds: [roleId("executive")] }] });
ok(dupInRequest.status === 400, "the same email twice in one request is refused before any login is made");
const asOwner = await raw(IDN, owner, "POST", `/api/identity/organizations/${A.id}/people`, { members: [{ email: mail("boss"), roleIds: [roleId("executive")], owner: true }] });
ok(asOwner.status === 400, "an owner cannot create another owner");
const noRole = await raw(IDN, owner, "POST", `/api/identity/organizations/${A.id}/people`, { members: [{ email: mail("norole"), roleIds: [] }] });
ok(noRole.status === 400, "a person needs at least one role");

// 6. someone who already has a login gets an invitation, never a new password
await admin("POST", "", { email: mail("known"), password: "Known-Pass-1!" });
const known = await call(IDN, owner, "POST", `/api/identity/organizations/${A.id}/people`, { members: [{ email: mail("known"), roleIds: [roleId("executive")] }] });
ok(known.members[0].token && !known.members[0].temporaryPassword && registry()[mail("known")].password === "Known-Pass-1!", "an existing account gets an invitation link, and its password is untouched");
const knownSession = await token(mail("known"), "Known-Pass-1!");
ok((await raw(API, knownSession, "POST", "/api/saas/invitations/accept", { token: known.members[0].token })).status === 200, "and accepts it with their own password");

// 7. the identity database role can do almost nothing
const sqlAs = (text) => spawnSync(PSQL, ["-h", "127.0.0.1", "-p", "54329", "-U", "cc_kpi_identity_login", "-d", "postgres", "-tA", "-c", `set role kpi_identity_app; ${text}`], { env: { ...process.env, PGPASSWORD: "demo-identity" }, encoding: "utf8" });
const read = sqlAs("select count(*) from kpi.memberships");
ok(/permission denied/.test(read.stderr), "the identity login cannot read memberships");
ok(/permission denied/.test(sqlAs("select count(*) from kpi.definitions").stderr), "or KPI definitions");
ok(/permission denied/.test(sqlAs("select count(*) from kpi.results").stderr), "or results");
ok(/permission denied/.test(sqlAs("select kpi.apply_template(gen_random_uuid(),'diagnostics-lab',gen_random_uuid())").stderr), "or call internal functions");
ok(/permission denied/.test(sqlAs("select kpi_control.add_people(gen_random_uuid(),'[]'::jsonb)").stderr), "or the operator's functions");
ok(/permission denied/.test(sqlAs("select kpi.approve_batch(gen_random_uuid(),gen_random_uuid())").stderr), "or the customer functions");
ok(/permission denied/.test(sqlAs("select * from kpi_control.registry").stderr), "or the operator's tables");

console.log(`\n${pass} passed, ${fail} failed`);
console.log(JSON.stringify({ orgId: A.id, owner: mail("owner"), ownerPassword: pwA[mail("owner")], coo: mail("coo"), cooPassword: byEmail[mail("coo")].temporaryPassword }));
process.exit(fail ? 1 : 0);
