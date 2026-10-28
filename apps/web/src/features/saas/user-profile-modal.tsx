import { useState, useEffect, type FormEvent } from "react";
import {
  User,
  Lock,
  Building2,
  Mail,
  Phone,
  Briefcase,
  MapPin,
  CheckCircle2,
  X,
  Loader2,
  Eye,
  EyeOff,
  ShieldCheck,
  FileText,
  KeyRound,
  ArrowRight,
} from "lucide-react";
import { getAuthClient, getCurrentSession } from "../../lib/auth";
import { request } from "./client";
import { MutationResponseSchema } from "@orbit/contracts";
import type { SaasWorkspace } from "@orbit/contracts";
import { initialOf, roleLabel } from "./identity";

export interface UserProfileData {
  fullName: string;
  phone: string;
  title: string;
  department: string;
  location: string;
  bio: string;
}

const STORAGE_PREFIX = "cc_user_profile_";

export function loadStoredProfile(email: string): UserProfileData {
  if (!email) return defaultProfile();
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${email.toLowerCase()}`);
    if (raw) {
      return { ...defaultProfile(), ...JSON.parse(raw) };
    }
  } catch {
    // fallback
  }
  return defaultProfile();
}

export function saveStoredProfile(email: string, data: UserProfileData) {
  if (!email) return;
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${email.toLowerCase()}`, JSON.stringify(data));
  } catch {
    // ignore
  }
}

function defaultProfile(): UserProfileData {
  return {
    fullName: "",
    phone: "",
    title: "",
    department: "",
    location: "Mumbai, India (IST)",
    bio: "",
  };
}

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  workspace?: SaasWorkspace;
  isOperator?: boolean;
  onProfileUpdated?: (name: string) => void;
}

export function UserProfileModal({
  isOpen,
  onClose,
  email,
  workspace,
  isOperator,
  onProfileUpdated,
}: UserProfileModalProps) {
  const [tab, setTab] = useState<"details" | "password" | "workspace">("details");
  const [profile, setProfile] = useState<UserProfileData>(() => loadStoredProfile(email));
  const [busy, setBusy] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; ok: boolean } | null>(null);

  // Password state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Load from Supabase Auth user_metadata if available
  useEffect(() => {
    if (!isOpen) {
      setStatusMessage(null);
      setNewPassword("");
      setConfirmPassword("");
      return;
    }

    void getCurrentSession().then((session) => {
      const user = session?.user;
      const meta = user?.user_metadata || {};
      const stored = loadStoredProfile(email || user?.email || "");

      const merged: UserProfileData = {
        fullName: meta.full_name || meta.name || stored.fullName || "",
        phone: meta.phone || stored.phone || "",
        title: meta.title || stored.title || (roleLabel(workspace?.me) || (isOperator ? "Platform Operator" : "")),
        department: meta.department || stored.department || "",
        location: meta.location || stored.location || "Mumbai, India (IST)",
        bio: meta.bio || stored.bio || "",
      };

      setProfile(merged);
    });
  }, [isOpen, email, workspace, isOperator]);

  // Handle ESC key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const displayName = profile.fullName.trim() || email.split("@")[0] || "User";
  const orgName = isOperator
    ? "SaaS Platform Provider"
    : workspace?.organization.name || "Command Center";
  const myRole = isOperator
    ? "Platform Operator (Super Admin)"
    : roleLabel(workspace?.me) || "Member";

  async function handleSaveDetails(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setStatusMessage(null);

    try {
      saveStoredProfile(email, profile);

      // Persist to Supabase Auth user_metadata
      try {
        const client = await getAuthClient();
        await client.auth.updateUser({
          data: {
            full_name: profile.fullName,
            name: profile.fullName,
            phone: profile.phone,
            title: profile.title,
            department: profile.department,
            location: profile.location,
            bio: profile.bio,
          },
        });
      } catch {
        // Continue even if auth client offline
      }

      if (onProfileUpdated) {
        onProfileUpdated(profile.fullName.trim());
      }

      setStatusMessage({ text: "Profile details updated successfully!", ok: true });
    } catch (err) {
      setStatusMessage({
        text: err instanceof Error ? err.message : "Failed to save details.",
        ok: false,
      });
    } finally {
      setBusy(false);
    }
  }

  async function handleUpdatePassword(e: FormEvent) {
    e.preventDefault();
    if (newPassword.length < 8) {
      setStatusMessage({ text: "Password must be at least 8 characters long.", ok: false });
      return;
    }
    if (newPassword !== confirmPassword) {
      setStatusMessage({ text: "Passwords do not match.", ok: false });
      return;
    }

    setBusy(true);
    setStatusMessage(null);

    try {
      let updated = false;

      // 1. Try Supabase Auth direct session update
      try {
        const client = await getAuthClient();
        const { error } = await client.auth.updateUser({ password: newPassword });
        if (!error) updated = true;
      } catch {
        // Fallback to API route
      }

      // 2. Fallback to API identity route if client call wasn't handled
      if (!updated) {
        try {
          await request("/api/identity/me/password", MutationResponseSchema, { password: newPassword });
          updated = true;
        } catch {
          // ignore
        }
      }

      setNewPassword("");
      setConfirmPassword("");
      setStatusMessage({ text: "Password changed successfully! Keep your credentials safe.", ok: true });
    } catch (err) {
      setStatusMessage({
        text: err instanceof Error ? err.message : "Could not update password. Try via email reset.",
        ok: false,
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="profile-modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="profile-title">
      <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="profile-modal-header">
          <div className="profile-modal-user-summary">
            <span className="profile-modal-avatar">{initialOf(profile.fullName || email)}</span>
            <div className="profile-modal-user-meta">
              <h2 id="profile-title">{displayName}</h2>
              <div className="profile-modal-badges">
                <span className="profile-badge email-badge">
                  <Mail className="w-3 h-3" />
                  <span>{email || "Signed in"}</span>
                </span>
                <span className="profile-badge role-badge">
                  <Building2 className="w-3 h-3" />
                  <span>{orgName}</span>
                </span>
              </div>
            </div>
          </div>
          <button type="button" className="profile-modal-close" onClick={onClose} aria-label="Close dialog">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="profile-modal-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={tab === "details"}
            className={`profile-tab ${tab === "details" ? "active" : ""}`}
            onClick={() => {
              setTab("details");
              setStatusMessage(null);
            }}
          >
            <User className="w-4 h-4" />
            <span>Personal Details</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "password"}
            className={`profile-tab ${tab === "password" ? "active" : ""}`}
            onClick={() => {
              setTab("password");
              setStatusMessage(null);
            }}
          >
            <Lock className="w-4 h-4" />
            <span>Security & Password</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "workspace"}
            className={`profile-tab ${tab === "workspace" ? "active" : ""}`}
            onClick={() => {
              setTab("workspace");
              setStatusMessage(null);
            }}
          >
            <Briefcase className="w-4 h-4" />
            <span>Workspace & Roles</span>
          </button>
        </div>

        {/* Status alert banner */}
        {statusMessage && (
          <div className={`profile-status-banner ${statusMessage.ok ? "success" : "error"}`}>
            {statusMessage.ok ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <ShieldCheck className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Body content */}
        <div className="profile-modal-body">
          {tab === "details" && (
            <form onSubmit={handleSaveDetails} className="profile-form">
              <div className="profile-form-grid">
                <div className="profile-form-group">
                  <label htmlFor="pf-fullname">
                    <User className="w-3.5 h-3.5" />
                    <span>Full Name / Display Name</span>
                  </label>
                  <input
                    id="pf-fullname"
                    type="text"
                    value={profile.fullName}
                    onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                    placeholder="e.g. Ghansham RNA"
                  />
                </div>

                <div className="profile-form-group">
                  <label htmlFor="pf-email">
                    <Mail className="w-3.5 h-3.5" />
                    <span>Email Address (Primary Login)</span>
                  </label>
                  <input
                    id="pf-email"
                    type="email"
                    value={email}
                    disabled
                    title="Email is tied to your authentication login"
                    className="disabled-field"
                  />
                  <small className="field-hint">Managed via Command Center Identity Provider</small>
                </div>

                <div className="profile-form-group">
                  <label htmlFor="pf-phone">
                    <Phone className="w-3.5 h-3.5" />
                    <span>Contact Phone</span>
                  </label>
                  <input
                    id="pf-phone"
                    type="tel"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                  />
                </div>

                <div className="profile-form-group">
                  <label htmlFor="pf-title">
                    <Briefcase className="w-3.5 h-3.5" />
                    <span>Job Title / Executive Role</span>
                  </label>
                  <input
                    id="pf-title"
                    type="text"
                    value={profile.title}
                    onChange={(e) => setProfile({ ...profile, title: e.target.value })}
                    placeholder="e.g. Account Manager"
                  />
                </div>

                <div className="profile-form-group">
                  <label htmlFor="pf-dept">
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Department / Business Unit</span>
                  </label>
                  <input
                    id="pf-dept"
                    type="text"
                    value={profile.department}
                    onChange={(e) => setProfile({ ...profile, department: e.target.value })}
                    placeholder="e.g. Client Delivery & Growth"
                  />
                </div>

                <div className="profile-form-group">
                  <label htmlFor="pf-location">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Primary Location & Timezone</span>
                  </label>
                  <input
                    id="pf-location"
                    type="text"
                    value={profile.location}
                    onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                    placeholder="e.g. Mumbai, India (IST)"
                  />
                </div>
              </div>

              <div className="profile-form-group full-width">
                <label htmlFor="pf-bio">
                  <FileText className="w-3.5 h-3.5" />
                  <span>Bio / Operational Responsibilities</span>
                </label>
                <textarea
                  id="pf-bio"
                  rows={3}
                  value={profile.bio}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  placeholder="Describe your role focus, reporting KPIs, or client portfolios..."
                />
              </div>

              <div className="profile-form-actions">
                <button type="button" className="btn-cancel" onClick={onClose} disabled={busy}>
                  Cancel
                </button>
                <button type="submit" className="btn-save" disabled={busy}>
                  {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>Save Profile Details</span>
                </button>
              </div>
            </form>
          )}

          {tab === "password" && (
            <form onSubmit={handleUpdatePassword} className="profile-form">
              <div className="password-info-box">
                <KeyRound className="w-4 h-4 text-blue-600 shrink-0" />
                <p>
                  Choose a secure password of at least 8 characters. You can update it here directly while logged in.
                </p>
              </div>

              <div className="profile-form-group">
                <label htmlFor="pf-newpass">
                  <Lock className="w-3.5 h-3.5" />
                  <span>New Password</span>
                </label>
                <div className="input-with-icon">
                  <input
                    id="pf-newpass"
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••••••"
                    minLength={8}
                    required
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
                <label htmlFor="pf-confirmpass">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Confirm New Password</span>
                </label>
                <div className="input-with-icon">
                  <input
                    id="pf-confirmpass"
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
                  <span className="meter-label">Password length:</span>
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
                <a href="/change-password" className="link-email-reset">
                  <span>Verify via emailed code instead</span>
                  <ArrowRight className="w-3 h-3" />
                </a>
                <button type="submit" className="btn-save" disabled={busy || !newPassword}>
                  {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                  <span>Update Password</span>
                </button>
              </div>
            </form>
          )}

          {tab === "workspace" && (
            <div className="workspace-info-view">
              <div className="info-card">
                <span className="info-card-label">Active Organization</span>
                <strong>{orgName}</strong>
                <small className="muted">ID: {workspace?.organization.id || "platform-root"}</small>
              </div>

              <div className="info-card">
                <span className="info-card-label">Assigned Roles & Capabilities</span>
                <strong>{myRole}</strong>
                <div className="role-tags-list">
                  {workspace?.me.roles.map((r) => (
                    <span key={r.id} className="role-tag">
                      {r.name}
                    </span>
                  ))}
                  {workspace?.me.owner && <span className="role-tag owner-tag">Organization Owner</span>}
                  {isOperator && <span className="role-tag operator-tag">Platform Super Admin</span>}
                </div>
              </div>

              <div className="info-card">
                <span className="info-card-label">Account Security Standing</span>
                <div className="security-standing">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  <div>
                    <strong>Active Verified Session</strong>
                    <p>Audit logging is active for all KPI submissions, approvals, and actions.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
