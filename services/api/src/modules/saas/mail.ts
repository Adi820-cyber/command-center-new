import { appendFile } from "node:fs/promises";

/**
 * Sends one plain-text email. Two ways, chosen by configuration:
 *
 *  - `brevo`: Brevo's transactional email API (free plan: 300 emails a day, no
 *    own domain needed; the sender address must be verified in Brevo). One HTTPS
 *    call, so no mail library is needed.
 *  - `outbox`: appends the message to a local file. For tests and the local demo
 *    only; nothing leaves the computer.
 *
 * Errors never include the API key or the message body.
 */
export interface Mailer {
  send(to: string, subject: string, text: string): Promise<void>;
}

export type MailConfig =
  | { provider: "brevo"; apiKey: string; fromEmail: string; fromName: string }
  | { provider: "outbox"; file: string };

export function createMailer(config: MailConfig, fetchImpl: typeof fetch = fetch): Mailer {
  if (config.provider === "outbox") {
    return {
      async send(to, subject, text) {
        await appendFile(config.file, `${JSON.stringify({ to, subject, text, at: new Date().toISOString() })}\n`);
      },
    };
  }
  return {
    async send(to, subject, text) {
      let response: Response;
      try {
        response = await fetchImpl("https://api.brevo.com/v3/smtp/email", {
          method: "POST",
          headers: { "api-key": config.apiKey, "Content-Type": "application/json", Accept: "application/json" },
          signal: AbortSignal.timeout(10_000),
          body: JSON.stringify({
            sender: { email: config.fromEmail, name: config.fromName },
            to: [{ email: to }],
            subject,
            textContent: text,
          }),
        });
      } catch {
        throw new Error("The email service did not answer.");
      }
      if (!response.ok) throw new Error(`The email service refused the message (status ${response.status}).`);
    },
  };
}

/** "anita@acme.com" -> "an•••@acme.com", so a page can say where a code went without showing the whole address. */
export function maskEmail(email: string): string {
  const [name = "", domain = ""] = email.split("@");
  return `${name.slice(0, 2)}${"•".repeat(Math.max(3, name.length - 2))}@${domain}`;
}
