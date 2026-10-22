import { describe, expect, it } from "vitest";
import { expandRoleGrants, roleDraftFromGrants, SaveRoleRequestSchema, type RoleGrant } from "./role-editor.ts";

const U1 = "11111111-1111-4111-8111-111111111111";
const K1 = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1";
const K2 = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2";

describe("expandRoleGrants", () => {
  it("gives view, act and submit one row per KPI, in the chosen scope", () => {
    expect(expandRoleGrants({ capabilities: ["view", "act", "submit"], scopeUnitId: U1, kpiIds: [K1, K2] })).toEqual([
      { capability: "view", unitId: U1, kpiId: K1 },
      { capability: "view", unitId: U1, kpiId: K2 },
      { capability: "act", unitId: U1, kpiId: K1 },
      { capability: "act", unitId: U1, kpiId: K2 },
      { capability: "submit", unitId: U1, kpiId: K1 },
      { capability: "submit", unitId: U1, kpiId: K2 },
    ]);
  });

  it("means every KPI in scope when none are chosen", () => {
    expect(expandRoleGrants({ capabilities: ["view"], scopeUnitId: null, kpiIds: [] })).toEqual([{ capability: "view", unitId: null, kpiId: null }]);
  });

  it("ties submission to chosen KPIs but keeps approval unit-wide and configure organization-wide", () => {
    expect(expandRoleGrants({ capabilities: ["submit", "approve", "configure"], scopeUnitId: U1, kpiIds: [K1] })).toEqual([
      { capability: "submit", unitId: U1, kpiId: K1 },
      { capability: "approve", unitId: U1, kpiId: null },
      { capability: "configure", unitId: null, kpiId: null },
    ]);
  });

  it("removes repeats", () => {
    const grants = expandRoleGrants({ capabilities: ["view", "view"], scopeUnitId: null, kpiIds: [K1, K1] });
    expect(grants).toHaveLength(1);
  });

  it("gives a role with no capabilities no rows", () => {
    expect(expandRoleGrants({ capabilities: [], scopeUnitId: U1, kpiIds: [K1] })).toEqual([]);
  });
});

describe("roleDraftFromGrants", () => {
  const roundTrip = (request: Parameters<typeof expandRoleGrants>[0]) => roleDraftFromGrants(expandRoleGrants(request));

  it("reads back what was saved", () => {
    const draft = roundTrip({ capabilities: ["act", "view", "submit"], scopeUnitId: U1, kpiIds: [K2, K1] });
    expect(draft).toEqual({ capabilities: ["view", "act", "submit"], scopeUnitId: U1, allKpis: false, kpiIds: [K2, K1], custom: false });
  });

  it("reads back a role that sees every KPI", () => {
    const draft = roundTrip({ capabilities: ["view", "act"], scopeUnitId: null, kpiIds: [] });
    expect(draft).toMatchObject({ allKpis: true, kpiIds: [], scopeUnitId: null, custom: false });
  });

  it("round-trips every combination of capabilities", () => {
    const all = ["view", "act", "submit", "approve", "configure"] as const;
    for (let mask = 0; mask < 32; mask++) {
      const capabilities = all.filter((_, i) => (mask >> i) & 1);
      for (const kpiIds of [[], [K1], [K1, K2]]) {
        for (const scopeUnitId of [null, U1]) {
          const draft = roundTrip({ capabilities: [...capabilities], scopeUnitId, kpiIds });
          expect(draft.custom, `${capabilities.join(",")}/${kpiIds.length}`).toBe(false);
          expect(draft.capabilities).toEqual(capabilities);
          const usesKpis = capabilities.includes("view") || capabilities.includes("act") || capabilities.includes("submit");
          expect(draft.kpiIds).toEqual(usesKpis ? kpiIds : []);
          const usesScope = capabilities.some((c) => c !== "configure");
          expect(draft.scopeUnitId).toBe(usesScope ? scopeUnitId : null);
        }
      }
    }
  });

  it("reads a role made the way templates make them (organization-wide, one view grant per KPI)", () => {
    const grants: RoleGrant[] = [
      { capability: "act", unitId: null, kpiId: null },
      { capability: "view", unitId: null, kpiId: K1 },
      { capability: "view", unitId: null, kpiId: K2 },
    ];
    // Acting on every KPI while seeing two is the same in practice as acting on those two.
    expect(roleDraftFromGrants(grants)).toEqual({ capabilities: ["view", "act"], scopeUnitId: null, allKpis: false, kpiIds: [K1, K2], custom: false });
  });

  it("flags permissions the controls cannot show", () => {
    // Seeing every KPI but acting on only one is a real difference.
    expect(roleDraftFromGrants([{ capability: "view", unitId: null, kpiId: null }, { capability: "act", unitId: null, kpiId: K1 }]).custom).toBe(true);
    // Seeing two KPIs but acting on a different one, too.
    expect(roleDraftFromGrants([{ capability: "view", unitId: null, kpiId: K1 }, { capability: "act", unitId: null, kpiId: K2 }]).custom).toBe(true);
    expect(roleDraftFromGrants([{ capability: "submit", unitId: U1, kpiId: null }, { capability: "approve", unitId: null, kpiId: null }]).custom).toBe(true);
    expect(roleDraftFromGrants([{ capability: "view", unitId: null, kpiId: null }, { capability: "view", unitId: null, kpiId: K1 }]).custom).toBe(true);
  });

  it("treats a role with nothing as empty", () => {
    expect(roleDraftFromGrants([])).toEqual({ capabilities: [], scopeUnitId: null, allKpis: true, kpiIds: [], custom: false });
  });
});

describe("SaveRoleRequestSchema", () => {
  const ok = { name: "Branch head", capabilities: ["view"], scopeUnitId: null, kpiIds: [] };
  it("accepts a normal request and a trimmed name", () => {
    expect(SaveRoleRequestSchema.parse({ ...ok, name: "  Branch head  " }).name).toBe("Branch head");
  });
  it("refuses an empty name, an unknown capability and stray fields", () => {
    expect(SaveRoleRequestSchema.safeParse({ ...ok, name: "   " }).success).toBe(false);
    expect(SaveRoleRequestSchema.safeParse({ ...ok, capabilities: ["admin"] }).success).toBe(false);
    expect(SaveRoleRequestSchema.safeParse({ ...ok, tenantId: U1 }).success).toBe(false);
    expect(SaveRoleRequestSchema.safeParse({ ...ok, kpiIds: ["not-a-uuid"] }).success).toBe(false);
  });
});
