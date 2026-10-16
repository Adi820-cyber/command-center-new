import { describe, expect, it } from "vitest";
import { WorkspaceSchema, type SaasWorkspace } from "@orbit/contracts";
import { answerQuestion } from "./ask.ts";

const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const ORG = id(1), ROOT = id(2), MUM = id(3), PUNE = id(4), ME = id(5);
const MARGIN = id(10), REV = id(11), DELAY = id(12), GROSS = id(13), GROSS_TX = id(14);

const kpi = (i: string, name: string, unit: string, direction: "higher" | "lower", formula: unknown) => ({
  id: i, key: name.toLowerCase().replaceAll(" ", "_"), version: 1, name, description: `About ${name}.`, unit, formula,
  direction, target: null, state: "active" as const, domain: "finance", catalogId: null, sortOrder: 0,
});
const result = (n: number, kpiId: string, unitId: string, start: string, end: string, value: string, onTarget: boolean | null, target: string | null) => ({
  id: id(100 + n), kpiId, unitId, start, end, value: { status: "available" as const, value },
  origin: ["manual"], computedAt: "2026-10-01T00:00:00Z", target, direction: "higher" as const, onTarget, inputIds: [],
});

function workspaceWith(overrides: Partial<Record<keyof SaasWorkspace, unknown>> = {}): SaasWorkspace {
  return WorkspaceSchema.parse({
    organization: { id: ORG, name: "Sunrise", owner: true },
    subject: ME,
    units: [
      { id: ROOT, name: "Sunrise", kind: "Organization", parentId: null },
      { id: MUM, name: "Mumbai", kind: "Centre", parentId: ROOT },
      { id: PUNE, name: "Pune", kind: "Centre", parentId: ROOT },
    ],
    measures: [],
    kpis: [
      kpi(MARGIN, "Operating margin", "%", "higher", { op: "percent", left: { op: "subtract", left: { op: "measure", key: "revenue" }, right: { op: "measure", key: "cost" } }, right: { op: "measure", key: "revenue" } }),
      kpi(REV, "Revenue", "currency", "higher", { op: "measure", key: "revenue" }),
      kpi(DELAY, "Report delay", "hours", "lower", { op: "measure", key: "delay" }),
      kpi(GROSS, "Gross margin", "%", "higher", { op: "measure", key: "gm" }),
      kpi(GROSS_TX, "Gross margin per transaction", "currency/count", "higher", { op: "measure", key: "gmt" }),
    ],
    roles: [],
    members: [{ id: ME, subject: ME, displayName: "Me", owner: true, active: true }],
    batches: [{ id: id(50), unitId: PUNE, start: "2026-10-01", end: "2026-10-31", status: "submitted", origin: "manual" }],
    results: [
      result(1, MARGIN, MUM, "2026-08-01", "2026-08-31", "22", false, "25"),
      result(2, MARGIN, MUM, "2026-09-01", "2026-09-30", "26.19", true, "25"),
      result(3, MARGIN, PUNE, "2026-09-01", "2026-09-30", "13.46", false, "25"),
      result(4, REV, MUM, "2026-09-01", "2026-09-30", "4200000", null, null),
      result(5, REV, PUNE, "2026-09-01", "2026-09-30", "2600000", null, null),
      result(6, DELAY, PUNE, "2026-09-01", "2026-09-30", "30", false, "24"),
    ],
    actions: [{ id: id(70), title: "Investigate delay", resultId: id(106), assigneeId: ME, dueDate: "2026-10-01", state: "open", version: 1 }],
    ...overrides,
  });
}
const ask = (question: string, workspace = workspaceWith()) => answerQuestion(question, workspace, "2026-10-15");

describe("Ask", () => {
  it("answers about a named KPI in each unit", () => {
    const a = ask("How is the operating margin?");
    expect(a.topic).toBe("kpi");
    expect(a.facts.map((f) => f.label)).toEqual(["Operating margin · Mumbai", "Operating margin · Pune"]);
    expect(a.facts[0]!.value).toContain("26.19%");
    expect(a.facts[0]!.value).toContain("+4.19 points vs Aug 2026");
    expect(a.resultIds).toHaveLength(2);
  });

  it("narrows to one unit when it is named", () => {
    const a = ask("What is revenue in Pune?");
    expect(a.topic).toBe("kpi");
    expect(a.answer).toContain("26,00,000");
    expect(a.answer).toContain("Sep 2026");
    expect(a.facts).toHaveLength(1);
  });

  it("prefers the most specific KPI name", () => {
    const a = ask("gross margin per transaction");
    expect(a.facts.length + a.answer.length).toBeGreaterThan(0);
    expect(a.answer).not.toContain("Gross margin is");
  });

  it("ranks units when asked for the lowest or highest", () => {
    expect(ask("which unit has the lowest operating margin").facts[0]!.label).toContain("Pune");
    expect(ask("which unit has the highest operating margin").facts[0]!.label).toContain("Mumbai");
  });

  it("lists what is off target, worst first", () => {
    const a = ask("What is off target?");
    expect(a.topic).toBe("off_target");
    expect(a.facts.map((f) => f.tone)).toEqual(["bad", "bad"]);
    expect(a.answer).toContain("2 results need attention");
  });

  it("lists what is on track", () => {
    const a = ask("what is on track?");
    expect(a.topic).toBe("on_track");
    expect(a.facts.map((f) => f.label)).toEqual(["Operating margin · Mumbai"]);
  });

  it("explains how a KPI is calculated", () => {
    const a = ask("how is operating margin calculated?");
    expect(a.topic).toBe("definition");
    expect(a.answer).toContain("pct(revenue - cost, revenue)");
  });

  it("reports waiting uploads and overdue actions", () => {
    expect(ask("what is waiting for approval").facts[0]).toMatchObject({ label: "Pune", value: "2026-10-01 to 2026-10-31" });
    const actions = ask("which actions are overdue?");
    expect(actions.topic).toBe("actions");
    expect(actions.facts[0]).toMatchObject({ label: "Investigate delay", tone: "bad" });
  });

  it("gives a brief for the whole organisation or one unit", () => {
    expect(ask("give me the morning brief").topic).toBe("brief");
    const mumbai = ask("how is Mumbai doing");
    expect(mumbai.topic).toBe("brief");
    expect(mumbai.answer.startsWith("Mumbai: ")).toBe(true);
  });

  it("suggests a name when only one word matches", () => {
    const a = ask("margin");
    expect(a.topic).toBe("kpi");
    expect(a.answer).toContain("match");
  });

  it("does not match on a generic word alone", () => {
    const a = ask("how is the quality control pass rate");
    expect(a.topic).toBe("unknown");
    expect(a.facts).toEqual([]);
  });

  it("never invents a figure for an unknown question", () => {
    const a = ask("what will the weather be like");
    expect(a.topic).toBe("unknown");
    expect(a.facts).toEqual([]);
    expect(a.answer).not.toMatch(/\d/);
  });
});

describe("Ask respects what the member can see", () => {
  it("refuses a member whose role has no KPIs", () => {
    const a = ask("what is off target?", workspaceWith({ kpis: [], results: [] }));
    expect(a.topic).toBe("no_access");
    expect(a.facts).toEqual([]);
    expect(a.answer).not.toMatch(/\d/);
  });

  it("says so when nothing has been calculated", () => {
    expect(ask("summary", workspaceWith({ results: [] })).topic).toBe("no_data");
  });

  it("only uses results present in the workspace it was given", () => {
    const only = workspaceWith({ results: [result(1, REV, MUM, "2026-09-01", "2026-09-30", "4200000", null, null)] });
    const a = ask("What is off target?", only);
    expect(a.facts).toEqual([]);
    const pune = ask("revenue in Pune", only);
    expect(pune.topic).toBe("kpi");
    expect(pune.answer).toContain("no calculated result");
  });
});
