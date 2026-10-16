import { changeTone, formatKpiValue, periodLabel, type Tone } from "./format.ts";
import type { SaasWorkspace } from "./saas.ts";

type Kpi = SaasWorkspace["kpis"][number];
type Result = SaasWorkspace["results"][number];
type Action = SaasWorkspace["actions"][number];

/** The latest calculated figure for one KPI in one unit, with its context. */
export interface KpiPoint {
  kpi: Kpi;
  unitId: string;
  unitName: string;
  result: Result;
  previous: Result | null;
  /** Null unless the value could be calculated. */
  number: number | null;
  /** Ready to show: `26.19%`, or why it could not be calculated. */
  display: string;
  period: string;
  /** For example `+1.20 points vs Aug 2026`. Null without an earlier figure. */
  change: string | null;
  changeTone: Tone;
  /** Good, bad or neutral: target first, then movement. */
  tone: Tone;
  onTarget: boolean | null;
}

const fmt = (n: number, digits: number) =>
  new Intl.NumberFormat("en-IN", { maximumFractionDigits: digits }).format(n);
const numberOf = (result: Result | null): number | null =>
  result && result.value.status === "available" ? Number(result.value.value) : null;

function describeChange(kpi: Kpi, current: number | null, previous: Result | null): string | null {
  const before = numberOf(previous);
  if (current === null || before === null || !previous) return null;
  const label = periodLabel(previous.start, previous.end);
  if (kpi.unit === "%") {
    const diff = current - before;
    const text = fmt(Math.abs(diff), 2);
    return text === "0" ? `no change vs ${label}` : `${diff >= 0 ? "+" : "−"}${text} points vs ${label}`;
  }
  if (before === 0) return null;
  const pct = ((current - before) / Math.abs(before)) * 100;
  const text = fmt(Math.abs(pct), 1);
  return text === "0" ? `no change vs ${label}` : `${pct >= 0 ? "+" : "−"}${text}% vs ${label}`;
}

function displayOf(kpi: Kpi, result: Result): string {
  const value = result.value;
  if (value.status === "available") return formatKpiValue(value.value, kpi.unit);
  if (value.status === "missing") return `not calculated, missing ${value.measures.join(", ")}`;
  return "not applicable (divides by zero)";
}

/**
 * The latest figure for every active KPI and unit the member can see. The
 * previous figure is the nearest earlier period for the same KPI and unit.
 */
export function kpiPoints(workspace: SaasWorkspace): KpiPoint[] {
  const active = new Map(workspace.kpis.filter((k) => k.state === "active").map((k) => [k.id, k]));
  const unitName = new Map(workspace.units.map((u) => [u.id, u.name]));
  const groups = new Map<string, Result[]>();
  for (const result of workspace.results) {
    if (!active.has(result.kpiId)) continue;
    const key = `${result.kpiId}|${result.unitId}`;
    (groups.get(key) ?? groups.set(key, []).get(key)!).push(result);
  }
  const points: KpiPoint[] = [];
  for (const results of groups.values()) {
    results.sort((a, b) => (a.end < b.end ? 1 : a.end > b.end ? -1 : 0));
    const latest = results[0]!;
    const kpi = active.get(latest.kpiId)!;
    const previous = results.find((r) => r.end < latest.start) ?? null;
    const current = numberOf(latest);
    const before = numberOf(previous);
    const moved: Tone =
      current !== null && before !== null ? changeTone(kpi.direction, current, before) : "neutral";
    const tone: Tone = latest.onTarget === null ? moved : latest.onTarget ? "good" : "bad";
    points.push({
      kpi,
      unitId: latest.unitId,
      unitName: unitName.get(latest.unitId) ?? "Unit",
      result: latest,
      previous,
      number: current,
      display: displayOf(kpi, latest),
      period: periodLabel(latest.start, latest.end),
      change: describeChange(kpi, current, previous),
      changeTone: moved,
      tone,
      onTarget: latest.onTarget,
    });
  }
  return points.sort(
    (a, b) => a.kpi.sortOrder - b.kpi.sortOrder || a.kpi.name.localeCompare(b.kpi.name) || a.unitName.localeCompare(b.unitName),
  );
}

export interface Brief {
  /** One sentence for the top of the dashboard. */
  headline: string;
  total: number;
  onTarget: number;
  offTarget: number;
  improving: number;
  worsening: number;
  /** Strong results to celebrate. */
  wins: KpiPoint[];
  /** Results that need attention, worst first. */
  concerns: KpiPoint[];
  /** Concerns with nobody assigned yet: what to act on now. */
  actNow: KpiPoint[];
  pendingBatches: number;
  overdueActions: Action[];
}

/** The morning brief: what changed, what is off target, what needs action. */
export function buildBrief(workspace: SaasWorkspace, today: string, unitId?: string): Brief {
  const points = kpiPoints(workspace).filter((p) => !unitId || p.unitId === unitId);
  const calculated = points.filter((p) => p.number !== null);
  const onTarget = calculated.filter((p) => p.onTarget === true).length;
  const offTarget = calculated.filter((p) => p.onTarget === false).length;
  const improving = calculated.filter((p) => p.changeTone === "good").length;
  const worsening = calculated.filter((p) => p.changeTone === "bad").length;

  const gap = (p: KpiPoint): number => {
    const target = p.result.target === null ? null : Number(p.result.target);
    if (target === null || p.number === null || target === 0) return 0;
    return Math.abs((p.number - target) / target);
  };
  const concerns = calculated
    .filter((p) => p.tone === "bad")
    .sort((a, b) => (a.onTarget === false ? 0 : 1) - (b.onTarget === false ? 0 : 1) || gap(b) - gap(a))
    .slice(0, 8);
  const wins = calculated
    .filter((p) => p.tone === "good" && (p.onTarget === true || p.changeTone === "good"))
    .sort((a, b) => (a.onTarget === true ? 0 : 1) - (b.onTarget === true ? 0 : 1))
    .slice(0, 5);
  const handled = new Set(
    workspace.actions.filter((a) => a.state !== "done").map((a) => a.resultId),
  );
  const actNow = concerns.filter((p) => !handled.has(p.result.id)).slice(0, 5);
  const overdueActions = workspace.actions.filter((a) => a.state !== "done" && a.dueDate < today);
  const pendingBatches = workspace.batches.filter((b) => b.status === "submitted").length;

  const parts: string[] = [];
  if (calculated.length === 0) parts.push("No results to show yet.");
  else {
    parts.push(
      `${calculated.length} KPI result${calculated.length === 1 ? "" : "s"}: ${onTarget} on target, ${offTarget} off target.`,
    );
    if (improving || worsening) parts.push(`${improving} improving, ${worsening} getting worse.`);
  }
  if (pendingBatches) parts.push(`${pendingBatches} data upload${pendingBatches === 1 ? "" : "s"} waiting for approval.`);
  if (overdueActions.length) parts.push(`${overdueActions.length} overdue action${overdueActions.length === 1 ? "" : "s"}.`);
  return {
    headline: parts.join(" "),
    total: calculated.length,
    onTarget,
    offTarget,
    improving,
    worsening,
    wins,
    concerns,
    actNow,
    pendingBatches,
    overdueActions,
  };
}
