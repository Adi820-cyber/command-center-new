import { useState, useEffect, type FormEvent } from "react";
import {
  KeyRound,
  Mail,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  Loader2,
  X,
  AlertCircle,
} from "lucide-react";
import { publicRequest } from "../saas/client";
import {
  RequestPasswordResetOtpResponseSchema,
  VerifyPasswordResetOtpResponseSchema,
  ConfirmPasswordResetResponseSchema,
} from "@orbit/contracts";

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialEmail?: string;
  onSuccess: (email: string, message: string) => void;
}

export function ForgotPasswordModal({
  isOpen,
  onClose,
  initialEmail = "",
  onSuccess,
}: ForgotPasswordModalProps) {
  const [step, setStep] = useState<"email" | "otp" | "password">("email");
  const [email, setEmail] = useState(initialEmail);
  const [otpCode, setOtpCode] = useState("");
  const [sentTo, setSentTo] = useState("");
  const [resetToken, setResetToken] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [cooldown, setCooldown] = useState(0);

  // Initialize email when modal opens
  useEffect(() => {
    if (isOpen) {
      setEmail(initialEmail);
      setStep("email");
      setOtpCode("");
      setNewPassword("");
      setConfirmPassword("");
      setMessage(null);
    }
  }, [isOpen, initialEmail]);

  // Cooldown timer for resending OTP
  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Step 1: Request OTP
  async function handleSendOtp(e?: FormEvent) {
    if (e) e.preventDefault();
    const targetEmail = email.trim().toLowerCase();
    if (!targetEmail || !targetEmail.includes("@")) {
      setMessage({ text: "Please enter a valid work email address.", ok: false });
      return;
    }

    setBusy(true);
    setMessage(null);

    try {
      const res = await publicRequest(
        "/api/identity/password-reset/request-otp",
        RequestPasswordResetOtpResponseSchema,
        { email: targetEmail },
      );

      setSentTo(res.sentTo);
      setStep("otp");
      setCooldown(60);
      setMessage({
        text: `Verification code sent to ${res.sentTo}. Please check your email inbox and spam folder.`,
        ok: true,
      });
    } catch (err) {
      setMessage({
        text: err instanceof Error ? err.message : "Failed to send verification code. Please check your email and try again.",
        ok: false,
      });
    } finally {
      setBusy(false);
    }
  }

  // Step 2: Validate Email by OTP
  async function handleVerifyOtp(e: FormEvent) {
    e.preventDefault();
    const code = otpCode.trim();
    if (code.length !== 6) {
      setMessage({ text: "Please enter the complete 6-digit OTP code.", ok: false });
      return;
    }

    setBusy(true);
    setMessage(null);

    try {
      const res = await publicRequest(
        "/api/identity/password-reset/verify-otp",
        VerifyPasswordResetOtpResponseSchema,
        { email: email.trim().toLowerCase(), otpCode: code },
      );

      if (res.ok) {
        setResetToken(res.resetToken);
        setStep("password");
        setMessage({
          text: "Email verified successfully! You now have permission to choose a new password.",
          ok: true,
        });
      }
    } catch (err) {
      setMessage({
        text: err instanceof Error ? err.message : "Incorrect verification code. Please check your email and try again.",
        ok: false,
      });
    } finally {
      setBusy(false);
    }
  }

  // Step 3: Confirm Password Reset
  async function handleResetPassword(e: FormEvent) {
    e.preventDefault();
    if (newPassword.length < 8) {
      setMessage({ text: "Password must be at least 8 characters long.", ok: false });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage({ text: "Passwords do not match.", ok: false });
      return;
    }

    setBusy(true);
    setMessage(null);

    try {
      await publicRequest(
        "/api/identity/password-reset/confirm",
        ConfirmPasswordResetResponseSchema,
        {
          email: email.trim().toLowerCase(),
          resetToken,
          password: newPassword,
        },
      );

      onSuccess(email.trim().toLowerCase(), "Password reset successfully. Sign in with your new password.");
      onClose();
    } catch (err) {
      setMessage({
        text: err instanceof Error ? err.message : "Failed to reset password. Please try again.",
        ok: false,
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="profile-modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="forgot-password-title"
    >
      <div className="profile-modal" style={{ maxWidth: 460 }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="profile-modal-header" style={{ padding: "18px 22px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: "#eff6ff",
                border: "1px solid #bfdbfe",
                display: "grid",
                placeItems: "center",
                color: "#2563eb",
              }}
            >
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 id="forgot-password-title" style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "#0f172a" }}>
                Reset Your Password
              </h2>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "#64748b" }}>
                {step === "email" && "Step 1 of 3: Enter your account email"}
                {step === "otp" && "Step 2 of 3: Validate your email with OTP"}
                {step === "password" && "Step 3 of 3: Choose your new password"}
              </p>
            </div>
          </div>
          <button type="button" className="profile-modal-close" onClick={onClose} aria-label="Close dialog">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step indicator bar */}
        <div style={{ display: "flex", height: 3, background: "#f1f5f9" }}>
          <div
            style={{
              height: "100%",
              width: step === "email" ? "33%" : step === "otp" ? "66%" : "100%",
              background: "#2563eb",
              transition: "width 0.3s ease",
            }}
          />
        </div>

        {/* Status message */}
        {message && (
          <div
            className={`profile-status-banner ${message.ok ? "success" : "error"}`}
            style={{ margin: "14px 20px 0" }}
          >
            {message.ok ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        <div className="profile-modal-body" style={{ padding: "18px 22px 24px" }}>
          {/* STEP 1: Enter email to receive OTP */}
          {step === "email" && (
            <form onSubmit={handleSendOtp} className="profile-form">
              <p style={{ fontSize: 13, color: "#475569", lineHeight: 1.5, margin: 0 }}>
                Enter the work email address tied to your Command Center account. We will dispatch a 6-digit verification code (OTP) to confirm your identity.
              </p>

              <div className="profile-form-group">
                <label htmlFor="fp-email">
                  <Mail className="w-3.5 h-3.5" />
                  <span>Work Email Address</span>
                </label>
                <input
                  id="fp-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@organization.com"
                  required
                  autoFocus
                />
              </div>

              <div className="profile-form-actions">
                <button type="button" className="btn-cancel" onClick={onClose} disabled={busy}>
                  Cancel
                </button>
                <button type="submit" className="btn-save" disabled={busy || !email}>
                  {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                  <span>Send OTP Verification Code</span>
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: Validate Email with OTP */}
          {step === "otp" && (
            <form onSubmit={handleVerifyOtp} className="profile-form">
              <div
                style={{
                  padding: "12px 14px",
                  background: "#eff6ff",
                  border: "1px solid #bfdbfe",
                  borderRadius: 10,
                  fontSize: 12,
                  color: "#1e40af",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                }}
              >
                <ShieldCheck className="w-4 h-4 shrink-0 text-blue-600 mt-0.5" />
                <div>
                  A 6-digit verification code was sent to <strong>{sentTo}</strong> (valid for 10 minutes).
                  Please enter it below to confirm email authorization.
                </div>
              </div>

              <div className="profile-form-group" style={{ textAlign: "center" }}>
                <label htmlFor="fp-otp" style={{ justifyContent: "center" }}>
                  <span>Enter 6-Digit OTP Code</span>
                </label>
                <input
                  id="fp-otp"
                  type="text"
                  inputMode="numeric"
                  pattern="\d{6}"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="123456"
                  required
                  autoFocus
                  style={{
                    fontFamily: "ui-monospace, monospace",
                    fontSize: 26,
                    fontWeight: 700,
                    letterSpacing: "0.25em",
                    textAlign: "center",
                    maxWidth: 220,
                    margin: "0 auto",
                    padding: "8px 12px",
                  }}
                />
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12 }}>
                <button
                  type="button"
                  onClick={() => setStep("email")}
                  style={{ background: "transparent", border: 0, color: "#64748b", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4 }}
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Change email</span>
                </button>
                <button
                  type="button"
                  disabled={busy || cooldown > 0}
                  onClick={() => void handleSendOtp()}
                  style={{
                    background: "transparent",
                    border: 0,
                    color: cooldown > 0 ? "#94a3b8" : "#2563eb",
                    cursor: cooldown > 0 ? "default" : "pointer",
                    fontWeight: 600,
                  }}
                >
                  {cooldown > 0 ? `Resend OTP in ${cooldown}s` : "Resend OTP"}
                </button>
              </div>

              <div className="profile-form-actions">
                <button type="button" className="btn-cancel" onClick={onClose} disabled={busy}>
                  Cancel
                </button>
                <button type="submit" className="btn-save" disabled={busy || otpCode.length !== 6}>
                  {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                  <span>Verify Email & Unlock</span>
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: Permission granted -> Set New Password */}
          {step === "password" && (
            <form onSubmit={handleResetPassword} className="profile-form">
              <div
                style={{
                  padding: "10px 14px",
                  background: "#ecfdf5",
                  border: "1px solid #a7f3d0",
                  borderRadius: 10,
                  fontSize: 12,
                  color: "#065f46",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  <strong>Email validated:</strong> You have permission to set a new password for{" "}
                  <strong>{email}</strong>.
                </span>
              </div>

              <div className="profile-form-group">
                <label htmlFor="fp-newpass">
                  <Lock className="w-3.5 h-3.5" />
                  <span>New Password</span>
                </label>
                <div className="input-with-icon">
                  <input
                    id="fp-newpass"
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••••••"
                    minLength={8}
                    required
                    autoFocus
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="profile-form-group">
                <label htmlFor="fp-confirmpass">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Confirm New Password</span>
                </label>
                <div className="input-with-icon">
                  <input
                    id="fp-confirmpass"
                    type={showConfirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••••••"
                    minLength={8}
                    required
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowConfirm(!showConfirm)}
                    tabIndex={-1}
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {newPassword && (
                <div className="password-meter">
                  <span className="meter-label">Strength:</span>
                  <div className="meter-bar">
                    <div
                      className={`meter-fill ${
                        newPassword.length >= 12
                          ? "strong"
                          : newPassword.length >= 8
                            ? "medium"
                            : "weak"
                      }`}
                      style={{ width: `${Math.min(100, (newPassword.length / 14) * 100)}%` }}
                    />
                  </div>
                  <span className="meter-text">
                    {newPassword.length >= 12
                      ? "Strong"
                      : newPassword.length >= 8
                        ? "Good"
                        : "Too short"}
                  </span>
                </div>
              )}

              <div className="profile-form-actions">
                <button type="button" className="btn-cancel" onClick={onClose} disabled={busy}>
                  Cancel
                </button>
                <button type="submit" className="btn-save" disabled={busy || !newPassword}>
                  {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                  <span>Change Password & Sign In</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
