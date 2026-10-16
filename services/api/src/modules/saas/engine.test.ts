import { describe, expect, it } from "vitest";
import { parseFormula } from "@orbit/contracts";
import { calculate, onTarget } from "./engine.ts";

const run = (text: string, values: Record<string, string>, periodDays = 30) =>
  calculate(parseFormula(text), new Map(Object.entries(values)), { periodDays });

describe("formula engine", () => {
  it("calculates exactly, with no floating-point drift", () => {
    expect(run("a + b", { a: "0.1", b: "0.2" })).toEqual({ status: "available", value: "0.3" });
    expect(run("pct(a - b, a)", { a: "4200000", b: "3100000" })).toEqual({
      status: "available",
      value: "26.1904761905",
    });
    expect(run("a / b", { a: "1", b: "3" })).toEqual({ status: "available", value: "0.3333333333" });
    expect(run("a * b", { a: "-1.5", b: "2" })).toEqual({ status: "available", value: "-3" });
  });

  it("supports min, max, abs and period_days", () => {
    expect(run("min(a, b)", { a: "5", b: "-2" })).toEqual({ status: "available", value: "-2" });
    expect(run("max(a, 0)", { a: "-5" })).toEqual({ status: "available", value: "0" });
    expect(run("abs(a - b)", { a: "2", b: "9" })).toEqual({ status: "available", value: "7" });
    expect(run("a / period_days", { a: "300" }, 30)).toEqual({ status: "available", value: "10" });
    expect(run("a / period_days", { a: "310" }, 31)).toEqual({ status: "available", value: "10" });
  });

  it("reads earlier periods", () => {
    expect(
      run("pct(a - a@prev, a@prev)", { a: "120", "a@previous": "100" }),
    ).toEqual({ status: "available", value: "20" });
    expect(run("a - a@yoy", { a: "9", "a@year_ago": "12" })).toEqual({
      status: "available",
      value: "-3",
    });
  });

  it("reports what is missing instead of guessing", () => {
    expect(run("pct(a - a@prev, a@prev)", { a: "120" })).toEqual({
      status: "missing",
      measures: ["a@previous"],
    });
    expect(run("a + b + c", { b: "1" })).toEqual({ status: "missing", measures: ["a", "c"] });
  });

  it("returns not applicable for a zero denominator, even deep inside", () => {
    expect(run("a / b", { a: "1", b: "0" })).toEqual({ status: "not_applicable", reason: "zero_denominator" });
    expect(run("1 + a / (b - b)", { a: "1", b: "5" })).toEqual({
      status: "not_applicable",
      reason: "zero_denominator",
    });
    expect(run("pct(a, b)", { a: "0", b: "0" })).toEqual({ status: "not_applicable", reason: "zero_denominator" });
  });

  it("rejects an invalid stored formula instead of calculating it", () => {
    expect(() => calculate("not a formula", new Map())).toThrow();
    expect(() => calculate({ op: "eval", code: "1" }, new Map())).toThrow();
  });
});

describe("on target", () => {
  const ok = { status: "available", value: "95" } as const;
  it("compares by direction", () => {
    expect(onTarget(ok, "90", "higher")).toBe(true);
    expect(onTarget(ok, "95", "higher")).toBe(true);
    expect(onTarget(ok, "96", "higher")).toBe(false);
    expect(onTarget(ok, "96", "lower")).toBe(true);
    expect(onTarget(ok, "90", "lower")).toBe(false);
  });
  it("has no opinion without a target or direction, or without a value", () => {
    expect(onTarget(ok, null, "higher")).toBeNull();
    expect(onTarget(ok, "90", "neutral")).toBeNull();
    expect(onTarget({ status: "missing", measures: ["a"] }, "90", "higher")).toBeNull();
  });
});
