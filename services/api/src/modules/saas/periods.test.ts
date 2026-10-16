import { describe, expect, it } from "vitest";
import { daysInPeriod, shiftPeriod } from "./periods.ts";

describe("reporting periods", () => {
  it("counts days inclusively", () => {
    expect(daysInPeriod({ start: "2026-09-01", end: "2026-09-30" })).toBe(30);
    expect(daysInPeriod({ start: "2028-02-01", end: "2028-02-29" })).toBe(29);
    expect(daysInPeriod({ start: "2026-01-01", end: "2026-12-31" })).toBe(365);
    expect(daysInPeriod({ start: "2026-10-05", end: "2026-10-05" })).toBe(1);
  });

  it("moves whole-month periods by whole months", () => {
    expect(shiftPeriod({ start: "2026-09-01", end: "2026-09-30" }, "previous")).toEqual({
      start: "2026-08-01",
      end: "2026-08-31",
    });
    expect(shiftPeriod({ start: "2026-03-01", end: "2026-03-31" }, "previous")).toEqual({
      start: "2026-02-01",
      end: "2026-02-28",
    });
    expect(shiftPeriod({ start: "2026-01-01", end: "2026-03-31" }, "previous")).toEqual({
      start: "2025-10-01",
      end: "2025-12-31",
    });
    expect(shiftPeriod({ start: "2026-12-01", end: "2026-12-31" }, "next")).toEqual({
      start: "2027-01-01",
      end: "2027-01-31",
    });
    expect(shiftPeriod({ start: "2026-02-01", end: "2026-02-28" }, "year_ago")).toEqual({
      start: "2025-02-01",
      end: "2025-02-28",
    });
    expect(shiftPeriod({ start: "2027-02-01", end: "2027-02-28" }, "year_ago")).toEqual({
      start: "2026-02-01",
      end: "2026-02-28",
    });
    expect(shiftPeriod({ start: "2028-02-01", end: "2028-02-29" }, "year_ago")).toEqual({
      start: "2027-02-01",
      end: "2027-02-28",
    });
    expect(shiftPeriod({ start: "2026-09-01", end: "2026-09-30" }, "year_after")).toEqual({
      start: "2027-09-01",
      end: "2027-09-30",
    });
  });

  it("moves other periods by their own length", () => {
    expect(shiftPeriod({ start: "2026-10-01", end: "2026-10-15" }, "previous")).toEqual({
      start: "2026-09-16",
      end: "2026-09-30",
    });
    expect(shiftPeriod({ start: "2026-10-01", end: "2026-10-07" }, "next")).toEqual({
      start: "2026-10-08",
      end: "2026-10-14",
    });
    expect(shiftPeriod({ start: "2026-10-05", end: "2026-10-11" }, "year_ago")).toEqual({
      start: "2025-10-05",
      end: "2025-10-11",
    });
    expect(shiftPeriod({ start: "2028-02-29", end: "2028-03-05" }, "year_ago")).toEqual({
      start: "2027-02-28",
      end: "2027-03-05",
    });
  });
});
