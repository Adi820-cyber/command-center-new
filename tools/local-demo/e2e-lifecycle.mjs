// The service provider's organization lifecycle. LOCAL demo stack only; control API started with SUPABASE_SECRET_KEY=demo-secret.
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
const AUTH = "http://127.0.0.1:54321/auth/v1", API = "http://localhost:3100", CTL = "http://localhost:3101";
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
const sql = (text) => spawnSync(PSQL, ["-h", "127.0.0.1", "-p", "54329", "-U", "postgres", "-tA", "-c", text], { env: { ...process.env, PGPASSWORD: "demo-superuser-pw" }, encoding: "utf8" }).stdout.trim();
const registry = () => JSON.parse(readFileSync(USERS, "utf8"));
const stamp = Date.now().toString(36);
const mail = (n) => `${n}.${stamp}@life.test`;
const op = await token("operator@demo.local", "x");
const make = (name, owner, members = [], extra = {}) => raw(CTL, op, "POST", "/api/control/organizations", { name, ownerEmailVerified: true, ownerEmail: owner, templateId: "diagnostics-lab", members, ...extra });

// 1. the operator must state that the owner's email was verified
const noAttest = await raw(CTL, op, "POST", "/api/control/organizations", { name: `NoAttest ${stamp}`, ownerEmail: mail("na"), templateId: "diagnostics-lab", members: [] });
ok(noAttest.status === 400, "an organization cannot be created without the operator's email verification");
const falseAttest = await make(`False ${stamp}`, mail("fa"), [], { ownerEmailVerified: false });
ok(falseAttest.status === 400, "'not verified' is refused too");

// 2. created pending: nobody can work in it
const A = await call(CTL, op, "POST", "/api/control/organizations", { name: `Lifecycle ${stamp}`, ownerEmailVerified: true, activate: false, ownerEmail: mail("owner"), templateId: "diagnostics-lab", members: [{ email: mail("ceo"), roleKeys: ["executive"] }] });
const pw = Object.fromEntries([A.owner, ...A.members].map((p) => [p.email, p.temporaryPassword]));
const owner = await token(mail("owner"), pw[mail("owner")]);
const ceo = await token(mail("ceo"), pw[mail("ceo")]);
const list = async () => await call(CTL, op, "GET", "/api/control/organizations");
const mine = async () => (await list()).find((o) => o.id === A.id);
ok((await mine()).status === "pending", "the organization starts pending when the operator does not activate it");
ok((await mine()).ownerEmail === mail("owner") && (await mine()).ownerEmailVerifiedAt, "the operator's list records the owner's email and when it was verified");
const ownerOrgs = await call(API, owner, "GET", "/api/saas/organizations");
ok(ownerOrgs.length === 1 && ownerOrgs[0].status === "pending", "the owner can sign in and sees the organization as pending");
const blocked = await raw(API, owner, "GET", `/api/saas/${A.id}/workspace`);
ok(blocked.status === 403 && /not been activated/.test(blocked.body.error?.message), `a pending organization cannot be worked in (${blocked.body.error?.message})`);
ok((await raw(API, owner, "POST", `/api/saas/${A.id}/organization`, { name: "Renamed" })).status === 403, "the owner cannot change anything while it is pending");

// 3. activate
await call(CTL, op, "POST", `/api/control/organizations/${A.id}/status`, { status: "active" });
ok((await mine()).status === "active", "the operator activates it");
const w = await call(API, owner, "GET", `/api/saas/${A.id}/workspace`);
ok(w.organization.status === "active" && w.kpis.length > 0, "the owner now works in it");
await call(API, owner, "POST", `/api/saas/${A.id}/units`, { name: "Kept unit", kind: "Branch", parentId: w.units[0].id });

// 4. suspend: everyone blocked, nothing lost
await call(CTL, op, "POST", `/api/control/organizations/${A.id}/status`, { status: "suspended" });
for (const [who, s] of [["the owner", owner], ["a member", ceo]]) {
  const r = await raw(API, s, "GET", `/api/saas/${A.id}/workspace`);
  ok(r.status === 403 && /suspended/.test(r.body.error?.message), `${who} is blocked with a clear reason while suspended`);
}
ok((await call(API, ceo, "GET", "/api/saas/organizations"))[0].status === "suspended", "and the person's own list says suspended");
await call(CTL, op, "POST", `/api/control/organizations/${A.id}/status`, { status: "active" });
ok((await call(API, owner, "GET", `/api/saas/${A.id}/workspace`)).units.some((u) => u.name === "Kept unit"), "reactivated, everything is exactly as it was");

// 5. only an operator, only valid moves
ok((await raw(CTL, null, "POST", `/api/control/organizations/${A.id}/status`, { status: "suspended" })).status === 401, "no sign-in: refused");
ok((await raw(CTL, owner, "POST", `/api/control/organizations/${A.id}/status`, { status: "suspended" })).status === 403, "the owner cannot suspend their own organization");
ok((await raw(API, owner, "POST", `/api/control/organizations/${A.id}/status`, { status: "active" })).status === 404, "and the customer API has no such route");
const noop = await raw(CTL, op, "POST", `/api/control/organizations/${A.id}/status`, { status: "active" });
ok(noop.status === 409, `activating an active organization is refused (${noop.status})`);

// 6. delete needs the typed name; restore within the window
const wrong = await raw(CTL, op, "POST", `/api/control/organizations/${A.id}/status`, { status: "deleted", confirmName: "something else" });
ok(wrong.status === 400, "deleting with the wrong name is refused");
ok((await raw(CTL, op, "POST", `/api/control/organizations/${A.id}/status`, { status: "deleted" })).status === 400, "deleting without typing the name is refused");
await call(CTL, op, "POST", `/api/control/organizations/${A.id}/status`, { status: "deleted", confirmName: `Lifecycle ${stamp}` });
const del = await mine();
const days = (new Date(del.purgeAfter) - Date.now()) / 86400000;
ok(del.status === "deleted" && days > 29 && days < 31, `deleted, with permanent deletion allowed in ${days.toFixed(1)} days`);
const gone = await raw(API, owner, "GET", `/api/saas/${A.id}/workspace`);
ok(gone.status === 403 && /removed/.test(gone.body.error?.message), "a deleted organization is closed to everyone");
const early = await raw(CTL, op, "POST", `/api/control/organizations/${A.id}/purge`, { confirmName: `Lifecycle ${stamp}` });
ok(early.status === 409 && /retention/.test(early.body.error?.message), "permanent deletion before 30 days is refused");
await call(CTL, op, "POST", `/api/control/organizations/${A.id}/status`, { status: "suspended" });
ok((await mine()).status === "suspended" && (await mine()).purgeAfter === null, "restoring brings it back as suspended, and cancels the deletion");
await call(CTL, op, "POST", `/api/control/organizations/${A.id}/status`, { status: "active" });
ok((await call(API, owner, "GET", `/api/saas/${A.id}/workspace`)).units.some((u) => u.name === "Kept unit"), "after restore and activation, the data is intact");

// 7. permanent deletion erases one organization and only the logins that belong to nobody else
const C = await call(CTL, op, "POST", "/api/control/organizations", { name: `Keeper ${stamp}`, ownerEmailVerified: true, ownerEmail: mail("keeper"), templateId: "diagnostics-lab", members: [{ email: mail("shared"), roleKeys: ["executive"] }] });
const D = await call(CTL, op, "POST", "/api/control/organizations", { name: `Doomed ${stamp}`, ownerEmailVerified: true, ownerEmail: mail("doomed"), templateId: "diagnostics-lab", members: [{ email: mail("shared"), roleKeys: ["executive"] }, { email: mail("temp"), roleKeys: ["executive"] }] });
const sharedInD = D.members.find((m) => m.email === mail("shared"));
ok(sharedInD.token && !sharedInD.temporaryPassword, "someone who already had a login gets an invitation to the second organization");
const sharedPw = C.members.find((m) => m.email === mail("shared")).temporaryPassword;
const shared = await token(mail("shared"), sharedPw);
await call(API, shared, "POST", "/api/saas/invitations/accept", { token: sharedInD.token });
ok((await call(API, shared, "GET", "/api/saas/organizations")).length === 2, "that person now belongs to both organizations");
const doomedOwner = await token(mail("doomed"), D.owner.temporaryPassword);
await call(API, doomedOwner, "POST", `/api/saas/${D.id}/units`, { name: "Doomed unit", kind: "Branch", parentId: (await call(API, doomedOwner, "GET", `/api/saas/${D.id}/workspace`)).units[0].id });
const rowsFor = (id) => Number(sql(`select (select count(*) from kpi.units where tenant_id='${id}') + (select count(*) from kpi.definitions where tenant_id='${id}') + (select count(*) from kpi.roles where tenant_id='${id}') + (select count(*) from kpi.memberships where tenant_id='${id}')`));
const keepersBefore = rowsFor(C.id);
ok(rowsFor(D.id) > 50 && keepersBefore > 50, "both organizations hold data");
await call(CTL, op, "POST", `/api/control/organizations/${D.id}/status`, { status: "deleted", confirmName: `Doomed ${stamp}` });
sql(`update kpi.organizations set purge_after = now() - interval '1 day' where id='${D.id}'`);
const badName = await raw(CTL, op, "POST", `/api/control/organizations/${D.id}/purge`, { confirmName: "nope" });
ok(badName.status === 400, "permanent deletion needs the typed name");
const notDeleted = await raw(CTL, op, "POST", `/api/control/organizations/${C.id}/purge`, { confirmName: `Keeper ${stamp}` });
ok(notDeleted.status === 409, "an organization that is not deleted cannot be permanently deleted");
const purged = await call(CTL, op, "POST", `/api/control/organizations/${D.id}/purge`, { confirmName: `Doomed ${stamp}` });
ok(purged.removedLogins === 2 && purged.failedLogins === 0, `permanent deletion removed ${purged.removedLogins} logins`);
ok(rowsFor(D.id) === 0, "every row of the deleted organization is gone");
ok(rowsFor(C.id) === keepersBefore, "the other organization is untouched");
ok(!(mail("doomed") in registry()) && !(mail("temp") in registry()), "the deleted organization's own logins were removed");
ok(mail("shared") in registry() && (await token(mail("shared"), sharedPw)).access_token, "the shared login, which belongs to another organization, was kept and still works");
ok(!(await list()).some((o) => o.id === D.id), "the operator's list no longer shows it");
ok(sql(`select string_agg(event, ',' order by at, event <> 'created') from kpi_control.lifecycle where tenant_id='${D.id}'`) === "created,activated,deleted,purged", "the history of what happened is kept after deletion");

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
