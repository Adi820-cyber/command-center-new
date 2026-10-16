import { z } from "zod";

/**
 * KPI formula language, version 2.
 *
 * A formula is a small tree. It is data, never code: nothing here can run
 * arbitrary logic, so a customer-defined KPI can be calculated safely.
 *
 *   measure       a reported input, optionally from an earlier period
 *   constant      a decimal number
 *   period_days   the number of days in the reporting period
 *   abs           absolute value
 *   add subtract multiply divide percent min max
 *
 * `percent(a, b)` is `a / b * 100`. A zero denominator makes the result "not
 * applicable". A missing input makes the result "missing".
 *
 * Text syntax (see `parseFormula`): `pct(revenue - cogs, revenue)`,
 * `revenue / period_days`, `pct(revenue - revenue@prev, revenue@prev)`.
 */

export const DecimalSchema = z
  .string()
  .regex(/^-?(?:0|[1-9]\d{0,19})(?:\.\d{1,10})?$/);
export const MeasureKeySchema = z.string().regex(/^[a-z][a-z0-9_]{0,63}$/);

export const PERIOD_REFS = ["current", "previous", "year_ago"] as const;
export type PeriodRef = (typeof PERIOD_REFS)[number];

export const BINARY_OPS = [
  "add",
  "subtract",
  "multiply",
  "divide",
  "percent",
  "min",
  "max",
] as const;
export type BinaryOp = (typeof BINARY_OPS)[number];

export type Formula =
  | { op: "measure"; key: string; period?: PeriodRef }
  | { op: "constant"; value: string }
  | { op: "period_days" }
  | { op: "abs"; arg: Formula }
  | { op: BinaryOp; left: Formula; right: Formula };

/** Reserved word: the number of days in the reporting period. */
export const PERIOD_DAYS_WORD = "period_days";

// Check depth/node count before recursive schema parsing, including hostile API input.
function bounded(value: unknown): boolean {
  const queue: { value: unknown; depth: number }[] = [{ value, depth: 0 }];
  let count = 0;
  while (queue.length) {
    const node = queue.pop()!;
    if (++count > 63 || node.depth > 8) return false;
    if (node.value && typeof node.value === "object") {
      for (const child of ["left", "right", "arg"] as const) {
        if (child in node.value)
          queue.push({
            value: Reflect.get(node.value, child),
            depth: node.depth + 1,
          });
      }
    }
  }
  return true;
}

const ExpressionSchema: z.ZodType<Formula> = z.lazy(() =>
  z.union([
    z.strictObject({
      op: z.literal("measure"),
      key: MeasureKeySchema,
      period: z.enum(PERIOD_REFS).optional(),
    }),
    z.strictObject({ op: z.literal("constant"), value: DecimalSchema }),
    z.strictObject({ op: z.literal("period_days") }),
    z.strictObject({ op: z.literal("abs"), arg: ExpressionSchema }),
    z.strictObject({
      op: z.enum(BINARY_OPS),
      left: ExpressionSchema,
      right: ExpressionSchema,
    }),
  ]),
);
export const FormulaSchema = z
  .unknown()
  .refine(bounded, "Formula exceeds complexity limit")
  .pipe(ExpressionSchema);

// ---------------------------------------------------------------------------
// References
// ---------------------------------------------------------------------------

/** `revenue`, `revenue@previous`, `revenue@year_ago`: the key used to look a value up. */
export const refKey = (key: string, period: PeriodRef = "current") =>
  period === "current" ? key : `${key}@${period}`;

/** Every measure reference in the formula, de-duplicated, period included. */
export function formulaRefs(formula: Formula): string[] {
  const out = new Set<string>();
  const walk = (node: Formula): void => {
    switch (node.op) {
      case "measure":
        out.add(refKey(node.key, node.period));
        return;
      case "constant":
      case "period_days":
        return;
      case "abs":
        walk(node.arg);
        return;
      default:
        walk(node.left);
        walk(node.right);
    }
  };
  walk(formula);
  return [...out];
}

/** Base measure keys the formula depends on, whatever period they are read from. */
export const formulaMeasureKeys = (formula: Formula): string[] => [
  ...new Set(formulaRefs(formula).map((ref) => ref.split("@")[0]!)),
];

/** The extra periods a formula reads, so callers know which to fetch. */
export function formulaPeriods(formula: Formula): Set<PeriodRef> {
  const periods = new Set<PeriodRef>();
  for (const ref of formulaRefs(formula)) {
    const suffix = ref.split("@")[1];
    if (suffix === "previous" || suffix === "year_ago") periods.add(suffix);
  }
  return periods;
}

// ---------------------------------------------------------------------------
// Units
// ---------------------------------------------------------------------------

/** Dimension algebra: exponent per base unit. A dimensionless value has no entries. */
type Dimension = Map<string, number>;

function dimensionOf(unit: string): Dimension {
  const dimension: Dimension = new Map();
  if (unit === "1" || unit === "") return dimension;
  const [numerator = "", denominator = ""] = unit.split("/");
  for (const [part, sign] of [
    [numerator, 1],
    [denominator, -1],
  ] as const) {
    for (const atom of part.split("*")) {
      if (atom && atom !== "1")
        dimension.set(atom, (dimension.get(atom) ?? 0) + sign);
    }
  }
  return dimension;
}
function combine(a: Dimension, b: Dimension, sign: 1 | -1): Dimension {
  const out = new Map(a);
  for (const [atom, power] of b) out.set(atom, (out.get(atom) ?? 0) + sign * power);
  for (const [atom, power] of out) if (power === 0) out.delete(atom);
  return out;
}
function render(dimension: Dimension): string {
  const top: string[] = [];
  const bottom: string[] = [];
  for (const [atom, power] of [...dimension].sort(([x], [y]) => x.localeCompare(y))) {
    for (let i = 0; i < Math.abs(power); i++) (power > 0 ? top : bottom).push(atom);
  }
  if (!top.length && !bottom.length) return "1";
  return `${top.join("*") || "1"}${bottom.length ? `/${bottom.join("*")}` : ""}`;
}
const sameDimension = (a: Dimension, b: Dimension) =>
  render(a) === render(b);

/**
 * The unit a formula produces, or an Error when it makes no sense (adding
 * currency to a count, a percentage of two different units). KPI definitions
 * must declare exactly this unit.
 */
export function formulaUnit(
  formula: Formula,
  units: ReadonlyMap<string, string>,
): string {
  return render(dimension(formula, units));
}
function dimension(node: Formula, units: ReadonlyMap<string, string>): Dimension {
  switch (node.op) {
    case "constant":
      return new Map();
    case "period_days":
      return dimensionOf("days");
    case "measure": {
      const unit = units.get(node.key);
      if (!unit) throw new Error(`Unknown measure: ${node.key}`);
      return dimensionOf(unit);
    }
    case "abs":
      return dimension(node.arg, units);
    default: {
      const a = dimension(node.left, units);
      const b = dimension(node.right, units);
      const constantSide =
        node.left.op === "constant" || node.right.op === "constant";
      switch (node.op) {
        case "add":
        case "subtract":
          if (!sameDimension(a, b))
            throw new Error("Addition and subtraction require matching units.");
          return a;
        case "min":
        case "max":
          // A constant works as a floor or cap for any unit.
          if (constantSide) return node.left.op === "constant" ? b : a;
          if (!sameDimension(a, b))
            throw new Error("min and max require matching units.");
          return a;
        case "percent":
          if (!sameDimension(a, b))
            throw new Error(
              "A percentage requires numerator and denominator in the same unit.",
            );
          return dimensionOf("%");
        case "divide":
          return combine(a, b, -1);
        case "multiply":
          return combine(a, b, 1);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Text syntax
// ---------------------------------------------------------------------------

const FUNCTIONS: Record<string, BinaryOp | "abs"> = {
  add: "add",
  sub: "subtract",
  mul: "multiply",
  div: "divide",
  pct: "percent",
  min: "min",
  max: "max",
  abs: "abs",
};
const PERIOD_SUFFIX: Record<string, PeriodRef> = {
  prev: "previous",
  previous: "previous",
  yoy: "year_ago",
  year_ago: "year_ago",
};

export class FormulaSyntaxError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FormulaSyntaxError";
  }
}

type Token =
  | { t: "num"; v: string }
  | { t: "id"; v: string }
  | { t: "sym"; v: string };

function tokenize(text: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < text.length) {
    const c = text[i]!;
    if (/\s/.test(c)) {
      i++;
    } else if (/[0-9]/.test(c) || (c === "." && /[0-9]/.test(text[i + 1] ?? ""))) {
      const m = /^[0-9]*\.?[0-9]+/.exec(text.slice(i))!;
      tokens.push({ t: "num", v: m[0] });
      i += m[0].length;
    } else if (/[a-z_]/.test(c)) {
      const m = /^[a-z_][a-z0-9_]*(?:@[a-z_]+)?/.exec(text.slice(i));
      if (!m) throw new FormulaSyntaxError(`Unexpected "${c}".`);
      tokens.push({ t: "id", v: m[0] });
      i += m[0].length;
    } else if ("+-*/(),".includes(c)) {
      tokens.push({ t: "sym", v: c });
      i++;
    } else {
      throw new FormulaSyntaxError(
        /[A-Z]/.test(c)
          ? "Use lower-case measure keys, for example revenue_total."
          : `Unexpected "${c}".`,
      );
    }
  }
  return tokens;
}

/**
 * Parses the text syntax into a formula tree and validates it against the
 * schema. Throws FormulaSyntaxError with a message a customer can act on.
 */
export function parseFormula(text: string): Formula {
  const tokens = tokenize(text);
  let at = 0;
  const peek = () => tokens[at];
  const take = () => tokens[at++];
  const isSym = (v: string) => {
    const token = peek();
    return token?.t === "sym" && token.v === v;
  };
  const expect = (v: string) => {
    if (!isSym(v)) throw new FormulaSyntaxError(`Expected "${v}".`);
    at++;
  };

  function expression(): Formula {
    let left = term();
    while (isSym("+") || isSym("-")) {
      const op = take()!.v === "+" ? "add" : "subtract";
      left = { op, left, right: term() };
    }
    return left;
  }
  function term(): Formula {
    let left = factor();
    while (isSym("*") || isSym("/")) {
      const op = take()!.v === "*" ? "multiply" : "divide";
      left = { op, left, right: factor() };
    }
    return left;
  }
  function factor(): Formula {
    const token = take();
    if (!token) throw new FormulaSyntaxError("The formula ends too early.");
    if (token.t === "num") return { op: "constant", value: token.v };
    if (token.t === "sym") {
      if (token.v === "(") {
        const inner = expression();
        expect(")");
        return inner;
      }
      if (token.v === "-")
        return { op: "subtract", left: { op: "constant", value: "0" }, right: factor() };
      throw new FormulaSyntaxError(`Unexpected "${token.v}".`);
    }
    const [name = "", suffix] = token.v.split("@");
    if (isSym("(") && suffix === undefined) {
      const fn = FUNCTIONS[name];
      if (!fn)
        throw new FormulaSyntaxError(
          `Unknown function "${name}". Use pct, min, max, abs, add, sub, mul or div.`,
        );
      take();
      const args: Formula[] = [expression()];
      while (isSym(",")) {
        take();
        args.push(expression());
      }
      expect(")");
      if (fn === "abs") {
        if (args.length !== 1) throw new FormulaSyntaxError("abs takes one value.");
        return { op: "abs", arg: args[0]! };
      }
      if (args.length !== 2)
        throw new FormulaSyntaxError(`${name} takes exactly two values.`);
      return { op: fn, left: args[0]!, right: args[1]! };
    }
    if (name === PERIOD_DAYS_WORD && suffix === undefined) return { op: "period_days" };
    if (suffix !== undefined) {
      const period = PERIOD_SUFFIX[suffix];
      if (!period)
        throw new FormulaSyntaxError(`Unknown period "@${suffix}". Use @prev or @yoy.`);
      return { op: "measure", key: name, period };
    }
    return { op: "measure", key: name };
  }

  if (!tokens.length) throw new FormulaSyntaxError("Enter a formula.");
  const tree = expression();
  if (at < tokens.length) throw new FormulaSyntaxError("Unexpected text after the formula.");
  const parsed = FormulaSchema.safeParse(tree);
  if (!parsed.success)
    throw new FormulaSyntaxError(
      parsed.error.issues[0]?.message ?? "The formula is not valid.",
    );
  return parsed.data;
}

const PRECEDENCE: Partial<Record<Formula["op"], number>> = {
  add: 1,
  subtract: 1,
  multiply: 2,
  divide: 2,
};
const SYMBOL: Partial<Record<Formula["op"], string>> = {
  add: "+",
  subtract: "-",
  multiply: "*",
  divide: "/",
};
const SUFFIX_OF: Record<PeriodRef, string> = { current: "", previous: "@prev", year_ago: "@yoy" };

/** Canonical text for a formula; `parseFormula(formatFormula(f))` gives `f` back. */
export function formatFormula(node: Formula, parent = 0, right = false): string {
  switch (node.op) {
    case "constant":
      return node.value;
    case "period_days":
      return PERIOD_DAYS_WORD;
    case "measure":
      return `${node.key}${SUFFIX_OF[node.period ?? "current"]}`;
    case "abs":
      return `abs(${formatFormula(node.arg)})`;
    case "percent":
    case "min":
    case "max":
      return `${node.op === "percent" ? "pct" : node.op}(${formatFormula(node.left)}, ${formatFormula(node.right)})`;
    default: {
      const own = PRECEDENCE[node.op]!;
      const text = `${formatFormula(node.left, own)} ${SYMBOL[node.op]} ${formatFormula(node.right, own, true)}`;
      return own < parent || (own === parent && right) ? `(${text})` : text;
    }
  }
}
