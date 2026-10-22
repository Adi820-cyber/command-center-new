import React, { useEffect, useMemo } from "react";
import {
  X,
  Target,
  Calculator,
  Calendar,
  Building2,
  TrendingUp,
  TrendingDown,
  Sparkles,
} from "lucide-react";
import type {
  SaasWorkspace,
} from "@orbit/contracts";
import { formatFormula, formatKpiValue, periodLabel } from "@orbit/contracts";

interface DrillPanelProps {
  kpiId: string | null;
  workspace?: SaasWorkspace;
  onClose: () => void;
  onAskKpi?: (kpiName: string) => void;
}

export const DrillPanel: React.FC<DrillPanelProps> = ({
  kpiId,
  workspace,
  onClose,
  onAskKpi,
}) => {
  // Prevent page scroll behind drawer
  useEffect(() => {
    if (!kpiId) return;
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = prev;
    };
  }, [kpiId]);

  const kpi = useMemo(() => {
    if (!kpiId || !workspace) return null;
    return workspace.kpis.find((k) => k.id === kpiId) ?? null;
  }, [kpiId, workspace]);

  // Unit breakdowns for this KPI
  const unitBreakdown = useMemo(() => {
    if (!kpi || !workspace) return [];
    const results = workspace.results.filter((r) => r.kpiId === kpi.id);
    return workspace.units.map((u) => {
      const result = results.find((r) => r.unitId === u.id);
      const val =
        result?.value.status === "available" ? result.value.value : null;
      return {
        unit: u,
        result,
        value: val,
        onTarget: result?.onTarget ?? null,
      };
    });
  }, [kpi, workspace]);

  // Historical periods
  const history = useMemo(() => {
    if (!kpi || !workspace) return [];
    return workspace.results
      .filter((r) => r.kpiId === kpi.id && r.value.status === "available")
      .sort((a, b) => a.start.localeCompare(b.start))
      .slice(-12)
      .map((r) => ({
        start: r.start,
        end: r.end,
        value: Number(r.value.status === "available" ? r.value.value : 0),
        raw: r.value.status === "available" ? r.value.value : "0",
        onTarget: r.onTarget,
      }));
  }, [kpi, workspace]);

  if (!kpiId || !kpi || !workspace) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden bg-slate-950/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-start justify-between bg-gradient-to-r from-slate-50 to-white gap-3 shrink-0">
          <div className="space-y-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200/60">
                {kpi.domain || "Executive KPI"}
              </span>
              <span className="text-xs text-slate-500 font-mono">
                v{kpi.version} · {kpi.state}
              </span>
            </div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">
              {kpi.name}
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              {kpi.description}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
            aria-label="Close drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-6">
          {/* Target & Direction Card */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Target Objective
              </span>
              <p className="text-base font-black text-slate-900 font-mono mt-0.5">
                {kpi.target !== null ? formatKpiValue(kpi.target, kpi.unit) : "None"}
              </p>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Target Direction
              </span>
              <p className="text-xs font-bold text-slate-800 capitalize mt-1 flex items-center gap-1">
                {kpi.direction === "higher" ? (
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                ) : kpi.direction === "lower" ? (
                  <TrendingDown className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Target className="w-4 h-4 text-slate-500" />
                )}
                <span>Higher is {kpi.direction === "higher" ? "better" : kpi.direction === "lower" ? "worse" : "neutral"}</span>
              </p>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 col-span-2 sm:col-span-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Unit of Measure
              </span>
              <p className="text-xs font-bold text-slate-800 font-mono mt-1">
                {kpi.unit}
              </p>
            </div>
          </div>

          {/* Formula calculation */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
              <Calculator className="w-4 h-4 text-blue-600" />
              <span>Calculation Logic</span>
            </div>
            <pre className="text-xs font-mono bg-white p-2.5 rounded-lg border border-slate-200 text-slate-800 overflow-x-auto">
              {formatFormula(kpi.formula)}
            </pre>
          </div>

          {/* Unit Breakdown */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-blue-600" />
                <span>Facility & Unit Telemetry ({unitBreakdown.length})</span>
              </h3>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
              {unitBreakdown.map(({ unit, value, onTarget }) => (
                <div
                  key={unit.id}
                  className="p-3 flex items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {unit.name}
                    </p>
                    <p className="text-[10px] text-slate-400 capitalize">
                      {unit.kind}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold font-mono text-slate-800">
                      {value !== null ? formatKpiValue(value, kpi.unit) : "—"}
                    </span>
                    {onTarget !== null && (
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${
                          onTarget
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}
                      >
                        {onTarget ? "On Target" : "Off Target"}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Historical Trend */}
          {history.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Reporting Period History ({history.length} periods)</span>
                </h3>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                {history.map((h, i) => (
                  <div
                    key={i}
                    className="p-2.5 px-3 flex items-center justify-between text-xs"
                  >
                    <span className="font-mono text-slate-600 text-[11px]">
                      {periodLabel(h.start, h.end)}
                    </span>
                    <span className="font-bold font-mono text-slate-900">
                      {formatKpiValue(h.raw, kpi.unit)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3 shrink-0">
          {onAskKpi && (
            <button
              onClick={() => {
                onClose();
                onAskKpi(kpi.name);
              }}
              className="px-3.5 py-2 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Ask about this KPI</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 ml-auto transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
