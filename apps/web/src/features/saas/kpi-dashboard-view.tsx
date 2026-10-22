import React, { useMemo, useState } from "react";
import { BarChart3, Search, Zap } from "lucide-react";
import type { SaasWorkspace } from "@orbit/contracts";
import { formatKpiValue } from "@orbit/contracts";
import { StatusBadge } from "./components/StatusBadge";
import { DrillPanel } from "./components/DrillPanel";

interface KpiDashboardViewProps {
  workspace: SaasWorkspace;
  onDrillKpi?: (kpiId: string) => void;
  onAskKpi?: (kpiName: string) => void;
}

export const KpiDashboardView: React.FC<KpiDashboardViewProps> = ({
  workspace: w,
  onAskKpi,
}) => {
  const [search, setSearch] = useState("");
  const [selectedDomain, setSelectedDomain] = useState<string>("all");
  const [drillingKpiId, setDrillingKpiId] = useState<string | null>(null);

  // Group KPIs by domain
  const { groups, domains, allCount } = useMemo(() => {
    const needle = search.trim().toLowerCase();
    const domainSet = new Set<string>();

    const filtered = w.kpis.filter((k) => {
      if (k.domain) domainSet.add(k.domain);
      if (selectedDomain !== "all" && k.domain !== selectedDomain) return false;
      if (!needle) return true;
      return `${k.name} ${k.description} ${k.domain ?? ""}`
        .toLowerCase()
        .includes(needle);
    });

    const groupMap = new Map<string, typeof filtered>();
    filtered.forEach((k) => {
      const d = k.domain || "Custom / General";
      const list = groupMap.get(d) ?? [];
      list.push(k);
      groupMap.set(d, list);
    });

    return {
      groups: Array.from(groupMap.entries()),
      domains: Array.from(domainSet).sort(),
      allCount: filtered.length,
    };
  }, [w.kpis, search, selectedDomain]);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-white p-4 sm:p-6 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-md bg-blue-100 text-blue-700">
              <BarChart3 className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {w.organization.name} Framework
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            KPI Scorecard Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {allCount} active metrics monitored across {w.units.length} organization units.
          </p>
        </div>

        {/* Filter controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search KPIs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800"
            />
          </div>
        </div>
      </div>

      {/* Domain Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        <button
          onClick={() => setSelectedDomain("all")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            selectedDomain === "all"
              ? "bg-slate-900 text-white shadow-2xs"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          All Domains ({w.kpis.length})
        </button>
        {domains.map((d) => (
          <button
            key={d}
            onClick={() => setSelectedDomain(d)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              selectedDomain === d
                ? "bg-slate-900 text-white shadow-2xs"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            {d}
          </button>
        ))}
      </div>

      {/* Grouped KPI Cards */}
      {groups.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-xs text-slate-500">
          No KPIs match the selected filter.
        </div>
      ) : (
        groups.map(([domainName, kpiList]) => (
          <section key={domainName} className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>{domainName}</span>
                <span className="text-xs font-normal text-slate-500 font-mono">
                  ({kpiList.length})
                </span>
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {kpiList.map((k) => {
                const results = w.results.filter((r) => r.kpiId === k.id);
                const latestResult = results[results.length - 1];
                const displayVal =
                  latestResult?.value.status === "available"
                    ? formatKpiValue(latestResult.value.value, k.unit)
                    : "Pending Data";
                const isGood = latestResult?.onTarget === true;
                const isBad = latestResult?.onTarget === false;

                return (
                  <article
                    key={k.id}
                    onClick={() => setDrillingKpiId(k.id)}
                    className="executive-card p-4 rounded-xl relative overflow-hidden bg-white hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          v{k.version} · {k.state}
                        </span>
                        <StatusBadge
                          status={
                            isGood ? "healthy" : isBad ? "critical" : "neutral"
                          }
                          label={
                            isGood
                              ? "On Target"
                              : isBad
                              ? "Off Target"
                              : "Tracking"
                          }
                          size="sm"
                        />
                      </div>

                      <h3 className="text-sm font-bold text-slate-900 tracking-tight leading-snug">
                        {k.name}
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                        {k.description}
                      </p>

                      <div className="mt-3 p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                        <span className="text-[10px] text-slate-400 font-semibold block uppercase">
                          Latest Computed Value
                        </span>
                        <div className="text-xl font-black text-slate-900 font-mono mt-0.5">
                          {displayVal}
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="font-mono text-slate-500 text-[11px]">
                        Target:{" "}
                        <strong className="text-slate-800">
                          {k.target !== null ? `${k.target} ${k.unit}` : "None"}
                        </strong>
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDrillingKpiId(k.id);
                        }}
                        className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-800 cursor-pointer"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        <span>Drill</span>
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ))
      )}

      {/* Slide-out Drill Drawer */}
      <DrillPanel
        kpiId={drillingKpiId}
        workspace={w}
        onClose={() => setDrillingKpiId(null)}
        onAskKpi={onAskKpi}
      />
    </div>
  );
};
