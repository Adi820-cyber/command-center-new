import { useMemo, useState, type ChangeEvent } from "react";
import { type SaasWorkspace } from "@orbit/contracts";
import { mutate } from "./client";
import {
  guideCsv,
  lastMonth,
  measuresFor,
  monthPeriod,
  parseCsv,
  templateCsv,
  validateCsv,
  type CsvReport,
} from "./csv";
import { domainTitle } from "./domains";
import "./v2.css";

function download(name: string, text: string) {
  // The byte-order mark makes Excel read accents and symbols correctly.
  const url = URL.createObjectURL(new Blob(["﻿", text], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

/** The same rows always give the same key, so submitting a file twice cannot create duplicates. */
async function stableUuid(text: string): Promise<string> {
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)));
  const bytes = digest.slice(0, 16);
  bytes[6] = (bytes[6]! & 0x0f) | 0x40;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;
  const hex = [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

interface Outcome {
  line: number;
  label: string;
  ok: boolean;
  note: string;
}

export function CsvImport({ workspace: w, reload }: { workspace: SaasWorkspace; reload: () => Promise<void> }) {
  const active = useMemo(() => w.kpis.filter((k) => k.state === "active"), [w.kpis]);
  const canPickKpis = active.length > 0;
  const [byKpi, setByKpi] = useState(canPickKpis);
  const [kpiIds, setKpiIds] = useState<string[]>(() => active.map((k) => k.id));
  const hasChildren = new Set(w.units.map((u) => u.parentId).filter(Boolean));
  const [unitIds, setUnitIds] = useState<string[]>(() => {
    const leaves = w.units.filter((u) => !hasChildren.has(u.id)).map((u) => u.id);
    return leaves.length ? leaves : w.units.map((u) => u.id);
  });
  const [month, setMonth] = useState(() => lastMonth().start.slice(0, 7));

  const measures = useMemo(() => measuresFor(w, byKpi ? kpiIds : null), [w, byKpi, kpiIds]);
  const period = monthPeriod(month);

  const [report, setReport] = useState<CsvReport>();
  const [fileName, setFileName] = useState("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [outcomes, setOutcomes] = useState<Outcome[]>([]);

  const groups = useMemo(() => {
    const out = new Map<string, typeof active>();
    for (const k of active) (out.get(k.domain ?? "") ?? out.set(k.domain ?? "", []).get(k.domain ?? "")!).push(k);
    return [...out];
  }, [active]);

  const toggle = (list: string[], set: (v: string[]) => void, id: string) =>
    set(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

  function onFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setOutcomes([]);
    setReport(undefined);
    if (!file) return;
    setFileName(file.name);
    if (file.size > 2_000_000) {
      setReport({ fileErrors: ["The file is larger than 2 MB. Split it into smaller files."], rows: [], ready: [] });
      return;
    }
    void file.text().then((text) => setReport(validateCsv(parseCsv(text), w)));
  }

  async function submitRows() {
    if (!report?.ready.length) return;
    setBusy(true);
    setOutcomes([]);
    setProgress(0);
    const done: Outcome[] = [];
    for (const [i, row] of report.ready.entries()) {
      const label = `${row.unitName} · ${row.start} to ${row.end}`;
      try {
        const key = await stableUuid(`${w.organization.id}|${row.unitId}|${row.start}|${row.end}|${JSON.stringify([...row.values].sort((a, b) => a.measure.localeCompare(b.measure)))}`);
        const result = await mutate(`/api/saas/${w.organization.id}/batches`, {
          idempotencyKey: key,
          unitId: row.unitId,
          period: { start: row.start, end: row.end },
          origin: "import",
          rows: row.values,
        });
        done.push({ line: row.line, label, ok: true, note: result.replayed ? "Already submitted, no change" : `${row.values.length} values submitted` });
      } catch (e) {
        done.push({ line: row.line, label, ok: false, note: e instanceof Error ? e.message : "Could not submit" });
      }
      setProgress(Math.round(((i + 1) / report.ready.length) * 100));
      setOutcomes([...done]);
    }
    await reload();
    setBusy(false);
  }

  const waiting = w.batches.filter((b) => b.status === "submitted");
  const [approved, setApproved] = useState("");
  async function approveAll() {
    setBusy(true);
    setApproved("");
    let ok = 0;
    // Oldest period first, so growth against the previous period is available to the next one.
    for (const batch of [...waiting].sort((a, b) => a.start.localeCompare(b.start))) {
      try {
        await mutate(`/api/saas/${w.organization.id}/batches/${batch.id}/approve`, {});
        ok++;
      } catch (e) {
        setApproved(`${ok} approved. Stopped: ${e instanceof Error ? e.message : "could not approve"}`);
        await reload();
        setBusy(false);
        return;
      }
    }
    setApproved(`${ok} upload${ok === 1 ? "" : "s"} approved and calculated.`);
    await reload();
    setBusy(false);
  }

  return (
    <div className="csv-steps">
      <section className="saas-card csv-step">
        <h2>Get the CSV format</h2>
        <p>
          Choose what you want to report. The file will have one column for each input those KPIs need, and one row
          for each unit, so nobody has to guess what to enter.
        </p>
        {canPickKpis ? (
          <div role="radiogroup" aria-label="What to include" style={{ display: "flex", gap: 20, marginBottom: 12 }}>
            <label className="saas-checkbox">
              <input type="radio" checked={byKpi} onChange={() => setByKpi(true)} /> The KPIs I choose
            </label>
            <label className="saas-checkbox">
              <input type="radio" checked={!byKpi} onChange={() => setByKpi(false)} /> Every input
            </label>
          </div>
        ) : (
          <p className="muted">Your role does not show KPIs, so the format lists every input you can report.</p>
        )}
        {canPickKpis && byKpi && (
          <>
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <button type="button" className="secondary" onClick={() => setKpiIds(active.map((k) => k.id))}>
                Select all
              </button>
              <button type="button" className="secondary" onClick={() => setKpiIds([])}>
                Select none
              </button>
              <span className="muted" style={{ alignSelf: "center" }}>
                {kpiIds.length} of {active.length} KPIs
              </span>
            </div>
            <fieldset className="csv-choices">
              <legend className="sr-only">KPIs</legend>
              {groups.map(([domain, list]) => (
                <div key={domain} className="csv-choice-group">
                  <div className="csv-choice-domain">{domainTitle(domain || null)}</div>
                  <div className="csv-choices-subgrid">
                    {list.map((k) => (
                      <label key={k.id}>
                        <input type="checkbox" checked={kpiIds.includes(k.id)} onChange={() => toggle(kpiIds, setKpiIds, k.id)} />
                        <span>{k.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </fieldset>
          </>
        )}
        <h3 style={{ margin: "18px 0 8px", fontSize: 14 }}>Units</h3>
        <fieldset className="csv-choices">
          <legend className="sr-only">Units</legend>
          <div className="csv-choices-subgrid" style={{ gridColumn: "1 / -1" }}>
            {w.units.map((u) => (
              <label key={u.id}>
                <input type="checkbox" checked={unitIds.includes(u.id)} onChange={() => toggle(unitIds, setUnitIds, u.id)} />
                <span>{u.name}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <div className="saas-form-grid" style={{ marginTop: 14 }}>
          <label>
            Reporting month
            <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
          </label>
        </div>
        <p className="muted">
          {measures.length} input{measures.length === 1 ? "" : "s"} for {byKpi ? kpiIds.length : "all"} KPIs, {unitIds.length} unit
          {unitIds.length === 1 ? "" : "s"}. You can change the dates in the file for quarterly or other periods.
        </p>
        <div className="csv-actions">
          <button
            type="button"
            disabled={!period || measures.length === 0 || unitIds.length === 0}
            onClick={() =>
              period &&
              download(
                `data-format-${month}.csv`,
                templateCsv(w, { measures, unitIds: w.units.filter((u) => unitIds.includes(u.id)).map((u) => u.id), start: period.start, end: period.end }),
              )
            }
          >
            Download CSV format
          </button>
          <button type="button" className="secondary" disabled={measures.length === 0} onClick={() => download("data-guide.csv", guideCsv(w, measures))}>
            Download the guide to each column
          </button>
        </div>
        <details style={{ marginTop: 14 }}>
          <summary>See what each column means</summary>
          <div className="saas-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Column</th>
                  <th>Unit</th>
                  <th>What to enter</th>
                  <th>Adds up across units</th>
                </tr>
              </thead>
              <tbody>
                {measures.map((m) => (
                  <tr key={m.key}>
                    <td>
                      <code>{m.key}</code>
                    </td>
                    <td>{m.unit}</td>
                    <td>
                      <strong>{m.name}</strong>
                      <small>{m.description}</small>
                    </td>
                    <td>{m.rollsUp ? "Yes" : "No"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </section>

      <section className="saas-card csv-step">
        <h2>Upload your filled file</h2>
        <p>
          Save the spreadsheet as CSV and choose it here. Nothing is sent until you press Submit; the file is checked
          first and every problem is listed.
        </p>
        <label className="csv-drop">
          <strong>{fileName || "Choose a .csv file"}</strong>
          <br />
          <span className="muted">Dates can be 2026-09-30 or 30/09/2026. Numbers like 42,00,000 are fine.</span>
          <input type="file" accept=".csv,text/csv" onChange={onFile} style={{ display: "block", margin: "12px auto 0" }} />
        </label>
        {report && (
          <section aria-label="File check">
            {report.fileErrors.length > 0 && (
              <ul className="errors" role="alert" style={{ color: "#a1332b" }}>
                {report.fileErrors.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            )}
            {report.rows.length > 0 && (
              <>
                <div className="csv-summary">
                  <span className="saas-badge good">{report.ready.length} rows ready</span>
                  <span className={`saas-badge ${report.rows.length - report.ready.length ? "bad" : ""}`}>
                    {report.rows.length - report.ready.length} with problems
                  </span>
                </div>
                <div className="saas-table-wrap">
                  <table className="csv-table">
                    <thead>
                      <tr>
                        <th>Line</th>
                        <th>Unit</th>
                        <th>Period</th>
                        <th>Values</th>
                        <th>Check</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.rows.slice(0, 200).map((r) => (
                        <tr key={r.line}>
                          <td>{r.line}</td>
                          <td>{r.unitName}</td>
                          <td>{r.start && r.end ? `${r.start} to ${r.end}` : ""}</td>
                          <td>{r.values.length}</td>
                          <td className={r.errors.length ? "bad" : "ok"}>{r.errors.length ? r.errors.join("; ") : "Ready"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {report.rows.length > 200 && <p className="muted">Showing the first 200 of {report.rows.length} rows.</p>}
                <div className="csv-actions">
                  <button type="button" disabled={busy || report.ready.length === 0} onClick={() => void submitRows()}>
                    {busy ? "Submitting…" : `Submit ${report.ready.length} row${report.ready.length === 1 ? "" : "s"} for approval`}
                  </button>
                </div>
                {report.rows.length > report.ready.length && (
                  <p className="muted">Rows with problems are skipped. Fix them in your file and upload it again.</p>
                )}
              </>
            )}
            {busy && progress > 0 && progress < 100 && (
              <div className="csv-progress" aria-hidden="true">
                <div style={{ width: `${progress}%` }} />
              </div>
            )}
            {outcomes.length > 0 && (
              <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: 4 }} aria-live="polite">
                {outcomes.map((o) => (
                  <li key={o.line} style={{ color: o.ok ? "#156343" : "#a1332b" }}>
                    {o.ok ? "✓" : "✗"} {o.label}: {o.note}
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </section>

      {(waiting.length > 0 || approved) && (
        <section className="saas-card csv-step">
          <h2>Approve what was uploaded</h2>
          <p>
            {waiting.length} upload{waiting.length === 1 ? " is" : "s are"} waiting. Approving calculates every KPI, including
            each parent unit. You cannot approve what you submitted yourself, unless your owner allows it.
          </p>
          {waiting.length > 0 && (
            <button type="button" disabled={busy} onClick={() => void approveAll()}>
              Approve all {waiting.length}
            </button>
          )}
          {approved && <output>{approved}</output>}
        </section>
      )}
    </div>
  );
}
