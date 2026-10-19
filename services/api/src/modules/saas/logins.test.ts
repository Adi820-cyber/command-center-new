import { describe, expect, it } from "vitest";
import type { AuthAdmin, CreatedLogin } from "./auth-admin.ts";
import { assertDistinct, prepareLogins } from "./logins.ts";

function fakeAdmin(existing: string[] = [], failOn?: string) {
  const created: string[] = [];
  const deleted: string[] = [];
  let next = 0;
  const admin: AuthAdmin = {
    async createUser(email, password): Promise<CreatedLogin> {
      if (email === failOn) throw new Error("The login service refused this account.");
      expect(password).toMatch(/^[A-Za-z0-9]{4}-[A-Za-z0-9]{4}-[A-Za-z0-9]{4}$/);
      if (existing.includes(email)) return { status: "exists" };
      const id = `00000000-0000-4000-8000-${String(++next).padStart(12, "0")}`;
      created.push(id);
      return { status: "created", id };
    },
    async deleteUser(id) {
      deleted.push(id);
    },
  };
  return { admin, created, deleted };
}

const people = [
  { email: "owner@acme.com", roleKeys: [], owner: true },
  { email: "anita@acme.com", roleKeys: ["operations", "data_reviewer"] },
  { email: "ravi@acme.com", roleKeys: ["executive"] },
];

describe("prepareLogins", () => {
  it("gives everyone their own temporary password and a membership entry", async () => {
    const { admin } = fakeAdmin();
    const prepared = await prepareLogins(people, admin);
    expect(prepared.people.map((p) => p.email)).toEqual(["owner@acme.com", "anita@acme.com", "ravi@acme.com"]);
    const passwords = prepared.people.map((p) => p.temporaryPassword);
    expect(new Set(passwords).size).toBe(3);
    expect(prepared.people.every((p) => p.token === undefined)).toBe(true);
    const entries = JSON.parse(prepared.json);
    expect(entries[0]).toMatchObject({ email: "owner@acme.com", owner: true, subject: expect.any(String) });
    expect(entries[1]).toMatchObject({ roleKeys: ["operations", "data_reviewer"], owner: false });
    expect(JSON.stringify(entries)).not.toContain(passwords[0]);
  });

  it("sends someone with an existing account an invitation instead, and keeps only its hash", async () => {
    const { admin } = fakeAdmin(["anita@acme.com"]);
    const prepared = await prepareLogins(people, admin);
    const anita = prepared.people[1]!;
    expect(anita.token).toMatch(/^[a-f0-9]{64}$/);
    expect(anita.temporaryPassword).toBeUndefined();
    const entry = JSON.parse(prepared.json)[1];
    expect(entry.subject).toBeUndefined();
    expect(entry.tokenHash).toMatch(/^[a-f0-9]{64}$/);
    expect(entry.tokenHash).not.toBe(anita.token);
    expect(prepared.json).not.toContain(anita.token!);
  });

  it("removes the logins it made when a later one fails, and says why", async () => {
    const { admin, created, deleted } = fakeAdmin([], "ravi@acme.com");
    await expect(prepareLogins(people, admin)).rejects.toThrow(/refused/);
    expect(created).toHaveLength(2);
    expect(deleted.sort()).toEqual(created.sort());
  });

  it("can undo what it created", async () => {
    const { admin, created, deleted } = fakeAdmin();
    const prepared = await prepareLogins(people, admin);
    await prepared.undo();
    expect(deleted.sort()).toEqual(created.sort());
    await prepared.undo();
    expect(deleted).toHaveLength(created.length);
  });

  it("refuses the same email twice, ignoring case, before creating anything", async () => {
    const { admin, created } = fakeAdmin();
    await expect(prepareLogins([people[0]!, { email: "OWNER@acme.com", roleKeys: ["executive"] }], admin)).rejects.toThrow(/more than once/);
    expect(created).toHaveLength(0);
    expect(() => assertDistinct([{ email: "a@b.co" }, { email: "c@d.co" }])).not.toThrow();
  });
});
