import { describe, expect, it } from "vitest";
import { accessCsv, accessMessage, invitationCsv, matchRole, parsePeople } from "./people.ts";

const roles = [
  { key: "executive", name: "Executive (CEO / Owner view)" },
  { key: "operations", name: "Operations head (COO)" },
  { key: "data_contributor", name: "Data contributor" },
  { key: "data_reviewer", name: "Data reviewer (approver)" },
];

describe("matching a role from what someone typed", () => {
  it("accepts the key, the name or the name without brackets", () => {
    expect(matchRole("data_contributor", roles)?.key).toBe("data_contributor");
    expect(matchRole("Data Contributor", roles)?.key).toBe("data_contributor");
    expect(matchRole("operations head", roles)?.key).toBe("operations");
    expect(matchRole("Executive", roles)?.key).toBe("executive");
    expect(matchRole("data rev", roles)?.key).toBe("data_reviewer");
  });
  it("does not guess from a fragment that is too short or unknown", () => {
    expect(matchRole("da", roles)).toBeUndefined();
    expect(matchRole("janitor", roles)).toBeUndefined();
    expect(matchRole("", roles)).toBeUndefined();
  });
});

describe("pasting a list of people", () => {
  it("reads one person per line with several roles", () => {
    const { people, errors } = parsePeople(
      "ceo@acme.com, executive\nanita@acme.com, operations; data reviewer\nentry@acme.com\tdata_contributor",
      roles,
    );
    expect(errors).toEqual([]);
    expect(people).toEqual([
      { email: "ceo@acme.com", roleKeys: ["executive"] },
      { email: "anita@acme.com", roleKeys: ["operations", "data_reviewer"] },
      { email: "entry@acme.com", roleKeys: ["data_contributor"] },
    ]);
  });

  it("skips a pasted header row and blank lines", () => {
    const { people, errors } = parsePeople("email, role\n\nceo@acme.com, executive\n", roles);
    expect(errors).toEqual([]);
    expect(people).toHaveLength(1);
  });

  it("explains every problem by line", () => {
    const { people, errors } = parsePeople(
      "not-an-email, executive\na@acme.com\nb@acme.com, janitor\nc@acme.com, executive\nC@ACME.com, executive",
      roles,
    );
    expect(people.map((p) => p.email)).toEqual(["c@acme.com"]);
    expect(errors).toEqual([
      'Line 1: "not-an-email" is not an email address.',
      "Line 2: a@acme.com has no role. Add one after a comma.",
      'Line 3: "janitor" is not a role in this template.',
      "Line 5: C@ACME.com is listed more than once.",
    ]);
  });

  it("keeps a person once even if a role is repeated", () => {
    expect(parsePeople("a@acme.com, executive; Executive", roles).people[0]!.roleKeys).toEqual(["executive"]);
  });
});

describe("invitation links file", () => {
  it("lists each person with their link", () => {
    const csv = invitationCsv([{ email: "a@acme.com", roleKeys: ["executive", "operations"], token: "abc" }], "https://app.example");
    expect(csv).toBe("email,roles,invitation_link\r\na@acme.com,executive; operations,https://app.example/invite#abc\r\n");
  });

  describe("access hand-over", () => {
    const withPassword = { email: "a@acme.com", roleKeys: ["executive"], temporaryPassword: "Ab3d-Efg4-Hjk5" };
    const withLink = { email: "b@acme.com", roleKeys: ["operations", "data_reviewer"], token: "tok123" };

    it("writes a message a person can act on", () => {
      const text = accessMessage(withPassword, "https://app.example");
      expect(text).toContain("https://app.example/login");
      expect(text).toContain("a@acme.com");
      expect(text).toContain("Ab3d-Efg4-Hjk5");
      expect(text).toMatch(/choose your own password/);
      const invite = accessMessage(withLink, "https://app.example");
      expect(invite).toContain("https://app.example/invite#tok123");
      expect(invite).not.toMatch(/password/i);
    });

    it("puts everyone in one CSV with the right column filled", () => {
      const csv = accessCsv([withPassword, withLink], "https://app.example").split("\r\n");
      expect(csv[0]).toBe("email,roles,sign_in_address,temporary_password,invitation_link");
      expect(csv[1]).toBe("a@acme.com,executive,https://app.example/login,Ab3d-Efg4-Hjk5,");
      expect(csv[2]).toBe('b@acme.com,operations; data_reviewer,https://app.example/login,,https://app.example/invite#tok123');
    });
  });
});
