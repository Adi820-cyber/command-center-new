import { describe, expect, it } from "vitest";
import { changeTone, formatKpiValue, periodLabel, unitLabel } from "./format.ts";

describe("value formatting", () => {
  it("formats by unit", () => {
    expect(formatKpiValue("26.1904761905", "%")).toBe("26.19%");
    expect(formatKpiValue("4200000", "currency")).toBe("42,00,000");
    expect(formatKpiValue("18400", "count")).toBe("18,400");
    expect(formatKpiValue("228.2608695652", "currency/count")).toBe("228.26 per item");
    expect(formatKpiValue("3.5", "days")).toBe("3.5 days");
    expect(formatKpiValue("1.2345", "1")).toBe("1.23×");
    expect(formatKpiValue("0.333", "hours/count")).toBe("0.33 hours per item");
    expect(formatKpiValue("-5", "currency")).toBe("-5");
    expect(formatKpiValue("oops", "%")).toBe("oops");
  });

  it("labels composite units in words", () => {
    expect(unitLabel("currency/days")).toBe(" per day");
    expect(unitLabel("count/hours")).toBe(" items per hour");
    expect(unitLabel("minutes/count")).toBe(" min per item");
  });
});

describe("periods", () => {
  it("labels whole months and other spans", () => {
    expect(periodLabel("2026-09-01", "2026-09-30")).toBe("Sep 2026");
    expect(periodLabel("2026-01-01", "2026-03-31")).toBe("Jan 2026 – Mar 2026");
    expect(periodLabel("2026-10-01", "2026-10-15")).toBe("1 Oct – 15 Oct 2026");
    expect(periodLabel("2028-02-01", "2028-02-29")).toBe("Feb 2028");
  });
});

describe("change tone", () => {
  it("judges a move by the KPI's direction", () => {
    expect(changeTone("higher", 5, 4)).toBe("good");
    expect(changeTone("higher", 3, 4)).toBe("bad");
    expect(changeTone("lower", 3, 4)).toBe("good");
    expect(changeTone("lower", 5, 4)).toBe("bad");
    expect(changeTone("neutral", 5, 4)).toBe("neutral");
    expect(changeTone("higher", 4, 4)).toBe("neutral");
  });
});
