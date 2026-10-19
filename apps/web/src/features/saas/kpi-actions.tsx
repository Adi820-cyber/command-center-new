import { useState } from "react";
import type { SaasWorkspace } from "@orbit/contracts";
import { rolesSeeingKpi } from "./audience";

type Kpi = SaasWorkspace["kpis"][number];
type Change = (path: string, body: unknown) => Promise<boolean>;

/**
 * What an owner can do with one KPI from the KPI library: approve or discard a
 * draft; edit, choose who sees, or stop using an active one.
 */
export function KpiActions({ w, kpi, change, onEdit }: { w: SaasWorkspace; kpi: Kpi; change: Change; onEdit: (kpi: Kpi) => void }) {
  const [audience, setAudience] = useState<string[]>();
  if (!w.organization.owner || kpi.state === "retired") return null;

  if (kpi.state === "draft")
    return (
      <div className="csv-actions" style={{ marginTop: 0 }}>
        <button type="button" onClick={() => void change(`/kpis/${kpi.id}/activate`, {})}>Approve & activate</button>
        <button
          type="button"
          className="secondary"
          onClick={() => {
            if (window.confirm(`Discard the draft “${kpi.name}”?`)) void change(`/kpis/${kpi.id}/retire`, {});
          }}
        >
          Discard
        </button>
      </div>
    );

  const view = rolesSeeingKpi(kpi, w.roles, w.kpis);
  return (
    <div>
      <div className="csv-actions" style={{ marginTop: 0 }}>
        <button type="button" className="secondary" onClick={() => onEdit(kpi)}>Edit</button>
        <button
          type="button"
          className="secondary"
          aria-expanded={audience !== undefined}
          onClick={() => setAudience(audience === undefined ? view.filter((r) => r.sees && !r.everything).map((r) => r.roleId) : undefined)}
        >
          Who sees it ({view.filter((r) => r.sees).length})
        </button>
        <button
          type="button"
          className="secondary"
          onClick={() => {
            if (window.confirm(`Stop using “${kpi.name}”? It will no longer be calculated or shown. Its past results are kept.`))
              void change(`/kpis/${kpi.id}/retire`, {});
          }}
        >
          Stop using
        </button>
      </div>
      {audience !== undefined && (
        <div className="audience">
          <p className="muted" style={{ margin: "0 0 8px" }}>Roles that see “{kpi.name}”:</p>
          <div className="console-roles">
            {view.map((r) => (
              <label key={r.roleId} title={r.everything ? "This role sees every KPI" : undefined}>
                <input
                  type="checkbox"
                  disabled={r.everything}
                  checked={r.everything || audience.includes(r.roleId)}
                  onChange={() => setAudience(audience.includes(r.roleId) ? audience.filter((x) => x !== r.roleId) : [...audience, r.roleId])}
                />
                {r.name}
                {r.everything && <small className="muted"> (sees every KPI)</small>}
              </label>
            ))}
          </div>
          <div className="csv-actions">
            <button
              type="button"
              onClick={() => void change(`/kpis/${kpi.id}/audience`, { roleIds: audience }).then((ok) => ok && setAudience(undefined))}
            >
              Save who sees it
            </button>
            <button type="button" className="secondary" onClick={() => setAudience(undefined)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
