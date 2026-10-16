import { describe, expect, it } from "vitest";
import {
  FormulaSchema,
  FormulaSyntaxError,
  formatFormula,
  formulaMeasureKeys,
  formulaPeriods,
  formulaRefs,
  formulaUnit,
  parseFormula,
} from "./formula.ts";

const units = new Map([
  ["revenue", "currency"],
  ["cost", "currency"],
  ["tests", "count"],
  ["hours", "hours"],
]);

describe("formula text syntax", () => {
  it("parses infix arithmetic with the usual precedence", () => {
    expect(formatFormula(parseFormula("revenue - cost * 2"))).toBe("revenue - cost * 2");
    expect(parseFormula("1 + 2 * 3")).toEqual({
      op: "add",
      left: { op: "constant", value: "1" },
      right: {
        op: "multiply",
        left: { op: "constant", value: "2" },
        right: { op: "constant", value: "3" },
      },
    });
  });

  it("round-trips through the formatter", () => {
    for (const text of [
      "pct(revenue - cost, revenue)",
      "revenue / period_days",
      "pct(revenue - revenue@prev, revenue@prev)",
      "abs(revenue - cost) / tests",
      "min(revenue, 100) * (cost + 1)",
      "revenue - (cost - 3)",
      "revenue / (cost / tests)",
      "max(revenue@yoy, 0)",
    ]) {
      const tree = parseFormula(text);
      expect(parseFormula(formatFormula(tree))).toEqual(tree);
    }
  });

  it("reports clear errors", () => {
    expect(() => parseFormula("")).toThrow(FormulaSyntaxError);
    expect(() => parseFormula("revenue +")).toThrow(/ends too early/);
    expect(() => parseFormula("sqrt(revenue)")).toThrow(/Unknown function/);
    expect(() => parseFormula("Revenue")).toThrow(/lower-case/);
    expect(() => parseFormula("revenue@never")).toThrow(/Unknown period/);
    expect(() => parseFormula("pct(revenue)")).toThrow(/exactly two/);
    expect(() => parseFormula("(revenue")).toThrow(/Expected/);
    expect(() => parseFormula("revenue cost")).toThrow(/Unexpected text/);
  });

  it("refuses formulas that are too large", () => {
    const wide = Array.from({ length: 70 }, (_, i) => `m${i}`).join(" + ");
    expect(() => parseFormula(wide)).toThrow(/complexity/);
  });

  it("validates trees from the API with the same schema", () => {
    expect(FormulaSchema.safeParse({ op: "period_days" }).success).toBe(true);
    expect(FormulaSchema.safeParse({ op: "abs", arg: { op: "constant", value: "-1" } }).success).toBe(true);
    expect(FormulaSchema.safeParse({ op: "measure", key: "x", period: "last_week" }).success).toBe(false);
    expect(FormulaSchema.safeParse({ op: "eval", code: "1" }).success).toBe(false);
  });
});

describe("references", () => {
  it("lists refs, keys and extra periods", () => {
    const f = parseFormula("pct(revenue - revenue@prev, revenue@prev) + cost@yoy");
    expect(formulaRefs(f).sort()).toEqual(["cost@year_ago", "revenue", "revenue@previous"]);
    expect(formulaMeasureKeys(f).sort()).toEqual(["cost", "revenue"]);
    expect([...formulaPeriods(f)].sort()).toEqual(["previous", "year_ago"]);
  });
});

describe("unit algebra", () => {
  const unitOf = (text: string) => formulaUnit(parseFormula(text), units);

  it("derives units", () => {
    expect(unitOf("revenue - cost")).toBe("currency");
    expect(unitOf("pct(revenue - cost, revenue)")).toBe("%");
    expect(unitOf("revenue / tests")).toBe("currency/count");
    expect(unitOf("revenue / tests * tests")).toBe("currency");
    expect(unitOf("revenue / cost")).toBe("1");
    expect(unitOf("revenue / period_days")).toBe("currency/days");
    expect(unitOf("tests / hours")).toBe("count/hours");
    expect(unitOf("abs(revenue - cost)")).toBe("currency");
    expect(unitOf("max(revenue, 0)")).toBe("currency");
    expect(unitOf("revenue@prev - revenue")).toBe("currency");
  });

  it("rejects meaningless combinations", () => {
    expect(() => unitOf("revenue + tests")).toThrow(/matching units/);
    expect(() => unitOf("pct(revenue, tests)")).toThrow(/same unit/);
    expect(() => unitOf("min(revenue, tests)")).toThrow(/matching units/);
    expect(() => unitOf("ghost + 1")).toThrow(/Unknown measure/);
  });
});
