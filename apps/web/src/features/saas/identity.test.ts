import { describe, expect, it } from "vitest";
import { initialOf, roleLabel, shortRole, viewingAs } from "./identity.ts";

const role = (name: string) => ({ id: "00000000-0000-4000-8000-000000000001", name });

describe("roleLabel", () => {
  it("says Owner for the owner, whatever else they hold", () => {
    expect(roleLabel({ owner: true, roles: [role("Finance head (CFO)")] })).toBe("Owner");
  });
  it("lists a member's roles", () => {
    expect(roleLabel({ owner: false, roles: [role("Operations head (COO)"), role("Quality head")] })).toBe("Operations head (COO) · Quality head");
  });
  it("is honest about someone with no role", () => {
    expect(roleLabel({ owner: false, roles: [] })).toBe("No role yet");
  });
  it("is empty until the workspace has loaded", () => {
    expect(roleLabel(undefined)).toBe("");
  });
});

describe("viewingAs", () => {
  it("names the role without its explanation", () => {
    expect(viewingAs({ owner: false, roles: [role("Operations head (COO)")] })).toBe("Viewing as Operations head.");
  });
  it("joins two roles", () => {
    expect(viewingAs({ owner: false, roles: [role("Finance head (CFO)"), role("Quality head")] })).toBe("Viewing as Finance head and Quality head.");
  });
  it("describes the owner's view", () => {
    expect(viewingAs({ owner: true, roles: [] })).toMatch(/owner: every KPI/);
  });
  it("tells a person with no role what to do", () => {
    expect(viewingAs({ owner: false, roles: [] })).toMatch(/Ask your owner/);
  });
});

describe("shortRole and initialOf", () => {
  it("only drops a trailing bracket", () => {
    expect(shortRole("Executive (CEO / Owner view)")).toBe("Executive");
    expect(shortRole("Quality head")).toBe("Quality head");
    expect(shortRole("Head (north) team")).toBe("Head (north) team");
  });
  it("takes the first letter, upper case, or a question mark", () => {
    expect(initialOf("anita@acme.com")).toBe("A");
    expect(initialOf("  ravi")).toBe("R");
    expect(initialOf("")).toBe("?");
    expect(initialOf(undefined)).toBe("?");
  });
});
