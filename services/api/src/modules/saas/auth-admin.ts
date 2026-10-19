import { randomInt } from "node:crypto";

/**
 * Creates and removes logins in Supabase Auth, so an operator can hand a person
 * an email and a temporary password.
 *
 * This needs Supabase's secret key, which can do far more than create users. It
 * is only ever given to the control API (the configuration refuses to start a
 * process that also holds the customer database credential). It never goes in
 * a `VITE_*` variable and never into a log or an error message.
 */
export type CreatedLogin = { status: "created"; id: string } | { status: "exists" };

export interface AuthAdmin {
  /** Creates a confirmed account that must choose its own password at first sign-in. */
  createUser(email: string, password: string): Promise<CreatedLogin>;
  /** Best-effort removal, used to undo logins when the rest of a provisioning step fails. */
  deleteUser(id: string): Promise<void>;
}

export interface AuthAdminOptions {
  supabaseUrl: string;
  secretKey: string;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}

export function createAuthAdmin(options: AuthAdminOptions): AuthAdmin {
  const base = `${options.supabaseUrl.replace(/\/+$/, "")}/auth/v1/admin/users`;
  const call = options.fetchImpl ?? fetch;
  const headers = {
    apikey: options.secretKey,
    Authorization: `Bearer ${options.secretKey}`,
    "Content-Type": "application/json",
  };
  const signal = () => AbortSignal.timeout(options.timeoutMs ?? 10_000);

  return {
    async createUser(email, password) {
      let response: Response;
      try {
        response = await call(base, {
          method: "POST",
          headers,
          signal: signal(),
          body: JSON.stringify({
            email,
            password,
            email_confirm: true,
            user_metadata: { must_change_password: true },
          }),
        });
      } catch {
        throw new Error("The login service did not answer.");
      }
      if (response.status === 422) {
        const body: unknown = await response.json().catch(() => ({}));
        const code = typeof body === "object" && body !== null && "error_code" in body ? body.error_code : undefined;
        const message = typeof body === "object" && body !== null && "msg" in body ? String(body.msg) : "";
        if (code === "email_exists" || /already (been )?registered|already exists/i.test(message)) return { status: "exists" };
        throw new Error("The login service refused this account. Check the email and the password rules.");
      }
      if (!response.ok) throw new Error(`The login service could not create the account (status ${response.status}).`);
      const body: unknown = await response.json().catch(() => ({}));
      const id = typeof body === "object" && body !== null && "id" in body ? body.id : undefined;
      if (typeof id !== "string") throw new Error("The login service returned an unexpected answer.");
      return { status: "created", id };
    },

    async deleteUser(id) {
      try {
        await call(`${base}/${encodeURIComponent(id)}`, { method: "DELETE", headers, signal: signal() });
      } catch {
        // Nothing more can be done here; the caller reports the original failure.
      }
    },
  };
}

const UPPER = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const LOWER = "abcdefghijkmnpqrstuvwxyz";
const DIGITS = "23456789";
const pick = (set: string) => set[randomInt(set.length)]!;

/**
 * A temporary password like `Kd7m-Qx4p-Wn9c`: twelve characters from an alphabet
 * without look-alikes (no 0/O, 1/l/I), always with upper case, lower case and a
 * digit, about 69 bits of randomness. It is shown once and must be changed.
 */
export function temporaryPassword(): string {
  const chars = [pick(UPPER), pick(UPPER), pick(UPPER), pick(LOWER), pick(LOWER), pick(LOWER), pick(LOWER), pick(DIGITS), pick(DIGITS), pick(DIGITS)];
  const all = UPPER + LOWER + DIGITS;
  while (chars.length < 12) chars.push(pick(all));
  // Fisher-Yates with a cryptographic source.
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j]!, chars[i]!];
  }
  const text = chars.join("");
  return `${text.slice(0, 4)}-${text.slice(4, 8)}-${text.slice(8, 12)}`;
}
