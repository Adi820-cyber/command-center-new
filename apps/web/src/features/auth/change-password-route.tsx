import { useEffect, useState, type FormEvent } from "react";
import { MutationResponseSchema, PasswordCodeResponseSchema } from "@orbit/contracts";
import { getAuthClient, getCurrentSession } from "../../lib/auth";
import { request } from "../saas/client";

/** True while the person still has a temporary password (server copy first). */
export function mustChangePassword(user: { app_metadata?: Record<string, unknown>; user_metadata?: Record<string, unknown> } | undefined): boolean {
  if (!user) return false;
  const server = user.app_metadata?.must_change_password;
  if (typeof server === "boolean") return server;
  return user.user_metadata?.must_change_password === true;
}

const field = (data: FormData, name: string) => {
  const value = data.get(name);
  return typeof value === "string" ? value : "";
};

/**
 * Changing your password. A 6-digit code is sent to your email first; the change
 * only happens with that code. This is also how a temporary password is replaced.
 * Where email codes are not set up yet, the page falls back to a direct change.
 */
export function ChangePasswordRoute() {
  const [firstTime, setFirstTime] = useState(false);
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<"start" | "code" | "done">("start");
  const [sentTo, setSentTo] = useState("");
  const [direct, setDirect] = useState(!import.meta.env.VITE_IDENTITY_API_BASE_URL?.trim());
  const [cooldown, setCooldown] = useState(0);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void getCurrentSession().then((session) => {
      setFirstTime(mustChangePassword(session?.user));
      setEmail(session?.user.email ?? "");
    });
  }, []);
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  async function finish() {
    // A new token without the "must change" flag.
    const client = await getAuthClient();
    await client.auth.refreshSession();
    setStep("done");
    setMessage("Your password has been changed.");
    if (firstTime) setTimeout(() => window.location.assign("/"), 1200);
  }

  async function sendCode() {
    setBusy(true);
    setMessage("");
    try {
      const result = await request("/api/identity/me/password-code", PasswordCodeResponseSchema, {});
      setSentTo(result.sentTo);
      setStep("code");
      setCooldown(60);
    } catch (error) {
      const text = error instanceof Error ? error.message : "";
      if (/not set up/.test(text)) setDirect(true);
      else setMessage(text || "The code could not be sent.");
    } finally {
      setBusy(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const password = field(data, "password");
    if (password !== field(data, "confirmation")) {
      setMessage("Passwords do not match.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      if (direct) {
        const client = await getAuthClient();
        const { error } = await client.auth.updateUser({ password, data: { must_change_password: false } });
        if (error) throw new Error("Password could not be changed. Check your session and password requirements.");
      } else {
        await request("/api/identity/me/password", MutationResponseSchema, { code: field(data, "code").trim(), password });
      }
      await finish();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Password could not be changed.");
    } finally {
      setBusy(false);
    }
  }

  const passwordFields = (
    <>
      <label>
        New password
        <input name="password" type="password" minLength={12} maxLength={72} required autoComplete="new-password" />
      </label>
      <label>
        Confirm password
        <input name="confirmation" type="password" minLength={12} maxLength={72} required autoComplete="new-password" />
      </label>
      <p className="muted" style={{ margin: 0 }}>At least 12 characters, and not your email address.</p>
    </>
  );

  return (
    <main className="saas-auth">
      <h1>{firstTime ? "Choose your own password" : "Change password"}</h1>
      {firstTime && <p>You signed in with a temporary password. Choose your own now, and then your workspace opens.</p>}

      {step === "done" ? null : direct ? (
        <form onSubmit={(event) => void submit(event)}>
          {passwordFields}
          <button disabled={busy}>Save password</button>
        </form>
      ) : step === "start" ? (
        <>
          <p>
            To keep your account safe, we first send a 6-digit code to <strong>{email || "your email"}</strong>.
          </p>
          <button type="button" disabled={busy} onClick={() => void sendCode()}>
            {busy ? "Sending…" : "Email me a code"}
          </button>
        </>
      ) : (
        <form onSubmit={(event) => void submit(event)}>
          <p>
            We sent a code to <strong>{sentTo}</strong>. It works for 10 minutes. Check your spam folder if it is not there.
          </p>
          <label>
            Code from the email
            <input name="code" inputMode="numeric" autoComplete="one-time-code" pattern="\d{6}" maxLength={6} required placeholder="123456" />
          </label>
          {passwordFields}
          <button disabled={busy}>{busy ? "Saving…" : "Change password"}</button>
          <button type="button" className="secondary" disabled={busy || cooldown > 0} onClick={() => void sendCode()}>
            {cooldown > 0 ? `Send a new code in ${cooldown}s` : "Send a new code"}
          </button>
        </form>
      )}
      <output>{message}</output>
      {!firstTime && <a href="/">Return to workspace</a>}
    </main>
  );
}
