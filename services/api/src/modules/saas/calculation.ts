import { randomUUID } from "node:crypto";
import {
  FormulaSchema,
  formulaMeasureKeys,
  formulaRefs,
  type PeriodRef,
} from "@orbit/contracts";
import type { Tx } from "../../db/client.ts";
import { calculate, onTarget } from "./engine.ts";
import { daysInPeriod, shiftPeriod, type Period } from "./periods.ts";

interface MeasureValue {
  value: string;
  inputIds: string[];
  origins: string[];
}
type Values = ReadonlyMap<string, MeasureValue>;

const SHIFT: Record<Exclude<PeriodRef, "current">, "previous" | "year_ago"> = {
  previous: "previous",
  year_ago: "year_ago",
};

/**
 * Calculates every active KPI for one unit and period, publishes the results,
 * and returns how many it stored.
 *
 * Inputs come from `kpi.rollup_inputs`: the unit's own approved figures, or the
 * sum of the units beneath it. KPIs that compare with an earlier period also
 * read that period's figures. A KPI none of whose inputs were reported is
 * skipped rather than filled with "missing" noise.
 */
async function calculateUnit(
  tx: Tx,
  tenant: string,
  source: string,
  target: string,
  period: Period,
  definitions: readonly Record<string, unknown>[],
): Promise<number> {
  const load = async (p: Period): Promise<Values> => {
    const rows = await tx.query(
      "select measure,value,input_ids,origins from kpi.rollup_inputs($1::uuid,$2::uuid,$3::uuid,$4::date,$5::date)",
      [tenant, source, target, p.start, p.end],
    );
    return new Map(
      rows.map((row) => [
        String(row.measure),
        {
          value: String(row.value),
          inputIds: (row.input_ids as string[] | null) ?? [],
          origins: (row.origins as string[] | null) ?? [],
        },
      ]),
    );
  };

  const current = await load(period);
  if (current.size === 0) return 0;
  const earlier = new Map<PeriodRef, Values>();
  const earlierValues = async (ref: Exclude<PeriodRef, "current">) => {
    let values = earlier.get(ref);
    if (!values) {
      values = await load(shiftPeriod(period, SHIFT[ref]));
      earlier.set(ref, values);
    }
    return values;
  };

  const run = randomUUID();
  let stored = 0;
  for (const def of definitions) {
    const formula = FormulaSchema.parse(def.formula);
    const keys = formulaMeasureKeys(formula);
    if (!keys.some((key) => current.has(key))) continue;

    const values = new Map<string, string>();
    const inputIds = new Set<string>();
    const origins = new Set<string>();
    const take = (ref: string, from: MeasureValue | undefined) => {
      if (!from) return;
      values.set(ref, from.value);
      for (const id of from.inputIds) inputIds.add(id);
      for (const origin of from.origins) origins.add(origin);
    };
    for (const ref of formulaRefs(formula)) {
      const [key = "", suffix] = ref.split("@");
      const set = suffix ? await earlierValues(suffix as Exclude<PeriodRef, "current">) : current;
      take(ref, set.get(key));
    }

    const value = calculate(formula, values, { periodDays: daysInPeriod(period) });
    const targetValue = typeof def.target === "string" ? def.target : null;
    await tx.query(
      "select kpi.publish_result($1::uuid,$2::uuid,$3::uuid,$4::uuid,$5::date,$6::date,$7::text::jsonb,$8::uuid[],$9::text[],$10::numeric,$11::text,$12::boolean,$13::uuid)",
      [
        tenant,
        source,
        target,
        String(def.id),
        period.start,
        period.end,
        JSON.stringify(value),
        `{${[...inputIds].join(",")}}`,
        `{${[...origins].join(",")}}`,
        targetValue,
        String(def.direction),
        onTarget(value, targetValue, String(def.direction)),
        run,
      ],
    );
    stored++;
  }
  return stored;
}

/**
 * After a batch is approved, brings every result it can affect up to date:
 *
 *  - the unit itself and every parent above it, because a parent adds up its
 *    children;
 *  - the same period, the next period and the same period next year, because
 *    "growth versus last period" in those periods now has something to compare
 *    with. A later period is only recalculated if it has figures of its own.
 */
export async function recalculateAfterApproval(
  tx: Tx,
  tenant: string,
  source: string,
  period: Period,
): Promise<{ calculated: number; units: number }> {
  const definitions = await tx.query(
    "select id,formula,target,direction from kpi.calculation_definitions($1::uuid,$2::uuid)",
    [tenant, source],
  );
  const chain = (await tx.query("select kpi.unit_chain($1::uuid,$2::uuid) as id", [tenant, source])).map(
    (row) => String(row.id),
  );
  const periods = [period, shiftPeriod(period, "next"), shiftPeriod(period, "year_after")];
  let calculated = 0;
  for (const target of chain)
    for (const p of periods)
      calculated += await calculateUnit(tx, tenant, source, target, p, definitions);
  return { calculated, units: chain.length };
}
