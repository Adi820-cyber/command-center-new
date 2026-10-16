import { describe, expect, it } from "vitest";
import { CATALOG, DOMAINS } from "./index.ts";

describe("KPI catalog", () => {
  it("builds without a single problem", () => {
    expect(CATALOG.kpis.length).toBeGreaterThan(0);
  });

  it("has unique KPI ids and measure keys", () => {
    expect(new Set(CATALOG.kpis.map((k) => k.id)).size).toBe(CATALOG.kpis.length);
    expect(new Set(CATALOG.measures.map((m) => m.key)).size).toBe(CATALOG.measures.length);
  });

  it("gives every KPI a derived unit and at least one measure", () => {
    for (const kpi of CATALOG.kpis) {
      expect(kpi.unit, kpi.id).toMatch(/^[a-z%*/1_]+$/);
      expect(kpi.measures.length, kpi.id).toBeGreaterThan(0);
    }
  });

  it("names a source page for every domain", () => {
    for (const domain of DOMAINS) expect(domain.sources.length, domain.domain).toBeGreaterThan(0);
  });
});

describe("KPI catalog size and quality", () => {
  it("holds at least 500 KPIs", () => {
    expect(CATALOG.kpis.length).toBeGreaterThanOrEqual(500);
  });

  it("covers every industry the templates target", () => {
    const industries = new Set(CATALOG.kpis.flatMap((k) => k.industries));
    for (const industry of ["healthcare", "retail", "manufacturing", "saas", "banking", "insurance", "hospitality", "education", "logistics", "real_estate", "professional_services"])
      expect(industries.has(industry), industry).toBe(true);
  });

  it("derives sensible units", () => {
    const byId = new Map(CATALOG.kpis.map((k) => [k.id, k]));
    expect(byId.get("FIN-003")?.unit).toBe("%");
    expect(byId.get("FIN-012")?.unit).toBe("1");
    expect(byId.get("FIN-016")?.unit).toBe("days");
    expect(byId.get("HLT-002")?.unit).toBe("days/count");
    expect(byId.get("SAL-006")?.unit).toBe("currency/count");
    expect(byId.get("MFG-001")?.unit).toBe("%");
    expect(byId.get("HOS-002")?.unit).toBe("currency/count");
  });

  it("flags KPIs that need an earlier period", () => {
    const history = CATALOG.kpis.filter((k) => k.needsHistory);
    expect(history.length).toBeGreaterThan(20);
    expect(history.every((k) => /@(prev|yoy)/.test(k.formulaText))).toBe(true);
  });

  it("never reuses a KPI name inside one domain", () => {
    const seen = new Set<string>();
    for (const k of CATALOG.kpis) {
      const key = `${k.domain}:${k.name.toLowerCase()}`;
      expect(seen.has(key), key).toBe(false);
      seen.add(key);
    }
  });
});

import { TEMPLATES } from "./index.ts";

describe("role templates", () => {
  const known = new Set(CATALOG.kpis.map((k) => k.id));

  it("offers at least twenty industry templates", () => {
    expect(TEMPLATES.length).toBeGreaterThanOrEqual(20);
    expect(new Set(TEMPLATES.map((t) => t.id)).size).toBe(TEMPLATES.length);
  });

  it("only refers to KPIs that exist", () => {
    for (const template of TEMPLATES)
      for (const role of template.roles)
        for (const id of role.kpis) expect(known.has(id), `${template.id}/${role.key}/${id}`).toBe(true);
  });

  it("gives every viewing role something to see and keeps role keys unique", () => {
    for (const template of TEMPLATES) {
      const keys = template.roles.map((r) => r.key);
      expect(new Set(keys).size, template.id).toBe(keys.length);
      for (const role of template.roles) {
        if (role.capabilities.includes("act")) expect(role.kpis.length, `${template.id}/${role.key}`).toBeGreaterThan(0);
      }
      expect(keys).toContain("data_contributor");
      expect(keys).toContain("data_reviewer");
    }
  });
});
