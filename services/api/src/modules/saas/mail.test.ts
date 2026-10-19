import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { createMailer, maskEmail } from "./mail.ts";

const dir = mkdtempSync(join(tmpdir(), "mail-"));
afterAll(() => rmSync(dir, { recursive: true, force: true }));

describe("createMailer", () => {
  it("writes to a local outbox, one message per line", async () => {
    const file = join(dir, "outbox.jsonl");
    const mailer = createMailer({ provider: "outbox", file });
    await mailer.send("a@acme.com", "Your code", "123456");
    await mailer.send("b@acme.com", "Your code", "654321");
    const lines = readFileSync(file, "utf8").trim().split("\n").map((l) => JSON.parse(l));
    expect(lines.map((l) => [l.to, l.text])).toEqual([["a@acme.com", "123456"], ["b@acme.com", "654321"]]);
  });

  it("sends through Brevo with the key in a header and the sender it was given", async () => {
    let seen: { url: string; init?: RequestInit } | undefined;
    const mailer = createMailer({ provider: "brevo", apiKey: "xkeysib-SECRET", fromEmail: "noreply@acme.com", fromName: "Command Center" }, async (url, init) => {
      seen = { url: typeof url === "string" ? url : url instanceof URL ? url.href : url.url, init };
      return new Response("{}", { status: 201 });
    });
    await mailer.send("a@acme.com", "Your code", "Your code is 123456");
    expect(seen?.url).toBe("https://api.brevo.com/v3/smtp/email");
    const headers = (seen?.init?.headers ?? {}) as Record<string, string>;
    expect(headers["api-key"]).toBe("xkeysib-SECRET");
    const body = seen?.init?.body;
    expect(JSON.parse(typeof body === "string" ? body : "{}")).toEqual({
      sender: { email: "noreply@acme.com", name: "Command Center" },
      to: [{ email: "a@acme.com" }],
      subject: "Your code",
      textContent: "Your code is 123456",
    });
  });

  it("never puts the key or the message in an error", async () => {
    const refused = createMailer({ provider: "brevo", apiKey: "xkeysib-SECRET", fromEmail: "n@a.co", fromName: "C" }, async () => new Response('{"message":"xkeysib-SECRET"}', { status: 401 }));
    const error = await refused.send("a@acme.com", "s", "code 123456").catch((e: Error) => e);
    expect((error as Error).message).toMatch(/status 401/);
    expect((error as Error).message).not.toContain("xkeysib");
    expect((error as Error).message).not.toContain("123456");
    const down = createMailer({ provider: "brevo", apiKey: "xkeysib-SECRET", fromEmail: "n@a.co", fromName: "C" }, async () => { throw new Error("xkeysib-SECRET down"); });
    expect(((await down.send("a@acme.com", "s", "t").catch((e: Error) => e)) as Error).message).not.toContain("xkeysib");
  });
});

describe("maskEmail", () => {
  it("shows the start of the name and the domain", () => {
    expect(maskEmail("anita@acme.com")).toBe("an•••@acme.com");
    expect(maskEmail("ghanshamrn.a27@gmail.com")).toBe("gh••••••••••••@gmail.com");
    expect(maskEmail("a@b.co")).toBe("a•••@b.co");
  });
});
