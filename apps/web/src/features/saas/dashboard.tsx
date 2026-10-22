import { useMemo, useState, type FormEvent } from "react";
import {
  buildBrief,
  formatFormula,
  formatKpiValue,
  kpiPoints,
  periodLabel,
  type KpiPoint,
  type SaasWorkspace,
} from "@orbit/contracts";
import { domainTitle } from "./domains";
import { formText } from "./forms";
import "./v2.css";

type Goto = "Ask" | "Data & approvals" | "KPI library";
interface Props {
  workspace: SaasWorkspace;
  change: (path: string, body: unknown) => Promise<boolean>;
  ask: (question: string) => void;
  goto: (tab: Goto) => void;
}

const QUICK_QUESTIONS = [
  "Which KPIs are off target?",
  "What got better since the last period?",
  "What got worse since the last period?",
  "What is waiting for approval?",
];

/** A small trend line. Colour follows whether the latest move was good or bad. */
function Sparkline({ values, tone, label }: { values: number[]; tone: KpiPoint["tone"]; label: string }) {
  if (values.length < 2) return null;
  const width = 120;
  const height = 34;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const step = width / (values.length - 1);
  const y = (v: number) => height - 5 - ((v - min) / span) * (height - 10);
  const points = values.map((v, i) => `${(i * step).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  return (
    <svg className={`spark ${tone}`} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <title>{label}</title>
      <polyline points={points} vectorEffect="non-scaling-stroke" />
      <circle cx={(values.length - 1) * step} cy={y(values[values.length - 1]!)} r="3" />
    </svg>
  );
}

/** "Waiting for: Cost of goods sold" instead of a raw key. */
function waitingFor(point: KpiPoint, names: Map<string, string>): string | null {
  const value = point.result.value;
  if (value.status !== "missing") return null;
  const label = (ref: string) => {
    const [key = "", suffix] = ref.split("@");
    const name = names.get(key) ?? key;
    return suffix === "previous" ? `${name} (previous period)` : suffix === "year_ago" ? `${name} (same period last year)` : name;
  };
  return `Waiting for: ${value.measures.map(label).join(", ")}`;
}

function arrow(change: string | null): string {
  if (!change) return "";
  return change.startsWith("+") ? "▲" : change.startsWith("−") ? "▼" : "";
}

function targetProgress(point: KpiPoint): number | null {
  if (point.number === null || point.result.target === null || point.kpi.direction === "neutral") return null;
  const target = Number(point.result.target);
  if (!Number.isFinite(target) || target === 0) return null;
  const ratio = point.kpi.direction === "higher"
    ? point.number / target
    : point.number === 0
      ? 1
      : target / point.number;
  return Math.max(0, Math.min(100, ratio * 100));
}

export function Dashboard({ workspace: w, change, ask, goto }: Props) {
  const today = new Date().toISOString().slice(0, 10);
  const points = useMemo(() => kpiPoints(w), [w]);

  // The organisation-level unit first, then the others.
  const unitsWithData = useMemo(() => {
    const ids = new Set(points.map((p) => p.unitId));
    return w.units
      .filter((u) => ids.has(u.id))
      .sort((a, b) => Number(b.parentId === null) - Number(a.parentId === null) || a.name.localeCompare(b.name));
  }, [points, w.units]);
  const [chosen, setChosen] = useState("");
  const unitId = unitsWithData.some((u) => u.id === chosen) ? chosen : (unitsWithData[0]?.id ?? "");
  const unitPoints = useMemo(() => points.filter((p) => p.unitId === unitId), [points, unitId]);
  const brief = useMemo(() => buildBrief(w, today, unitId || undefined), [w, today, unitId]);
  const [acting, setActing] = useState("");
  // Two weeks from now, chosen once, as the suggested due date for a new action.
  const [defaultDue] = useState(() => new Date(Date.now() + 14 * 86_400_000).toISOString().slice(0, 10));

  const active = w.kpis.filter((k) => k.state === "active");
  const waiting = active.filter((k) => !points.some((p) => p.kpi.id === k.id)).length;

  const measureNames = useMemo(() => new Map(w.measures.map((m) => [m.key, m.name])), [w.measures]);
  const history = (p: KpiPoint): number[] =>
    w.results
      .filter((r) => r.kpiId === p.kpi.id && r.unitId === p.unitId && r.value.status === "available")
      .sort((a, b) => a.start.localeCompare(b.start))
      .slice(-12)
      .map((r) => Number(r.value.status === "available" ? r.value.value : 0));

  const groups = useMemo(() => {
    const out = new Map<string, KpiPoint[]>();
    for (const p of unitPoints) (out.get(p.kpi.domain ?? "") ?? out.set(p.kpi.domain ?? "", []).get(p.kpi.domain ?? "")!).push(p);
    return [...out];
  }, [unitPoints]);

  async function createAction(event: FormEvent<HTMLFormElement>, point: KpiPoint) {
    event.preventDefault();
    const f = new FormData(event.currentTarget);
    await change("/actions", {
      title: formText(f, "title"),
      resultId: point.result.id,
      assigneeId: formText(f, "assignee"),
      dueDate: formText(f, "due"),
    });
    setActing("");
  }

  if (w.kpis.length === 0) {
    return (
      <section className="saas-card">
        {w.organization.owner ? (
          <>
            <p className="eyebrow">START WITH WHAT MATTERS</p>
            <h2>No KPIs yet</h2>
            <p>Pick from the catalog of ready-made KPIs, or write your own formula.</p>
            <button onClick={() => goto("KPI library")}>Open the KPI library →</button>
          </>
        ) : (
          <>
            <h2>Your role has no KPIs to show</h2>
            <p>
              You can still upload data if your role allows it. To see KPIs here, ask your organization owner or your
              platform contact to add them to your role.
            </p>
            <button onClick={() => goto("Data & approvals")}>Go to data uploads →</button>
          </>
        )}
      </section>
    );
  }
  if (points.length === 0) {
    return (
      <section className="saas-card">
        <p className="eyebrow">NEARLY THERE</p>
        <h2>{active.length} KPIs are ready, waiting for data</h2>
        <p>
          Download the CSV format for your KPIs, fill it in, and upload it. Once the data is approved the dashboard
          fills in.
        </p>
        <button onClick={() => goto("Data & approvals")}>Get the CSV format →</button>
      </section>
    );
  }

  return (
    <>
      <section className="dash-brief" aria-label="Morning brief">
        <p className="eyebrow">MORNING BRIEF · {new Date(today).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}</p>
        <h2>{brief.headline}</h2>
        <div className="dash-chips">
          <span className="dash-chip good">{brief.onTarget} on target</span>
          <span className="dash-chip bad">{brief.offTarget} off target</span>
          <span className="dash-chip">{brief.improving} improving</span>
          <span className="dash-chip">{brief.worsening} getting worse</span>
          {waiting > 0 && <span className="dash-chip">{waiting} waiting for data</span>}
        </div>
      </section>

      <div className="dash-toolbar">
        <label>
          Showing
          <select value={unitId} onChange={(e) => setChosen(e.target.value)} aria-label="Unit">
            {unitsWithData.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </label>
        <div className="dash-asks" aria-label="Ask a question">
          {QUICK_QUESTIONS.map((q) => (
            <button key={q} type="button" onClick={() => ask(q)}>
              {q}
            </button>
          ))}
        </div>
      </div>

      <div className="dash-two">
        <section className="saas-card">
          <h2>Act now</h2>
          {brief.actNow.length === 0 ? (
            <p className="muted">
              {brief.concerns.length === 0 ? "Nothing needs attention." : "Everything that needs attention already has an action."}
            </p>
          ) : (
            <ul className="dash-list">
              {brief.actNow.map((p) => (
                <li key={p.result.id}>
                  <div className="top">
                    <strong>{p.kpi.name}</strong>
                    <span className="saas-badge bad">{p.onTarget === false ? "Off target" : "Getting worse"}</span>
                  </div>
                  <span>
                    {p.display}
                    {p.change ? ` · ${p.change}` : ""}
                  </span>
                  {acting === p.result.id ? (
                    <form className="act-form" onSubmit={(e) => void createAction(e, p)}>
                      <label>
                        What needs to happen
                        <input name="title" required maxLength={200} defaultValue={`Improve ${p.kpi.name} in ${p.unitName}`} />
                      </label>
                      <label>
                        Owner
                        <select name="assignee" required>
                          {w.members
                            .filter((m) => m.active)
                            .map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.displayName}
                                {m.subject === w.subject ? " (you)" : ""}
                              </option>
                            ))}
                        </select>
                      </label>
                      <label>
                        Due
                        <input name="due" type="date" required defaultValue={defaultDue} min={today} />
                      </label>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button>Assign action</button>
                        <button type="button" className="secondary" onClick={() => setActing("")}>
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div>
                      <button type="button" onClick={() => setActing(p.result.id)}>
                        Assign an action
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
          {brief.overdueActions.length > 0 && (
            <p className="muted">
              {brief.overdueActions.length} action{brief.overdueActions.length === 1 ? " is" : "s are"} overdue.
            </p>
          )}
        </section>
        <section className="saas-card">
          <h2>Going well</h2>
          {brief.wins.length === 0 ? (
            <p className="muted">No clear wins yet. Targets and a second period of data make this list useful.</p>
          ) : (
            <ul className="dash-list">
              {brief.wins.map((p) => (
                <li key={p.result.id}>
                  <div className="top">
                    <strong>{p.kpi.name}</strong>
                    <span className="saas-badge good">{p.onTarget === true ? "On target" : "Improving"}</span>
                  </div>
                  <span>
                    {p.display}
                    {p.change ? ` · ${p.change}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {groups.map(([domain, list]) => (
        <section key={domain || "custom"}>
          <div className="dash-domain">
            <h2>{domainTitle(domain || null)}</h2>
            <span className="muted">{list.length} KPIs</span>
          </div>
          <div className="dash-grid">
            {list.map((p) => {
              const values = history(p);
              const progress = targetProgress(p);
              return (
                <article key={p.result.id} className={`kpi-tile ${p.tone}`}>
                  <h3>{p.kpi.name}</h3>
                  <div className={`kpi-value ${p.number === null ? "small" : ""}`}>{waitingFor(p, measureNames) ?? p.display}</div>
                  <div className="kpi-meta">
                    {p.change && (
                      <span className={`kpi-change ${p.changeTone}`}>
                        {arrow(p.change)} {p.change}
                      </span>
                    )}
                    {p.onTarget !== null && (
                      <span className={`saas-badge ${p.onTarget ? "good" : "bad"}`}>{p.onTarget ? "On target" : "Off target"}</span>
                    )}
                  </div>
                  <Sparkline values={values} tone={p.tone} label={`Trend of ${p.kpi.name}`} />
                  {progress !== null && (
                    <div className="kpi-progress" aria-label={`${progress.toFixed(0)} percent of target`}>
                      <div style={{ width: `${progress}%` }} />
                    </div>
                  )}
                  <small className="muted">
                    {p.period}
                    {p.result.target !== null && ` · target ${formatKpiValue(p.result.target, p.kpi.unit)}`}
                  </small>
                  <details>
                    <summary>How this is worked out</summary>
                    <p>{p.kpi.description}</p>
                    <pre>{formatFormula(p.kpi.formula)}</pre>
                    <p>
                      <small>
                        {p.result.inputIds.length} input records · calculated {periodLabel(p.result.start, p.result.end)} ·{" "}
                        {p.result.origin.join(", ") || "formula constants"}
                      </small>
                    </p>
                  </details>
                </article>
              );
            })}
          </div>
        </section>
      ))}
    </>
  );
}
