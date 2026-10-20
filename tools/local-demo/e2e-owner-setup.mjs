// The operator creates an organization with its owner only; the owner sets it up.
// LOCAL demo stack: control API (3101) and identity API (3102) with SUPABASE_SECRET_KEY=demo-secret.
const AUTH = "http://127.0.0.1:54321/auth/v1", API = "http://localhost:3100", CTL = "http://localhost:3101", IDN = "http://localhost:3102";
let pass = 0, fail = 0;
const ok = (cond, label) => { cond ? pass++ : fail++; console.log(`${cond ? "PASS" : "FAIL"}  ${label}`); };
const token = async (email, password) => (await (await fetch(`${AUTH}/token?grant_type=password`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) })).json());
const raw = async (base, s, method, path, body) => {
  const r = await fetch(base + path, { method, headers: { ...(s ? { Authorization: `Bearer ${s.access_token}` } : {}), "Content-Type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
  return { status: r.status, body: await r.json().catch(() => ({})) };
};
const call = async (...a) => { const r = await raw(...a); if (r.status >= 300) throw new Error(`${a[2]} ${a[3]} -> ${r.status} ${JSON.stringify(r.body)}`); return r.body; };
const stamp = Date.now().toString(36);
const mail = (n) => `${n}.${stamp}@setup.test`;
const op = await token("operator@demo.local", "x");
const make = (name, owner) => call(CTL, op, "POST", "/api/control/organizations", { name, ownerEmail: owner, ownerEmailVerified: true, members: [] });

// 1. the operator gives the owner a login, nothing else
const A = await make(`Agency ${stamp}`, mail("owner"));
ok(A.mode === "logins" && A.owner.temporaryPassword && A.members.length === 0, "the operator creates an organization with only the owner's login");
const owner = await token(mail("owner"), A.owner.temporaryPassword);
const T = `/api/saas/${A.id}`;
let w = await call(API, owner, "GET", `${T}/workspace`);
ok(w.me.owner && w.kpis.length === 0 && w.roles.length === 0 && w.units.length === 1, "the owner lands in an empty organization: no KPIs, no roles, one unit");

// 2. the owner picks a starting point
const templates = await call(API, owner, "GET", "/api/saas/templates");
const agency = templates.find((t) => t.id === "digital-marketing-agency");
ok(templates.length >= 21 && agency && agency.roles.length === 6, `the owner can browse ${templates.length} industry templates`);
ok((await raw(API, null, "GET", "/api/saas/templates")).status === 401, "but only when signed in");
const B = await make(`Other ${stamp}`, mail("other"));
const other = await token(mail("other"), B.owner.temporaryPassword);
ok((await raw(API, other, "POST", `${T}/template`, { templateId: "digital-marketing-agency" })).status === 403, "another organization's owner cannot set up this one");
ok((await raw(API, op, "POST", `${T}/template`, { templateId: "digital-marketing-agency" })).status === 403, "nor can the platform operator");
ok((await raw(API, owner, "POST", `${T}/template`, { templateId: "no-such-template" })).status === 400, "an unknown template is refused");
await call(API, owner, "POST", `${T}/template`, { templateId: "digital-marketing-agency" });
w = await call(API, owner, "GET", `${T}/workspace`);
ok(w.kpis.filter((k) => k.state === "active").length === agency.kpiCount && w.roles.length === 6, `the template brings ${agency.kpiCount} active KPIs and 6 roles`);
const twice = await raw(API, owner, "POST", `${T}/template`, { templateId: "general-business" });
ok(twice.status === 409 && /before any KPIs or roles/.test(twice.body.error?.message), "a second template is refused clearly, so nothing is duplicated");
const listed = (await call(CTL, op, "GET", "/api/control/organizations")).find((o) => o.id === A.id);
ok(listed?.templateId === "digital-marketing-agency", "the operator's list shows which template the owner chose");
const audit = await call(API, owner, "GET", `${T}/audit`);
ok(audit.some((a) => a.event === "template.applied"), "the activity log records it");

// 3. the owner customizes: retires a KPI, adds one from the library, makes a role, adds a person
const retired = w.kpis.find((k) => k.catalogId === "AGY-052");
await call(API, owner, "POST", `${T}/kpis/${retired.id}/retire`, {});
const added = await call(API, owner, "POST", `${T}/catalog/FIN-012/add`, { activate: true });
w = await call(API, owner, "GET", `${T}/workspace`);
ok(!w.kpis.some((k) => k.id === retired.id && k.state === "active") && w.kpis.some((k) => k.id === added.id && k.state === "active"), "the owner retires a template KPI and adds another from the library");
const pick = w.kpis.filter((k) => ["AGY-020", "AGY-021", "FIN-012"].includes(k.catalogId ?? "") && k.state === "active").map((k) => k.id);
const role = await call(API, owner, "POST", `${T}/roles/save`, { name: "Studio lead", capabilities: ["view", "act"], scopeUnitId: null, kpiIds: pick });
const made = await call(IDN, owner, "POST", `/api/identity/organizations/${A.id}/people`, { members: [{ email: mail("lead"), roleIds: [role.id] }] });
const lead = await token(mail("lead"), made.members[0].temporaryPassword);
const lw = await call(API, lead, "GET", `${T}/workspace`);
ok(lw.kpis.length === 3 && lw.kpis.every((k) => pick.includes(k.id)), "a person the owner adds sees exactly the KPIs of the role the owner made");

// 4. building from scratch: once the owner has made something, no template is pushed over it
const C = await make(`Scratch ${stamp}`, mail("scratch"));
const scratch = await token(mail("scratch"), C.owner.temporaryPassword);
await call(API, scratch, "POST", `/api/saas/${C.id}/catalog/FIN-001/add`, { activate: true });
ok((await raw(API, scratch, "POST", `/api/saas/${C.id}/template`, { templateId: "general-business" })).status === 409, "after the owner adds their own KPIs, a template is refused");

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
