// The owner as manager: KPIs (predefined and own), who sees them, units, password resets. LOCAL demo stack, all three APIs.
import { readFileSync } from "node:fs";
const AUTH = "http://127.0.0.1:54321/auth/v1", API = "http://localhost:3100", CTL = "http://localhost:3101", IDN = "http://localhost:3102";
const USERS = new URL("./users.json", import.meta.url);
let pass = 0, fail = 0;
const ok = (cond, label) => { cond ? pass++ : fail++; console.log(`${cond ? "PASS" : "FAIL"}  ${label}`); };
const token = async (email, password) => { const r = await fetch(`${AUTH}/token?grant_type=password`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) }); return { status: r.status, ...(await r.json()) }; };
const raw = async (base, s, method, path, body) => {
  const r = await fetch(base + path, { method, headers: { ...(s ? { Authorization: `Bearer ${s.access_token}` } : {}), "Content-Type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
  return { status: r.status, body: await r.json().catch(() => ({})) };
};
const call = async (...a) => { const r = await raw(...a); if (r.status >= 300) throw new Error(`${a[2]} ${a[3]} -> ${r.status} ${JSON.stringify(r.body)}`); return r.body; };
const registry = () => JSON.parse(readFileSync(USERS, "utf8"));
const attempts = async () => (await (await fetch(`${AUTH}/admin/attempts`)).json()).attempts;
const stamp = Date.now().toString(36);
const mail = (n) => `${n}.${stamp}@mgr.test`;
const op = await token("operator@demo.local", "x");
const make = (name, owner, members) => call(CTL, op, "POST", "/api/control/organizations", { name, ownerEmailVerified: true, ownerEmail: owner, templateId: "diagnostics-lab", members });
const A = await make(`Manager ${stamp}`, mail("owner"), [{ email: mail("coo"), roleKeys: ["operations"] }, { email: mail("ceo"), roleKeys: ["executive"] }]);
const pw = Object.fromEntries([A.owner, ...A.members].map((p) => [p.email, p.temporaryPassword]));
const owner = await token(mail("owner"), pw[mail("owner")]);
const coo = await token(mail("coo"), pw[mail("coo")]);
const T = `/api/saas/${A.id}`;
const ws = (s) => call(API, s, "GET", `${T}/workspace`);
let w = await ws(owner);
const cooRole = w.roles.find((r) => r.templateKey === "operations");

// 1. predefined KPIs: the owner adds and activates in one step
const before = w.kpis.filter((k) => k.state === "active").length;
const added = await call(API, owner, "POST", `${T}/catalog/FIN-046/add`, { activate: true });
w = await ws(owner);
const payroll = w.kpis.find((k) => k.id === added.id);
ok(payroll?.state === "active" && w.kpis.filter((k) => k.state === "active").length === before + 1, "the owner adds a predefined KPI and it is active at once");
const asDraft = await call(API, owner, "POST", `${T}/catalog/FIN-047/add`, {});
ok((await ws(owner)).kpis.find((k) => k.id === asDraft.id)?.state === "draft", "or adds one as a draft to review later");
ok((await raw(API, coo, "POST", `${T}/catalog/FIN-048/add`, { activate: true })).status === 403, "a member cannot add KPIs");

// 2. their own KPI, activated at once
const own = await call(API, owner, "POST", `${T}/kpis`, { key: "tests_per_day", name: "Tests per day", description: "Tests performed divided by days in the period.", unit: "count/days", formula: { op: "divide", left: { op: "measure", key: "tests_performed" }, right: { op: "period_days" } }, direction: "higher", target: "40", activate: true });
w = await ws(owner);
ok(w.kpis.find((k) => k.id === own.id)?.state === "active", "the owner writes their own KPI and activates it at once");
const asMember = await raw(API, coo, "POST", `${T}/kpis`, { key: "x_kpi", name: "X", description: "x", unit: "count", formula: { op: "measure", key: "tests_performed" }, direction: "higher", target: null, activate: true });
ok(asMember.status === 403, "a member cannot write KPIs");

// 3. edit = next version; the old one retires, its id stays in history
const v2 = await call(API, owner, "POST", `${T}/kpis`, { key: "tests_per_day", name: "Tests per day", description: "Tests per working day (22 days).", unit: "count", formula: { op: "divide", left: { op: "measure", key: "tests_performed" }, right: { op: "constant", value: "22" } }, direction: "higher", target: "40", activate: true });
w = await ws(owner);
const versions = w.kpis.filter((k) => k.key === "tests_per_day").map((k) => `${k.version}:${k.state}`).sort();
ok(versions.join(",") === "1:retired,2:active", `editing makes version 2 active and retires version 1 (${versions})`);

// 4. who sees it, from the KPI side
ok(!(await ws(coo)).kpis.some((k) => k.key === "tests_per_day"), "a new KPI is not shown to a role with chosen KPIs");
await call(API, owner, "POST", `${T}/kpis/${v2.id}/audience`, { roleIds: [cooRole.id] });
const cooView = await ws(coo);
ok(cooView.kpis.some((k) => k.key === "tests_per_day"), "after 'who sees it', the operations head sees it");
ok((await ws(owner)).roles.find((r) => r.id === cooRole.id).grants.some((g) => g.capability === "act" && (g.kpiId === null || g.kpiId === v2.id)), "and can assign actions on it, like their other KPIs");
await call(API, owner, "POST", `${T}/kpis/${v2.id}/audience`, { roleIds: [] });
ok(!(await ws(coo)).kpis.some((k) => k.key === "tests_per_day"), "and taking the role off hides it again");
ok((await raw(API, coo, "POST", `${T}/kpis/${v2.id}/audience`, { roleIds: [cooRole.id] })).status === 403, "a member cannot change who sees a KPI");
ok((await raw(API, owner, "POST", `${T}/kpis/${asDraft.id}/audience`, { roleIds: [cooRole.id] })).status === 409, "a draft cannot be shown to roles until it is active");
// an older version's grant still counts after a new version, by key
await call(API, owner, "POST", `${T}/kpis/${v2.id}/audience`, { roleIds: [cooRole.id] });
const v3 = await call(API, owner, "POST", `${T}/kpis`, { key: "tests_per_day", name: "Tests per day", description: "v3", unit: "count", formula: { op: "divide", left: { op: "measure", key: "tests_performed" }, right: { op: "constant", value: "21" } }, direction: "higher", target: "40", activate: true });
ok((await ws(coo)).kpis.some((k) => k.id === v3.id), "a role keeps seeing a KPI when the owner edits it again");

// 5. stop using and discard
await call(API, owner, "POST", `${T}/kpis/${payroll.id}/retire`, {});
ok((await ws(owner)).kpis.find((k) => k.id === payroll.id)?.state === "retired", "the owner stops using a KPI");
await call(API, owner, "POST", `${T}/kpis/${asDraft.id}/retire`, {});
ok((await ws(owner)).kpis.find((k) => k.id === asDraft.id)?.state === "retired", "and discards a draft");
const again = await raw(API, owner, "POST", `${T}/kpis/${payroll.id}/retire`, {});
ok(again.status === 409, "retiring twice is refused");
ok((await raw(API, coo, "POST", `${T}/kpis/${v3.id}/retire`, {})).status === 403, "a member cannot retire KPIs");
const log = await call(API, owner, "GET", `${T}/audit`);
ok(["kpi.retired", "kpi.discarded", "kpi.audience_changed", "kpi.activated"].every((e) => log.some((a) => a.event === e)), "every KPI change is in the activity log");

// 6. units: rename, delete only when nothing depends on it
const root = w.units.find((u) => u.parentId === null);
const branch = (await call(API, owner, "POST", `${T}/units`, { name: "Branch A", kind: "Branch", parentId: root.id })).id;
const sub = (await call(API, owner, "POST", `${T}/units`, { name: "Desk", kind: "Desk", parentId: branch })).id;
await call(API, owner, "POST", `${T}/units/${branch}/rename`, { name: "Pune branch", kind: "Branch" });
ok((await ws(owner)).units.find((u) => u.id === branch).name === "Pune branch", "the owner renames a unit");
const hasChild = await raw(API, owner, "POST", `${T}/units/${branch}/delete`, {});
ok(hasChild.status === 409 && /units under it/.test(hasChild.body.error?.message), `a unit with units under it cannot be deleted (${hasChild.body.error?.message})`);
const rootDel = await raw(API, owner, "POST", `${T}/units/${root.id}/delete`, {});
ok(rootDel.status === 409 && /top unit/.test(rootDel.body.error?.message), "the top unit cannot be deleted");
await call(API, owner, "POST", `${T}/units/${sub}/delete`, {});
ok(!(await ws(owner)).units.some((u) => u.id === sub), "an unused unit is deleted");
await raw(API, owner, "POST", `${T}/settings`, { allowSelfApproval: true });
const b = await call(API, owner, "POST", `${T}/batches`, { idempotencyKey: crypto.randomUUID(), unitId: branch, period: { start: "2026-09-01", end: "2026-09-30" }, origin: "import", rows: [{ measure: "tests_performed", value: "100" }] });
await call(API, owner, "POST", `${T}/batches/${b.id}/approve`, {});
const withData = await raw(API, owner, "POST", `${T}/units/${branch}/delete`, {});
ok(withData.status === 409 && /figures or results/.test(withData.body.error?.message), "a unit with figures cannot be deleted");
ok((await raw(API, coo, "POST", `${T}/units/${branch}/rename`, { name: "Hijack", kind: "x" })).status === 403, "a member cannot rename units");

// 7. reset a password
const cooMember = (await ws(owner)).members.find((m) => m.email === mail("coo"));
let tried = await attempts();
ok((await raw(IDN, coo, "POST", `/api/identity/organizations/${A.id}/members/${cooMember.id}/reset-password`, {})).status === 403, "a member cannot reset passwords");
ok((await raw(IDN, null, "POST", `/api/identity/organizations/${A.id}/members/${cooMember.id}/reset-password`, {})).status === 401, "nor can someone not signed in");
const reset = await call(IDN, owner, "POST", `/api/identity/organizations/${A.id}/members/${cooMember.id}/reset-password`, {});
ok(/^[A-Za-z0-9]{4}-[A-Za-z0-9]{4}-[A-Za-z0-9]{4}$/.test(reset.temporaryPassword), "the owner resets a password and gets a new temporary one");
ok((await token(mail("coo"), pw[mail("coo")])).status === 400, "the old password stops working");
const fresh = await token(mail("coo"), reset.temporaryPassword);
ok(fresh.access_token && fresh.user.user_metadata.must_change_password === true, "the new one works and must be changed at sign-in");
const ownerMember = (await ws(owner)).members.find((m) => m.owner);
ok((await raw(IDN, owner, "POST", `/api/identity/organizations/${A.id}/members/${ownerMember.id}/reset-password`, {})).status === 409, "the owner's own password is not reset this way");
// someone who is also in another organization is protected
const B = await make(`Elsewhere ${stamp}`, mail("otherowner"), [{ email: mail("shared"), roleKeys: ["executive"] }]);
const sharedPw = B.members[0].temporaryPassword;
const invited = await call(API, owner, "POST", `${T}/invitations`, { email: mail("shared"), roleIds: [cooRole.id] });
await call(API, await token(mail("shared"), sharedPw), "POST", "/api/saas/invitations/accept", { token: invited.token });
const sharedMember = (await ws(owner)).members.find((m) => m.email === mail("shared"));
tried = await attempts();
const blocked = await raw(IDN, owner, "POST", `/api/identity/organizations/${A.id}/members/${sharedMember.id}/reset-password`, {});
ok(blocked.status === 409 && /another organization/.test(blocked.body.error?.message), "someone who also belongs to another organization cannot be reset by this owner");
ok(registry()[mail("shared")].password === sharedPw && (await token(mail("shared"), sharedPw)).access_token, "and their password is untouched");
ok((await call(API, owner, "GET", `${T}/audit`)).some((a) => a.event === "member.password_reset"), "the reset is in the activity log");

console.log(`\n${pass} passed, ${fail} failed`);
console.log(JSON.stringify({ orgId: A.id, owner: mail("owner"), ownerPassword: pw[mail("owner")] }));
process.exit(fail ? 1 : 0);
