// End-to-end check of the KPI platform against the LOCAL demo stack only (see README.md).
// Needs: the stand-in login (auth-server.mjs), the customer API on :3100 and the control API on :3101.
import { randomUUID } from "node:crypto";
const AUTH = "http://127.0.0.1:54321/auth/v1", API = "http://localhost:3100", CTL = "http://localhost:3101";
let pass = 0, fail = 0;
const ok = (cond, label) => { cond ? pass++ : fail++; console.log(`${cond ? "PASS" : "FAIL"}  ${label}`); };
const login = async (email) => (await (await fetch(`${AUTH}/token?grant_type=password`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password: "x" }) })).json());
const raw = async (base, token, method, path, body) => {
  const r = await fetch(base + path, { method, headers: { Authorization: `Bearer ${token.access_token}`, "Content-Type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
  return { status: r.status, body: await r.json().catch(() => ({})) };
};
const call = async (...a) => { const r = await raw(...a); if (r.status >= 300) throw new Error(`${a[2]} ${a[3]} -> ${r.status} ${JSON.stringify(r.body)}`); return r.body; };

const stamp = Date.now().toString(36);
const mail = (n) => `${n}.${stamp}@medilab.test`;
const op = await login("operator@demo.local");

// 1. templates
const templates = await call(CTL, op, "GET", "/api/control/templates");
ok(templates.length >= 20, `operator sees ${templates.length} templates`);
const lab = templates.find((t) => t.id === "diagnostics-lab");
ok(lab && lab.roles.length === 9 && lab.kpiCount > 20, `diagnostics template has ${lab?.roles.length} roles and ${lab?.kpiCount} KPIs`);

// 2. provision with members and roles
const people = { owner: mail("owner"), entry: mail("entry"), review: mail("review"), ceo: mail("ceo"), coo: mail("coo") };
const org = await call(CTL, op, "POST", "/api/control/organizations", {
  name: `Medilab ${stamp}`, ownerEmail: people.owner, templateId: "diagnostics-lab",
  members: [
    { email: people.entry, roleKeys: ["data_contributor"] },
    { email: people.review, roleKeys: ["data_reviewer"] },
    { email: people.ceo, roleKeys: ["executive"] },
    { email: people.coo, roleKeys: ["operations", "quality_head"] },
  ],
});
ok(org.id && org.token && org.members.length === 4, "organization provisioned with owner and 4 members");
ok(new Set([org.token, ...org.members.map((m) => m.token)]).size === 5, "every invitation has its own token");
const dup = await raw(CTL, op, "POST", "/api/control/organizations", { name: "X", ownerEmail: mail("o2"), templateId: "diagnostics-lab", members: [{ email: mail("d"), roleKeys: ["executive"] }, { email: mail("d"), roleKeys: ["executive"] }] });
ok(dup.status === 400, "duplicate member email is refused");
const badRole = await raw(CTL, op, "POST", "/api/control/organizations", { name: "X", ownerEmail: mail("o3"), templateId: "diagnostics-lab", members: [{ email: mail("e"), roleKeys: ["no_such_role"] }] });
ok(badRole.status === 400, "unknown role is refused");
const noTemplate = await raw(CTL, op, "POST", "/api/control/organizations", { name: "X", ownerEmail: mail("o4"), members: [{ email: mail("f"), roleKeys: ["executive"] }] });
ok(noTemplate.status === 400, "members without a template are refused");

// 3. everyone joins
const t = org.id;
const owner = await login(people.owner), entry = await login(people.entry), review = await login(people.review), ceo = await login(people.ceo), coo = await login(people.coo);
await call(API, owner, "POST", "/api/saas/invitations/accept", { token: org.token });
const byEmail = Object.fromEntries(org.members.map((m) => [m.email, m.token]));
await call(API, entry, "POST", "/api/saas/invitations/accept", { token: byEmail[people.entry] });
await call(API, review, "POST", "/api/saas/invitations/accept", { token: byEmail[people.review] });
await call(API, ceo, "POST", "/api/saas/invitations/accept", { token: byEmail[people.ceo] });
await call(API, coo, "POST", "/api/saas/invitations/accept", { token: byEmail[people.coo] });
const wrong = await raw(API, ceo, "POST", "/api/saas/invitations/accept", { token: byEmail[people.coo] });
ok(wrong.status >= 400, "an invitation cannot be used by someone with a different email");
ok((await raw(API, op, "GET", `/api/saas/${t}/workspace`)).status === 403, "the operator cannot open the customer workspace");

// 4. units and the template content
let w = await call(API, owner, "GET", `/api/saas/${t}/workspace`);
ok(w.kpis.filter((k) => k.state === "active").length > 20, `owner sees ${w.kpis.length} active template KPIs`);
ok(w.kpis.every((k) => k.catalogId && k.domain), "template KPIs remember their catalog id and domain");
ok(w.roles.length === 9 && w.roles.some((r) => r.templateKey === "quality_head"), "roles came from the template");
const root = w.units[0].id;
const mumbai = (await call(API, owner, "POST", `/api/saas/${t}/units`, { name: "Mumbai Lab", kind: "Lab", parentId: root })).id;
const pune = (await call(API, owner, "POST", `/api/saas/${t}/units`, { name: "Pune Lab", kind: "Lab", parentId: root })).id;

// 5. contributor uploads Aug and Sep for both labs
const rows = (m) => Object.entries(m).map(([measure, value]) => ({ measure, value: String(Math.round(value)) }));
const submit = async (unitId, start, end, values) =>
  (await call(API, entry, "POST", `/api/saas/${t}/batches`, { idempotencyKey: randomUUID(), unitId, period: { start, end }, origin: "import", rows: rows(values) })).id;
const base = (n) => ({ tests_performed: 1000 * n, tests_reported_on_time: 940 * n, samples_received: 900 * n, samples_rejected: 18 * n, revenue: 600000 * n, reagent_cost: 150000 * n, home_collections: 200 * n, home_collections_on_time: 170 * n });
const mAug = await submit(mumbai, "2026-08-01", "2026-08-31", base(1));
const mSep = await submit(mumbai, "2026-09-01", "2026-09-30", { ...base(1.2), tests_performed: 1200 });
const pAug = await submit(pune, "2026-08-01", "2026-08-31", base(0.5));
const pSep = await submit(pune, "2026-09-01", "2026-09-30", { ...base(0.6), tests_performed: 600 });
w = await call(API, owner, "GET", `/api/saas/${t}/workspace`);
ok(w.batches.filter((b) => b.status === "submitted").length === 4, "four batches wait for approval");
const own = await raw(API, entry, "POST", `/api/saas/${t}/batches/${mSep}/approve`, {});
ok(own.status === 403, "the data contributor cannot approve");
const unknownMeasure = await raw(API, entry, "POST", `/api/saas/${t}/batches`, { idempotencyKey: randomUUID(), unitId: pune, period: { start: "2026-07-01", end: "2026-07-31" }, origin: "import", rows: rows({ not_a_measure: 1 }) });
ok(unknownMeasure.status === 400, "an unknown measure in a CSV row is refused");

// 6. approve September first, then August: September growth must catch up
const a1 = await call(API, review, "POST", `/api/saas/${t}/batches/${mSep}/approve`, {});
ok(a1.calculated > 0 && a1.units === 2, `approving Mumbai September calculated ${a1.calculated} results across ${a1.units} units`);
let rev = await call(API, owner, "GET", `/api/saas/${t}/workspace`);
const kid = (cid) => rev.kpis.find((k) => k.catalogId === cid).id;
const latest = (cid, unitId, start) => rev.results.filter((r) => r.kpiId === kid(cid) && r.unitId === unitId && r.start === start).pop();
ok(latest("LAB-014", mumbai, "2026-09-01")?.value.status === "missing", "September growth is 'missing' until August arrives");
await call(API, review, "POST", `/api/saas/${t}/batches/${mAug}/approve`, {});
rev = await call(API, owner, "GET", `/api/saas/${t}/workspace`);
const growth = latest("LAB-014", mumbai, "2026-09-01");
ok(growth?.value.status === "available" && Number(growth.value.value) === 20, `approving August updated September growth to ${growth?.value.value}% (expected 20)`);
await call(API, review, "POST", `/api/saas/${t}/batches/${pAug}/approve`, {});
await call(API, review, "POST", `/api/saas/${t}/batches/${pSep}/approve`, {});

// 7. roll-up to the organisation unit
rev = await call(API, owner, "GET", `/api/saas/${t}/workspace`);
const rootTests = latest("LAB-001", root, "2026-09-01");
ok(rootTests && Number(rootTests.value.value) === 1800, `organisation total tests = ${rootTests?.value.value} (expected 1200 + 600)`);
const rootOnTime = latest("LAB-002", root, "2026-09-01");
const expectOnTime = ((940 * 1.2 + 940 * 0.6) / (1200 + 600)) * 100;
ok(rootOnTime && Math.abs(Number(rootOnTime.value.value) - expectOnTime) < 0.001, `organisation on-time rate is a ratio of sums (${Number(rootOnTime?.value.value).toFixed(2)}), not an average of rates`);
const rootGrowth = latest("LAB-014", root, "2026-09-01");
ok(rootGrowth && Math.abs(Number(rootGrowth.value.value) - ((1800 - 1500) / 1500) * 100) < 0.001, `organisation growth uses rolled-up August (${rootGrowth?.value.value}%)`);
const batchesAfter = rev.batches.filter((b) => b.status === "approved").length;
ok(batchesAfter === 4, "all four batches approved");

// 8. role-based visibility
const ceoW = await call(API, ceo, "GET", `/api/saas/${t}/workspace`);
const cooW = await call(API, coo, "GET", `/api/saas/${t}/workspace`);
const entryW = await call(API, entry, "GET", `/api/saas/${t}/workspace`);
ok(ceoW.kpis.length > 0 && ceoW.kpis.length < w.kpis.length && ceoW.results.length > 0, `executive sees ${ceoW.kpis.length} of ${w.kpis.length} KPIs and their results`);
ok(cooW.kpis.length > ceoW.kpis.length - 10 && cooW.results.length > 0, `operations + quality head sees ${cooW.kpis.length} KPIs`);
ok(entryW.kpis.length === 0 && entryW.results.length === 0, "data contributor sees no KPIs and no results");
ok(new Set(ceoW.results.map((r) => r.kpiId)).size <= ceoW.kpis.length, "executive only sees results for KPIs in their role");

// 8b. targets: owner sets one, stored results follow, others cannot
const onTime = kid("LAB-002");
const noTargetYet = await q0();
async function q0() { return call(API, ceo, "POST", `/api/saas/${t}/ask`, { question: "Which KPIs are off target?" }); }
ok(/No targets are set/.test(noTargetYet.answer), "with no targets, Ask says so instead of claiming all is well");
ok((await raw(API, ceo, "POST", `/api/saas/${t}/kpis/${onTime}/target`, { target: "95" })).status === 403, "a non-owner cannot set a target");
ok((await raw(API, owner, "POST", `/api/saas/${t}/kpis/${onTime}/target`, { target: "abc" })).status === 400, "a target that is not a number is refused");
ok((await raw(API, owner, "POST", `/api/saas/${t}/kpis/${randomUUID()}/target`, { target: "95" })).status === 400, "an unknown KPI is refused");
await call(API, owner, "POST", `/api/saas/${t}/kpis/${onTime}/target`, { target: "95" });
rev = await call(API, owner, "GET", `/api/saas/${t}/workspace`);
const mumOnTime = latest("LAB-002", mumbai, "2026-09-01");
ok(rev.kpis.find((k) => k.id === onTime).target?.startsWith("95") && mumOnTime.target?.startsWith("95") && mumOnTime.onTarget === false, `setting target 95 flagged the 94% result as off target (${mumOnTime.value.value})`);
await call(API, owner, "POST", `/api/saas/${t}/kpis/${onTime}/target`, { target: "90" });
rev = await call(API, owner, "GET", `/api/saas/${t}/workspace`);
ok(latest("LAB-002", mumbai, "2026-09-01").onTarget === true, "lowering the target to 90 flips the stored result to on target");
await call(API, owner, "POST", `/api/saas/${t}/kpis/${onTime}/target`, { target: null });
rev = await call(API, owner, "GET", `/api/saas/${t}/workspace`);
ok(latest("LAB-002", mumbai, "2026-09-01").onTarget === null && rev.kpis.find((k) => k.id === onTime).target === null, "clearing the target clears the flags");
await call(API, owner, "POST", `/api/saas/${t}/kpis/${onTime}/target`, { target: "95" });
const offTarget = await call(API, ceo, "POST", `/api/saas/${t}/ask`, { question: "Which KPIs are off target?" });
ok(offTarget.topic === "off_target" && offTarget.facts.some((f) => f.label.startsWith("Report on-time rate")), "Ask now lists the off-target KPI");
const audit = await call(API, owner, "GET", `/api/saas/${t}/audit`);
ok(audit.filter((a) => a.event === "kpi.target_changed").length >= 3, "target changes are in the audit log");

// 9. Ask follows the same limits
const q = async (token, text) => call(API, token, "POST", `/api/saas/${t}/ask`, { question: text });
const ownerAsk = await q(owner, "How is the sample rejection rate?");
ok(ownerAsk.topic === "kpi" && ownerAsk.facts.length >= 1 && ownerAsk.mode === "facts", `owner asks about a KPI: "${ownerAsk.answer.slice(0, 80)}…"`);
const brief = await q(ceo, "give me the morning brief");
ok(brief.topic === "brief" && /KPI result/.test(brief.answer), `executive brief: ${brief.answer}`);
const entryAsk = await q(entry, "what is off target?");
ok(entryAsk.topic === "no_access" && entryAsk.facts.length === 0, "contributor's question is refused: no KPIs for this role");
const execAsk = await q(ceo, "how is the quality control pass rate?");
ok(execAsk.facts.length === 0, "executive cannot ask about a KPI outside their role (no leak)");
const tooShort = await raw(API, ceo, "POST", `/api/saas/${t}/ask`, { question: "a" });
ok(tooShort.status === 400, "an empty question is refused");

// 10. catalog: browse, add
const catalog = await call(API, ceo, "GET", "/api/saas/catalog");
ok(catalog.kpis.length >= 500 && catalog.measures.length >= 400, `catalog has ${catalog.kpis.length} KPIs and ${catalog.measures.length} measures`);
const added = await call(API, owner, "POST", `/api/saas/${t}/catalog/FIN-016/add`, {});
ok(!!added.id, "owner adds a catalog KPI (as a draft)");
const denied = await raw(API, entry, "POST", `/api/saas/${t}/catalog/FIN-017/add`, {});
ok(denied.status === 403, "a data contributor cannot add a catalog KPI");
const bogus = await raw(API, owner, "POST", `/api/saas/${t}/catalog/NOPE-999/add`, {});
ok(bogus.status === 400, "an unknown catalog id is refused");

// 11. operator adds more people later
const more = await call(CTL, op, "POST", `/api/control/organizations/${t}/members`, { members: [{ email: mail("late"), roleKeys: ["unit_manager"] }] });
ok(more.members.length === 1, "operator adds another member with a role later");
const orgs = await call(CTL, op, "GET", "/api/control/organizations");
ok(orgs.find((o) => o.id === t)?.templateId === "diagnostics-lab", "operator's registry remembers the template");
const stranger = await login(mail("stranger"));
ok((await raw(CTL, stranger, "GET", "/api/control/templates")).status === 403, "a non-operator cannot list templates");
ok((await raw(CTL, stranger, "POST", `/api/control/organizations/${t}/members`, { members: [{ email: mail("x"), roleKeys: ["executive"] }] })).status === 403, "a non-operator cannot add members");

console.log(`\n${pass} passed, ${fail} failed`);
console.log(JSON.stringify({ orgId: t, owner: people.owner, ceo: people.ceo, entry: people.entry, review: people.review, coo: people.coo }));
process.exit(fail ? 1 : 0);
