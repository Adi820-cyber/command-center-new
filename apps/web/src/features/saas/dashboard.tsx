import { useMemo, useState, type FormEvent } from "react";
import {
  buildBrief,
  formatKpiValue,
  kpiPoints,
  type KpiPoint,
  type SaasWorkspace,
} from "@orbit/contracts";
import {
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Building2,
  CheckCircle2,
  Zap,
  CheckSquare,
  BarChart3,
  ChevronRight,
} from "lucide-react";
import { formText } from "./forms";
import { StatusBadge } from "./components/StatusBadge";
import { DrillPanel } from "./components/DrillPanel";
import { ApprovalModal, type ActionModalData } from "./components/ApprovalModal";

interface Props {
  workspace: SaasWorkspace;
  change: (path: string, body: unknown) => Promise<boolean>;
  ask: (question: string) => void;
  goto: (tab: any) => void;
  selectedUnitId?: string;
  selectedDomain?: string;
}

/** SVG Sparkline with subtle gradient and tone coloring */
function Sparkline({
  values,
  tone,
  label,
}: {
  values: number[];
  tone: KpiPoint["tone"];
  label: string;
}) {
  if (values.length < 2) return null;
  const width = 120;
  const height = 32;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const step = width / (values.length - 1);
  const y = (v: number) => height - 5 - ((v - min) / span) * (height - 10);
  const points = values
    .map((v, i) => `${(i * step).toFixed(1)},${y(v).toFixed(1)}`)
    .join(" ");

  const strokeColor =
    tone === "good" ? "#10b981" : tone === "bad" ? "#f43f5e" : "#64748b";

  return (
    <svg
      className="w-24 h-7 shrink-0 overflow-visible"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
    >
      <title>{label}</title>
      <polyline
        fill="none"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
      <circle
        cx={(values.length - 1) * step}
        cy={y(values[values.length - 1]!)}
        r="3"
        fill={strokeColor}
      />
    </svg>
  );
}

function waitingFor(point: KpiPoint, names: Map<string, string>): string | null {
  const value = point.result.value;
  if (value.status !== "missing") return null;
  const label = (ref: string) => {
    const [key = "", suffix] = ref.split("@");
    const name = names.get(key) ?? key;
    return suffix === "previous"
      ? `${name} (previous)`
      : suffix === "year_ago"
      ? `${name} (last year)`
      : name;
  };
  return `Waiting for: ${value.measures.map(label).join(", ")}`;
}

export function Dashboard({
  workspace: w,
  change,
  ask,
  goto,
  selectedUnitId = "",
  selectedDomain = "all",
}: Props) {
  const today = new Date().toISOString().slice(0, 10);
  const points = useMemo(() => kpiPoints(w), [w]);

  // Selected drill KPI
  const [drillingKpiId, setDrillingKpiId] = useState<string | null>(null);

  // Selected approval modal action
  const [activeModalAction, setActiveModalAction] =
    useState<ActionModalData | null>(null);

  // Selected attention tier tab
  const [attentionTier, setAttentionTier] = useState<
    "all" | "action-now" | "monitor" | "on-track"
  >("all");

  const [acting, setActing] = useState("");
  const [defaultDue] = useState(() =>
    new Date(Date.now() + 14 * 86_400_000).toISOString().slice(0, 10),
  );

  // Unit filter selection
  const unitsWithData = useMemo(() => {
    const ids = new Set(points.map((p) => p.unitId));
    return w.units
      .filter((u) => ids.has(u.id))
      .sort(
        (a, b) =>
          Number(b.parentId === null) - Number(a.parentId === null) ||
          a.name.localeCompare(b.name),
      );
  }, [points, w.units]);

  const activeUnitId = selectedUnitId || (unitsWithData[0]?.id ?? "");
  const unitPoints = useMemo(() => {
    let list = activeUnitId
      ? points.filter((p) => p.unitId === activeUnitId)
      : points;
    if (selectedDomain && selectedDomain !== "all") {
      list = list.filter((p) => p.kpi.domain === selectedDomain);
    }
    return list;
  }, [points, activeUnitId, selectedDomain]);

  const brief = useMemo(
    () => buildBrief(w, today, activeUnitId || undefined),
    [w, today, activeUnitId],
  );

  const measureNames = useMemo(
    () => new Map(w.measures.map((m) => [m.key, m.name])),
    [w.measures],
  );

  const history = (p: KpiPoint): number[] =>
    w.results
      .filter(
        (r) =>
          r.kpiId === p.kpi.id &&
          r.unitId === p.unitId &&
          r.value.status === "available",
      )
      .sort((a, b) => a.start.localeCompare(b.start))
      .slice(-12)
      .map((r) => Number(r.value.status === "available" ? r.value.value : 0));

  const pendingActionsCount = w.actions.filter((a) => a.state !== "done").length;
  const pendingBatchesCount = w.batches.filter((b) => b.status === "submitted").length;

  // Exceptions telemetry for the top banner
  const exceptions = useMemo(() => {
    const items = [];
    if (brief.offTarget > 0) {
      items.push({
        id: "exc-off-target",
        badge: `C${items.length + 1}`,
        severity: "critical" as const,
        title: `${brief.offTarget} KPI${brief.offTarget === 1 ? "" : "s"} Off Target`,
        description: `Underperforming metrics in ${activeUnitId ? w.units.find((u) => u.id === activeUnitId)?.name ?? "selected unit" : "organization"} requiring intervention.`,
        actionLabel: "View Critical",
        action: () => setAttentionTier("action-now"),
      });
    }
    if (pendingBatchesCount > 0) {
      items.push({
        id: "exc-pending-batches",
        badge: `W${items.length + 1}`,
        severity: "warning" as const,
        title: `${pendingBatchesCount} Batch${pendingBatchesCount === 1 ? "" : "es"} Awaiting Approval`,
        description: "Submitted measures ready for calculation review before publication.",
        actionLabel: "Review Batches",
        action: () => goto("Data & approvals"),
      });
    }
    if (brief.overdueActions.length > 0) {
      items.push({
        id: "exc-overdue-actions",
        badge: `W${items.length + 1}`,
        severity: "warning" as const,
        title: `${brief.overdueActions.length} Action${brief.overdueActions.length === 1 ? "" : "s"} Overdue`,
        description: "Assigned performance recovery items past their scheduled completion date.",
        actionLabel: "Open Decision Queue",
        action: () => goto("Actions"),
      });
    }
    if (items.length === 0) {
      items.push({
        id: "exc-healthy",
        badge: "A1",
        severity: "info" as const,
        title: "Standard Operational Telemetry",
        description: "All approved inputs calculated and operating within SLA target boundaries.",
        actionLabel: "Inspect Library",
        action: () => goto("KPI library"),
      });
    }
    return items;
  }, [brief, pendingBatchesCount, activeUnitId, w.units, goto]);

  // Three-Tier Classification
  const actionNowItems = useMemo(
    () => unitPoints.filter((p) => p.onTarget === false),
    [unitPoints],
  );

  const monitorItems = useMemo(
    () => unitPoints.filter((p) => p.onTarget === null || p.changeTone === "bad"),
    [unitPoints],
  );

  const onTrackItems = useMemo(
    () => unitPoints.filter((p) => p.onTarget === true),
    [unitPoints],
  );

  const tiers = [
    { id: "all", label: "All Items", count: unitPoints.length },
    {
      id: "action-now",
      label: "Action Now",
      count: actionNowItems.length,
      badgeColor: "bg-rose-100 text-rose-800",
    },
    {
      id: "monitor",
      label: "Monitor",
      count: monitorItems.length,
      badgeColor: "bg-amber-100 text-amber-800",
    },
    {
      id: "on-track",
      label: "On Track",
      count: onTrackItems.length,
      badgeColor: "bg-emerald-100 text-emerald-800",
    },
  ];

  async function createAction(
    event: FormEvent<HTMLFormElement>,
    point: KpiPoint,
  ) {
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

  // Handle Action state transition
  const handleApproveAction = async (act: ActionModalData) => {
    await change(`/actions/${act.id}/transition`, {
      state: "done",
      expectedVersion: act.version,
    });
  };

  const handleRejectAction = async (act: ActionModalData) => {
    await change(`/actions/${act.id}/transition`, {
      state: "done",
      expectedVersion: act.version,
    });
  };

  const handleRevisionsAction = async (act: ActionModalData) => {
    await change(`/actions/${act.id}/transition`, {
      state: "in_progress",
      expectedVersion: act.version,
    });
  };

  if (w.kpis.length === 0) {
    return (
      <section className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-8 text-center space-y-4">
        <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
          <BarChart3 className="w-6 h-6" />
        </div>
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            START WITH WHAT MATTERS
          </span>
          <h2 className="text-xl font-black text-slate-900 mt-1">
            No KPIs Defined Yet
          </h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
            Pick from the catalog of industry templates and ready-made KPIs, or create your own custom metrics.
          </p>
        </div>
        <button
          onClick={() => goto("KPI library")}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer inline-flex items-center gap-1.5"
        >
          <span>Open the KPI Library</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </section>
    );
  }

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* ─── 1. Executive Greeting & Context Banner ─── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-md flex items-center gap-1.5 border border-blue-200/60">
              <BarChart3 className="w-3.5 h-3.5 text-blue-600" />
              {w.organization.name}
            </span>
            <span className="text-slate-300 hidden sm:inline">•</span>
            <span className="text-xs text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md font-mono border border-emerald-200/60">
              {new Date(today).toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Executive Morning Brief
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            {brief.headline}
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={() => ask("Which KPIs are off target?")}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold shadow-2xs transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>Ask anything</span>
          </button>

          <button
            onClick={() => goto("Actions")}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-2xs hover:shadow transition-all cursor-pointer"
          >
            <span>Decision Queue ({pendingActionsCount})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ─── 2. Morning Brief Exception Telemetry Banner ─── */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 text-white rounded-xl p-4 sm:p-5 shadow-sm border border-blue-800/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-3 mb-3 border-b border-white/10 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="text-xs font-bold uppercase tracking-wider text-blue-200">
              Morning Brief Exception Telemetry · Run the Organization From One Screen
            </span>
          </div>
          <span className="text-[10px] sm:text-[11px] text-slate-300 font-mono">
            Generated {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} · {w.organization.name}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 text-xs">
          {exceptions.map((item) => (
            <div
              key={item.id}
              className="p-3 rounded-lg bg-white/5 border border-white/10 flex items-start gap-2.5 hover:bg-white/10 transition-colors"
            >
              <span
                className={`p-1 px-1.5 rounded font-mono font-bold text-[10px] shrink-0 mt-0.5 ${
                  item.severity === "critical"
                    ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                    : item.severity === "warning"
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                    : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                }`}
              >
                {item.badge}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-white leading-snug">{item.title}</p>
                <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                  {item.description}
                </p>
                <button
                  type="button"
                  onClick={item.action}
                  className="mt-2 inline-flex items-center gap-1 rounded-md border border-white/20 px-2 py-1 text-[11px] font-semibold text-blue-100 hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <Zap className="w-3 h-3 text-amber-300" />
                  <span>{item.actionLabel}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── 3. Section A: Executive KPI Scorecards Grid ─── */}
      <section aria-label="Executive KPI Framework Scorecards">
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <BarChart3 className="w-3.5 h-3.5 text-blue-600" />
            <span>Executive KPI Scorecards ({unitPoints.length} active)</span>
          </h2>
          <span className="text-xs text-slate-500">
            Click any KPI card to drill down into unit telemetry
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {unitPoints.map((p) => {
            const values = history(p);
            const isGood = p.onTarget === true;
            const isBad = p.onTarget === false;
            const borderTone = isGood
              ? "border-emerald-200 hover:border-emerald-400"
              : isBad
              ? "border-rose-200 hover:border-rose-400"
              : "border-slate-200 hover:border-blue-300";

            return (
              <article
                key={p.result.id}
                onClick={() => setDrillingKpiId(p.kpi.id)}
                className={`executive-card p-3.5 sm:p-4 rounded-xl relative overflow-hidden transition-all bg-white hover:shadow-md cursor-pointer ${borderTone}`}
                title={`Drill into ${p.kpi.name}`}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded bg-slate-100 text-slate-600 truncate max-w-[140px]">
                    {p.kpi.domain || "Executive"}
                  </span>
                  <StatusBadge
                    status={
                      isGood ? "healthy" : isBad ? "critical" : "neutral"
                    }
                    label={isGood ? "On Target" : isBad ? "Off Target" : "Tracking"}
                    size="sm"
                    pulse={isBad}
                  />
                </div>

                <h3 className="text-xs font-bold text-slate-900 truncate tracking-tight mb-1">
                  {p.kpi.name}
                </h3>

                <div className="flex items-baseline justify-between gap-2 mb-1.5">
                  <div className="text-2xl font-black tracking-tight text-slate-900 font-mono">
                    {waitingFor(p, measureNames) ?? p.display}
                  </div>
                  <Sparkline
                    values={values}
                    tone={p.tone}
                    label={`Trend for ${p.kpi.name}`}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-slate-100 mt-2">
                  <span className="text-slate-500 font-mono">
                    {p.result.target !== null
                      ? `Target ${formatKpiValue(p.result.target, p.kpi.unit)}`
                      : "No target set"}
                  </span>
                  {p.change && (
                    <span
                      className={`inline-flex items-center gap-0.5 font-bold font-mono px-1.5 py-0.5 rounded text-[10px] ${
                        p.changeTone === "good"
                          ? "text-emerald-700 bg-emerald-50"
                          : p.changeTone === "bad"
                          ? "text-rose-700 bg-rose-50"
                          : "text-slate-600 bg-slate-100"
                      }`}
                    >
                      {p.change.startsWith("+")
                        ? "▲"
                        : p.change.startsWith("−")
                        ? "▼"
                        : ""}
                      {p.change}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-50">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDrillingKpiId(p.kpi.id);
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800 cursor-pointer"
                  >
                    <Zap className="w-3 h-3" />
                    <span>Drill</span>
                  </button>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {p.unitName}
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* ─── 4. Section B: Three-Tier Attention Feed ─── */}
      <section
        aria-label="Critical Alerts and Attention Items"
        className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden"
      >
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-slate-50/80 to-white">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="p-1.5 rounded-md bg-rose-100 text-rose-700">
                <ShieldAlert className="w-4 h-4" />
              </span>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Executive Morning Brief — Triage & Attention Feed
              </h2>
              <span className="bg-rose-100 text-rose-800 text-xs font-semibold px-2 py-0.5 rounded-full font-mono">
                {actionNowItems.length} Actionable Items
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Performance variances categorized into Action Now, Monitor, and On Track tiers.
            </p>
          </div>

          <button
            onClick={() => goto("Actions")}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors self-start sm:self-auto cursor-pointer"
          >
            <span>Open Decision Queue</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Tier Tabs */}
        <div className="px-4 sm:px-5 py-2.5 bg-slate-50/60 border-b border-slate-100 flex items-center gap-2 overflow-x-auto">
          {tiers.map((tab) => {
            const isActive = attentionTier === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setAttentionTier(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                  isActive
                    ? "bg-slate-900 text-white shadow-2xs"
                    : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isActive
                      ? "bg-slate-700 text-white"
                      : tab.badgeColor || "bg-slate-100 text-slate-600"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Tier Content */}
        <div className="divide-y divide-slate-100">
          {(attentionTier === "all" || attentionTier === "action-now") && (
            <div className="p-4 sm:p-5 space-y-3 bg-rose-50/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-pulse" />
                  <span className="text-xs font-black uppercase tracking-wider text-rose-800">
                    Tier 1: Action Now
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-mono">
                    {actionNowItems.length} Critical
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 hidden sm:inline">
                  Underperforming metrics requiring management decision today
                </span>
              </div>

              {actionNowItems.length === 0 ? (
                <div className="p-4 rounded-lg border border-rose-100 bg-white text-center text-xs text-slate-500">
                  No critical underperforming metrics in this selection.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {actionNowItems.map((p) => (
                    <div
                      key={p.result.id}
                      className="p-3.5 sm:p-4 rounded-xl border border-slate-200 border-l-4 border-l-rose-500 bg-rose-50/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <StatusBadge status="critical" size="sm" pulse />
                          <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded flex items-center gap-1 font-mono">
                            <Building2 className="w-3 h-3 text-blue-500" />
                            {p.unitName}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            Variance:{" "}
                            <strong className="text-rose-700 font-mono">
                              {p.display}
                            </strong>{" "}
                            (vs target{" "}
                            {p.result.target !== null
                              ? formatKpiValue(p.result.target, p.kpi.unit)
                              : "None"}
                            )
                          </span>
                        </div>
                        <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                          {p.kpi.name} is off target in {p.unitName}
                        </h3>
                        <p className="text-[11px] text-slate-600 mt-1">
                          {p.kpi.description}
                        </p>
                      </div>

                      {acting === p.result.id ? (
                        <form
                          className="w-full sm:w-80 bg-white p-3 rounded-lg border border-slate-200 space-y-2"
                          onSubmit={(e) => void createAction(e, p)}
                        >
                          <label className="text-[11px] font-bold text-slate-700 block">
                            Action title
                            <input
                              name="title"
                              required
                              maxLength={200}
                              defaultValue={`Recover ${p.kpi.name} in ${p.unitName}`}
                              className="w-full mt-1 p-1.5 text-xs border border-slate-200 rounded"
                            />
                          </label>
                          <label className="text-[11px] font-bold text-slate-700 block">
                            Assignee
                            <select
                              name="assignee"
                              required
                              className="w-full mt-1 p-1.5 text-xs border border-slate-200 rounded"
                            >
                              {w.members.map((m) => (
                                <option key={m.id} value={m.id}>
                                  {m.displayName}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label className="text-[11px] font-bold text-slate-700 block">
                            Target due date
                            <input
                              name="due"
                              type="date"
                              required
                              defaultValue={defaultDue}
                              min={today}
                              className="w-full mt-1 p-1.5 text-xs border border-slate-200 rounded"
                            />
                          </label>
                          <div className="flex gap-2 pt-1">
                            <button className="flex-1 px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded">
                              Commit Action
                            </button>
                            <button
                              type="button"
                              onClick={() => setActing("")}
                              className="px-3 py-1.5 border border-slate-200 text-slate-600 text-xs rounded"
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      ) : (
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => setDrillingKpiId(p.kpi.id)}
                            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                          >
                            Drill
                          </button>
                          <button
                            type="button"
                            onClick={() => setActing(p.result.id)}
                            className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <span>Assign Action</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {(attentionTier === "all" || attentionTier === "monitor") && (
            <div className="p-4 sm:p-5 space-y-3 bg-amber-50/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span className="text-xs font-black uppercase tracking-wider text-amber-800">
                    Tier 2: Monitor
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-mono">
                    {monitorItems.length} Tracking
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 hidden sm:inline">
                  Metrics showing negative momentum or awaiting new inputs
                </span>
              </div>

              {monitorItems.length === 0 ? (
                <div className="p-4 rounded-lg border border-amber-100 bg-white text-center text-xs text-slate-500">
                  No intermediate items under watch.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {monitorItems.map((p) => (
                    <div
                      key={p.result.id}
                      className="p-3.5 sm:p-4 rounded-xl border border-slate-200 border-l-4 border-l-amber-500 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <StatusBadge status="warning" size="sm" />
                          <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded font-mono">
                            {p.unitName}
                          </span>
                          <span className="text-[11px] font-mono text-slate-500">
                            Current: {p.display} {p.change ? `(${p.change})` : ""}
                          </span>
                        </div>
                        <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                          {p.kpi.name}
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => setDrillingKpiId(p.kpi.id)}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer shrink-0"
                      >
                        Inspect Telemetry
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {(attentionTier === "all" || attentionTier === "on-track") && (
            <div className="p-4 sm:p-5 space-y-3 bg-emerald-50/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="text-xs font-black uppercase tracking-wider text-emerald-800">
                    Tier 3: On Track
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-mono">
                    {onTrackItems.length} Meeting Target
                  </span>
                </div>
              </div>

              {onTrackItems.length === 0 ? (
                <div className="p-4 rounded-lg border border-emerald-100 bg-white text-center text-xs text-slate-500">
                  No metrics currently scored as on-target.
                </div>
              ) : (
                <div className="space-y-2">
                  {onTrackItems.map((p) => (
                    <div
                      key={p.result.id}
                      className="p-3 rounded-lg border border-emerald-200 bg-white flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <div>
                          <strong className="text-xs text-slate-900">
                            {p.kpi.name}
                          </strong>
                          <span className="text-xs text-slate-500 ml-2">
                            {p.display} (Target:{" "}
                            {p.result.target !== null
                              ? formatKpiValue(p.result.target, p.kpi.unit)
                              : "None"}
                            )
                          </span>
                        </div>
                      </div>
                      <StatusBadge status="Approved" size="sm" label="On Target" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ─── 5. Two-Column Grid: Units Health & Priority Tasks ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Units / Facilities Health (2 cols) */}
        <section
          className="lg:col-span-2 bg-white rounded-xl border border-slate-200/90 shadow-2xs p-4 sm:p-5 space-y-4"
          aria-label="Unit Operations Health"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-md bg-blue-100 text-blue-700">
                <Building2 className="w-4 h-4" />
              </span>
              <h2 className="text-sm font-bold text-slate-900">
                Facility & Organization Unit Operations
              </h2>
            </div>
            <button
              onClick={() => goto("Units")}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800"
            >
              View all {w.units.length} units →
            </button>
          </div>

          <div className="space-y-3">
            {w.units.map((u) => {
              const unitKp = points.filter((p) => p.unitId === u.id);
              const goodCount = unitKp.filter((p) => p.onTarget === true).length;
              const totalCount = unitKp.length;
              const pct = totalCount > 0 ? Math.round((goodCount / totalCount) * 100) : 100;

              return (
                <div
                  key={u.id}
                  className="p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 transition-all bg-slate-50/40"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{u.name}</h4>
                      <span className="text-[10px] text-slate-400 capitalize">
                        {u.kind} · {totalCount} monitored metrics
                      </span>
                    </div>
                    <span className="text-xs font-bold font-mono text-slate-700">
                      {pct}% On Track
                    </span>
                  </div>

                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        pct < 50
                          ? "bg-rose-500"
                          : pct < 80
                          ? "bg-amber-500"
                          : "bg-emerald-500"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Priority Tasks (1 col) */}
        <section
          className="lg:col-span-1 bg-white rounded-xl border border-slate-200/90 shadow-2xs p-4 sm:p-5 space-y-4"
          aria-label="Priority Tasks"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-md bg-amber-100 text-amber-700">
                <CheckSquare className="w-4 h-4" />
              </span>
              <h2 className="text-sm font-bold text-slate-900">Priority Tasks</h2>
            </div>
            <span className="text-xs font-mono text-slate-400">
              {w.actions.length} Total
            </span>
          </div>

          <div className="space-y-2.5">
            {w.actions.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">
                No active tasks assigned yet.
              </p>
            ) : (
              w.actions.slice(0, 5).map((a) => {
                const kpi = w.kpis.find((k) =>
                  w.results.some((r) => r.id === a.resultId && r.kpiId === k.id),
                );
                return (
                  <div
                    key={a.id}
                    onClick={() =>
                      setActiveModalAction({
                        id: a.id,
                        title: a.title,
                        resultId: a.resultId,
                        assigneeId: a.assigneeId,
                        dueDate: a.dueDate,
                        state: a.state,
                        version: a.version,
                        kpiName: kpi?.name,
                      })
                    }
                    className="p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 truncate">
                        {a.title}
                      </h4>
                      <StatusBadge status={a.state} size="sm" />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                      <span>Due: {a.dueDate}</span>
                      <span className="text-blue-600 font-semibold group-hover:underline">
                        Review Memo →
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <button
            onClick={() => goto("Actions")}
            className="w-full py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Open Full Decision Queue
          </button>
        </section>
      </div>

      {/* ─── Global Modals: DrillPanel & ApprovalModal ─── */}
      <DrillPanel
        kpiId={drillingKpiId}
        workspace={w}
        onClose={() => setDrillingKpiId(null)}
        onAskKpi={(kpiName) => ask(`Tell me about ${kpiName}`)}
      />

      <ApprovalModal
        action={activeModalAction}
        workspace={w}
        onClose={() => setActiveModalAction(null)}
        onApprove={handleApproveAction}
        onReject={handleRejectAction}
        onRequestRevisions={handleRevisionsAction}
      />
    </div>
  );
}
