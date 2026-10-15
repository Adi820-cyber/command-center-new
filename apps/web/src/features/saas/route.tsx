import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  ResultSchema,
  type SaasResult,
  SettingsSchema,
  ProposalListSchema,
  AuditResponseSchema,
  BatchDetailSchema,
  TenantListSchema,
  WorkspaceSchema,
  type SaasWorkspace,
  type Formula,
} from "@orbit/contracts";
import { getAuthClient, signOut } from "../../lib/auth";
import { mutate, request } from "./client";
import "./saas.css";
type Tab =
  | "Overview"
  | "Data & approvals"
  | "KPI library"
  | "Actions"
  | "Organization"
  | "Activity";
const tabs: Tab[] = [
  "Overview",
  "Data & approvals",
  "KPI library",
  "Actions",
  "Organization",
  "Activity",
];
const text = (data: FormData, key: string) => {
  const value = data.get(key);
  return typeof value === "string" ? value.trim() : "";
};
function Field({ title, children }: { title: string; children: ReactNode }) {
  return (
    <label>
      {title}
      {children}
    </label>
  );
}
function Empty({ children }: { children: ReactNode }) {
  return <div className="saas-empty">{children}</div>;
}
const onClickAsync = (fn: () => Promise<void>) => () => {
  void fn();
};
const onSubmitAsync =
  (fn: (event: FormEvent<HTMLFormElement>) => Promise<void>) =>
  (event: FormEvent<HTMLFormElement>) => {
    void fn(event);
  };
export function SaasRoute() {
  const [organizations, setOrganizations] = useState<
    ReturnType<typeof TenantListSchema.parse>
  >([]);
  const [tenant, setTenant] = useState("");
  const [workspace, setWorkspace] = useState<SaasWorkspace>();
  const [tab, setTab] = useState<Tab>("Overview");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const generation = useRef(0);
  const selectTenant = useCallback((id: string) => {
    ++generation.current;
    setWorkspace(undefined);
    setMessage("");
    setTab("Overview");
    setLoading(!!id);
    setTenant(id);
  }, []);
  useEffect(() => {
    let active = true;
    request("/api/saas/organizations", TenantListSchema)
      .then((rows) => {
        if (active) {
          setOrganizations(rows);
          selectTenant(rows[0]?.id ?? "");
        }
      })
      .catch((e) => {
        if (active) {
          setMessage(e.message);
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [selectTenant]);
  useEffect(() => {
    const current = generation.current;
    if (!tenant) return;
    request(`/api/saas/${tenant}/workspace`, WorkspaceSchema)
      .then((value) => {
        if (current === generation.current) setWorkspace(value);
      })
      .catch((e) => {
        if (current === generation.current) setMessage(e.message);
      })
      .finally(() => {
        if (current === generation.current) setLoading(false);
      });
  }, [tenant]);
  async function change(path: string, body: unknown) {
    const current = generation.current;
    setBusy(true);
    setMessage("");
    try {
      const result = await mutate(`/api/saas/${tenant}${path}`, body);
      const updated = await request(
        `/api/saas/${tenant}/workspace`,
        WorkspaceSchema,
      );
      if (current === generation.current) {
        setWorkspace(updated);
        setMessage(
          result.token
            ? `Invitation: ${window.location.origin}/invite#${result.token}`
            : "Saved. Your workspace is up to date.",
        );
      }
    } catch (e) {
      if (current === generation.current)
        setMessage(e instanceof Error ? e.message : "Unable to save.");
    } finally {
      if (current === generation.current) setBusy(false);
    }
  }
  return (
    <div className="saas-shell">
      <aside className="saas-sidebar">
        <a className="saas-brand" href="/">
          ◈{" "}
          <span>
            Command Center<small>PERFORMANCE WORKSPACE</small>
          </span>
        </a>
        <Field title="Organization">
          <select
            aria-label="Organization"
            value={tenant}
            disabled={busy}
            onChange={(e) => selectTenant(e.target.value)}
          >
            <option value="" disabled>
              Select workspace
            </option>
            {organizations.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        </Field>
        <nav aria-label="Workspace">
          {tabs.map((item, i) => (
            <button
              key={item}
              className={tab === item ? "selected" : ""}
              aria-current={tab === item ? "page" : undefined}
              onClick={() => setTab(item)}
            >
              <span aria-hidden="true">
                {["◫", "⇅", "◇", "☑", "◎", "◷"][i]}
              </span>
              {item}
            </button>
          ))}
        </nav>
        <div className="saas-sidebar-footer">
          <p>
            One workspace.
            <br />
            Your measures of progress.
          </p>
          <a href="/change-password">Account security</a>
          <button
            onClick={() =>
              void signOut().then(() => window.location.assign("/login"))
            }
          >
            Sign out
          </button>
        </div>
      </aside>
      <div className="saas-main">
        <header className="saas-topbar">
          <span>
            {workspace?.organization.name ?? "Your organization"}{" "}
            <span className="muted"> / {tab}</span>
          </span>
          <span className="saas-badge">
            {workspace?.organization.owner
              ? "Organization owner"
              : "Member workspace"}
          </span>
        </header>
        <main>
          <div className="saas-page-heading">
            <div>
              <p className="eyebrow">MEASURE · UNDERSTAND · ACT</p>
              <h1>{tab}</h1>
              <p className="muted">{description(tab)}</p>
            </div>
            <button
              className="secondary"
              onClick={() => setTab("Data & approvals")}
            >
              ＋ Submit data
            </button>
          </div>
          {message && <output className="saas-message">{message}</output>}
          {loading && <Empty>Loading your authorized workspace…</Empty>}
          {!loading && !tenant && (
            <Empty>
              <h2>Your workspace starts with an invitation</h2>
              <p>
                Ask your organization owner for an invitation. Platform
                operators can provision an empty organization.
              </p>
              <a href="/operator">Open platform setup</a>
            </Empty>
          )}
          {workspace && (
            <fieldset disabled={busy} className="saas-content" key={tenant}>
              {tab === "Overview" && (
                <Overview workspace={workspace} select={setTab} />
              )}
              {tab === "KPI library" && (
                <Kpis workspace={workspace} change={change} />
              )}
              {tab === "Data & approvals" && (
                <DataEntry
                  workspace={workspace}
                  change={change}
                  tenant={tenant}
                />
              )}
              {tab === "Organization" && (
                <>
                  <Organization workspace={workspace} change={change} />
                  {workspace.organization.owner && (
                    <Governance
                      tenant={tenant}
                      workspace={workspace}
                      change={change}
                    />
                  )}
                </>
              )}
              {tab === "Actions" && (
                <Actions workspace={workspace} change={change} />
              )}
              {tab === "Activity" && <Activity tenant={tenant} />}
            </fieldset>
          )}
          <footer className="saas-footer">
            Values appear only after approved inputs are calculated. Missing
            data is never treated as zero.
          </footer>
        </main>
      </div>
    </div>
  );
}
function description(tab: Tab) {
  return {
    Overview: "A clear view of performance, with evidence behind every number.",
    "Data & approvals":
      "Submit aggregate measures and review them before publication.",
    "KPI library":
      "Define what matters. Keep every calculation explicit and versioned.",
    Actions: "Turn an observation into an accountable next step.",
    Organization: "Your structure, your roles, your team.",
    Activity: "An auditable record of changes in your workspace.",
  }[tab];
}
type Props = {
  workspace: SaasWorkspace;
  change: (path: string, body: unknown) => Promise<void>;
};
function Overview({
  workspace: w,
  select,
}: {
  workspace: SaasWorkspace;
  select: (tab: Tab) => void;
}) {
  const active = w.kpis.filter((k) => k.state === "active");
  return (
    <>
      <div className="saas-stats">
        {[
          ["Active KPIs", active.length],
          [
            "Awaiting approval",
            w.batches.filter((b) => b.status === "submitted").length,
          ],
          ["Open actions", w.actions.filter((a) => a.state !== "done").length],
          ["Organization units", w.units.length],
        ].map(([label, value]) => (
          <div key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
      {!active.length && (
        <Empty>
          <p className="eyebrow">START WITH WHAT MATTERS</p>
          <h2>Build your first KPI</h2>
          <p>
            Define an input measure, choose a calculation, and approve the
            definition. Then submit data for your first reporting period.
          </p>
          <button onClick={() => select("KPI library")}>
            Set up KPI library →
          </button>
        </Empty>
      )}
      <div className="saas-cards">
        {active.map((k) => {
          // filter() creates a local copy, so sorting cannot mutate workspace state.
          const results = w.results.filter((r) => r.kpiId === k.id);
          // oxlint-disable-next-line unicorn/no-array-sort -- local filtered copy only
          results.sort(
              (a, b) =>
                b.end.localeCompare(a.end) ||
                b.computedAt.localeCompare(a.computedAt),
          );
          return (
            <section className="saas-card" key={k.id}>
              <div className="saas-card-title">
                <h2>{k.name}</h2>
                <span className="saas-badge">v{k.version}</span>
              </div>
              <p className="muted">{k.description}</p>
              {!results.length && (
                <p className="saas-value muted">Awaiting approved data</p>
              )}
              {results.map((r) => (
                <div className="saas-observation" key={r.id}>
                  <div className="saas-card-title">
                    <span>{w.units.find((u) => u.id === r.unitId)?.name}</span>
                    <small>
                      {r.start} — {r.end}
                    </small>
                  </div>
                  <p className="saas-value">
                    {r.value.status === "available"
                      ? r.value.value
                      : r.value.status === "missing"
                        ? "Missing inputs"
                        : "Not applicable"}{" "}
                    <small>
                      {r.value.status === "available" ? k.unit : ""}
                    </small>
                  </p>
                  <span
                    className={`saas-badge ${r.onTarget === true ? "good" : r.onTarget === false ? "attention" : ""}`}
                  >
                    {r.onTarget === null
                      ? "Not scored"
                      : r.onTarget
                        ? "On target"
                        : "Needs attention"}
                  </span>
                  <p>
                    <small>
                      Source: {r.origin.join(", ") || "Formula constant"} ·{" "}
                      {r.inputIds.length} input records · {r.computedAt}
                    </small>
                  </p>
                  {r.value.status === "missing" && (
                    <p>Needed: {r.value.measures.join(", ")}</p>
                  )}
                  {r.value.status === "not_applicable" && (
                    <p>The denominator is zero.</p>
                  )}
                  <details>
                    <summary>Definition & evidence</summary>
                    <p>
                      Target: {r.target ?? "Not configured"} · Direction:{" "}
                      {r.direction}
                    </p>
                    <pre>{JSON.stringify(k.formula, null, 2)}</pre>
                    <p>Result ID: {r.id}</p>
                    <p>Input IDs: {r.inputIds.join(", ") || "None"}</p>
                  </details>
                </div>
              ))}
            </section>
          );
        })}
      </div>
    </>
  );
}
function Kpis({ workspace: w, change }: Props) {
  const [op, setOp] = useState<
    "measure" | "add" | "subtract" | "multiply" | "divide" | "percent"
  >("measure");
  async function measure(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    await change("/measures", {
      key: text(f, "key"),
      name: text(f, "name"),
      unit: text(f, "unit"),
    });
  }
  async function kpi(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const left: Formula = { op: "measure", key: text(f, "left") };
    const formula: Formula =
      op === "measure"
        ? left
        : {
            op,
            left,
            right: { op: "measure", key: text(f, "right") },
          };
    await change("/kpis", {
      key: text(f, "key"),
      name: text(f, "name"),
      description: text(f, "description"),
      unit: text(f, "unit"),
      formula,
      direction: text(f, "direction"),
      target: text(f, "target") || null,
    });
  }
  return (
    <>
      <div className="saas-columns">
        <section className="saas-card">
          <h2>1. Define an input measure</h2>
          <p>
            Use aggregate values, such as completed orders or available hours.
            Do not upload individual records.
          </p>
          <form onSubmit={(event) => void measure(event)}>
            <Field title="Measure key">
              <input
                name="key"
                pattern="[a-z][a-z0-9_]*"
                maxLength={64}
                placeholder="completed_orders"
                required
              />
            </Field>
            <Field title="Display name">
              <input name="name" maxLength={120} required />
            </Field>
            <Field title="Unit">
              <input
                name="unit"
                placeholder="orders, hours, INR…"
                maxLength={32}
                required
              />
            </Field>
            <button>Add measure</button>
          </form>
        </section>
        <section className="saas-card">
          <h2>2. Draft a KPI</h2>
          <p>
            Using an existing key creates a new version. The owner reviews and
            activates it.
          </p>
          <form onSubmit={(event) => void kpi(event)}>
            <div className="saas-form-grid">
              <Field title="KPI key">
                <input
                  name="key"
                  pattern="[a-z][a-z0-9_]*"
                  maxLength={64}
                  required
                />
              </Field>
              <Field title="Name">
                <input name="name" maxLength={120} required />
              </Field>
            </div>
            <Field title="Definition and input meaning">
              <textarea name="description" maxLength={2000} required />
            </Field>
            <Field title="Calculation">
              <select
                value={op}
                onChange={(e) => {
                  const value = e.currentTarget.value;
                  if (
                    value === "measure" ||
                    value === "add" ||
                    value === "subtract" ||
                    value === "multiply" ||
                    value === "divide" ||
                    value === "percent"
                  )
                    setOp(value);
                }}
              >
                <option value="measure">Direct input</option>
                <option value="add">A + B</option>
                <option value="subtract">A − B</option>
                <option value="multiply">A × B</option>
                <option value="divide">A ÷ B</option>
                <option value="percent">A ÷ B × 100</option>
              </select>
            </Field>
            <div className="saas-form-grid">
              <Field title="Input A">
                <select name="left" required>
                  {w.measures.map((m) => (
                    <option key={m.key} value={m.key}>
                      {m.name} ({m.unit})
                    </option>
                  ))}
                </select>
              </Field>
              {op !== "measure" && (
                <Field title="Input B">
                  <select name="right" required>
                    {w.measures.map((m) => (
                      <option key={m.key} value={m.key}>
                        {m.name} ({m.unit})
                      </option>
                    ))}
                  </select>
                </Field>
              )}
            </div>
            <div className="saas-form-grid">
              <Field title="Result unit">
                <input name="unit" required maxLength={32} />
              </Field>
              <Field title="Target (optional)">
                <input name="target" inputMode="decimal" />
              </Field>
              <Field title="Direction">
                <select name="direction">
                  <option value="neutral">Monitor only</option>
                  <option value="higher">Higher is better</option>
                  <option value="lower">Lower is better</option>
                </select>
              </Field>
            </div>
            <button disabled={!w.measures.length}>Create draft</button>
          </form>
        </section>
      </div>
      <section className="saas-card">
        <h2>Definition history</h2>
        {!w.kpis.length ? (
          <p>No KPIs yet.</p>
        ) : (
          <div className="saas-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>KPI</th>
                  <th>Version</th>
                  <th>Unit</th>
                  <th>Status</th>
                  <th>Review</th>
                </tr>
              </thead>
              <tbody>
                {w.kpis.map((k) => (
                  <tr key={k.id}>
                    <td>
                      <strong>{k.name}</strong>
                      <small>{k.description}</small>
                      <details>
                        <summary>Calculation</summary>
                        <pre>{JSON.stringify(k.formula, null, 2)}</pre>
                        <p>
                          Target: {k.target ?? "None"} · {k.direction}
                        </p>
                      </details>
                    </td>
                    <td>{k.version}</td>
                    <td>{k.unit}</td>
                    <td>{k.state}</td>
                    <td>
                      {k.state === "draft" && w.organization.owner && (
                        <button
                          onClick={() =>
                            void change(`/kpis/${k.id}/activate`, {})
                          }
                        >
                          Approve & activate
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
function DataEntry({
  workspace: w,
  change,
  tenant,
}: Props & { tenant: string }) {
  const [review, setReview] =
    useState<ReturnType<typeof BatchDetailSchema.parse>>();
  const [error, setError] = useState("");
  const [csv, setCsv] = useState("");
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const f = new FormData(e.currentTarget);
    let rows = w.measures.flatMap((m) =>
      text(f, m.key) ? [{ measure: m.key, value: text(f, m.key) }] : [],
    );
    if (csv.trim()) {
      const lines = csv.trim().split(/\r?\n/);
      if (lines.shift()?.trim() !== "measure,value") {
        setError("CSV must begin with measure,value.");
        return;
      }
      if (lines.some((line) => line.split(",").length !== 2)) {
        setError(
          "Each row must contain exactly a measure key and decimal value.",
        );
        return;
      }
      rows = lines.map((line) => {
        const [measure = "", value = ""] = line.split(",");
        return { measure: measure.trim(), value: value.trim() };
      });
    }
    await change("/batches", {
      idempotencyKey: crypto.randomUUID(),
      unitId: text(f, "unitId"),
      period: { start: text(f, "start"), end: text(f, "end") },
      origin: csv.trim() ? "import" : text(f, "origin"),
      rows,
    });
  }
  async function inspect(id: string) {
    setError("");
    try {
      setReview(
        await request(`/api/saas/${tenant}/batches/${id}`, BatchDetailSchema),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to review.");
    }
  }
  return (
    <>
      <section className="saas-card">
        <h2>Submit a reporting period</h2>
        <p>
          Leave unavailable measures blank. To correct a value, submit a new
          batch for the same unit and exact period. Earlier approved inputs
          remain in history.
        </p>
        <form onSubmit={(event) => void submit(event)}>
          <div className="saas-form-grid">
            <Field title="Organization unit">
              <select name="unitId" required>
                {w.units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field title="Period start">
              <input name="start" type="date" required />
            </Field>
            <Field title="Period end">
              <input name="end" type="date" required />
            </Field>
            <Field title="Source">
              <select name="origin">
                <option value="manual">Manual aggregate entry</option>
                <option value="synthetic">Synthetic demonstration</option>
              </select>
            </Field>
          </div>
          <div className="saas-form-grid">
            {w.measures.map((m) => (
              <Field title={`${m.name} (${m.unit})`} key={m.key}>
                <input
                  name={m.key}
                  inputMode="decimal"
                  disabled={!!csv.trim()}
                />
              </Field>
            ))}
          </div>
          <details>
            <summary>Import aggregate CSV instead</summary>
            <p>
              Paste a two-column file. Maximum 500 measures. Format:
              measure,value. Use plain decimal values; no formulas or personal
              records.
            </p>
            <textarea
              aria-label="CSV aggregate data"
              value={csv}
              onChange={(e) => setCsv(e.target.value)}
              placeholder={"measure,value\ncompleted_orders,90"}
              maxLength={60000}
            />
          </details>
          <button disabled={!w.measures.length}>Submit for approval</button>
        </form>
      </section>
      {error && <p role="alert">{error}</p>}
      {review && (
        <section className="saas-card">
          <h2>Review submitted inputs</h2>
          <p>
            {
              w.units.find(
                (u) =>
                  u.id === w.batches.find((b) => b.id === review.id)?.unitId,
              )?.name
            }{" "}
            · {w.batches.find((b) => b.id === review.id)?.start} —{" "}
            {w.batches.find((b) => b.id === review.id)?.end}
          </p>
          <p>
            Status: {review.status}. Confirm units, reporting period and source
            before approval.
          </p>
          <table>
            <thead>
              <tr>
                <th>Measure</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
              {review.rows.map((r) => (
                <tr key={r.measure}>
                  <td>{r.measure}</td>
                  <td>{r.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {review.status === "submitted" && (
            <button
              onClick={onClickAsync(async () => {
                await change(`/batches/${review.id}/approve`, {});
                setReview(undefined);
              })}
            >
              Approve & calculate
            </button>
          )}
          {review.status === "submitted" && (
            <button
              className="secondary"
              onClick={onClickAsync(async () => {
                await change(`/batches/${review.id}/reject`, {});
                setReview(undefined);
              })}
            >
              Reject submission
            </button>
          )}
          <button className="secondary" onClick={() => setReview(undefined)}>
            Close review
          </button>
        </section>
      )}
      <section className="saas-card">
        <h2>Submission history</h2>
        {!w.batches.length ? (
          <p>No submissions yet.</p>
        ) : (
          <div className="saas-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Unit</th>
                  <th>Period</th>
                  <th>Source</th>
                  <th>Status</th>
                  <th>Review</th>
                </tr>
              </thead>
              <tbody>
                {w.batches.map((b) => (
                  <tr key={b.id}>
                    <td>{w.units.find((u) => u.id === b.unitId)?.name}</td>
                    <td>
                      {b.start} — {b.end}
                    </td>
                    <td>{b.origin}</td>
                    <td>{b.status}</td>
                    <td>
                      <button
                        className="secondary"
                        onClick={() => void inspect(b.id)}
                      >
                        Inspect inputs
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
function Organization({ workspace: w, change }: Props) {
  return (
    <>
      <div className="saas-columns">
        <section className="saas-card">
          <h2>Organization structure</h2>
          <ul>
            {w.units.map((u) => (
              <li key={u.id}>
                {u.name}{" "}
                <small>
                  · {u.kind}
                  {u.parentId
                    ? ` · under ${w.units.find((p) => p.id === u.parentId)?.name}`
                    : ""}
                </small>
              </li>
            ))}
          </ul>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              void change("/units", {
                name: text(f, "name"),
                kind: text(f, "kind"),
                parentId: text(f, "parentId") || null,
              });
            }}
          >
            <Field title="Unit name">
              <input name="name" required maxLength={120} />
            </Field>
            <Field title="Unit type">
              <input
                name="kind"
                placeholder="Branch, team, department…"
                required
                maxLength={60}
              />
            </Field>
            <Field title="Parent">
              <select name="parentId">
                {w.units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </Field>
            <button>Add unit</button>
          </form>
        </section>
        {w.organization.owner && (
          <section className="saas-card">
            <h2>Create a business role</h2>
            <p>
              Role names do not grant authority. Choose explicit capabilities
              and a unit scope. This form grants all KPIs within that scope.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                void change("/roles", {
                  name: text(f, "name"),
                  grants: f
                    .getAll("capability")
                    .flatMap((capability) => {
                      const selected=f.getAll('kpis');
                      const ids=(capability==='view'||capability==='act')&&selected.length?selected:[null];
                      return ids.map(kpiId=>({capability,unitId:capability==='configure'?null:text(f,'unitId')||null,kpiId}));
                    }),
                });
              }}
            >
              <Field title="Role name">
                <input name="name" required maxLength={120} />
              </Field>
              <Field title="Scope">
                <select name="unitId">
                  <option value="">Entire organization</option>
                  {w.units.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} and descendants
                    </option>
                  ))}
                </select>
              </Field>
              {["view", "submit", "approve", "act", "configure"].map((c) => (
                <label className="saas-checkbox" key={c}>
                  <input type="checkbox" name="capability" value={c} />
                  {c === "configure"
                    ? "Configure definitions and units (organization-wide)"
                    : c}
                </label>
              ))}
              <Field title="Visible/actionable KPIs (optional)">
                <select name="kpis" multiple size={Math.min(5,Math.max(2,w.kpis.length))}>
                  {w.kpis.filter(k=>k.state==='active').map(k=><option key={k.id} value={k.id}>{k.name} (all versions)</option>)}
                </select>
              </Field>
              <p>Leave KPI selection empty to include all KPIs in scope. Submit and approve apply to aggregate input data for the selected unit.</p>
              <button>Create role</button>
            </form>
          </section>
        )}
      </div>
      {w.organization.owner && (
        <section className="saas-card">
          <h2>Invite a team member</h2>
          <p>
            Choose one or more roles. The recipient must sign in with this
            verified email before accepting the private invitation.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              void change("/invitations", {
                email: text(f, "email"),
                roleIds: f.getAll("roles"),
              });
            }}
          >
            <Field title="Work email">
              <input name="email" type="email" required />
            </Field>
            {w.roles.map((r) => (
              <label className="saas-checkbox" key={r.id}>
                <input name="roles" type="checkbox" value={r.id} />
                {r.name}
              </label>
            ))}
            <button disabled={!w.roles.length}>
              Create private invitation
            </button>
          </form>
        </section>
      )}
      <section className="saas-card">
        <h2>Members</h2>
        <p>
          There is no fixed number of users or business roles. Member
          identifiers are shown until profile names are configured.
        </p>
        <table>
          <thead>
            <tr>
              <th>Member</th>
              <th>Access</th>
              <th>Status</th>
              <th>Manage</th>
            </tr>
          </thead>
          <tbody>
            {w.members.map((m) => (
              <tr key={m.id}>
                <td>{m.subject === w.subject ? "You" : m.displayName}</td>
                <td>{m.owner ? "Owner" : "Assigned roles"}</td>
                <td>{m.active ? "Active" : "Revoked"}</td>
                <td>
                  {w.organization.owner && !m.owner && m.active && (
                    <button
                      className="secondary"
                      onClick={() => void change(`/members/${m.id}/revoke`, {})}
                    >
                      Revoke access
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {w.organization.owner&&<form onSubmit={e=>{
          e.preventDefault();const f=new FormData(e.currentTarget);
          void change(`/members/${text(f,'member')}/roles`,{roleIds:f.getAll('roles')});
        }}><h3>Replace a member’s role assignments</h3><Field title="Member"><select name="member" required>{w.members.filter(m=>m.active&&!m.owner).map(m=><option key={m.id} value={m.id}>{m.displayName}</option>)}</select></Field>
          {w.roles.map(r=><label className="saas-checkbox" key={r.id}><input type="checkbox" name="roles" value={r.id}/>{r.name}</label>)}
          <p>This replaces all existing assignments. Selecting none removes all role capabilities.</p><button disabled={!w.members.some(m=>m.active&&!m.owner)}>Replace assignments</button></form>}
      </section>
    </>
  );
}
function Actions({ workspace: w, change }: Props) {
  const [evidence,setEvidence]=useState<SaasResult>();const [evidenceError,setEvidenceError]=useState('');
  return (
    <>
      <section className="saas-card">
        <h2>Assign an action</h2>
        <p>
          Each action preserves the exact result it was created from, even after
          later corrections.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            void change("/actions", {
              title: text(f, "title"),
              resultId: text(f, "resultId"),
              assigneeId: text(f, "assigneeId"),
              dueDate: text(f, "dueDate"),
            });
          }}
        >
          <Field title="Next step">
            <input name="title" required maxLength={200} />
          </Field>
          <div className="saas-form-grid">
            <Field title="Evidence">
              <select name="resultId" required>
                {w.results.map((r) => (
                  <option key={r.id} value={r.id}>
                    {w.kpis.find((k) => k.id === r.kpiId)?.name} ·{" "}
                    {w.units.find((u) => u.id === r.unitId)?.name} · {r.end}
                  </option>
                ))}
              </select>
            </Field>
            <Field title="Assignee">
              <select name="assigneeId" required>
                {w.members
                  .filter((m) => m.active)
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.subject === w.subject ? "You" : m.displayName}
                    </option>
                  ))}
              </select>
            </Field>
            <Field title="Due date">
              <input name="dueDate" type="date" required />
            </Field>
          </div>
          <button disabled={!w.results.length}>Create action</button>
        </form>
      </section>
      {evidence&&<section className="saas-card"><h2>Original action evidence</h2><p>{evidence.start} — {evidence.end} · {evidence.origin.join(', ')}</p><p className="saas-value">{evidence.value.status==='available'?evidence.value.value:evidence.value.status}</p><p>Target at publication: {evidence.target??'Not configured'}</p><details><summary>Trace records</summary><p>{evidence.inputIds.join(', ')}</p><p>Calculated: {evidence.computedAt}</p></details><button className="secondary" onClick={()=>setEvidence(undefined)}>Close evidence</button></section>}
      {evidenceError&&<p role="alert">{evidenceError}</p>}
      <section className="saas-card">
        <h2>Action register</h2>
        {!w.actions.length ? (
          <Empty>No actions yet. Start from an approved result.</Empty>
        ) : (
          w.actions.map((a) => (
            <div className="saas-observation" key={a.id}>
              <h3>{a.title}</h3><button className="secondary" onClick={()=>{setEvidenceError('');void request(`/api/saas/${w.organization.id}/results/${a.resultId}`,ResultSchema).then(setEvidence).catch(e=>setEvidenceError(e.message));}}>View original evidence</button>
              <p>
                Due {a.dueDate} · Evidence {a.resultId}
              </p>
              <Field title="Status">
                <select
                  value={a.state}
                  onChange={(e) =>
                    void change(`/actions/${a.id}/transition`, {
                      state: e.target.value,
                      expectedVersion: a.version,
                    })
                  }
                >
                  <option value="open">Open</option>
                  <option value="in_progress">In progress</option>
                  <option value="done">Done</option>
                </select>
              </Field>
            </div>
          ))
        )}
      </section>
    </>
  );
}
function Activity({ tenant }: { tenant: string }) {
  const [rows, setRows] = useState<
    ReturnType<typeof AuditResponseSchema.parse>
  >([]);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    request(`/api/saas/${tenant}/audit`, AuditResponseSchema)
      .then((r) => {
        if (active) setRows(r);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [tenant]);
  return (
    <section className="saas-card">
      <h2>Recent changes</h2>
      <p>
        Latest 200 events. Audit events record operations without copying input
        values.
      </p>
      {error && <p role="alert">{error}</p>}
      <table>
        <thead>
          <tr>
            <th>When</th>
            <th>Event</th>
            <th>Actor</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td>{r.createdAt}</td>
              <td>{r.event}</td>
              <td>{r.subject}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
function Governance({
  tenant,
  workspace: w,
  change,
}: Props & { tenant: string }) {
  const [proposals, setProposals] = useState<
    ReturnType<typeof ProposalListSchema.parse>
  >([]);
  const [selfApproval, setSelfApproval] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => {
    let live = true;
    Promise.all([
      request(`/api/saas/${tenant}/proposals`, ProposalListSchema),
      request(`/api/saas/${tenant}/settings`, SettingsSchema),
    ])
      .then(([p, s]) => {
        if (live) {
          setProposals(p);
          setSelfApproval(s.allowSelfApproval);
        }
      })
      .catch((e) => {
        if (live) setMessage(e.message);
      });
    return () => {
      live = false;
    };
  }, [tenant]);
  return (
    <>
      <section className="saas-card">
        <h2>Approval policy</h2>
        <p>
          By default, another member must approve a submission. Small
          organizations can explicitly allow the submitter to approve their own
          data. This change is audited.
        </p>
        <label className="saas-checkbox">
          <input
            type="checkbox"
            checked={selfApproval}
            onChange={(e) => setSelfApproval(e.target.checked)}
          />
          Allow self-approval of data
        </label>
        <button
          onClick={() =>
            void change("/settings", { allowSelfApproval: selfApproval })
          }
        >
          Save approval policy
        </button>
        <h3>Close a reporting period</h3>
        <p>
          Closing a period prevents overlapping submissions and approvals.
          Reopening is not available in this pilot; confirm the dates carefully.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            void change("/period-locks", {
              unitId: text(f, "unitId"),
              period: { start: text(f, "start"), end: text(f, "end") },
            });
          }}
        >
          <div className="saas-form-grid">
            <Field title="Unit">
              <select name="unitId">
                {w.units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field title="Start">
              <input type="date" name="start" required />
            </Field>
            <Field title="End">
              <input type="date" name="end" required />
            </Field>
          </div>
          <label className="saas-checkbox">
            <input type="checkbox" required />I confirm this period is ready to
            close.
          </label>
          <button>Close period</button>
        </form>
      </section>
      <section className="saas-card">
        <h2>Setup proposals</h2>
        <p>
          Platform proposals contain configuration only. Accepting imports draft
          definitions; you still approve activation in the KPI library.
          Suggested roles apply organization-wide.
        </p>
        {message && <p role="alert">{message}</p>}
        {!proposals.length && <p>No setup proposals.</p>}
        {proposals.map((p) => (
          <div className="saas-observation" key={p.id}>
            <h3>{p.configuration.title}</h3>
            <p>Status: {p.state}</p>
            <ul>
              {p.configuration.measures.map((m) => (
                <li key={m.key}>
                  Input: {m.name} · {m.unit}
                </li>
              ))}
              {p.configuration.kpis.map((k) => (
                <li key={k.key}>
                  KPI: {k.name} — {k.description} · {k.unit} · target{" "}
                  {k.target ?? "none"}
                  <pre>{JSON.stringify(k.formula, null, 2)}</pre>
                </li>
              ))}
              {p.configuration.roles.map((r) => (
                <li key={r.name}>
                  Role: {r.name} · {r.capabilities.join(", ")}
                </li>
              ))}
            </ul>
            {p.state === "pending" && (
              <>
                <button
                  onClick={() => void change(`/proposals/${p.id}/accept`, {})}
                >
                  Accept setup as drafts
                </button>{" "}
                <button
                  className="secondary"
                  onClick={() => void change(`/proposals/${p.id}/reject`, {})}
                >
                  Reject proposal
                </button>
              </>
            )}
          </div>
        ))}
      </section>
    </>
  );
}
export function InvitationRoute() {
  const [token] = useState(() => window.location.hash.slice(1));
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <main className="saas-auth">
      <p className="eyebrow">YOUR WORKSPACE INVITATION</p>
      <h1>Join your organization</h1>
      <p>
        Sign in with the email that received this invitation, then accept. Your
        organization controls your access.
      </p>
      <button
        disabled={busy || !token}
        onClick={onClickAsync(async () => {
          setBusy(true);
          try {
            await mutate("/api/saas/invitations/accept", { token });
            window.history.replaceState(null, "", "/invite");
            window.location.assign("/");
          } catch (e) {
            setMessage(
              e instanceof Error ? e.message : "Unable to accept invitation.",
            );
          } finally {
            setBusy(false);
          }
        })}
      >
        Accept invitation
      </button>
      <output>{message}</output>
      <p>
        Keep this invitation link private. If you need to sign in, open sign-in
        in a separate tab and return here.
      </p>
      <a href="/login" target="_blank" rel="noreferrer">
        Sign in
      </a>
      <details>
        <summary>Create a sign-in account</summary>
        <p>
          Use the invited email. Confirm it using the email from the sign-in
          service, then return to this invitation.
        </p>
        <form
          onSubmit={onSubmitAsync(async (e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            setBusy(true);
            try {
              const client = await getAuthClient();
              const { error } = await client.auth.signUp({
                email: text(f, "email"),
                password: text(f, "password"),
              });
              setMessage(
                error
                  ? "Unable to create account. Check the email and password requirements."
                  : "Check your email to confirm your account, then sign in and accept this invitation.",
              );
            } catch {
              setMessage("Sign-in service unavailable.");
            } finally {
              setBusy(false);
            }
          })}
        >
          <label>
            Email
            <input name="email" type="email" required autoComplete="email" />
          </label>
          <label>
            Password
            <input
              name="password"
              type="password"
              minLength={12}
              required
              autoComplete="new-password"
            />
          </label>
          <button disabled={busy}>Create account</button>
        </form>
      </details>
    </main>
  );
}
