import React from "react";
import type { SaasWorkspace } from "@orbit/contracts";

interface ContextBarProps {
  sidebarCollapsed: boolean;
  workspace?: SaasWorkspace;
  selectedUnitId: string;
  onSelectUnitId: (unitId: string) => void;
  selectedDomain: string;
  onSelectDomain: (domain: string) => void;
  selectedPeriodType: "M" | "Q" | "YTD" | "Y";
  onSelectPeriodType: (p: "M" | "Q" | "YTD" | "Y") => void;
}

const SELECT_CLASS =
  "max-w-full min-w-[8rem] text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500/30 shadow-2xs";

export const ContextBar: React.FC<ContextBarProps> = ({
  sidebarCollapsed,
  workspace,
  selectedUnitId,
  onSelectUnitId,
  selectedDomain,
  onSelectDomain,
  selectedPeriodType,
  onSelectPeriodType,
}) => {
  // Collect all unique domains from workspace KPIs
  const domains = React.useMemo(() => {
    if (!workspace) return [];
    const set = new Set<string>();
    workspace.kpis.forEach((k) => {
      if (k.domain) set.add(k.domain);
    });
    return Array.from(set).sort();
  }, [workspace]);

  return (
    <div
      className={`sticky top-16 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200/90 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-3 sm:px-6 py-2 transition-all duration-300 ml-0 ${
        sidebarCollapsed ? "lg:ml-20" : "lg:ml-64"
      }`}
    >
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        {/* Scope / Unit Selector */}
        <div className="flex items-center gap-1.5 max-w-full">
          <label
            htmlFor="context-scope"
            className="text-[11px] font-bold uppercase tracking-wider text-slate-500"
          >
            Scope
          </label>
          <select
            id="context-scope"
            value={selectedUnitId}
            onChange={(e) => onSelectUnitId(e.target.value)}
            className={SELECT_CLASS}
            aria-label="Scope unit"
          >
            <option value="">
              Organization Wide ({workspace?.units.length ?? 0} units)
            </option>
            {workspace?.units.map((unit) => (
              <option key={unit.id} value={unit.id}>
                {unit.name} ({unit.kind})
              </option>
            ))}
          </select>
        </div>

        {/* Domain Selector */}
        <div className="flex items-center gap-1.5 max-w-full">
          <label
            htmlFor="context-domain"
            className="text-[11px] font-bold uppercase tracking-wider text-slate-500"
          >
            Domain
          </label>
          <select
            id="context-domain"
            value={selectedDomain}
            onChange={(e) => onSelectDomain(e.target.value)}
            className={SELECT_CLASS}
            aria-label="Filter domain"
          >
            <option value="all">All Domains</option>
            {domains.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        {/* Reporting Period Selector */}
        <fieldset className="flex items-center gap-1 border-0 p-0 m-0">
          <legend className="sr-only">Period</legend>
          <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5 border border-slate-200/60">
            {(["M", "Q", "YTD", "Y"] as const).map((p) => (
              <label
                key={p}
                className={`px-2.5 py-1 rounded-md text-xs font-bold cursor-pointer transition-colors focus-within:ring-2 focus-within:ring-blue-500/40 ${
                  selectedPeriodType === p
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <input
                  type="radio"
                  name="period-type"
                  value={p}
                  checked={selectedPeriodType === p}
                  onChange={() => onSelectPeriodType(p)}
                  className="sr-only"
                />
                {p}
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      <div className="flex items-center gap-2">
        <span
          className="text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1 font-mono"
          title="Active reporting cycle"
        >
          {selectedPeriodType === "M"
            ? "Monthly Cycle"
            : selectedPeriodType === "Q"
            ? "Quarterly Cycle"
            : selectedPeriodType === "YTD"
            ? "Year to Date"
            : "Annual Cycle"}
        </span>
      </div>
    </div>
  );
};
