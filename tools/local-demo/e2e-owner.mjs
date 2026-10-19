// The owner runs their organization: rename, roles and their KPIs, people. LOCAL demo stack only.
// Needs the control API started with SUPABASE_SECRET_KEY=demo-secret.
const AUTH = "http://127.0.0.1:54321/auth/v1", API = "http://localhost:3100", CTL = "http://localhost:3101";
let pass = 0, fail = 0;
const ok = (cond, label) => { cond ? pass++ : fail++; console.log(`${cond ? "PASS" : "FAIL"}  ${label}`); };
const token = async (email, password) => (await (await fetch(`${AUTH}/token?grant_type=password`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) })).json());
const raw = async (base, s, method, path, body) => {
  const r = await fetch(base + path, { method, headers: { Authorization: `Bearer ${s.access_token}`, "Content-Type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
  return { status: r.status, body: await r.json().catch(() => ({})) };
};
const call = async (...a) => { const r = await raw(...a); if (r.status >= 300) throw new Error(`${a[2]} ${a[3]} -> ${r.status} ${JSON.stringify(r.body)}`); return r.body; };

const stamp = Date.now().toString(36);
const mail = (n) => `${n}.${stamp}@owner.test`;
const op = await token("operator@demo.local", "x");
const org = await call(CTL, op, "POST", "/api/control/organizations", {
  name: `Owner Co ${stamp}`, ownerEmail: mail("owner"), templateId: "diagnostics-lab",
  members: [{ email: mail("ceo"), roleKeys: ["executive"] }, { email: mail("entry"), roleKeys: ["data_contributor"] }],
});
const pw = Object.fromEntries([org.owner, ...org.members].map((p) => [p.email, p.temporaryPassword]));
const owner = await token(mail("owner"), pw[mail("owner")]);
const ceo = await token(mail("ceo"), pw[mail("ceo")]);
const entry = await token(mail("entry"), pw[mail("entry")]);
const T = `/api/saas/${org.id}`;
const ws = (s) => call(API, s, "GET", `${T}/workspace`);

// 1. what the owner sees about people
let w = await ws(owner);
const ceoMember = w.members.find((m) => m.email === mail("ceo"));
ok(ceoMember && ceoMember.roleIds.length === 1, "the owner sees each person's email and roles");
const ceoView = await ws(ceo);
ok(ceoView.members.every((m) => m.email === null && m.roleIds.length === 0), "a member does not see colleagues' emails or roles");

// 2. rename
ok((await raw(API, ceo, "POST", `${T}/organization`, { name: "Hijack" })).status === 403, "a member cannot rename the organization");
await call(API, owner, "POST", `${T}/organization`, { name: `  Renamed ${stamp}  ` });
w = await ws(owner);
ok(w.organization.name === `Renamed ${stamp}`, "the owner renames it (spaces trimmed)");
const registry = await call(CTL, op, "GET", "/api/control/organizations");
ok(registry.some((o) => o.id === org.id && o.name === `Renamed ${stamp}`), "the operator's list shows the new name");
ok((await raw(API, owner, "POST", `${T}/organization`, { name: "   " })).status === 400, "an empty name is refused");

// 3. narrow what the executive sees
const execRole = w.roles.find((r) => r.templateKey === "executive");
const before = (await ws(ceo)).kpis.length;
const active = w.kpis.filter((k) => k.state === "active");
const pick = [active.find((k) => k.catalogId === "LAB-001"), active.find((k) => k.catalogId === "FIN-001")].filter(Boolean).map((k) => k.id);
ok(pick.length === 2, "found two KPIs to give the executive");
await call(API, owner, "POST", `${T}/roles/save`, { roleId: execRole.id, name: "Executive", capabilities: ["view", "act"], scopeUnitId: null, kpiIds: pick });
const after = await ws(ceo);
ok(before > 2 && after.kpis.length === 2 && after.kpis.every((k) => pick.includes(k.id)), `the executive now sees exactly the 2 chosen KPIs (was ${before})`);
w = await ws(owner);
ok(w.roles.find((r) => r.id === execRole.id).name === "Executive", "the role was renamed");

// 4. widen to every KPI
await call(API, owner, "POST", `${T}/roles/save`, { roleId: execRole.id, name: "Executive", capabilities: ["view"], scopeUnitId: null, kpiIds: [] });
ok((await ws(ceo)).kpis.length === active.length, `choosing every KPI shows all ${active.length}`);

// 5. scope to a unit: a member then sees results only there
const root = w.units.find((u) => u.parentId === null);
const north = (await call(API, owner, "POST", `${T}/units`, { name: "North", kind: "Region", parentId: root.id })).id;
const south = (await call(API, owner, "POST", `${T}/units`, { name: "South", kind: "Region", parentId: root.id })).id;
await call(API, owner, "POST", `${T}/roles/save`, { roleId: execRole.id, name: "Executive", capabilities: ["view"], scopeUnitId: north, kpiIds: [] });
const batch = (unit, n) => ({ idempotencyKey: crypto.randomUUID(), unitId: unit, period: { start: "2026-09-01", end: "2026-09-30" }, origin: "import", rows: [{ measure: "tests_performed", value: String(n) }] });
for (const [unit, n] of [[north, 100], [south, 300]]) {
  const b = await call(API, entry, "POST", `${T}/batches`, batch(unit, n));
  await raw(API, owner, "POST", `${T}/settings`, { allowSelfApproval: true });
  await call(API, owner, "POST", `${T}/batches/${b.id}/approve`, {});
}
const scoped = await ws(ceo);
const units = new Set(scoped.results.map((r) => r.unitId));
ok(scoped.results.length > 0 && [...units].every((u) => u === north), "scoped to North, the executive sees North's results and not South's");

// 6. refusals
ok((await raw(API, ceo, "POST", `${T}/roles/save`, { name: "Mine", capabilities: ["view"], scopeUnitId: null, kpiIds: [] })).status === 403, "a member cannot create roles");
const foreignKpi = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
ok((await raw(API, owner, "POST", `${T}/roles/save`, { name: "Bad", capabilities: ["view"], scopeUnitId: null, kpiIds: [foreignKpi] })).status === 400, "a KPI from outside the organization is refused");
ok((await raw(API, owner, "POST", `${T}/roles/save`, { name: "Bad", capabilities: [], scopeUnitId: null, kpiIds: [] })).status === 400, "a role that can do nothing is refused");
ok((await raw(API, owner, "POST", `${T}/roles/save`, { name: "Bad", capabilities: ["submit"], scopeUnitId: null, kpiIds: [pick[0]] })).status === 400, "KPIs on a role that cannot see results are refused");
const dupName = await raw(API, owner, "POST", `${T}/roles/save`, { name: "Executive", capabilities: ["view"], scopeUnitId: null, kpiIds: [] });
ok(dupName.status === 409 && /already exists/.test(dupName.body.error?.message), `a second role with the same name is refused clearly (${dupName.body.error?.message})`);

// 7. create and delete roles
const created = await call(API, owner, "POST", `${T}/roles/save`, { name: "Branch head", capabilities: ["view", "approve"], scopeUnitId: south, kpiIds: [pick[0]] });
w = await ws(owner);
ok(w.roles.some((r) => r.id === created.id && r.name === "Branch head"), "the owner creates a new role");
const inUse = await raw(API, owner, "POST", `${T}/roles/${execRole.id}/delete`, {});
ok(inUse.status === 409 && /still held/.test(inUse.body.error?.message), "a role someone holds cannot be deleted, with a clear reason");
await call(API, owner, "POST", `${T}/roles/${created.id}/delete`, {});
ok(!(await ws(owner)).roles.some((r) => r.id === created.id), "an unused role is deleted");
ok((await raw(API, ceo, "POST", `${T}/roles/${created.id}/delete`, {})).status === 403, "a member cannot delete roles");

// 8. revoke and restore
const ceoId = ceoMember.id;
await call(API, owner, "POST", `${T}/members/${ceoId}/revoke`, {});
ok((await raw(API, ceo, "GET", `${T}/workspace`)).status === 403, "a revoked person loses access");
ok((await raw(API, ceo, "POST", `${T}/members/${ceoId}/restore`, {})).status === 403, "they cannot restore themselves");
await call(API, owner, "POST", `${T}/members/${ceoId}/restore`, {});
const restored = await ws(ceo);
ok(restored.kpis.length > 0, "the owner restores them, with their roles intact");
const ownerMember = (await ws(owner)).members.find((m) => m.owner);
ok((await raw(API, owner, "POST", `${T}/members/${ownerMember.id}/revoke`, {})).status === 404, "the owner cannot be revoked");

// 9. audit
const auditLog = await call(API, owner, "GET", `${T}/audit`);
const events = new Set(auditLog.map((a) => a.event));
ok(["organization.renamed", "role.saved", "role.deleted", "member.restored"].every((e) => events.has(e)), "every change is in the activity log");

console.log(`\n${pass} passed, ${fail} failed`);
console.log(JSON.stringify({ orgId: org.id, owner: mail("owner"), ownerPassword: pw[mail("owner")], ceo: mail("ceo"), ceoPassword: pw[mail("ceo")] }));
process.exit(fail ? 1 : 0);
