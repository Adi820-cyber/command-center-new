import type { Formula } from "@orbit/contracts";

export type Direction = "higher" | "lower" | "neutral";

/** A reported input. One measure is shared by every KPI that needs it. */
export interface CatalogMeasure {
  key: string;
  name: string;
  /** Base unit: currency, count, hours, days, units, and so on. */
  unit: string;
  description: string;
  /** Whether a parent unit can be calculated by adding up its children. */
  rollsUp: boolean;
  domain: string;
}

export interface CatalogKpi {
  /** Stable id such as FIN-012. Never reused. */
  id: string;
  name: string;
  description: string;
  domain: string;
  /** Industries this KPI suits. `*` means every industry. */
  industries: readonly string[];
  /** Formula in text syntax, for display and editing. */
  formulaText: string;
  formula: Formula;
  /** Derived from the formula and the measure units. */
  unit: string;
  direction: Direction;
  /** Measures the KPI reads, base keys only. */
  measures: readonly string[];
  /** True when the formula compares against an earlier period. */
  needsHistory: boolean;
  /** Pages the definition was checked against. */
  sources: readonly string[];
  /** "top": calculated only for the whole organization (the unit without a parent). */
  scope: "all" | "top";
}

export interface DomainSource {
  /** Domain key, for example `finance`. */
  domain: string;
  title: string;
  /** Industries the KPIs suit; `*` for all. */
  industries: readonly string[];
  /** Pages the definitions were checked against. Definitions still vary by company. */
  sources: readonly string[];
  /**
   * One measure per line: `key | name | unit | description [| no-rollup]`.
   */
  measures: string;
  /**
   * One KPI per line: `ID | name | formula | direction | description [| top]`.
   * `top` marks a KPI measured for the whole organization only.
   */
  kpis: string;
}

export interface TemplateRole {
  key: string;
  name: string;
  description: string;
  /** Platform capabilities the role holds. Viewing is granted per KPI below. */
  capabilities: readonly ("configure" | "submit" | "approve" | "act")[];
  /** KPI ids the role sees, in dashboard order. */
  kpis: readonly string[];
}

export interface CatalogTemplate {
  id: string;
  name: string;
  industry: string;
  description: string;
  roles: readonly TemplateRole[];
}
