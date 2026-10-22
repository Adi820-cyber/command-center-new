import React, { useState } from "react";
import {
  Building2,
  Plus,
  FolderTree,
  ChevronRight,
} from "lucide-react";
import type { SaasWorkspace } from "@orbit/contracts";
import { StatusBadge } from "./components/StatusBadge";

interface UnitsViewProps {
  workspace: SaasWorkspace;
  change: (path: string, body: unknown) => Promise<boolean>;
  onSelectUnit?: (unitId: string) => void;
}

export const UnitsView: React.FC<UnitsViewProps> = ({
  workspace: w,
  change,
  onSelectUnit,
}) => {
  const [isAddOpen, setIsAddOpen] = useState(false);

  const handleAddSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const ok = await change("/units", {
      name: (f.get("name") as string).trim(),
      kind: (f.get("kind") as string).trim(),
      parentId: f.get("parentId") || null,
    });
    if (ok) setIsAddOpen(false);
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-white p-4 sm:p-6 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-md bg-blue-100 text-blue-700">
              <Building2 className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {w.organization.name} Hierarchy
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Facilities, Branches & Operational Units
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {w.units.length} active organizational units reporting performance metrics.
          </p>
        </div>

        {w.organization.owner && (
          <button
            onClick={() => setIsAddOpen(!isAddOpen)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Unit</span>
          </button>
        )}
      </div>

      {/* Add Unit Collapsible Form */}
      {isAddOpen && (
        <section className="bg-white rounded-xl border border-blue-200 p-5 shadow-sm space-y-4 animate-in slide-in-from-top-3 duration-200">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h2 className="text-sm font-bold text-slate-900">
              Register New Organization Unit
            </h2>
            <button
              onClick={() => setIsAddOpen(false)}
              className="text-xs text-slate-400 hover:text-slate-600"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={(e) => void handleAddSubmit(e)} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Unit Name
                </label>
                <input
                  name="name"
                  required
                  maxLength={120}
                  placeholder="e.g. Nairobi Hospital, Finance Branch"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Unit Type / Kind
                </label>
                <input
                  name="kind"
                  required
                  maxLength={60}
                  placeholder="Hospital, Branch, Department, Team…"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Parent Unit (Optional)
                </label>
                <select
                  name="parentId"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                >
                  <option value="">None (Top-Level Organization)</option>
                  {w.units.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.kind})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
              >
                Register Unit
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Facilities & Units Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {w.units.map((unit) => {
          const parent = w.units.find((p) => p.id === unit.parentId);
          const results = w.results.filter((r) => r.unitId === unit.id);
          const onTargetCount = results.filter((r) => r.onTarget === true).length;
          const offTargetCount = results.filter((r) => r.onTarget === false).length;
          const totalScored = onTargetCount + offTargetCount;
          const compliancePct =
            totalScored > 0 ? Math.round((onTargetCount / totalScored) * 100) : 100;

          return (
            <div
              key={unit.id}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded flex items-center gap-1">
                    <Building2 className="w-3 h-3 text-blue-500" />
                    {unit.kind}
                  </span>
                  <StatusBadge
                    status={
                      compliancePct >= 80
                        ? "healthy"
                        : compliancePct >= 50
                        ? "warning"
                        : "critical"
                    }
                    label={`${compliancePct}% On Track`}
                    size="sm"
                  />
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                    {unit.name}
                  </h3>
                  {parent && (
                    <span className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                      <FolderTree className="w-3 h-3" />
                      Part of {parent.name}
                    </span>
                  )}
                </div>

                {/* Progress bar */}
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold mb-1 font-mono">
                    <span className="text-slate-600">Metric Compliance</span>
                    <span className="text-slate-900 font-bold">{compliancePct}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        compliancePct < 50
                          ? "bg-rose-500"
                          : compliancePct < 80
                          ? "bg-amber-500"
                          : "bg-emerald-500"
                      }`}
                      style={{ width: `${compliancePct}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span className="font-mono text-slate-700 font-medium">
                  {results.length} reported measures
                </span>
                {onSelectUnit && (
                  <button
                    onClick={() => onSelectUnit(unit.id)}
                    className="text-blue-600 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Inspect Unit</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
