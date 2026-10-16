import { describe, expect, it } from "vitest";
import { WorkspaceSchema, type SaasWorkspace } from "@orbit/contracts";
import {
  guideCsv,
  lastMonth,
  measuresFor,
  monthPeriod,
  normalizeDate,
  normalizeNumber,
  parseCsv,
  templateCsv,
  toCsv,
  validateCsv,
} from "./csv.ts";

const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const workspace: SaasWorkspace = WorkspaceSchema.parse({
  organization: { id: id(1), name: "Org", owner: true },
  subject: id(2),
  units: [
    { id: id(10), name: "Org", kind: "Organization", parentId: null },
    { id: id(11), name: "Mumbai Lab", kind: "Lab", parentId: id(10) },
    { id: id(12), name: "Pune Lab", kind: "Lab", parentId: id(10) },
  ],
  measures: [
    { key: "revenue", name: "Revenue", unit: "currency", description: "Net revenue.", rollsUp: true },
    { key: "cost", name: "Cost", unit: "currency", description: "Cost.", rollsUp: true },
    { key: "tests", name: "Tests", unit: "count", description: "Tests done.", rollsUp: true },
    { key: "score", name: "Score", unit: "score", description: "A score.", rollsUp: false },
  ],
  kpis: [
    { id: id(20), key: "margin", version: 1, name: "Margin", description: "d", unit: "%", direction: "higher", target: null, state: "active", domain: "finance", catalogId: "FIN-003", sortOrder: 1,
      formula: { op: "percent", left: { op: "subtract", left: { op: "measure", key: "revenue" }, right: { op: "measure", key: "cost" } }, right: { op: "measure", key: "revenue" } } },
    { id: id(21), key: "rev_per_test", version: 1, name: "Revenue per test", description: "d", unit: "currency/count", direction: "higher", target: null, state: "active", domain: "finance", catalogId: null, sortOrder: 2,
      formula: { op: "divide", left: { op: "measure", key: "revenue" }, right: { op: "measure", key: "tests" } } },
  ],
  roles: [],
  members: [{ id: id(30), subject: id(2), displayName: "Me", owner: true, active: true }],
  batches: [],
  results: [],
  actions: [],
});

describe("CSV parsing", () => {
  it("reads quotes, doubled quotes and line endings", () => {
    expect(parseCsv('a,b,c\r\n"x, y","say ""hi""",3\n\n4,5,6')).toEqual([
      ["a", "b", "c"],
      ["x, y", 'say "hi"', "3"],
      ["4", "5", "6"],
    ]);
  });
  it("copes with a byte-order mark and semicolon or tab separators", () => {
    expect(parseCsv("﻿a;b\n1;2")).toEqual([["a", "b"], ["1", "2"]]);
    expect(parseCsv("a\tb\n1\t2")).toEqual([["a", "b"], ["1", "2"]]);
  });
  it("round-trips through toCsv", () => {
    const rows = [["unit", "note"], ["Mumbai, East", 'a "quoted" word']];
    expect(parseCsv(toCsv(rows))).toEqual(rows);
  });
});

describe("dates and numbers as people type them", () => {
  it("normalises dates, day first", () => {
    expect(normalizeDate("2026-09-01")).toBe("2026-09-01");
    expect(normalizeDate("01/09/2026")).toBe("2026-09-01");
    expect(normalizeDate("1-9-2026")).toBe("2026-09-01");
    expect(normalizeDate("30.09.2026")).toBe("2026-09-30");
    expect(normalizeDate("31/04/2026")).toBeNull();
    expect(normalizeDate("29/02/2027")).toBeNull();
    expect(normalizeDate("29/02/2028")).toBe("2028-02-29");
    expect(normalizeDate("September")).toBeNull();
  });
  it("normalises numbers", () => {
    expect(normalizeNumber("1,234,567.50")).toEqual({ value: "1234567.50" });
    expect(normalizeNumber("12,34,567")).toEqual({ value: "1234567" });
    expect(normalizeNumber("1,23")).toHaveProperty("error");
    expect(normalizeNumber(" 42 ")).toEqual({ value: "42" });
    expect(normalizeNumber("-0")).toEqual({ value: "0" });
    expect(normalizeNumber("007")).toEqual({ value: "7" });
    expect(normalizeNumber("0.5")).toEqual({ value: "0.5" });
    expect(normalizeNumber("12%")).toHaveProperty("error");
    expect(normalizeNumber("abc")).toHaveProperty("error");
    expect(normalizeNumber("1.12345678901")).toHaveProperty("error");
    expect(normalizeNumber("123456789012345678901")).toHaveProperty("error");
  });
});

describe("validation", () => {
  const check = (text: string) => validateCsv(parseCsv(text), workspace);

  it("accepts a good file, matching units by name without regard to case", () => {
    const report = check("unit,period_start,period_end,revenue,tests\nmumbai lab,2026-09-01,2026-09-30,\"42,00,000\",18400\nPune Lab,01/09/2026,30/09/2026,2600000,");
    expect(report.fileErrors).toEqual([]);
    expect(report.rows[0]!.errors).toEqual([]);
    expect(report.ready).toHaveLength(2);
    expect(report.ready[0]).toMatchObject({ unitId: id(11), start: "2026-09-01", end: "2026-09-30" });
    expect(report.ready[1]!.values).toEqual([{ measure: "revenue", value: "2600000" }]);
  });

  it("reports every problem on a row together", () => {
    const row = check("unit,period_start,period_end,revenue\nNowhere,not a date,2026-09-30,abc").rows[0]!;
    expect(row.errors).toHaveLength(3);
    expect(row.errors.join(" ")).toContain('unit "Nowhere" is not in this organization');
    expect(row.errors.join(" ")).toContain("period_start");
    expect(row.errors.join(" ")).toContain("revenue");
  });

  it("flags a whole-file problem before any row", () => {
    expect(check("unit,revenue\nA,1").fileErrors.join(" ")).toContain('"period_start"');
    expect(check("unit,period_start,period_end,ghost\nA,2026-09-01,2026-09-30,1").fileErrors.join(" ")).toContain("Unknown measure column: ghost");
    expect(check("unit,period_start,period_end,revenue").fileErrors).toContain("The file has a header but no rows.");
    expect(check("").fileErrors).toEqual(["The file is empty."]);
    expect(check("unit,period_start,period_end,revenue,revenue\nA,2026-09-01,2026-09-30,1,2").fileErrors.join(" ")).toContain("repeated");
  });

  it("rejects an end before the start, an empty row and a duplicate unit-period", () => {
    const report = check(
      "unit,period_start,period_end,revenue\nMumbai Lab,2026-09-30,2026-09-01,5\nMumbai Lab,2026-09-01,2026-09-30,\nPune Lab,2026-09-01,2026-09-30,5\nPune Lab,2026-09-01,2026-09-30,6",
    );
    expect(report.rows[0]!.errors).toContain("period_end is before period_start");
    expect(report.rows[1]!.errors).toContain("no values on this row");
    expect(report.rows[2]!.errors).toEqual([]);
    expect(report.rows[3]!.errors.join(" ")).toContain("appear on an earlier row");
    expect(report.ready).toHaveLength(1);
  });

  it("accepts header names with spaces or capitals", () => {
    expect(check("Unit,Period Start,Period-End,Revenue\nMumbai Lab,2026-09-01,2026-09-30,5").ready).toHaveLength(1);
  });
});

describe("the format and the guide", () => {
  it("lists only the measures the chosen KPIs need", () => {
    expect(measuresFor(workspace, [id(21)]).map((m) => m.key)).toEqual(["revenue", "tests"]);
    expect(measuresFor(workspace, [id(20)]).map((m) => m.key)).toEqual(["revenue", "cost"]);
    expect(measuresFor(workspace, null)).toHaveLength(4);
    expect(measuresFor(workspace, [])).toHaveLength(0);
  });

  it("builds a template that the validator accepts once filled in", () => {
    const measures = measuresFor(workspace, [id(20), id(21)]);
    const template = templateCsv(workspace, { measures, unitIds: [id(11), id(12)], start: "2026-09-01", end: "2026-09-30" });
    const table = parseCsv(template);
    expect(table[0]).toEqual(["unit", "period_start", "period_end", "revenue", "cost", "tests"]);
    expect(table).toHaveLength(3);
    table[1]![3] = "100";
    table[2]![5] = "7";
    const report = validateCsv(table, workspace);
    expect(report.ready).toHaveLength(2);
  });

  it("writes a guide naming the KPIs that use each column", () => {
    const guide = parseCsv(guideCsv(workspace, measuresFor(workspace, null)));
    const revenue = guide.find((row) => row[0] === "revenue")!;
    expect(revenue[5]).toBe("Margin; Revenue per test");
    expect(guide.find((row) => row[0] === "score")![4]).toContain("no:");
    expect(guide.map((row) => row[0]).slice(0, 4)).toEqual(["column", "unit", "period_start", "period_end"]);
  });

  it("proposes last month and reads a month picker", () => {
    expect(lastMonth(new Date("2026-10-15T00:00:00Z"))).toEqual({ start: "2026-09-01", end: "2026-09-30" });
    expect(lastMonth(new Date("2026-01-03T00:00:00Z"))).toEqual({ start: "2025-12-01", end: "2025-12-31" });
    expect(monthPeriod("2028-02")).toEqual({ start: "2028-02-01", end: "2028-02-29" });
    expect(monthPeriod("2026-13")).toBeNull();
    expect(monthPeriod("junk")).toBeNull();
  });
});
