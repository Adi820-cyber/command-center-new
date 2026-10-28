import { useState, useMemo, type FormEvent } from "react";
import { type SaasWorkspace } from "@orbit/contracts";
import { CatalogBrowser } from "./catalog-browser";
import { CustomKpiForm } from "./custom-kpi";
import { TargetEditor } from "./target-editor";
import { KpiActions } from "./kpi-actions";
import "./v2.css";

type Props = {
  workspace: SaasWorkspace;
  change: (path: string, body: unknown) => Promise<boolean>;
  reload: () => Promise<void>;
};

type KpiSubTab = "active" | "catalog" | "custom" | "measures";

export function OrgKpis({ workspace: w, change, reload }: Props) {
  const [subTab, setSubTab] = useState<KpiSubTab>("active");
  const [search, setSearch] = useState("");
  const [showRetired, setShowRetired] = useState(false);
  const [editingKpi, setEditingKpi] = useState<SaasWorkspace["kpis"][number]>();
  const [limit, setLimit] = useState(25);

  const activeKpis = useMemo(() => w.kpis.filter((k) => k.state === "active"), [w.kpis]);
  const withTarget = useMemo(() => activeKpis.filter((k) => k.target !== null).length, [activeKpis]);
  const retiredCount = useMemo(() => w.kpis.filter((k) => k.state === "retired").length, [w.kpis]);

  const needle = search.trim().toLowerCase();
  const matching = useMemo(
    () =>
      w.kpis
        .filter((k) => showRetired || k.state !== "retired")
        .filter(
          (k) =>
            !needle ||
            `${k.name} ${k.description} ${k.catalogId ?? ""} ${k.state} ${k.domain ?? ""}`
              .toLowerCase()
              .includes(needle)
        ),
    [w.kpis, showRetired, needle]
  );

  const startEdit = (kpi: SaasWorkspace["kpis"][number]) => {
    setEditingKpi(kpi);
    setSubTab("custom");
  };

  async function addMeasure(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const key = String(f.get("key") ?? "").trim();
    const name = String(f.get("name") ?? "").trim();
    const unit = String(f.get("unit") ?? "").trim();
    if (!key || !name || !unit) return;
    const ok = await change("/measures", { key, name, unit });
    if (ok) {
      (e.target as HTMLFormElement).reset();
      await reload();
    }
  }

  return (
    <div className="org-kpis-container">
      {/* KPI Management Header Summary */}
      <section className="saas-card" style={{ marginBottom: 16 }}>
        <div className="saas-card-title">
          <div>
            <h2 style={{ margin: "0 0 6px" }}>KPIs & Performance Metrics</h2>
            <p className="muted" style={{ margin: 0, fontSize: 14 }}>
              Set up predefined KPIs from our 592-metric library, or customize formulas, targets, and directions for your organization.
            </p>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              type="button"
              className={subTab === "catalog" ? "" : "secondary"}
              onClick={() => {
                setEditingKpi(undefined);
                setSubTab("catalog");
              }}
            >
              🌟 Browse Predefined Catalog
            </button>
            <button
              type="button"
              className={subTab === "custom" && !editingKpi ? "" : "secondary"}
              onClick={() => {
                setEditingKpi(undefined);
                setSubTab("custom");
              }}
            >
              ✏️ + Build Custom KPI
            </button>
          </div>
        </div>

        {/* Quick KPI Stats Bar */}
        <div className="saas-stats" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", marginTop: 16 }}>
          <div
            style={{ cursor: "pointer", background: subTab === "active" ? "#eff6ff" : undefined }}
            onClick={() => setSubTab("active")}
          >
            <span>Active Organization KPIs</span>
            <strong style={{ color: "var(--brand-primary, #2563eb)" }}>{activeKpis.length}</strong>
          </div>
          <div>
            <span>KPIs With Targets Set</span>
            <strong style={{ color: withTarget === activeKpis.length && activeKpis.length > 0 ? "#16a34a" : "#0f172a" }}>
              {withTarget} <small style={{ fontWeight: 400, fontSize: 13, color: "#64748b" }}>of {activeKpis.length}</small>
            </strong>
          </div>
          <div
            style={{ cursor: "pointer", background: subTab === "catalog" ? "#eff6ff" : undefined }}
            onClick={() => setSubTab("catalog")}
          >
            <span>Predefined Ready Library</span>
            <strong>592</strong>
          </div>
          <div
            style={{ cursor: "pointer", background: subTab === "measures" ? "#eff6ff" : undefined }}
            onClick={() => setSubTab("measures")}
          >
            <span>Data Input Measures</span>
            <strong>{w.measures.length}</strong>
          </div>
        </div>

        {/* Navigation Sub-Tabs */}
        <div style={{ display: "flex", gap: 6, borderBottom: "1px solid #e2e8f0", marginTop: 18, paddingBottom: 2 }}>
          <button
            type="button"
            className="secondary"
            style={{
              borderRadius: "6px 6px 0 0",
              borderBottom: subTab === "active" ? "2px solid #2563eb" : "2px solid transparent",
              fontWeight: subTab === "active" ? 600 : 400,
              color: subTab === "active" ? "#2563eb" : "#64748b",
              background: "transparent",
              borderTop: "none",
              borderLeft: "none",
              borderRight: "none",
              padding: "8px 14px",
            }}
            onClick={() => setSubTab("active")}
          >
            📋 Active KPIs ({activeKpis.length})
          </button>
          <button
            type="button"
            className="secondary"
            style={{
              borderRadius: "6px 6px 0 0",
              borderBottom: subTab === "catalog" ? "2px solid #2563eb" : "2px solid transparent",
              fontWeight: subTab === "catalog" ? 600 : 400,
              color: subTab === "catalog" ? "#2563eb" : "#64748b",
              background: "transparent",
              borderTop: "none",
              borderLeft: "none",
              borderRight: "none",
              padding: "8px 14px",
            }}
            onClick={() => setSubTab("catalog")}
          >
            🌟 Predefined Catalog (592)
          </button>
          <button
            type="button"
            className="secondary"
            style={{
              borderRadius: "6px 6px 0 0",
              borderBottom: subTab === "custom" ? "2px solid #2563eb" : "2px solid transparent",
              fontWeight: subTab === "custom" ? 600 : 400,
              color: subTab === "custom" ? "#2563eb" : "#64748b",
              background: "transparent",
              borderTop: "none",
              borderLeft: "none",
              borderRight: "none",
              padding: "8px 14px",
            }}
            onClick={() => setSubTab("custom")}
          >
            ✏️ {editingKpi ? `Customizing: ${editingKpi.name}` : "Build Custom KPI"}
          </button>
          <button
            type="button"
            className="secondary"
            style={{
              borderRadius: "6px 6px 0 0",
              borderBottom: subTab === "measures" ? "2px solid #2563eb" : "2px solid transparent",
              fontWeight: subTab === "measures" ? 600 : 400,
              color: subTab === "measures" ? "#2563eb" : "#64748b",
              background: "transparent",
              borderTop: "none",
              borderLeft: "none",
              borderRight: "none",
              padding: "8px 14px",
            }}
            onClick={() => setSubTab("measures")}
          >
            ➕ Input Measures ({w.measures.length})
          </button>
        </div>
      </section>

      {/* 1. Predefined KPI Catalog View */}
      {subTab === "catalog" && (
        <div className="catalog-tab-content">
          <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "12px 16px", borderRadius: 8, marginBottom: 16 }}>
            <strong style={{ color: "#166534" }}>🌟 Predefined Industry KPIs Catalog</strong>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "#15803d" }}>
              Explore standardized healthcare and corporate operational KPIs. Click &ldquo;Add &amp; activate&rdquo; to add any KPI directly into your organization, set its monthly target, and assign visibility to roles.
            </p>
          </div>
          <CatalogBrowser workspace={w} change={change} startOpen={true} />
        </div>
      )}

      {/* 2. Custom KPI Builder View */}
      {subTab === "custom" && (
        <div className="custom-kpi-tab-content">
          {editingKpi ? (
            <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", padding: "12px 16px", borderRadius: 8, marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <strong style={{ color: "#1e40af" }}>Customizing KPI: &ldquo;{editingKpi.name}&rdquo;</strong>
                <p style={{ margin: "2px 0 0", fontSize: 13, color: "#1d4ed8" }}>
                  Adjust formula, customize target value, threshold direction, or description. Saving creates a new active version.
                </p>
              </div>
              <button
                type="button"
                className="secondary"
                style={{ fontSize: 12, padding: "5px 10px" }}
                onClick={() => setEditingKpi(undefined)}
              >
                Cancel &amp; Return to List
              </button>
            </div>
          ) : (
            <div style={{ background: "#faf5ff", border: "1px solid #e9d5ff", padding: "12px 16px", borderRadius: 8, marginBottom: 16 }}>
              <strong style={{ color: "#6b21a8" }}>✏️ Create a Tailored Custom KPI</strong>
              <p style={{ margin: "4px 0 0", fontSize: 13, color: "#7e22ce" }}>
                Formulate your unique KPI using arithmetic expressions (+, -, *, /) and available raw data inputs. Immediate syntax check ensures formula integrity.
              </p>
            </div>
          )}
          <CustomKpiForm
            key={editingKpi?.id ?? "new-custom"}
            workspace={w}
            change={change}
            editing={editingKpi}
            onDone={() => {
              setEditingKpi(undefined);
              setSubTab("active");
              void reload();
            }}
          />
        </div>
      )}

      {/* 3. Input Measures Setup */}
      {subTab === "measures" && (
        <div className="measures-tab-content">
          <div className="saas-columns">
            <section className="saas-card">
              <h2>Define a New Input Measure</h2>
              <p className="muted" style={{ fontSize: 13, marginBottom: 14 }}>
                Input measures are aggregate raw figures (e.g., patient visits, billable hours, operating expenses) uploaded each period.
              </p>
              <form onSubmit={(e) => void addMeasure(e)}>
                <label>
                  Measure key (unique system ID)
                  <input
                    name="key"
                    pattern="[a-z][a-z0-9_]*"
                    maxLength={64}
                    placeholder="e.g. total_consultations"
                    required
                  />
                </label>
                <label>
                  Display name
                  <input name="name" maxLength={120} placeholder="e.g. Total Consultations Completed" required />
                </label>
                <label>
                  Unit
                  <input name="unit" placeholder="count, hours, INR, percentage..." maxLength={32} required />
                </label>
                <button type="submit" style={{ marginTop: 12 }}>+ Add Input Measure</button>
              </form>
            </section>

            <section className="saas-card">
              <h2>Current Data Measures ({w.measures.length})</h2>
              <p className="muted" style={{ fontSize: 13 }}>
                These are the measures available to be entered via monthly CSV upload or manual entry.
              </p>
              <div className="saas-table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Key</th>
                      <th>Unit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {w.measures.map((m) => (
                      <tr key={m.key}>
                        <td><strong>{m.name}</strong></td>
                        <td><code>{m.key}</code></td>
                        <td><span className="saas-badge">{m.unit}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </div>
      )}

      {/* 4. Active Organization KPIs List */}
      {subTab === "active" && (
        <section className="saas-card">
          <div className="saas-card-title">
            <div>
              <h3>Configured Organization KPIs</h3>
              <p className="muted" style={{ margin: "2px 0 0", fontSize: 13 }}>
                These KPIs appear on your organization leadership dashboard and role views. Edit targets or click &ldquo;Customize&rdquo; to modify formula and direction.
              </p>
            </div>
            {w.kpis.length > 5 && (
              <input
                type="search"
                aria-label="Filter active KPIs"
                placeholder="Search active KPIs…"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setLimit(25);
                }}
                style={{ maxWidth: 260 }}
              />
            )}
          </div>

          {!w.kpis.length ? (
            <div style={{ textAlign: "center", padding: "36px 18px" }}>
              <p style={{ fontSize: 16, fontWeight: 500, color: "#475569" }}>No KPIs configured yet for your organization.</p>
              <p className="muted" style={{ fontSize: 14 }}>
                Choose predefined metrics from our ready-made catalog, or build custom KPIs from scratch.
              </p>
              <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 14 }}>
                <button type="button" onClick={() => setSubTab("catalog")}>
                  🌟 Browse 592 Predefined KPIs
                </button>
                <button type="button" className="secondary" onClick={() => setSubTab("custom")}>
                  ✏️ Build Custom KPI
                </button>
              </div>
            </div>
          ) : (
            <div className="saas-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>KPI Name &amp; Formula</th>
                    <th>Domain</th>
                    <th>Unit</th>
                    <th>Target Value</th>
                    <th>Direction</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {matching.slice(0, limit).map((k) => (
                    <tr key={k.id}>
                      <td style={{ maxWidth: 320 }}>
                        <strong style={{ display: "block", fontSize: 14 }}>{k.name}</strong>
                        <span className="muted" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>
                          {k.description}
                        </span>
                        <details style={{ fontSize: 12, color: "#64748b" }}>
                          <summary style={{ cursor: "pointer" }}>View Formula &amp; ID</summary>
                          <div style={{ background: "#f8fafc", padding: "6px 8px", borderRadius: 4, marginTop: 4 }}>
                            <code>{JSON.stringify(k.formula)}</code>
                            <div style={{ marginTop: 2, fontSize: 11 }}>Catalog ID: {k.catalogId ?? "Custom"} · Version: {k.version}</div>
                          </div>
                        </details>
                      </td>
                      <td>
                        <span className="saas-badge" style={{ textTransform: "capitalize" }}>
                          {k.domain || "General"}
                        </span>
                      </td>
                      <td>
                        <span className="saas-badge">{k.unit}</span>
                      </td>
                      <td>
                        {k.state !== "retired" ? (
                          <TargetEditor key={`${k.id}:${k.target}`} kpi={k} change={change} />
                        ) : (
                          k.target ?? "—"
                        )}
                      </td>
                      <td>
                        <span
                          className={`saas-badge ${
                            k.direction === "higher" ? "good" : k.direction === "lower" ? "warn" : ""
                          }`}
                          style={{ fontSize: 11 }}
                        >
                          {k.direction === "higher" ? "▲ Higher is better" : k.direction === "lower" ? "▼ Lower is better" : "• Neutral"}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`saas-badge ${
                            k.state === "active" ? "good" : k.state === "draft" ? "warn" : "bad"
                          }`}
                        >
                          {k.state}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                          <button
                            type="button"
                            className="secondary"
                            style={{ padding: "4px 8px", fontSize: 12 }}
                            onClick={() => startEdit(k)}
                            title="Customize formula, target, and direction"
                          >
                            ✏️ Customize
                          </button>
                          <KpiActions w={w} kpi={k} change={change} onEdit={startEdit} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {matching.length > limit && (
            <div className="csv-actions" style={{ marginTop: 12 }}>
              <button type="button" className="secondary" onClick={() => setLimit((l) => l + 25)}>
                Show more ({matching.length - limit} remaining)
              </button>
            </div>
          )}

          {retiredCount > 0 && (
            <label
              className="saas-checkbox"
              style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 14, fontSize: 13, color: "#64748b" }}
            >
              <input
                type="checkbox"
                checked={showRetired}
                onChange={(e) => setShowRetired(e.target.checked)}
                style={{ width: "auto" }}
              />
              Show {retiredCount} retired KPI version{retiredCount === 1 ? "" : "s"}
            </label>
          )}
        </section>
      )}
    </div>
  );
}
