import { describe, expect, it } from "vitest";
import { rolesSeeingKpi } from "./audience.ts";

const V1 = "00000000-0000-4000-8000-0000000000a1";
const V2 = "00000000-0000-4000-8000-0000000000a2";
const OTHER = "00000000-0000-4000-8000-0000000000b1";
const kpis = [
  { id: V1, key: "margin" },
  { id: V2, key: "margin" },
  { id: OTHER, key: "revenue" },
];
const role = (id: string, name: string, grants: { capability: "view" | "act" | "submit" | "approve" | "configure"; unitId: string | null; kpiId: string | null }[]) => ({ id, name, templateKey: null, grants });

describe("rolesSeeingKpi", () => {
  const roles = [
    role("r1", "Sees v1", [{ capability: "view", unitId: null, kpiId: V1 }]),
    role("r2", "Sees all", [{ capability: "view", unitId: null, kpiId: null }]),
    role("r3", "Sees other", [{ capability: "view", unitId: null, kpiId: OTHER }]),
    role("r4", "Acts only", [{ capability: "act", unitId: null, kpiId: V1 }]),
    role("r5", "Uploads", [{ capability: "submit", unitId: null, kpiId: null }]),
  ];

  it("counts a grant on an earlier version for the current one", () => {
    const view = rolesSeeingKpi({ key: "margin" }, roles, kpis);
    expect(view.find((r) => r.roleId === "r1")).toMatchObject({ sees: true, everything: false });
  });

  it("marks a role that sees every KPI", () => {
    expect(rolesSeeingKpi({ key: "margin" }, roles, kpis).find((r) => r.roleId === "r2")).toMatchObject({ sees: true, everything: true });
  });

  it("does not count another KPI, acting without seeing, or uploading", () => {
    const view = rolesSeeingKpi({ key: "margin" }, roles, kpis);
    expect(view.filter((r) => r.sees).map((r) => r.roleId)).toEqual(["r1", "r2"]);
  });

  it("works for a KPI nobody was given", () => {
    expect(rolesSeeingKpi({ key: "brand_new" }, roles, kpis).filter((r) => r.sees).map((r) => r.roleId)).toEqual(["r2"]);
  });
});
