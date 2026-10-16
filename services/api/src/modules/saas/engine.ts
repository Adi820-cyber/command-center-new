import {
  FormulaSchema,
  formulaRefs,
  refKey,
  type Formula,
  type CalculationValue,
} from "@orbit/contracts";

/**
 * Exact decimal arithmetic for KPI formulas.
 *
 * Every value is a fraction of two BigInts, so `0.1 + 0.2` is exactly `0.3`
 * and a long chain of operations never drifts. Results are rounded once, at
 * the end, to ten decimal places.
 */
type Fraction = { n: bigint; d: bigint };
function gcd(a: bigint, b: bigint): bigint {
  a = a < 0n ? -a : a;
  while (b) {
    const t = b;
    b = a % b;
    a = t;
  }
  return a || 1n;
}
function fraction(n: bigint, d: bigint): Fraction {
  const sign = d < 0n ? -1n : 1n;
  const g = gcd(n, d < 0n ? -d : d);
  return { n: (sign * n) / g, d: (sign * d) / g };
}
function decimal(value: string): Fraction {
  const [whole = "0", digits = ""] = value.split(".");
  return fraction(BigInt(whole + digits), 10n ** BigInt(digits.length));
}
function render(v: Fraction): string {
  const scale = 10n ** 10n;
  const negative = v.n < 0n;
  const n = negative ? -v.n : v.n;
  const rounded = (n * scale * 2n + v.d) / (2n * v.d);
  const whole = rounded / scale;
  const tail = (rounded % scale)
    .toString()
    .padStart(10, "0")
    .replace(/0+$/, "");
  return `${negative && rounded ? "-" : ""}${whole}${tail ? "." + tail : ""}`;
}
/** -1, 0 or 1. Denominators are always positive. */
const compare = (a: Fraction, b: Fraction): number => {
  const diff = a.n * b.d - b.n * a.d;
  return diff < 0n ? -1 : diff > 0n ? 1 : 0;
};

/** Base measure keys a formula reads, whatever period they come from. */
export { formulaMeasureKeys as measureKeys } from "@orbit/contracts";

export interface CalculationContext {
  /** Days in the reporting period, for `period_days`. */
  periodDays: number;
}

/**
 * Evaluates a formula. `values` maps a reference (`revenue`,
 * `revenue@previous`, `revenue@year_ago`) to a decimal string. Any reference
 * that is absent makes the result "missing"; a zero denominator makes it
 * "not applicable".
 */
export function calculate(
  raw: unknown,
  values: ReadonlyMap<string, string>,
  context: CalculationContext = { periodDays: 30 },
): CalculationValue {
  const formula = FormulaSchema.parse(raw);
  const missing = formulaRefs(formula).filter((ref) => !values.has(ref));
  if (missing.length) return { status: "missing", measures: missing };

  function visit(node: Formula): Fraction | null {
    switch (node.op) {
      case "constant":
        return decimal(node.value);
      case "period_days":
        return fraction(BigInt(context.periodDays), 1n);
      case "measure":
        return decimal(values.get(refKey(node.key, node.period))!);
      case "abs": {
        const a = visit(node.arg);
        return a && { n: a.n < 0n ? -a.n : a.n, d: a.d };
      }
    }
    const a = visit(node.left);
    const b = visit(node.right);
    if (!a || !b) return null;
    switch (node.op) {
      case "add":
        return fraction(a.n * b.d + b.n * a.d, a.d * b.d);
      case "subtract":
        return fraction(a.n * b.d - b.n * a.d, a.d * b.d);
      case "multiply":
        return fraction(a.n * b.n, a.d * b.d);
      case "min":
        return compare(a, b) <= 0 ? a : b;
      case "max":
        return compare(a, b) >= 0 ? a : b;
      case "divide":
      case "percent":
        return b.n === 0n
          ? null
          : fraction(
              a.n * b.d * (node.op === "percent" ? 100n : 1n),
              a.d * b.n,
            );
      default:
        throw new Error("Unsupported formula operator.");
    }
  }
  const result = visit(formula);
  return result
    ? { status: "available", value: render(result) }
    : { status: "not_applicable", reason: "zero_denominator" };
}

export function onTarget(
  value: CalculationValue,
  target: string | null,
  direction: string,
): boolean | null {
  if (
    value.status !== "available" ||
    target === null ||
    direction === "neutral"
  )
    return null;
  const diff = compare(decimal(value.value), decimal(target));
  return direction === "higher" ? diff >= 0 : diff <= 0;
}
