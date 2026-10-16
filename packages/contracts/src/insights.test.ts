import { describe, expect, it } from "vitest";
import { WorkspaceSchema, type SaasWorkspace } from "./saas.ts";
import { buildBrief, kpiPoints } from "./insights.ts";

const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const ORG = id(1), ROOT = id(2), MUM = id(3), ME = id(4);
const MARGIN = id(10), TESTS = id(11), DELAY = id(12);

function result(n: number, kpiId: string, unitId: string, start: string, end: string, value: string, onTarget: boolean | null, target: string | null = "25") {
  return {
    id: id(100 + n), kpiId, unitId, start, end,
    value: { status: "available" as const, value },
    origin: ["manual"], computedAt: "2026-10-01T00:00:00Z", target,
    direction: "higher" as const, onTarget, inputIds: [],
  };
}
function kpi(i: string, name: string, unit: string, direction: "higher" | "lower" | "neutral", sortOrder = 0, state: "active" | "draft" = "active") {
  return {
    id: i, key: name.toLowerCase().replaceAll(" ", "_"), version: 1, name, description: "d", unit,
    formula: { op: "measure" as const, key: "x" }, direction, target: null, state, domain: "finance", catalogId: null, sortOrder,
  };
}

const workspace: SaasWorkspace = WorkspaceSchema.parse({
  organization: { id: ORG, name: "Org", owner: true },
  subject: ME,
  units: [
    { id: ROOT, name: "Org", kind: "Organization", parentId: null },
    { id: MUM, name: "Mumbai", kind: "Store", parentId: ROOT },
  ],
  measures: [],
  kpis: [
    kpi(MARGIN, "Operating margin", "%", "higher", 1),
    kpi(TESTS, "Tests performed", "count", "higher", 2),
    kpi(DELAY, "Report delay", "hours", "lower", 3),
    kpi(id(13), "Draft only", "%", "higher", 4, "draft"),
  ],
  roles: [],
  members: [{ id: ME, subject: ME, displayName: "Me", owner: true, active: true }],
  batches: [
    { id: id(50), unitId: MUM, start: "2026-09-01", end: "2026-09-30", status: "submitted", origin: "manual" },
    { id: id(51), unitId: MUM, start: "2026-08-01", end: "2026-08-31", status: "approved", origin: "manual" },
  ],
  results: [
    result(1, MARGIN, MUM, "2026-08-01", "2026-08-31", "22", false),
    result(2, MARGIN, MUM, "2026-09-01", "2026-09-30", "26", true),
    result(3, TESTS, MUM, "2026-08-01", "2026-08-31", "100", null, null),
    result(4, TESTS, MUM, "2026-09-01", "2026-09-30", "90", null, null),
    result(5, DELAY, MUM, "2026-09-01", "2026-09-30", "30", false, "24"),
    result(6, id(13), MUM, "2026-09-01", "2026-09-30", "1", null),
  ],
  actions: [
    { id: id(70), title: "Fix delay", resultId: id(105), assigneeId: ME, dueDate: "2026-10-01", state: "open", version: 1 },
    { id: id(71), title: "Old", resultId: id(104), assigneeId: ME, dueDate: "2026-08-01", state: "done", version: 2 },
  ],
});

describe("kpiPoints", () => {
  const points = kpiPoints(workspace);
  const by = (name: string) => points.find((p) => p.kpi.name === name)!;

  it("shows the latest figure and ignores inactive KPIs", () => {
    expect(points.map((p) => p.kpi.name)).toEqual(["Operating margin", "Tests performed", "Report delay"]);
    expect(by("Operating margin").display).toBe("26%");
    expect(by("Operating margin").period).toBe("Sep 2026");
  });

  it("compares with the nearest earlier period", () => {
    expect(by("Operating margin").change).toBe("+4 points vs Aug 2026");
    expect(by("Tests performed").change).toBe("−10% vs Aug 2026");
  });

  it("says so when nothing moved", () => {
    const flat = WorkspaceSchema.parse({
      ...workspace,
      results: [
        result(1, MARGIN, MUM, "2026-08-01", "2026-08-31", "26", true),
        result(2, MARGIN, MUM, "2026-09-01", "2026-09-30", "26.001", true),
        result(3, TESTS, MUM, "2026-08-01", "2026-08-31", "100", null, null),
        result(4, TESTS, MUM, "2026-09-01", "2026-09-30", "100", null, null),
      ],
    });
    const changes = kpiPoints(flat).map((p) => p.change);
    expect(changes).toEqual(["no change vs Aug 2026", "no change vs Aug 2026"]);
  });

  it("judges by target first, then by movement", () => {
    expect(by("Operating margin").tone).toBe("good");
    expect(by("Report delay").tone).toBe("bad");
    expect(by("Tests performed").tone).toBe("bad");
    expect(by("Tests performed").onTarget).toBeNull();
  });
});

describe("morning brief", () => {
  const brief = buildBrief(workspace, "2026-10-15");

  it("counts results", () => {
    expect(brief.total).toBe(3);
    expect(brief.onTarget).toBe(1);
    expect(brief.offTarget).toBe(1);
    expect(brief.improving).toBe(1);
    expect(brief.worsening).toBe(1);
  });

  it("separates wins from concerns, off-target first", () => {
    expect(brief.wins.map((p) => p.kpi.name)).toEqual(["Operating margin"]);
    expect(brief.concerns.map((p) => p.kpi.name)).toEqual(["Report delay", "Tests performed"]);
  });

  it("asks for action only where nobody is already assigned", () => {
    expect(brief.actNow.map((p) => p.kpi.name)).toEqual(["Tests performed"]);
  });

  it("reports waiting uploads and overdue actions", () => {
    expect(brief.pendingBatches).toBe(1);
    expect(brief.overdueActions.map((a) => a.title)).toEqual(["Fix delay"]);
    expect(brief.headline).toContain("3 KPI results");
    expect(brief.headline).toContain("1 data upload waiting for approval");
    expect(brief.headline).toContain("1 overdue action");
  });

  it("can focus on one unit", () => {
    expect(buildBrief(workspace, "2026-10-15", ROOT).total).toBe(0);
    expect(buildBrief(workspace, "2026-10-15", ROOT).headline).toContain("No results to show yet");
  });
});
