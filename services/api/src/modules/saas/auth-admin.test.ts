import { describe, expect, it } from "vitest";
import { createAuthAdmin, temporaryPassword } from "./auth-admin.ts";

const reply = (status: number, body: unknown) => new Response(JSON.stringify(body), { status });
const urlOf = (input: Parameters<typeof fetch>[0]) => (typeof input === "string" ? input : input instanceof URL ? input.href : input.url);
const bodyOf = (init?: RequestInit) => (typeof init?.body === "string" ? init.body : "");
const admin = (fetchImpl: typeof fetch) =>
  createAuthAdmin({ supabaseUrl: "https://project.supabase.co/", secretKey: "sb_secret_TESTKEY", fetchImpl });

describe("temporaryPassword", () => {
  it("has twelve characters in three groups and avoids look-alikes", () => {
    for (let i = 0; i < 300; i++) {
      const p = temporaryPassword();
      expect(p).toMatch(/^[A-Za-z0-9]{4}-[A-Za-z0-9]{4}-[A-Za-z0-9]{4}$/);
      expect(p).not.toMatch(/[01OIl]/);
    }
  });

  it("always has upper case, lower case and a digit", () => {
    for (let i = 0; i < 300; i++) {
      const p = temporaryPassword();
      expect(p).toMatch(/[A-Z]/);
      expect(p).toMatch(/[a-z]/);
      expect(p).toMatch(/[2-9]/);
    }
  });

  it("does not repeat", () => {
    expect(new Set(Array.from({ length: 500 }, temporaryPassword)).size).toBe(500);
  });
});

describe("createAuthAdmin", () => {
  it("creates a confirmed account flagged to change its password, using the secret key", async () => {
    let seen: { url: string; init: RequestInit } | undefined;
    const result = await admin(async (url, init) => {
      seen = { url: urlOf(url), init: init ?? {} };
      return reply(200, { id: "0ae98de5-74d7-4145-867a-d23526ee7a07" });
    }).createUser("anita@acme.com", "Ab3d-Efg4-Hjk5");
    expect(result).toEqual({ status: "created", id: "0ae98de5-74d7-4145-867a-d23526ee7a07" });
    expect(seen?.url).toBe("https://project.supabase.co/auth/v1/admin/users");
    const headers = seen?.init.headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer sb_secret_TESTKEY");
    expect(JSON.parse(bodyOf(seen?.init))).toEqual({
      email: "anita@acme.com",
      password: "Ab3d-Efg4-Hjk5",
      email_confirm: true,
      user_metadata: { must_change_password: true },
      app_metadata: { must_change_password: true },
    });
  });

  it("reports an existing account instead of failing", async () => {
    expect(await admin(async () => reply(422, { error_code: "email_exists", msg: "x" })).createUser("a@b.co", "pw")).toEqual({ status: "exists" });
    expect(await admin(async () => reply(422, { msg: "A user with this email address has already been registered" })).createUser("a@b.co", "pw")).toEqual({ status: "exists" });
  });

  it("explains a refused password without echoing the secret, the password or the provider's body", async () => {
    const error = await admin(async () => reply(422, { error_code: "weak_password", msg: "secret detail sb_secret_TESTKEY" }))
      .createUser("a@b.co", "SuperSecretPw1")
      .catch((e: Error) => e);
    expect(error).toBeInstanceOf(Error);
    const text = (error as Error).message;
    expect(text).toMatch(/refused/);
    expect(text).not.toContain("sb_secret_TESTKEY");
    expect(text).not.toContain("SuperSecretPw1");
  });

  it("never leaks the key when the service is unreachable or errors", async () => {
    const down = await admin(async () => { throw new Error("connect sb_secret_TESTKEY failed"); }).createUser("a@b.co", "pw").catch((e: Error) => e);
    expect((down as Error).message).not.toContain("sb_secret_TESTKEY");
    const broken = await admin(async () => reply(500, { msg: "sb_secret_TESTKEY" })).createUser("a@b.co", "pw").catch((e: Error) => e);
    expect((broken as Error).message).toMatch(/status 500/);
    expect((broken as Error).message).not.toContain("sb_secret_TESTKEY");
  });

  it("rejects an answer without an id", async () => {
    await expect(admin(async () => reply(200, {})).createUser("a@b.co", "pw")).rejects.toThrow(/unexpected/);
  });

  it("deletes by id and swallows failure", async () => {
    const calls: string[] = [];
    await admin(async (url, init) => { calls.push(`${init?.method} ${urlOf(url)}`); return reply(200, {}); }).deleteUser("abc");
    expect(calls).toEqual(["DELETE https://project.supabase.co/auth/v1/admin/users/abc"]);
    await expect(admin(async () => { throw new Error("down"); }).deleteUser("abc")).resolves.toBeUndefined();
  });

  it("resets a password with the must-change flag, and never leaks the key", async () => {
    let seen: { url: string; init?: RequestInit } | undefined;
    await admin(async (url, init) => { seen = { url: urlOf(url), init }; return reply(200, {}); }).resetPassword("abc", "Ab3d-Efg4-Hjk5");
    expect(seen?.url).toBe("https://project.supabase.co/auth/v1/admin/users/abc");
    expect(seen?.init?.method).toBe("PUT");
    expect(JSON.parse(bodyOf(seen?.init))).toEqual({ password: "Ab3d-Efg4-Hjk5", user_metadata: { must_change_password: true }, app_metadata: { must_change_password: true } });
    const failed = await admin(async () => reply(500, { msg: "sb_secret_TESTKEY" })).resetPassword("abc", "pw").catch((e: Error) => e);
    expect((failed as Error).message).toMatch(/status 500/);
    expect((failed as Error).message).not.toContain("sb_secret_TESTKEY");
  });

  it("sets the person's own password and clears the flag in both places", async () => {
    let body: unknown;
    await admin(async (_url, init) => { body = JSON.parse(bodyOf(init)); return reply(200, {}); }).setOwnPassword("abc", "My-own-password-1");
    expect(body).toEqual({ password: "My-own-password-1", user_metadata: { must_change_password: false }, app_metadata: { must_change_password: false } });
  });
});
