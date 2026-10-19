import {
  formulaMeasureKeys,
  formulaPeriods,
  formulaUnit,
  parseFormula,
} from "@orbit/contracts";
import type {
  CatalogKpi,
  CatalogMeasure,
  Direction,
  DomainSource,
} from "./types.ts";

const DIRECTIONS: readonly Direction[] = ["higher", "lower", "neutral"];
const KEY = /^[a-z][a-z0-9_]{0,63}$/;
const UNIT = /^[a-z][a-z_]*$/;
const ID = /^[A-Z]{2,4}-\d{3}$/;

export interface BuiltCatalog {
  measures: CatalogMeasure[];
  kpis: CatalogKpi[];
}

const lines = (text: string) =>
  text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"));

/**
 * Turns the hand-written domain text into typed measures and KPIs.
 *
 * Every mistake is collected and reported together, so one run shows the
 * whole list to fix. The same checks run in the test suite and before the
 * database seed is generated.
 */
export function buildCatalog(domains: readonly DomainSource[]): BuiltCatalog {
  const errors: string[] = [];
  const measures = new Map<string, CatalogMeasure>();
  const kpis: CatalogKpi[] = [];
  const ids = new Set<string>();

  for (const domain of domains) {
    for (const line of lines(domain.measures)) {
      const [key = "", name = "", unit = "", description = "", flag = ""] = line
        .split("|")
        .map((part) => part.trim());
      const where = `${domain.domain} measure "${key}"`;
      if (!KEY.test(key)) errors.push(`${where}: key must be lower_snake_case.`);
      if (key === "period_days") errors.push(`${where}: reserved word.`);
      if (!name) errors.push(`${where}: missing name.`);
      if (!UNIT.test(unit)) errors.push(`${where}: unit "${unit}" is not a single base unit.`);
      if (!description) errors.push(`${where}: missing description.`);
      if (flag && flag !== "no-rollup") errors.push(`${where}: unknown flag "${flag}".`);
      if (measures.has(key)) errors.push(`${where}: defined twice.`);
      measures.set(key, {
        key,
        name,
        unit,
        description,
        rollsUp: flag !== "no-rollup",
        domain: domain.domain,
      });
    }
  }

  const unitOf = new Map([...measures].map(([key, m]) => [key, m.unit]));
  for (const domain of domains) {
    for (const line of lines(domain.kpis)) {
      const [id = "", name = "", formulaText = "", direction = "", description = "", flag = ""] = line
        .split("|")
        .map((part) => part.trim());
      const where = `${id || "(no id)"} ${name}`;
      if (!ID.test(id)) errors.push(`${where}: id must look like FIN-001.`);
      if (flag && flag !== "top") errors.push(`${where}: unknown flag "${flag}".`);
      if (ids.has(id)) errors.push(`${where}: duplicate id.`);
      ids.add(id);
      if (!name) errors.push(`${where}: missing name.`);
      if (!description) errors.push(`${where}: missing description.`);
      if (!DIRECTIONS.includes(direction as Direction))
        errors.push(`${where}: direction "${direction}" must be higher, lower or neutral.`);
      try {
        const formula = parseFormula(formulaText);
        const used = formulaMeasureKeys(formula);
        const unknown = used.filter((key) => !measures.has(key));
        if (unknown.length) {
          errors.push(`${where}: unknown measures ${unknown.join(", ")}.`);
          continue;
        }
        kpis.push({
          id,
          name,
          description,
          domain: domain.domain,
          industries: domain.industries,
          formulaText,
          formula,
          unit: formulaUnit(formula, unitOf),
          direction: direction as Direction,
          measures: used,
          needsHistory: formulaPeriods(formula).size > 0,
          sources: domain.sources,
          scope: flag === "top" ? "top" : "all",
        });
      } catch (error) {
        errors.push(`${where}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  const used = new Set(kpis.flatMap((kpi) => kpi.measures));
  for (const key of measures.keys())
    if (!used.has(key)) errors.push(`measure "${key}" is not used by any KPI.`);

  if (errors.length)
    throw new Error(`The KPI catalog has ${errors.length} problem(s):\n${errors.join("\n")}`);
  return { measures: [...measures.values()], kpis };
}
