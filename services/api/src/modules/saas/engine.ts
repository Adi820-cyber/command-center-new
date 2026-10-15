import {
  FormulaSchema,
  type Formula,
  type CalculationValue,
} from "@orbit/contracts";

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
export function measureKeys(formula: Formula): string[] {
  if (formula.op === "measure") return [formula.key];
  if (formula.op === "constant") return [];
  return [
    ...new Set([...measureKeys(formula.left), ...measureKeys(formula.right)]),
  ];
}
export function calculate(
  raw: unknown,
  values: ReadonlyMap<string, string>,
): CalculationValue {
  const formula = FormulaSchema.parse(raw);
  const missing = measureKeys(formula).filter((key) => !values.has(key));
  if (missing.length) return { status: "missing", measures: missing };
  function visit(node: Formula): Fraction | null {
    if (node.op === "constant") return decimal(node.value);
    if (node.op === "measure") return decimal(values.get(node.key)!);
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
  const a = decimal(value.value);
  const b = decimal(target);
  const diff = a.n * b.d - b.n * a.d;
  return direction === "higher" ? diff >= 0n : diff <= 0n;
}

/** Unit algebra: addition requires like units; percent requires like dimensions. */
export function formulaUnit(
  formula: Formula,
  units: ReadonlyMap<string, string>,
): string {
  if (formula.op === "constant") return "1";
  if (formula.op === "measure") {
    const unit = units.get(formula.key);
    if (!unit) throw new Error(`Unknown measure: ${formula.key}`);
    return unit;
  }
  const a = formulaUnit(formula.left, units),
    b = formulaUnit(formula.right, units);
  if (formula.op === "add" || formula.op === "subtract") {
    if (a !== b)
      throw new Error("Addition and subtraction require matching units.");
    return a;
  }
  if (formula.op === "percent") {
    if (a !== b)
      throw new Error(
        "A percentage requires numerator and denominator in the same unit.",
      );
    return "%";
  }
  if (formula.op === "divide")
    return a === b ? "1" : b === "1" ? a : `${a}/${b}`;
  return a === "1" ? b : b === "1" ? a : `${a}*${b}`;
}
