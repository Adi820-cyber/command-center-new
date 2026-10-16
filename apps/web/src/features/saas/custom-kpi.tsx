import { useMemo, useState, type FormEvent } from "react";
import {
  FormulaSyntaxError,
  formatFormula,
  formulaMeasureKeys,
  formulaUnit,
  parseFormula,
  unitLabel,
  type Formula,
  type SaasWorkspace,
} from "@orbit/contracts";
import { formText } from "./forms";
import "./v2.css";

const slug = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/^[0-9]/, "k_$&")
    .slice(0, 64);

interface Check {
  formula?: Formula;
  unit?: string;
  error?: string;
}

/** Checks a formula as it is typed: syntax, unknown inputs, and whether the units make sense. */
export function checkFormula(text: string, measures: SaasWorkspace["measures"]): Check {
  if (!text.trim()) return {};
  try {
    const formula = parseFormula(text);
    const known = new Map(measures.map((m) => [m.key, m.unit]));
    const unknown = formulaMeasureKeys(formula).filter((key) => !known.has(key));
    if (unknown.length)
      return { error: `Unknown input${unknown.length === 1 ? "" : "s"}: ${unknown.join(", ")}. Define ${unknown.length === 1 ? "it" : "them"} first, or pick from the list.` };
    return { formula, unit: formulaUnit(formula, known) };
  } catch (error) {
    return { error: error instanceof FormulaSyntaxError || error instanceof Error ? error.message : "The formula is not valid." };
  }
}

/** Write a KPI as a formula. Nothing here can run code: it is a small arithmetic language. */
export function CustomKpiForm({
  workspace: w,
  change,
}: {
  workspace: SaasWorkspace;
  change: (path: string, body: unknown) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  const [keyTouched, setKeyTouched] = useState(false);
  const [text, setText] = useState("");
  const [query, setQuery] = useState("");
  const check = useMemo(() => checkFormula(text, w.measures), [text, w.measures]);
  const effectiveKey = keyTouched ? key : slug(name);
  const choices = useMemo(
    () => w.measures.filter((m) => `${m.name} ${m.key}`.toLowerCase().includes(query.toLowerCase())).slice(0, 24),
    [w.measures, query],
  );

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!check.formula || !check.unit) return;
    const f = new FormData(event.currentTarget);
    const value = (n: string) => formText(f, n);
    await change("/kpis", {
      key: effectiveKey,
      name: value("name"),
      description: value("description"),
      unit: check.unit,
      formula: check.formula,
      direction: value("direction"),
      target: value("target") || null,
    });
  }

  return (
    <section className="saas-card">
      <h2>Write your own KPI</h2>
      <p>
        Type a formula using your inputs. Using an existing key creates a new version. The owner reviews and activates it.
      </p>
      <form onSubmit={(event) => void submit(event)}>
        <div className="saas-form-grid">
          <label>
            Name
            <input name="name" required maxLength={120} value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label>
            Key (a short code)
            <input
              name="key"
              required
              pattern="[a-z][a-z0-9_]*"
              maxLength={64}
              value={effectiveKey}
              onChange={(e) => {
                setKeyTouched(true);
                setKey(e.target.value);
              }}
            />
          </label>
        </div>
        <label>
          What it measures
          <textarea name="description" required maxLength={2000} />
        </label>
        <label>
          Formula
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            spellCheck={false}
            placeholder="pct(revenue - cost, revenue)"
            aria-describedby="formula-help"
            style={{ fontFamily: "ui-monospace, monospace" }}
          />
        </label>
        <div id="formula-help" className="muted" style={{ fontSize: 12, lineHeight: 1.6 }}>
          Use + - * / and brackets. <code>pct(a, b)</code> is a ÷ b × 100. <code>min(a, b)</code>, <code>max(a, b)</code> and{" "}
          <code>abs(a)</code> also work. <code>revenue@prev</code> is last period, <code>revenue@yoy</code> the same period last
          year, and <code>period_days</code> the days in the period. Example: <code>pct(revenue - revenue@prev, revenue@prev)</code>
        </div>
        {text.trim() && (
          <output className={`formula-check ${check.error ? "bad" : "good"}`} style={{ display: "block" }}>
            {check.error ? (
              check.error
            ) : (
              <>
                ✓ {formatFormula(check.formula!)} · result unit: <strong>{check.unit === "1" ? "ratio" : (unitLabel(check.unit!).trim() || check.unit)}</strong>
              </>
            )}
          </output>
        )}
        <div>
          <label>
            Add an input to the formula
            <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search your inputs" />
          </label>
          <div className="chip-row" style={{ marginTop: 8 }}>
            {choices.map((m) => (
              <button key={m.key} type="button" title={`${m.name} (${m.unit})`} onClick={() => setText((t) => `${t}${t && !/[\s(,]$/.test(t) ? " " : ""}${m.key}`)}>
                {m.key}
              </button>
            ))}
            {w.measures.length === 0 && <span className="muted">Define an input above, or add a catalog KPI to bring its inputs.</span>}
          </div>
        </div>
        <div className="saas-form-grid">
          <label>
            Target (optional)
            <input name="target" inputMode="decimal" />
          </label>
          <label>
            Direction
            <select name="direction">
              <option value="neutral">Monitor only</option>
              <option value="higher">Higher is better</option>
              <option value="lower">Lower is better</option>
            </select>
          </label>
        </div>
        <button disabled={!check.formula || !effectiveKey}>Create draft</button>
      </form>
    </section>
  );
}
