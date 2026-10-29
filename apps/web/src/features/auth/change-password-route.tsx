import { useEffect, useState, type FormEvent } from "react";
import { MutationResponseSchema, PasswordCodeResponseSchema } from "@orbit/contracts";
import { KeyRound, ShieldCheck, ArrowLeft, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import { getCurrentSession, signOut } from "../../lib/auth";
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
 * Email verification is mandatory; there is no browser-only password bypass.
 */
export function ChangePasswordRoute() {
  const [firstTime, setFirstTime] = useState(false);
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<"code" | "done">("code");
  const [sentTo, setSentTo] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void getCurrentSession().then((session) => {
      const isFirst = mustChangePassword(session?.user);
      setFirstTime(isFirst);
      const userEmail = session?.user.email ?? "";
      setEmail(userEmail);
      setSentTo(userEmail);
      void sendCode();
    });
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  async function finish() {
    // End current session so the user must authenticate with their newly set password
    try {
      await signOut();
    } catch {
      // ignore
    }
    setStep("done");
    setMessage("Your password has been changed successfully. Redirecting to login…");
    const target = email ? `/login?reset=success&email=${encodeURIComponent(email)}` : "/login?reset=success";
    setTimeout(() => {
      window.location.assign(target);
    }, 1500);
  }

  async function sendCode() {
    setBusy(true);
    setMessage("");
    try {
      const result = await request("/api/identity/me/password-code", PasswordCodeResponseSchema, {});
      setSentTo(result.sentTo);
      setCooldown(60);
      setMessage(`A 6-digit verification code has been dispatched to ${result.sentTo}. Please check your inbox and spam folder.`);
    } catch (error) {
      const text = error instanceof Error ? error.message : "";
      setMessage(text || "The verification code could not be sent. Please click Resend Code.");
    } finally {
      setBusy(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const codeVal = field(data, "code").trim();
    if (!codeVal) {
      setMessage("Please enter the 6-digit verification code sent to your email.");
      return;
    }
    const password = field(data, "password");
    if (password !== field(data, "confirmation")) {
      setMessage("Passwords do not match.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      await request("/api/identity/me/password", MutationResponseSchema, { code: codeVal, password });
      await finish();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Password could not be changed.");
    } finally {
      setBusy(false);
    }
  }

  const passwordFields = (
    <div className="space-y-4">
      <div>
        <label htmlFor="new-password" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
          New password
        </label>
        <input
          id="new-password"
          name="password"
          type="password"
          minLength={8}
          maxLength={72}
          required
          autoComplete="new-password"
          placeholder="••••••••••••"
          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
        />
      </div>
      <div>
        <label htmlFor="confirm-password" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
          Confirm password
        </label>
        <input
          id="confirm-password"
          name="confirmation"
          type="password"
          minLength={8}
          maxLength={72}
          required
          autoComplete="new-password"
          placeholder="••••••••••••"
          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
        />
      </div>
      <p className="text-xs text-slate-400">At least 8 characters, and not your email address.</p>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-slate-50" style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif" }}>
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200/60 flex items-center justify-center text-blue-600 mb-3 shadow-2xs">
            <KeyRound className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
            Security Authorization
          </span>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            {firstTime ? "Set Up Your Permanent Password" : "Change Password"}
          </h1>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            {firstTime
              ? "Validate your email address with the one-time code (OTP) and choose a permanent password."
              : "Update your credentials to maintain executive audit compliance."}
          </p>
        </div>

        <div className="p-6 space-y-5">
          {message && (
            <div className={`p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 ${
              step === "done"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-blue-50 text-blue-800 border border-blue-200"
            }`}>
              {step === "done" ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />}
              <span>{message}</span>
            </div>
          )}

          {step === "done" ? (
            <div className="text-center py-4 space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto ring-8 ring-emerald-50/50">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <p className="text-base font-bold text-slate-800">Password successfully updated!</p>
                <p className="text-xs text-slate-500 mt-1">
                  Your session has ended. Redirecting you to sign in with your new credentials…
                </p>
              </div>
              <a
                href={email ? `/login?reset=success&email=${encodeURIComponent(email)}` : "/login?reset=success"}
                className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition-colors"
              >
                <span>Proceed to Sign In</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          ) : (
            <form onSubmit={(event) => void submit(event)} className="space-y-4">
              <div className="p-3 bg-blue-50/70 border border-blue-200/60 rounded-xl text-xs text-blue-900">
                A verification code was dispatched to <strong>{sentTo || email}</strong> (valid for 10 minutes).
              </div>

              <div>
                <label htmlFor="password-code" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  6-digit Email Verification Code (OTP) *
                </label>
                <input
                  id="password-code"
                  name="code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="\d{6}"
                  maxLength={6}
                  required
                  placeholder="123456"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono tracking-widest text-center focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
              </div>
              {passwordFields}
              <button
                type="submit"
                disabled={busy}
                className="w-full py-2.5 px-4 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Validate Email & Save Permanent Password</span>
              </button>
              <button
                type="button"
                disabled={busy || cooldown > 0}
                onClick={() => void sendCode()}
                className="w-full py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer disabled:opacity-50"
              >
                {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
              </button>
            </form>
          )}

          {!firstTime && step !== "done" && (
            <div className="pt-3 border-t border-slate-100 text-center">
              <a
                href="/"
                className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors"
              >
                <ArrowLeft className="w-3 h-3" />
                <span>Return to Workspace</span>
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
