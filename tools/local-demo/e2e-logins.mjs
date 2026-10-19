// End-to-end check of temporary logins against the LOCAL demo stack only.
// Needs the control API started with SUPABASE_SECRET_KEY=demo-secret (see tools/local-demo/README.md).
import { readFileSync } from "node:fs";
const AUTH = "http://127.0.0.1:54321/auth/v1", API = "http://localhost:3100", CTL = "http://localhost:3101";
const USERS = new URL("./users.json", import.meta.url);
let pass = 0, fail = 0;
const ok = (cond, label) => { cond ? pass++ : fail++; console.log(`${cond ? "PASS" : "FAIL"}  ${label}`); };
const token = async (email, password) => {
  const r = await fetch(`${AUTH}/token?grant_type=password`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
  return { status: r.status, ...(await r.json()) };
};
const raw = async (base, session, method, path, body) => {
  const r = await fetch(base + path, { method, headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
  return { status: r.status, body: await r.json().catch(() => ({})) };
};
const call = async (...a) => { const r = await raw(...a); if (r.status >= 300) throw new Error(`${a[2]} ${a[3]} -> ${r.status} ${JSON.stringify(r.body)}`); return r.body; };
const registry = () => JSON.parse(readFileSync(USERS, "utf8"));
const admin = (method, path, body) => fetch(`${AUTH}/admin/users${path}`, { method, headers: { Authorization: "Bearer demo-secret", "Content-Type": "application/json" }, body: body && JSON.stringify(body) });

const stamp = Date.now().toString(36);
const mail = (n) => `${n}.${stamp}@lablogin.test`;
const op = await token("operator@demo.local", "x");

// 1. create an organization; everyone gets a login
const who = { owner: mail("owner"), ceo: mail("ceo"), entry: mail("entry"), review: mail("review"), existing: mail("existing") };
await admin("POST", "", { email: who.existing, password: "Existing-Pass-9" });
const org = await call(CTL, op, "POST", "/api/control/organizations", {
  name: `Lablogin ${stamp}`, ownerEmailVerified: true, ownerEmail: who.owner, templateId: "diagnostics-lab",
  members: [
    { email: who.ceo, roleKeys: ["executive"] },
    { email: who.entry, roleKeys: ["data_contributor"] },
    { email: who.review, roleKeys: ["data_reviewer"] },
    { email: who.existing, roleKeys: ["operations"] },
  ],
});
ok(org.mode === "logins", "the control API (with the admin key) creates logins, not links");
ok(org.owner.temporaryPassword && !org.owner.token, "the owner gets a temporary password");
const byEmail = Object.fromEntries(org.members.map((m) => [m.email, m]));
ok([who.ceo, who.entry, who.review].every((e) => /^[A-Za-z0-9]{4}-[A-Za-z0-9]{4}-[A-Za-z0-9]{4}$/.test(byEmail[e]?.temporaryPassword ?? "")), "each new person gets their own temporary password");
ok(new Set([org.owner, ...org.members].map((p) => p.temporaryPassword).filter(Boolean)).size === 4, "no two passwords are the same");
ok(byEmail[who.existing].token && !byEmail[who.existing].temporaryPassword, "someone who already had an account gets an invitation link, never a new password");
ok(registry()[who.existing].password === "Existing-Pass-9", "their existing password was left alone");

// 2. they can sign in with the temporary password, and only with it
const ownerLogin = await token(who.owner, org.owner.temporaryPassword);
ok(ownerLogin.access_token, "the owner signs in with the temporary password");
ok((await token(who.owner, "wrong-password-1")).status === 400, "a wrong password is refused");
ok(ownerLogin.user.user_metadata.must_change_password === true, "the account is flagged to choose its own password");

// 3. they are members immediately, with only their role's view
const ownerOrgs = await call(API, ownerLogin, "GET", "/api/saas/organizations");
ok(ownerOrgs.length === 1 && ownerOrgs[0].id === org.id && ownerOrgs[0].owner === true, "the owner is in the organization at once, no invitation to accept");
const ceo = await token(who.ceo, byEmail[who.ceo].temporaryPassword);
const entry = await token(who.entry, byEmail[who.entry].temporaryPassword);
const review = await token(who.review, byEmail[who.review].temporaryPassword);
const workspace = async (s) => call(API, s, "GET", `/api/saas/${org.id}/workspace`);
const [wOwner, wCeo, wEntry, wReview] = await Promise.all([workspace(ownerLogin), workspace(ceo), workspace(entry), workspace(review)]);
const active = (w) => w.kpis.filter((k) => k.state === "active").length;
ok(active(wOwner) >= 40, `the owner sees all ${active(wOwner)} KPIs`);
ok(active(wCeo) > 0 && active(wCeo) < active(wOwner) / 2, `the executive sees only their ${active(wCeo)} of ${active(wOwner)} KPIs`);
ok(wEntry.kpis.length === 0, "the data contributor sees no KPIs");
ok(wReview.units.length >= 1, "the data reviewer sees the organization's units");

// 4. permissions follow the roles
const unit = wOwner.units[0].id;
const batch = (n) => ({ idempotencyKey: crypto.randomUUID(), unitId: unit, period: { start: "2026-09-01", end: "2026-09-30" }, origin: "import", rows: [{ measure: "tests_performed", value: String(n) }] });
ok((await raw(API, entry, "POST", `/api/saas/${org.id}/batches`, batch(100))).status === 200, "the contributor can upload data");
ok((await raw(API, ceo, "POST", `/api/saas/${org.id}/batches`, batch(100))).status === 403, "the executive cannot upload data");
ok((await raw(API, ceo, "POST", `/api/saas/${org.id}/units`, { name: "X", kind: "x", parentId: unit })).status === 403, "the executive cannot configure the organization");
const pending = (await workspace(review)).batches.find((b) => b.status === "submitted");
ok((await raw(API, review, "POST", `/api/saas/${org.id}/batches/${pending.id}/approve`, {})).status === 200, "the reviewer approves it");
ok((await workspace(ceo)).results.length > 0, "the executive now sees results for their KPIs");

// 4b. nobody but a signed-in operator can make this API create a login
const attempts = async () => (await (await fetch(`${AUTH}/admin/attempts`)).json()).attempts;
const validBody = (n) => ({ name: `Intruder ${n}`, ownerEmailVerified: true, ownerEmail: mail(`intruder${n}`), templateId: "diagnostics-lab", members: [{ email: mail(`intruder${n}m`), roleKeys: ["executive"] }] });
const tried = await attempts();
const anon = await fetch(CTL + "/api/control/organizations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(validBody(1)) });
ok(anon.status === 401, `a request with no sign-in is refused (${anon.status})`);
const asCustomer = await raw(CTL, ownerLogin, "POST", "/api/control/organizations", validBody(2));
ok(asCustomer.status === 403, `a signed-in customer is refused (${asCustomer.status})`);
const addAsCustomer = await raw(CTL, ceo, "POST", `/api/control/organizations/${org.id}/members`, { members: [{ email: mail("sneaky"), roleKeys: ["executive"] }] });
ok(addAsCustomer.status === 403, `a customer cannot add people through the control API (${addAsCustomer.status})`);
ok((await attempts()) === tried, "and none of those requests even tried to create a login");

// 5. the operator still cannot see the customer's data
ok((await raw(API, op, "GET", `/api/saas/${org.id}/workspace`)).status === 403, "the operator cannot open the customer workspace");

// 6. the existing account accepts its invitation with its own password
const existing = await token(who.existing, "Existing-Pass-9");
const accepted = await raw(API, existing, "POST", "/api/saas/invitations/accept", { token: byEmail[who.existing].token });
ok(accepted.status === 200, "the existing account accepts the invitation with its own password");

// 7. all or nothing: a bad role leaves no stray logins behind
const before = Object.keys(registry()).length;
const bad = await raw(CTL, op, "POST", "/api/control/organizations", {
  name: `Bad ${stamp}`, ownerEmailVerified: true, ownerEmail: mail("badowner"), templateId: "diagnostics-lab",
  members: [{ email: mail("badmember"), roleKeys: ["janitor"] }],
});
ok(bad.status >= 400, `a role the template does not have is refused (${bad.status})`);
ok(Object.keys(registry()).length === before, "and the logins created along the way were removed");
const dup = await raw(CTL, op, "POST", "/api/control/organizations", {
  name: `Dup ${stamp}`, ownerEmailVerified: true, ownerEmail: mail("dupowner"), templateId: "diagnostics-lab",
  members: [{ email: mail("dm"), roleKeys: ["executive"] }, { email: mail("DM").toUpperCase().replace("@LABLOGIN.TEST", "@lablogin.test"), roleKeys: ["executive"] }],
});
ok(dup.status === 400 && Object.keys(registry()).length === before, "the same email twice is refused before any login is created");
const asOperator = await raw(CTL, op, "POST", "/api/control/organizations", {
  name: `Op ${stamp}`, ownerEmailVerified: true, ownerEmail: mail("opowner"), templateId: "diagnostics-lab",
  members: [{ email: "operator@demo.local", roleKeys: ["executive"] }],
});
ok(asOperator.status >= 400, "an operator account cannot be made a member of an organization");
ok(!("operator@demo.local" in registry()) || registry()["operator@demo.local"].password === "", "and the attempt left the operator's login alone");

// 8. add people later
const later = mail("later");
const more = await call(CTL, op, "POST", `/api/control/organizations/${org.id}/members`, { members: [{ email: later, roleKeys: ["executive"] }] });
ok(more.mode === "logins" && more.members[0].temporaryPassword, "people added later get a temporary password too");
const laterSession = await token(later, more.members[0].temporaryPassword);
ok((await workspace(laterSession)).kpis.length === wCeo.kpis.length, "and see exactly what the same role sees");
const second = await raw(CTL, op, "POST", `/api/control/organizations/${org.id}/members`, { members: [{ email: later, roleKeys: ["executive"] }] });
ok(second.status >= 400, "adding the same person twice is refused");

// 9. choosing a new password
const put = await fetch(`${AUTH}/user`, { method: "PUT", headers: { Authorization: `Bearer ${ceo.access_token}`, "Content-Type": "application/json" }, body: JSON.stringify({ password: "My-Own-Passw0rd!", data: { must_change_password: false } }) });
ok(put.status === 200, "a person can choose their own password");
ok((await token(who.ceo, byEmail[who.ceo].temporaryPassword)).status === 400, "the temporary password stops working");
const renewed = await token(who.ceo, "My-Own-Passw0rd!");
ok(renewed.access_token && renewed.user.user_metadata.must_change_password === false, "the new password works and the flag is cleared");

console.log(`\n${pass} passed, ${fail} failed`);
console.log(JSON.stringify({ orgId: org.id, owner: who.owner, ownerPassword: org.owner.temporaryPassword, ceo: who.ceo, ceoTemp: byEmail[who.ceo].temporaryPassword }));
process.exit(fail ? 1 : 0);
