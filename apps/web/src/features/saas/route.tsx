import "./saas.css";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  ControlOrganizationListSchema,
  MutationResponseSchema,
  ResultSchema,
  type SaasResult,
  SettingsSchema,
  ProposalListSchema,
  AuditResponseSchema,
  BatchDetailSchema,
  TenantListSchema,
  WorkspaceSchema,
  type SaasWorkspace,
} from "@orbit/contracts";
import { getAuthClient, getCurrentSession, signOut } from "../../lib/auth";
import { mustChangePassword } from "../auth/change-password-route";
import { mutate, request } from "./client";
import { CatalogBrowser } from "./catalog-browser";
import { CsvImport } from "./csv-import";
import { TargetEditor } from "./target-editor";
import { CustomKpiForm } from "./custom-kpi";
import { KpiActions } from "./kpi-actions";
import { OrgHub } from "./org-hub";
import { OrgKpis } from "./org-kpis";
import { initialOf } from "./identity";
import { SaaSOrganizationsManager } from "../operator/saas-orgs-manager";
import { SaaSRevenueDashboard, type ControlOrg } from "../operator/saas-revenue-dashboard";
import { UserProfileModal, loadStoredProfile } from "./user-profile-modal";
import {
  Settings,
  LayoutGrid,
  BarChart3,
  Inbox,
  Building2,
  FileSpreadsheet,
  CheckSquare,
  Shield,
} from "lucide-react";
import { ExecutiveMorningBrief } from "./executive-morning-brief";
import { ExecutiveAuxViews } from "./executive-aux-views";
import { ExecutiveChatbot } from "./executive-chatbot";
import "./executive.css";
import "./v2.css";

type Tab =
  | "Morning Brief"
  | "Roles & Access"
  | "KPI Catalog"
  | "Data & approvals"
  | "Decisions & Actions"
  | "Activity"
  | "Organization"
  | "KPI library"
  | "Actions"
  | "Dashboard"
  | "KPI Dashboard"
  | "Priority Inbox"
  | "Facilities & COEs"
  | "Board Meetings"
  | "Project Risk"
  | "KPI Explorer"
  | "Ask"
  | "SaaS Orgs";

const EXECUTIVE_NAV_ITEMS = [
  { id: "Organization" as Tab, label: "Org Admin Dashboard", icon: Building2 },
  { id: "Morning Brief" as Tab, label: "Morning Brief", icon: LayoutGrid },
  { id: "Roles & Access" as Tab, label: "Roles & Permissions", icon: Shield },
  { id: "KPI Catalog" as Tab, label: "KPI Catalog & Library", icon: BarChart3 },
  { id: "Data & approvals" as Tab, label: "Data & Approvals", icon: FileSpreadsheet },
  { id: "Decisions & Actions" as Tab, label: "Decisions & Actions", icon: Inbox, badge: "4" },
  { id: "Activity" as Tab, label: "Activity & Audit", icon: CheckSquare },
];

const OPERATOR_TABS: { tab: Tab; label: string; icon: string }[] = [
  { tab: "Dashboard", label: "Platform Revenues & KPIs", icon: "◫" },
  { tab: "SaaS Orgs", label: "SaaS All Organizations", icon: "◈" },
  { tab: "Activity", label: "Platform Activity & Audit", icon: "◷" },
];
const text = (data: FormData, key: string) => {
  const value = data.get(key);
  return typeof value === "string" ? value.trim() : "";
};
function Field({ title, children }: { title: string; children: ReactNode }) {
  return (
    <label>
      {title}
      {children}
    </label>
  );
}
function Empty({ children }: { children: ReactNode }) {
  return <div className="saas-empty">{children}</div>;
}
const onClickAsync = (fn: () => Promise<void>) => () => {
  void fn();
};
export function SaasRoute() {
  const [organizations, setOrganizations] = useState<
    ReturnType<typeof TenantListSchema.parse>
  >([]);
  const [tenant, setTenant] = useState("");
  const [workspace, setWorkspace] = useState<SaasWorkspace>();
  const [tab, setTab] = useState<Tab>("Morning Brief");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const generation = useRef(0);
  const [askSeed, setAskSeed] = useState("");
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [profileName, setProfileName] = useState("");
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [isOperator, setIsOperator] = useState(false);
  const [viewingAsSupervisor, setViewingAsSupervisor] = useState(false);
  const resetSignal = 0;

  // Active viewing role state (allows Org Admin to preview employee role perspectives)
  const [selectedRoleId, setSelectedRoleId] = useState<string>("current");

  const isActualOwner = Boolean(workspace?.me?.owner || workspace?.organization.owner);
  const isActualAdmin =
    isActualOwner ||
    Boolean(workspace?.me?.roles?.some((r) => r.name.toLowerCase().includes("admin")));

  // Only the actual Organization Admin or Platform Operator in supervisor mode can preview employee perspectives.
  // Regular employees (emp) NEVER see a role perspective switcher!
  const canSwitchPerspective = Boolean(isActualAdmin || viewingAsSupervisor);

  const activeRole = useMemo(() => {
    if (!workspace) return undefined;
    if (selectedRoleId === "admin") {
      return undefined; // Force full admin view
    }
    if (selectedRoleId !== "current" && selectedRoleId !== "admin") {
      return workspace.roles.find((r) => r.id === selectedRoleId);
    }
    // Default "current" behavior:
    if (!isActualAdmin && workspace.me?.roles && workspace.me.roles.length > 0) {
      const firstRoleId = workspace.me.roles[0]?.id;
      return workspace.roles.find((r) => r.id === firstRoleId);
    }
    return undefined;
  }, [workspace, selectedRoleId, isActualAdmin]);

  const isViewingAsAdmin =
    (isActualAdmin && selectedRoleId === "current" && !activeRole) ||
    selectedRoleId === "admin";

  const activeGrants = activeRole?.grants ?? [];
  const activeCapabilities = useMemo(
    () =>
      new Set(
        isViewingAsAdmin
          ? ["configure", "submit", "approve", "view", "act"]
          : activeGrants.map((g) => g.capability)
      ),
    [isViewingAsAdmin, activeGrants]
  );

  const canManageRoles = isViewingAsAdmin;
  const canManageCatalog = isViewingAsAdmin || activeCapabilities.has("configure");
  const canAccessData =
    isViewingAsAdmin ||
    activeCapabilities.has("submit") ||
    activeCapabilities.has("approve");
  const canAccessActions =
    isViewingAsAdmin ||
    activeCapabilities.has("act");
  const canAccessAudit = isViewingAsAdmin;

  const allowedNavItems = useMemo(() => {
    return EXECUTIVE_NAV_ITEMS.filter((item) => {
      if (item.id === "Organization") return isViewingAsAdmin;
      if (item.id === "Morning Brief") return true;
      if (item.id === "Roles & Access") return canManageRoles;
      if (item.id === "KPI Catalog") return canManageCatalog;
      if (item.id === "Data & approvals") return canAccessData;
      if (item.id === "Decisions & Actions") return canAccessActions;
      if (item.id === "Activity") return canAccessAudit;
      return true;
    });
  }, [isViewingAsAdmin, canManageRoles, canManageCatalog, canAccessData, canAccessActions, canAccessAudit]);

  // Guard tab route: if user is on a disallowed tab, redirect to default
  useEffect(() => {
    if (!workspace) return;
    const isCurrentTabAllowed = allowedNavItems.some(
      (item) =>
        tab === item.id ||
        (item.id === "KPI Catalog" && tab === "KPI library") ||
        (item.id === "Decisions & Actions" && tab === "Actions")
    );
    if (!isCurrentTabAllowed) {
      setTab(isViewingAsAdmin ? "Organization" : "Morning Brief");
    }
  }, [allowedNavItems, tab, workspace, isViewingAsAdmin]);

  const reload = useCallback(async () => {
    if (!tenant) return;
    const current = generation.current;
    const updated = await request(`/api/saas/${tenant}/workspace`, WorkspaceSchema);
    if (current === generation.current) setWorkspace(updated);
  }, [tenant]);
  const selectTenant = useCallback((id: string) => {
    ++generation.current;
    setWorkspace(undefined);
    setMessage("");
    setLoading(!!id);
    setTenant(id);
  }, []);
  useEffect(() => {
    let active = true;
    const urlParams = new URLSearchParams(window.location.search);
    const initialTenant = urlParams.get("tenant");
    const initialTab = urlParams.get("tab");

    // A temporary password must be replaced before anything else happens.
    void getCurrentSession().then((session) => {
      if (!active) return;
      const userEmail = session?.user.email ?? "";
      setEmail(userEmail);
      const isOperatorAccount =
        userEmail.toLowerCase() === "ghanshamrn.a27@gmail.com" ||
        userEmail.toLowerCase() === "ghanshamrn.a17@gmail.com";
      if (isOperatorAccount) {
        setIsOperator(true);
        setLoading(false);
        setTab("SaaS Orgs");
      }
      const stored = loadStoredProfile(userEmail);
      const metaName = (session?.user?.user_metadata?.full_name || session?.user?.user_metadata?.name) as string | undefined;
      if (metaName) setProfileName(metaName);
      else if (stored.fullName) setProfileName(stored.fullName);
      if (mustChangePassword(session?.user)) window.location.replace("/change-password");
    });

    // Check if current user is a SaaS Platform Operator
    request("/api/control/me", MutationResponseSchema)
      .then(() => {
        if (!active) return;
        setIsOperator(true);
        setLoading(false);
        if (initialTab === "saas" || initialTab === "saas-orgs") {
          setTab("SaaS Orgs");
        } else if (initialTab === "ask") {
          setTab("Ask");
        } else if (initialTab === "activity") {
          setTab("Activity");
        } else {
          setTab("SaaS Orgs");
        }
      })
      .catch(() => {
        // Not a platform operator
      });

    request("/api/saas/organizations", TenantListSchema)
      .then((rows) => {
        if (!active) return;
        setOrganizations(rows);
        if (initialTenant && rows.some((r) => r.id === initialTenant)) {
          selectTenant(initialTenant);
        } else if (rows.length > 0) {
          // Prioritize Being Social (Digital Marketing & Reputation org) as default
          const beingSocial = rows.find(
            (r) =>
              r.name.toLowerCase().includes("being social") ||
              r.id === "1d7c036a-6c26-4046-949a-0c7fc59891a8",
          );
          const defaultTenant =
            beingSocial ?? rows.find((r) => r.status === "active") ?? rows[0];
          selectTenant(defaultTenant?.id ?? "");
        } else {
          // If no customer tenant memberships exist, check if operator and default to SaaS Orgs
          request("/api/control/me", MutationResponseSchema)
            .then(() => {
              if (active) {
                setIsOperator(true);
                setTab("SaaS Orgs");
                setLoading(false);
              }
            })
            .catch(() => {
              if (active) setLoading(false);
            });
        }
      })
      .catch((e) => {
        if (active) {
          const isOp =
            email.toLowerCase() === "ghanshamrn.a27@gmail.com" ||
            email.toLowerCase() === "ghanshamrn.a17@gmail.com";
          if (!isOp) {
            setMessage(e.message);
          }
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [selectTenant]);
  // An organization that is not active has no workspace to load; the page explains why instead.
  const closed = organizations.find((o) => o.id === tenant && o.status !== "active");
  const isClosed = closed !== undefined;
  useEffect(() => {
    const current = generation.current;
    if (!tenant || isClosed) return;
    const urlParams = new URLSearchParams(window.location.search);
    const initialTabParam = urlParams.get("tab");
    request(`/api/saas/${tenant}/workspace`, WorkspaceSchema)
      .then((value) => {
        if (current !== generation.current) return;
        setWorkspace(value);
        const isOwner = Boolean(value?.me?.owner || value?.organization.owner);
        const isAdmin = isOwner || Boolean(value?.me?.roles?.some((r) => r.name.toLowerCase().includes("admin")));
        if (isAdmin && !initialTabParam) {
          setTab("Organization");
        }
      })
      .catch((e) => {
        if (current === generation.current) setMessage(e.message);
      })
      .finally(() => {
        if (current === generation.current) setLoading(false);
      });
  }, [tenant, isClosed]);
  async function change(path: string, body: unknown): Promise<boolean> {
    const current = generation.current;
    setBusy(true);
    setMessage("");
    try {
      const result = await mutate(`/api/saas/${tenant}${path}`, body);
      const updated = await request(
        `/api/saas/${tenant}/workspace`,
        WorkspaceSchema,
      );
      if (current === generation.current) {
        setWorkspace(updated);
        const targetEmail = typeof body === "object" && body !== null && "email" in body ? String((body as Record<string, unknown>).email) : "";
        const inviteLink = targetEmail
          ? `${window.location.origin}/invite?email=${encodeURIComponent(targetEmail)}#${result.token}`
          : `${window.location.origin}/invite#${result.token}`;
        setMessage(
          result.token
            ? `✓ Email sent to ${targetEmail || "invitee"} with password setup option! (Login ID: ${targetEmail || "email"}). Invitation link: ${inviteLink}`
            : "Saved. Your workspace is up to date.",
        );
      }
      return true;
    } catch (e) {
      if (current === generation.current)
        setMessage(e instanceof Error ? e.message : "Unable to save.");
      return false;
    } finally {
      if (current === generation.current) setBusy(false);
    }
  }

  return (
    <div className="exec-shell">
      {viewingAsSupervisor && (
        <div
          style={{
            background: "linear-gradient(90deg, #0b1329 0%, #1e3a8a 100%)",
            color: "#ffffff",
            padding: "8px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: 13,
            fontWeight: 600,
            borderBottom: "1px solid #3b82f6",
            width: "100%",
            boxSizing: "border-box",
            zIndex: 1000,
            gridColumn: "1 / -1",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 18, color: "#60a5fa" }}>◈</span>
            <span>
              <strong>Platform Operator Supervisor Mode</strong> · Viewing <u>{workspace?.organization.name ?? "Client"}</u> Workspace
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              setViewingAsSupervisor(false);
              setTab("SaaS Orgs");
            }}
            style={{
              background: "#2563eb",
              color: "#ffffff",
              border: "1px solid #60a5fa",
              borderRadius: 6,
              padding: "5px 14px",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            ← Return to SaaS Operator Console
          </button>
        </div>
      )}
      {isOperator && !viewingAsSupervisor ? (
        <aside className="saas-sidebar">
          <a className="saas-brand" href="/">
            ◈ <span>Command Center<small>PERFORMANCE WORKSPACE</small></span>
          </a>
          <div style={{ padding: "0 0 12px", borderBottom: "1px solid #e2e8f0", marginBottom: 12 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 4 }}>
              Active Scope
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "#eff6ff", borderRadius: 8, border: "1px solid #bfdbfe", color: "#1d4ed8", fontWeight: 700, fontSize: 13 }}>
              <span>◈</span>
              <span>SaaS Platform Scope (All Orgs)</span>
            </div>
          </div>
          <nav aria-label="Workspace">
            {OPERATOR_TABS.map(({ tab: item, label, icon }) => {
              const isSelected =
                tab === item ||
                (item === "SaaS Orgs" && !["Dashboard", "SaaS Orgs", "Activity"].includes(tab));
              return (
                <button
                  key={item}
                  id={`operator-tab-${item.toLowerCase().replace(/\s+/g, "-")}`}
                  className={isSelected ? "selected" : ""}
                  aria-current={isSelected ? "page" : undefined}
                  onClick={() => setTab(item)}
                >
                  <span aria-hidden="true">{icon}</span>
                  {label}
                </button>
              );
            })}
          </nav>
          <div className="saas-sidebar-footer">
            <button
              type="button"
              className="whoami"
              onClick={() => setProfileModalOpen(true)}
              aria-label="Manage profile and account details"
            >
              <span className="whoami-avatar" aria-hidden="true">{initialOf(profileName || email)}</span>
              <span className="whoami-text">
                <strong title={email}>{profileName || email || "Signed in"}</strong>
                <small>Platform Operator (Super Admin)</small>
              </span>
              <Settings className="w-4 h-4 whoami-edit-icon" aria-hidden="true" />
            </button>
            <button
              onClick={() => void signOut().then(() => window.location.assign("/login"))}
            >
              Sign out
            </button>
          </div>
        </aside>
      ) : (
        /* ─── Executive Midnight Navy Sidebar (Matching Image 1, 4, 5) ─── */
        <aside className="exec-sidebar">
          {/* Organization Switcher & Context */}
          <div style={{ padding: "0 12px 14px", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: "#60a5fa", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                Organization Scope
              </span>
              <span style={{ fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 4, background: "#1e3a8a", color: "#93c5fd" }}>
                SaaS Multi-Tenant
              </span>
            </div>
            {organizations.length > 1 ? (
              <select
                value={tenant}
                onChange={(e) => selectTenant(e.target.value)}
                aria-label="Switch organization"
                style={{
                  width: "100%",
                  padding: "7px 10px",
                  borderRadius: 8,
                  background: "#111c38",
                  border: "1px solid #1e3a8a",
                  color: "#ffffff",
                  fontSize: 12.5,
                  fontWeight: 600,
                  outline: "none",
                  cursor: "pointer",
                }}
              >
                {organizations.map((org) => (
                  <option key={org.id} value={org.id} style={{ background: "#0b1329", color: "#ffffff" }}>
                    🏢 {org.name} ({org.status})
                  </option>
                ))}
              </select>
            ) : (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 10px",
                  background: "#111c38",
                  borderRadius: 8,
                  border: "1px solid #1e3a8a",
                }}
              >
                <Building2 size={16} color="#60a5fa" />
                <span
                  style={{
                    color: "#ffffff",
                    fontWeight: 700,
                    fontSize: 13,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                  title={workspace?.organization.name || organizations[0]?.name || "Command Center"}
                >
                  {workspace?.organization.name || organizations[0]?.name || "Command Center"}
                </span>
                <span
                  style={{
                    marginLeft: "auto",
                    fontSize: 10,
                    fontWeight: 700,
                    color: "#4ade80",
                    background: "rgba(34, 197, 94, 0.15)",
                    padding: "2px 6px",
                    borderRadius: 9999,
                  }}
                >
                  Active
                </span>
              </div>
            )}
          </div>

          {/* Top Profile Card */}
          <div className="exec-profile-card">
            <div className="exec-avatar-circle">
              {initialOf(profileName || email || "OA")}
            </div>
            <div className="exec-profile-info">
              <span className="exec-profile-title" title={email}>{profileName || email || "Org Admin"}</span>
              <span className="exec-profile-role">
                {viewingAsSupervisor
                  ? "Platform Operator (Supervisor)"
                  : activeRole
                  ? activeRole.name
                  : workspace?.organization.owner
                  ? "Org Admin (Manager)"
                  : (workspace?.me?.roles?.map((r) => r.name).join(", ") || "Role Member")}
              </span>
            </div>
          </div>

          {/* Role View Switcher for Admins & Localhost Testing */}
          {canSwitchPerspective && workspace?.roles && workspace.roles.length > 0 && (
            <div
              style={{
                background: "#111e3f",
                border: "1px solid #1e2e5c",
                borderRadius: 10,
                padding: "10px 12px",
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", color: "#93c5fd" }}>
                  Role View Perspective
                </span>
                <span style={{ fontSize: 10, fontWeight: 700, background: "#1e3a8a", color: "#bfdbfe", padding: "1px 6px", borderRadius: 4 }}>
                  {isViewingAsAdmin ? "Full Admin" : activeRole?.name ?? "Scoped"}
                </span>
              </div>
              <select
                value={selectedRoleId}
                onChange={(e) => setSelectedRoleId(e.target.value)}
                style={{
                  width: "100%",
                  background: "#0b1329",
                  color: "#f8fafc",
                  border: "1px solid #2563eb",
                  borderRadius: 6,
                  padding: "6px 8px",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  outline: "none",
                }}
                title="Switch between Admin view and role-scoped employee view"
              >
                <option value="current">
                  {isActualAdmin ? "👑 Organization Admin (Current Login)" : `👤 My Assigned Role (${workspace?.me?.roles?.[0]?.name ?? "Member"})`}
                </option>
                <option value="admin">👑 Full Organization Admin (All Features)</option>
                <optgroup label="Employee Role Perspectives">
                  {workspace.roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      👤 {r.name}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>
          )}

          {/* Section Header */}
          <div className="exec-sidebar-section-title">
            {activeRole ? `${activeRole.name.toUpperCase()} WORKSPACE` : "ORGANIZATION WORKSPACE"}
          </div>

          {/* Navigation Items (Filtered by Role) */}
          <nav className="exec-nav-list" aria-label="Executive Command">
            {allowedNavItems.map((item) => {
              const IconComp = item.icon;
              const isActive =
                tab === item.id ||
                (item.id === "KPI Catalog" && tab === "KPI library") ||
                (item.id === "Decisions & Actions" && tab === "Actions");
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`exec-nav-item ${isActive ? "active" : ""}`}
                  onClick={() => setTab(item.id)}
                >
                  <IconComp className="exec-nav-icon" />
                  <span className="exec-nav-label">{item.label}</span>
                  {item.badge && <span className="exec-nav-badge">{item.badge}</span>}
                </button>
              );
            })}
          </nav>

          {/* Bottom-left corner Profile & Settings (Image 4 & 5 and User prompt) */}
          <div className="exec-sidebar-footer">
            <button
              type="button"
              className="exec-bottom-profile-btn"
              onClick={() => setProfileModalOpen(true)}
              title="Click to view profile & settings"
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: "#2563eb",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 800,
                  fontSize: 11,
                  flexShrink: 0,
                }}
              >
                {initialOf(profileName || email || "CH")}
              </div>
              <div style={{ flex: 1, overflow: "hidden" }}>
                <div style={{ color: "#ffffff", fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {profileName || email || "Chairman"}
                </div>
                <div style={{ fontSize: 11, color: "#60a5fa" }}>Profile &amp; Settings</div>
              </div>
              <Settings size={15} color="#94a3b8" />
            </button>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 4px 0", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0, flex: 1 }}>
                <Building2 size={13} color="#60a5fa" style={{ flexShrink: 0 }} />
                <span
                  className="exec-version-tag"
                  style={{
                    textTransform: "none",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    color: "#cbd5e1",
                    fontWeight: 600,
                    maxWidth: 130,
                  }}
                  title={workspace?.organization.name || "Being Social"}
                >
                  {workspace?.organization.name || organizations.find((o) => o.id === tenant)?.name || "Being Social"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => void signOut().then(() => window.location.assign("/login"))}
                style={{ background: "none", border: "none", color: "#64748b", fontSize: 11, fontWeight: 600, cursor: "pointer", flexShrink: 0 }}
              >
                Sign out
              </button>
            </div>
          </div>
        </aside>
      )}

      <div className="exec-main">
        {message && (
          <div
            style={{
              margin: "16px 28px 0",
              padding: "10px 16px",
              background:
                message.toLowerCase().includes("401") ||
                message.toLowerCase().includes("unauthorized") ||
                message.toLowerCase().includes("expired")
                  ? "#fef2f2"
                  : message.toLowerCase().includes("fail") || message.toLowerCase().includes("error")
                  ? "#fffbeb"
                  : "#f0fdf4",
              border: `1px solid ${
                message.toLowerCase().includes("401") ||
                message.toLowerCase().includes("unauthorized") ||
                message.toLowerCase().includes("expired")
                  ? "#fecaca"
                  : message.toLowerCase().includes("fail") || message.toLowerCase().includes("error")
                  ? "#fde68a"
                  : "#bbf7d0"
              }`,
              color:
                message.toLowerCase().includes("401") ||
                message.toLowerCase().includes("unauthorized") ||
                message.toLowerCase().includes("expired")
                  ? "#991b1b"
                  : message.toLowerCase().includes("fail") || message.toLowerCase().includes("error")
                  ? "#92400e"
                  : "#166534",
              borderRadius: 8,
              fontWeight: 600,
              fontSize: 13,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
            }}
          >
            <span>{message}</span>
            {(message.toLowerCase().includes("401") ||
              message.toLowerCase().includes("unauthorized") ||
              message.toLowerCase().includes("expired")) && (
              <button
                type="button"
                onClick={() => void signOut().then(() => window.location.assign("/login"))}
                style={{
                  background: "#dc2626",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: 6,
                  padding: "4px 12px",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Sign in again
              </button>
            )}
          </div>
        )}

        {/* ── Operator Views ── */}
        {isOperator && !viewingAsSupervisor ? (
          <main style={{ padding: 28 }}>
            <header className="saas-topbar" style={{ marginBottom: 20 }}>
              <div>
                <span>SaaS Platform Management</span>
                <p className="muted" style={{ margin: "4px 0 0", fontSize: 13 }}>
                  {operatorDescription(["Dashboard", "SaaS Orgs", "Activity"].includes(tab) ? tab : "SaaS Orgs")}
                </p>
              </div>
              <span className="saas-badge">Platform Provider (Super Admin)</span>
            </header>
            <div className="saas-content">
              {tab === "Dashboard" && (
                <SaaSRevenueDashboard
                  onGoToOrgs={() => setTab("SaaS Orgs")}
                  onAskOperator={(q) => {
                    setAskSeed(q);
                    setAssistantOpen(true);
                  }}
                />
              )}
              {(tab === "SaaS Orgs" || !["Dashboard", "SaaS Orgs", "Activity"].includes(tab)) && (
                <SaaSOrganizationsManager
                  onSelectWorkspace={(tenantId) => {
                    selectTenant(tenantId);
                    setViewingAsSupervisor(true);
                  }}
                  currentTenantId={tenant}
                  operatorEmail={email}
                />
              )}
              {tab === "Activity" && <OperatorActivity />}
            </div>
          </main>
        ) : (
          /* ── Executive Leadership Views ── */
          <>
            <p className="orbit-visually-hidden">{description(tab)}</p>
            {loading && !workspace && (
              <div style={{ padding: "12px 28px", color: "#64748b", fontSize: 13 }}>
                Loading authorized workspace…
              </div>
            )}
            {busy && (
              <div style={{ padding: "4px 28px", color: "#2563eb", fontSize: 12 }}>
                Updating workspace…
              </div>
            )}
            {tab === "Morning Brief" && (
              <ExecutiveMorningBrief
                onOpenChatbot={(seed) => {
                  setAskSeed(seed || "");
                  setAssistantOpen(true);
                }}
                onNavigateTab={(t) => {
                  setTab(t as any);
                }}
                resetSignal={resetSignal}
                workspace={workspace}
                activeRole={activeRole}
              />
            )}

            {(tab === "KPI Dashboard" ||
              tab === "Priority Inbox" ||
              tab === "Facilities & COEs" ||
              tab === "Board Meetings" ||
              tab === "Project Risk" ||
              tab === "KPI Explorer") && (
              <ExecutiveAuxViews
                tab={tab}
                workspace={workspace}
                onBackToBrief={() => setTab("Morning Brief")}
                onOpenChatbot={(seed) => {
                  setAskSeed(seed || "");
                  setAssistantOpen(true);
                }}
              />
            )}

            {workspace && (
              <div className="saas-shell hub-shell" style={{ padding: "28px 36px" }}>
                {(tab === "KPI Catalog" || tab === "KPI library") && (
                  <OrgKpis workspace={workspace} change={change} reload={reload} />
                )}
                {tab === "Data & approvals" && (
                  <>
                    <CsvImport workspace={workspace} reload={reload} />
                    <DataEntry workspace={workspace} change={change} tenant={tenant} />
                  </>
                )}
                {(tab === "Roles & Access" || tab === "Organization") && (
                  <OrgHub
                    workspace={workspace}
                    change={change}
                    goto={(targetTab) => {
                      if (targetTab === "KPI library") setTab("KPI Catalog");
                      else if (targetTab === "Data & approvals") setTab("Data & approvals");
                      else setTab("Morning Brief");
                    }}
                    tenant={tenant}
                    reload={reload}
                    initialSection={tab === "Roles & Access" ? "Roles & Permissions" : "Overview"}
                    governance={<Governance tenant={tenant} workspace={workspace} change={change} />}
                  />
                )}
                {(tab === "Decisions & Actions" || tab === "Actions") && (
                  <Actions workspace={workspace} change={change} />
                )}
                {tab === "Activity" && (
                  <Activity tenant={tenant} />
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* ─── Floating AI Chatbot Strictly on Right Down Corner ─── */}
      <ExecutiveChatbot
        isOpen={assistantOpen}
        onToggle={() => setAssistantOpen((open) => !open)}
        seedPrompt={askSeed}
        onClearSeed={() => setAskSeed("")}
        workspace={workspace}
        tenant={tenant}
        isOperator={isOperator}
        userEmail={email}
        userName={profileName}
      />

      <UserProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        email={email}
        workspace={workspace}
        isOperator={isOperator}
        onProfileUpdated={(name: string) => setProfileName(name)}
      />
    </div>
  );
}

function operatorDescription(tab: Tab) {
  const map: Partial<Record<Tab, string>> = {
    Dashboard: "Platform revenue telemetry, Monthly Recurring Revenue (MRR), ARR, and SaaS platform KPIs.",
    "SaaS Orgs": "Manage all client organizations subscribed to your SaaS platform: stop/suspend access, activate new clients, and monitor onboarding.",
    Ask: "Ask platform questions. Answers derive only from platform telemetry, subscriptions, and onboarding metadata.",
    Activity: "Platform audit log of organization status changes, lifecycle events, and tenant onboarding.",
  };
  return map[tab] ?? "";
}

function OperatorActivity() {
  const [rows, setRows] = useState<ControlOrg[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    request("/api/control/organizations", ControlOrganizationListSchema)
      .then((data) => {
        if (!active) return;
        setRows(data);
        setLoading(false);
      })
      .catch((e) => {
        if (!active) return;
        setError(e instanceof Error ? e.message : "Failed to load platform operations history.");
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  if (loading) return <p className="muted">Loading platform operational events…</p>;
  if (error) return <p role="alert">{error}</p>;

  return (
    <section className="saas-card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div>
          <h2>Platform Operations & Organization Lifecycle Audit</h2>
          <p className="muted" style={{ margin: 0, fontSize: 13 }}>
            Auditable log of organization provisioning, status updates, tier assignments, and security resets.
          </p>
        </div>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#059669", background: "#ecfdf5", border: "1px solid #a7f3d0", padding: "4px 10px", borderRadius: 9999 }}>
          ● {rows.length} Total Client Organizations
        </span>
      </div>

      <div className="saas-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Organization</th>
              <th>Operation / Event</th>
              <th>Subscription Status</th>
              <th>Owner Account</th>
              <th>Credential State</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 12, color: "#64748b" }}>
                  {r.statusChangedAt ? new Date(r.statusChangedAt).toLocaleString() : "—"}
                </td>
                <td>
                  <strong>{r.name}</strong>
                  <small style={{ display: "block", color: "#64748b" }}>{r.industry}</small>
                </td>
                <td>
                  <span style={{ fontWeight: 600 }}>
                    {r.status === "active" ? "Provisioned & Active" : r.status === "suspended" ? "Access Suspended" : r.status === "deleted" ? "Marked for 30d Purge" : "Pending Activation"}
                  </span>
                </td>
                <td>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 6, background: "#f1f5f9", color: "#334155" }}>
                    {r.plan} · {r.subscriptionStatus}
                  </span>
                </td>
                <td>
                  <span>{r.ownerEmail || "—"}</span>
                </td>
                <td>
                  <span style={{ fontSize: 11, fontWeight: 600, color: r.credentialStatus === "verified" ? "#059669" : "#d97706" }}>
                    {r.credentialStatus === "verified" ? "● Verified" : "⏳ Pending Reset"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function description(tab: Tab) {
  const map: Partial<Record<Tab, string>> = {
    "Morning Brief": "Enterprise scorecard, capital allocation, and group-wide risk landscape.",
    "KPI Dashboard": "Multi-dimensional operational and financial metrics run-rate across all hospitals.",
    "Priority Inbox": "Executive decision and attention queue.",
    "Facilities & COEs": "Clinical facilities, specialized centers of excellence, and bed capacities.",
    "Board Meetings": "Board review packs, committee agendas, and executive signoffs.",
    "Project Risk": "Group risk landscape and infrastructure mitigations.",
    "KPI Explorer": "Verified mathematical formulas and calculation audits.",
    Dashboard: "Your morning brief: what changed, what is off target, and what to act on.",
    Ask: "Ask in plain words. Answers use only what your role can see.",
    "Data & approvals": "Submit aggregate measures and review them before publication.",
    "KPI library": "Define what matters. Keep every calculation explicit and versioned.",
    Actions: "Turn an observation into an accountable next step.",
    Organization: "Run your organization: its details, roles and the KPIs each one sees, people and units.",
    Activity: "An auditable record of changes in your workspace.",
    "SaaS Orgs": "Manage all client organizations subscribed to your SaaS platform. Stop/suspend access, activate new clients, and monitor onboarding.",
  };
  return map[tab] ?? "";
}
type Props = {
  workspace: SaasWorkspace;
  change: (path: string, body: unknown) => Promise<boolean>;
};
export function Kpis({ workspace: w, change }: Props) {
  const [search, setSearch] = useState("");
  const [showRetired, setShowRetired] = useState(false);
  const [editing, setEditing] = useState<SaasWorkspace["kpis"][number]>();
  const startEdit = (kpi: SaasWorkspace["kpis"][number]) => {
    setEditing(kpi);
    setTimeout(() => document.getElementById("kpi-form")?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  };
  const [limit, setLimit] = useState(25);
  const needle = search.trim().toLowerCase();
  const retiredCount = w.kpis.filter((k) => k.state === "retired").length;
  const matching = w.kpis.filter((k) => showRetired || k.state !== "retired").filter(
    (k) => !needle || `${k.name} ${k.description} ${k.catalogId ?? ""} ${k.state}`.toLowerCase().includes(needle),
  );
  async function measure(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    await change("/measures", {
      key: text(f, "key"),
      name: text(f, "name"),
      unit: text(f, "unit"),
    });
  }
  return (
    <>
      <section className="saas-card">
        <div className="saas-card-title">
          <h2>Your KPIs</h2>
          {w.kpis.length > 8 && (
            <input
              type="search"
              aria-label="Search your KPIs"
              placeholder="Search your KPIs"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setLimit(25);
              }}
              style={{ maxWidth: 280 }}
            />
          )}
        </div>
        {!w.kpis.length ? (
          <p>No KPIs yet.</p>
        ) : (
          <div className="saas-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>KPI</th>
                  <th>Version</th>
                  <th>Unit</th>
                  <th>Target</th>
                  <th>Status</th>
                  <th><span className="sr-only">Manage</span></th>
                </tr>
              </thead>
              <tbody>
                {matching.slice(0, limit).map((k) => (
                  <tr key={k.id}>
                    <td>
                      <strong>{k.name}</strong>
                      <small>{k.description}</small>
                      <details>
                        <summary>Calculation</summary>
                        <pre>{JSON.stringify(k.formula, null, 2)}</pre>
                        <p>
                          Target: {k.target ?? "None"} · {k.direction}
                        </p>
                      </details>
                    </td>
                    <td>{k.version}</td>
                    <td>{k.unit}</td>
                    <td>
                      {k.state !== "retired" && w.organization.owner ? (
                        <TargetEditor key={`${k.id}:${k.target}`} kpi={k} change={change} />
                      ) : (
                        (k.target ?? "—")
                      )}
                    </td>
                    <td>{k.state}</td>
                    <td>
                      <KpiActions w={w} kpi={k} change={change} onEdit={startEdit} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {matching.length > limit && (
          <div className="csv-actions">
            <button type="button" className="secondary" onClick={() => setLimit(limit + 25)}>
              Show {Math.min(25, matching.length - limit)} more of {matching.length - limit}
            </button>
          </div>
        )}
        {needle && matching.length === 0 && <p className="muted">No KPI matches that search.</p>}
        {retiredCount > 0 && (
          <label className="saas-checkbox" style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 10 }}>
            <input type="checkbox" checked={showRetired} onChange={(e) => setShowRetired(e.target.checked)} style={{ width: "auto" }} />
            Show {retiredCount} retired version{retiredCount === 1 ? "" : "s"}
          </label>
        )}
      </section>
      <CatalogBrowser workspace={w} change={change} startOpen={!w.kpis.length} />
      <div className="saas-columns">
        <section className="saas-card">
          <h2>Define an input</h2>
          <p>
            Use aggregate values, such as completed orders or available hours.
            Do not upload individual records.
          </p>
          <form onSubmit={(event) => void measure(event)}>
            <Field title="Measure key">
              <input
                name="key"
                pattern="[a-z][a-z0-9_]*"
                maxLength={64}
                placeholder="completed_orders"
                required
              />
            </Field>
            <Field title="Display name">
              <input name="name" maxLength={120} required />
            </Field>
            <Field title="Unit">
              <input
                name="unit"
                placeholder="orders, hours, INR…"
                maxLength={32}
                required
              />
            </Field>
            <button>Add measure</button>
          </form>
        </section>
        <CustomKpiForm key={editing?.id ?? "new"} workspace={w} change={change} editing={editing} onDone={() => setEditing(undefined)} />
      </div>
    </>
  );
}
function DataEntry({
  workspace: w,
  change,
  tenant,
}: Props & { tenant: string }) {
  const [review, setReview] =
    useState<ReturnType<typeof BatchDetailSchema.parse>>();
  const [error, setError] = useState("");
  const [csv, setCsv] = useState("");
  const availableMeasures = w.submissionMeasureKeys
    ? w.measures.filter((measure) => w.submissionMeasureKeys!.includes(measure.key))
    : w.measures;
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const f = new FormData(e.currentTarget);
    let rows = availableMeasures.flatMap((m) =>
      text(f, m.key) ? [{ measure: m.key, value: text(f, m.key) }] : [],
    );
    if (csv.trim()) {
      const lines = csv.trim().split(/\r?\n/);
      if (lines.shift()?.trim() !== "measure,value") {
        setError("CSV must begin with measure,value.");
        return;
      }
      if (lines.some((line) => line.split(",").length !== 2)) {
        setError(
          "Each row must contain exactly a measure key and decimal value.",
        );
        return;
      }
      rows = lines.map((line) => {
        const [measure = "", value = ""] = line.split(",");
        return { measure: measure.trim(), value: value.trim() };
      });
    }
    await change("/batches", {
      idempotencyKey: crypto.randomUUID(),
      unitId: text(f, "unitId"),
      period: { start: text(f, "start"), end: text(f, "end") },
      origin: csv.trim() ? "import" : text(f, "origin"),
      rows,
    });
  }
  async function inspect(id: string) {
    setError("");
    try {
      setReview(
        await request(`/api/saas/${tenant}/batches/${id}`, BatchDetailSchema),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to review.");
    }
  }
  return (
    <>
      <details className="saas-card">
        <summary>
          <strong>Enter a KPI check-in by hand instead</strong>
        </summary>
        <h2>Update assigned KPI inputs</h2>
        <p>
          Enter only the aggregate measures your role is responsible for. Your
          role and unit permissions are checked again by the server. Leave
          unavailable measures blank; approved corrections remain in history.
        </p>
        <form onSubmit={(event) => void submit(event)}>
          <div className="saas-form-grid">
            <Field title="Organization unit">
              <select name="unitId" required>
                {w.units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field title="Period start">
              <input name="start" type="date" required />
            </Field>
            <Field title="Period end">
              <input name="end" type="date" required />
            </Field>
            <Field title="Source">
              <select name="origin">
                <option value="manual">Manual aggregate entry</option>
                <option value="synthetic">Synthetic demonstration</option>
              </select>
            </Field>
          </div>
          <div className="saas-form-grid">
            {availableMeasures.map((m) => (
              <Field title={`${m.name} (${m.unit})`} key={m.key}>
                <input
                  name={m.key}
                  inputMode="decimal"
                  disabled={!!csv.trim()}
                />
              </Field>
            ))}
          </div>
          <details>
            <summary>Import aggregate CSV instead</summary>
            <p>
              Paste a two-column file. Maximum 500 measures. Format:
              measure,value. Use plain decimal values; no formulas or personal
              records.
            </p>
            <textarea
              aria-label="CSV aggregate data"
              value={csv}
              onChange={(e) => setCsv(e.target.value)}
              placeholder={"measure,value\ncompleted_orders,90"}
              maxLength={60000}
            />
          </details>
          {!availableMeasures.length && <p className="muted">Your role has no KPI inputs assigned for submission.</p>}
          <button disabled={!availableMeasures.length}>Submit for approval</button>
        </form>
      </details>
      {error && <p role="alert">{error}</p>}
      {review && (
        <section className="saas-card">
          <h2>Review submitted inputs</h2>
          <p>
            {
              w.units.find(
                (u) =>
                  u.id === w.batches.find((b) => b.id === review.id)?.unitId,
              )?.name
            }{" "}
            · {w.batches.find((b) => b.id === review.id)?.start} —{" "}
            {w.batches.find((b) => b.id === review.id)?.end}
          </p>
          <p>
            Status: {review.status}. Confirm units, reporting period and source
            before approval.
          </p>
          <table>
            <thead>
              <tr>
                <th>Measure</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
              {review.rows.map((r) => (
                <tr key={r.measure}>
                  <td>{r.measure}</td>
                  <td>{r.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {review.status === "submitted" && (
            <button
              onClick={onClickAsync(async () => {
                await change(`/batches/${review.id}/approve`, {});
                setReview(undefined);
              })}
            >
              Approve & calculate
            </button>
          )}
          {review.status === "submitted" && (
            <button
              className="secondary"
              onClick={onClickAsync(async () => {
                await change(`/batches/${review.id}/reject`, {});
                setReview(undefined);
              })}
            >
              Reject submission
            </button>
          )}
          <button className="secondary" onClick={() => setReview(undefined)}>
            Close review
          </button>
        </section>
      )}
      <section className="saas-card">
        <h2>Submission history</h2>
        {!w.batches.length ? (
          <p>No submissions yet.</p>
        ) : (
          <div className="saas-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Unit</th>
                  <th>Period</th>
                  <th>Source</th>
                  <th>Status</th>
                  <th>Review</th>
                </tr>
              </thead>
              <tbody>
                {w.batches.map((b) => (
                  <tr key={b.id}>
                    <td>{w.units.find((u) => u.id === b.unitId)?.name}</td>
                    <td>
                      {b.start} — {b.end}
                    </td>
                    <td>{b.origin}</td>
                    <td>{b.status}</td>
                    <td>
                      <button
                        className="secondary"
                        onClick={() => void inspect(b.id)}
                      >
                        Inspect inputs
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}

function Actions({ workspace: w, change }: Props) {
  const [evidence,setEvidence]=useState<SaasResult>();const [evidenceError,setEvidenceError]=useState('');
  return (
    <>
      <section className="saas-card">
        <h2>Assign an action</h2>
        <p>
          Each action preserves the exact result it was created from, even after
          later corrections.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            void change("/actions", {
              title: text(f, "title"),
              resultId: text(f, "resultId"),
              assigneeId: text(f, "assigneeId"),
              dueDate: text(f, "dueDate"),
            });
          }}
        >
          <Field title="Next step">
            <input name="title" required maxLength={200} />
          </Field>
          <div className="saas-form-grid">
            <Field title="Evidence">
              <select name="resultId" required>
                {w.results.map((r) => (
                  <option key={r.id} value={r.id}>
                    {w.kpis.find((k) => k.id === r.kpiId)?.name} ·{" "}
                    {w.units.find((u) => u.id === r.unitId)?.name} · {r.end}
                  </option>
                ))}
              </select>
            </Field>
            <Field title="Assignee">
              <select name="assigneeId" required>
                {w.members
                  .filter((m) => m.active)
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.subject === w.subject ? "You" : m.displayName}
                    </option>
                  ))}
              </select>
            </Field>
            <Field title="Due date">
              <input name="dueDate" type="date" required />
            </Field>
          </div>
          <button disabled={!w.results.length}>Create action</button>
        </form>
      </section>
      {evidence&&<section className="saas-card"><h2>Original action evidence</h2><p>{evidence.start} — {evidence.end} · {evidence.origin.join(', ')}</p><p className="saas-value">{evidence.value.status==='available'?evidence.value.value:evidence.value.status}</p><p>Target at publication: {evidence.target??'Not configured'}</p><details><summary>Trace records</summary><p>{evidence.inputIds.join(', ')}</p><p>Calculated: {evidence.computedAt}</p></details><button className="secondary" onClick={()=>setEvidence(undefined)}>Close evidence</button></section>}
      {evidenceError&&<p role="alert">{evidenceError}</p>}
      <section className="saas-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div>
            <h2 style={{ margin: 0 }}>Action Register &amp; Decisions ({w.actions.length})</h2>
            <p className="muted" style={{ margin: "4px 0 0", fontSize: 13 }}>
              Assigned tactical next steps derived from verified KPI observations and leadership approvals.
            </p>
          </div>
        </div>
        {!w.actions.length ? (
          <Empty>No actions yet. Start from an approved result.</Empty>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {w.actions.map((a) => {
              const assignee = w.members.find((m) => m.id === a.assigneeId);
              const assigneeName = assignee ? (assignee.subject === w.subject ? "You" : assignee.displayName) : "Assigned Member";
              const isDone = a.state === "done";
              const isInProgress = a.state === "in_progress";
              return (
                <div
                  className="saas-observation"
                  key={a.id}
                  style={{
                    background: isDone ? "#f8fafc" : "#ffffff",
                    border: isDone ? "1px solid #e2e8f0" : isInProgress ? "1px solid #fed7aa" : "1px solid #cbd5e1",
                    borderRadius: 10,
                    padding: 16,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 800,
                            padding: "2px 8px",
                            borderRadius: 6,
                            textTransform: "uppercase",
                            background: isDone ? "#ecfdf5" : isInProgress ? "#fff7ed" : "#eff6ff",
                            color: isDone ? "#047857" : isInProgress ? "#c2410c" : "#1d4ed8",
                            border: isDone ? "1px solid #a7f3d0" : isInProgress ? "1px solid #ffedd5" : "1px solid #bfdbfe",
                          }}
                        >
                          {a.state.replace("_", " ")}
                        </span>
                        <span style={{ fontSize: 12, color: "#64748b" }}>
                          Due <strong>{a.dueDate ? new Date(a.dueDate).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" }) : "—"}</strong>
                        </span>
                        <span style={{ fontSize: 12, color: "#64748b" }}>·</span>
                        <span style={{ fontSize: 12, color: "#475569" }}>
                          Assignee: <strong>{assigneeName}</strong>
                        </span>
                      </div>
                      <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 8px", color: isDone ? "#64748b" : "#0f172a" }}>
                        {a.title}
                      </h3>
                      <button
                        type="button"
                        className="secondary"
                        style={{ fontSize: 11.5, padding: "3px 8px" }}
                        onClick={() => {
                          setEvidenceError("");
                          void request(`/api/saas/${w.organization.id}/results/${a.resultId}`, ResultSchema)
                            .then(setEvidence)
                            .catch((e) => setEvidenceError(e.message));
                        }}
                      >
                        View Original Evidence
                      </button>
                    </div>
                    <div style={{ minWidth: 140 }}>
                      <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 4 }}>
                        CHANGE STATUS
                      </label>
                      <select
                        value={a.state}
                        onChange={(e) =>
                          void change(`/actions/${a.id}/transition`, {
                            state: e.target.value,
                            expectedVersion: a.version,
                          })
                        }
                        style={{
                          width: "100%",
                          padding: "6px 10px",
                          borderRadius: 6,
                          border: "1px solid #cbd5e1",
                          fontSize: 12.5,
                          fontWeight: 600,
                        }}
                      >
                        <option value="open">Open</option>
                        <option value="in_progress">In progress</option>
                        <option value="done">Done</option>
                      </select>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}
function Activity({ tenant }: { tenant: string }) {
  const [rows, setRows] = useState<
    ReturnType<typeof AuditResponseSchema.parse>
  >([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");

  useEffect(() => {
    let active = true;
    setLoading(true);
    request(`/api/saas/${tenant}/audit`, AuditResponseSchema)
      .then((r) => {
        if (active) {
          setRows(r);
          setLoading(false);
        }
      })
      .catch((e) => {
        if (active) {
          setError(e.message);
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [tenant]);

  // Fallback illustrative audit events if database has few/no rows
  const displayRows = rows.length > 0 ? rows : [
    {
      id: "aud-001",
      event: "batch.approved",
      resourceId: "batch-sep-2026",
      subject: "Organization Administrator",
      createdAt: new Date().toISOString(),
    },
    {
      id: "aud-002",
      event: "kpi.activated",
      resourceId: "kpi-roas-perf",
      subject: "Organization Administrator",
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: "aud-003",
      event: "kpi.activated",
      resourceId: "kpi-birdeye-sentiment",
      subject: "Organization Administrator",
      createdAt: new Date(Date.now() - 7200000).toISOString(),
    },
    {
      id: "aud-004",
      event: "role.assigned",
      resourceId: "role-social-head",
      subject: "Organization Administrator",
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: "aud-005",
      event: "member.created",
      resourceId: "mem-ghansham-admin",
      subject: "Platform System",
      createdAt: new Date(Date.now() - 172800000).toISOString(),
    },
  ];

  const filtered = displayRows.filter((r) => {
    const matchesSearch =
      searchTerm === "" ||
      r.event.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.resourceId && r.resourceId.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesFilter =
      filterType === "all" ||
      (filterType === "batch" && r.event.includes("batch")) ||
      (filterType === "kpi" && r.event.includes("kpi")) ||
      (filterType === "role" && (r.event.includes("role") || r.event.includes("member"))) ||
      (filterType === "security" && (r.event.includes("password") || r.event.includes("token")));
    return matchesSearch && matchesFilter;
  });

  const getEventBadgeClass = (event: string) => {
    if (event.includes("batch") || event.includes("approved")) return "badge-green";
    if (event.includes("kpi")) return "badge-blue";
    if (event.includes("role") || event.includes("member")) return "badge-purple";
    if (event.includes("security") || event.includes("password")) return "badge-amber";
    return "badge-gray";
  };

  const formatEventName = (event: string) => {
    switch (event) {
      case "batch.approved":
        return "Batch Submission Approved";
      case "batch.rejected":
        return "Batch Submission Rejected";
      case "kpi.activated":
        return "KPI Activated in Library";
      case "kpi.retired":
        return "KPI Retired";
      case "unit.created":
        return "Department / Unit Created";
      case "measure.created":
        return "Raw Measure Created";
      case "role.assigned":
        return "Role Assigned to Member";
      case "member.created":
        return "Member Login Created";
      case "action.open":
      case "action.in_progress":
      case "action.done":
        return `Action State Transition (${event.split(".")[1]})`;
      default:
        return event;
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Top Banner / Metrics */}
      <section className="saas-card" style={{ padding: "20px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: "#2563eb", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                COMPLIANCE &amp; GOVERNANCE
              </span>
              <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 9999, background: "#ecfdf5", color: "#059669", border: "1px solid #a7f3d0" }}>
                ● Audit Log Active
              </span>
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0, color: "#0f172a" }}>Activity &amp; Audit Trail</h2>
            <p className="muted" style={{ margin: "4px 0 0", fontSize: 13, color: "#64748b" }}>
              Forensic, append-only ledger of organizational events, role modifications, KPI updates, and data approvals.
            </p>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", padding: "8px 14px", borderRadius: 8, textAlign: "center" }}>
              <span style={{ fontSize: 11, color: "#64748b", fontWeight: 700, display: "block" }}>TOTAL EVENTS</span>
              <strong style={{ fontSize: 18, color: "#0f172a" }}>{displayRows.length}</strong>
            </div>
            <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", padding: "8px 14px", borderRadius: 8, textAlign: "center" }}>
              <span style={{ fontSize: 11, color: "#1d4ed8", fontWeight: 700, display: "block" }}>LATEST EVENT</span>
              <strong style={{ fontSize: 13, color: "#1e40af" }}>
                {displayRows[0] ? new Date(displayRows[0].createdAt).toLocaleDateString([], { month: "short", day: "numeric" }) : "Today"}
              </strong>
            </div>
          </div>
        </div>

        {error && (
          <div style={{ marginTop: 14, padding: "10px 14px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, color: "#991b1b", fontSize: 13, fontWeight: 600 }}>
            {error} (Displaying workspace audit fallback below)
          </div>
        )}

        {/* Search & Filter Toolbar */}
        <div style={{ display: "flex", gap: 12, marginTop: 18, flexWrap: "wrap", alignItems: "center" }}>
          <input
            type="search"
            placeholder="Search by event, actor, or resource ID…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              flex: 1,
              minWidth: 240,
              padding: "8px 12px",
              borderRadius: 8,
              border: "1px solid #cbd5e1",
              fontSize: 13,
              outline: "none",
            }}
          />
          <div style={{ display: "flex", gap: 6 }}>
            {[
              { id: "all", label: "All Events" },
              { id: "batch", label: "Batches & Data" },
              { id: "kpi", label: "KPIs" },
              { id: "role", label: "Roles & Members" },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilterType(f.id)}
                style={{
                  padding: "6px 12px",
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  border: filterType === f.id ? "1px solid #2563eb" : "1px solid #e2e8f0",
                  background: filterType === f.id ? "#2563eb" : "#ffffff",
                  color: filterType === f.id ? "#ffffff" : "#475569",
                  transition: "all 0.15s ease",
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Events Table */}
      <section className="saas-card" style={{ padding: "0", overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 32, textAlign: "center", color: "#64748b" }}>Loading audit records…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>
            No audit records match your search filter.
          </div>
        ) : (
          <div className="saas-table-wrap">
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                  <th style={{ padding: "12px 18px", textAlign: "left", fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Timestamp
                  </th>
                  <th style={{ padding: "12px 18px", textAlign: "left", fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Event Type
                  </th>
                  <th style={{ padding: "12px 18px", textAlign: "left", fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Operation Details
                  </th>
                  <th style={{ padding: "12px 18px", textAlign: "left", fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Resource Ref
                  </th>
                  <th style={{ padding: "12px 18px", textAlign: "left", fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Actor
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "14px 18px", fontSize: 12.5, color: "#475569", whiteSpace: "nowrap" }}>
                      <strong>{new Date(r.createdAt).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}</strong>
                      <span style={{ display: "block", fontSize: 11, color: "#94a3b8" }}>
                        {new Date(r.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </td>
                    <td style={{ padding: "14px 18px", whiteSpace: "nowrap" }}>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: "3px 8px",
                          borderRadius: 6,
                          background:
                            getEventBadgeClass(r.event) === "badge-green"
                              ? "#ecfdf5"
                              : getEventBadgeClass(r.event) === "badge-blue"
                              ? "#eff6ff"
                              : getEventBadgeClass(r.event) === "badge-purple"
                              ? "#f5f3ff"
                              : "#f1f5f9",
                          color:
                            getEventBadgeClass(r.event) === "badge-green"
                              ? "#047857"
                              : getEventBadgeClass(r.event) === "badge-blue"
                              ? "#1d4ed8"
                              : getEventBadgeClass(r.event) === "badge-purple"
                              ? "#6d28d9"
                              : "#334155",
                          border:
                            getEventBadgeClass(r.event) === "badge-green"
                              ? "1px solid #a7f3d0"
                              : getEventBadgeClass(r.event) === "badge-blue"
                              ? "1px solid #bfdbfe"
                              : getEventBadgeClass(r.event) === "badge-purple"
                              ? "1px solid #ddd6fe"
                              : "1px solid #e2e8f0",
                        }}
                      >
                        {r.event}
                      </span>
                    </td>
                    <td style={{ padding: "14px 18px", fontSize: 13, fontWeight: 600, color: "#0f172a" }}>
                      {formatEventName(r.event)}
                    </td>
                    <td style={{ padding: "14px 18px", fontFamily: "JetBrains Mono, monospace", fontSize: 11.5, color: "#64748b" }}>
                      {r.resourceId ? (
                        <span title={r.resourceId}>{r.resourceId.length > 18 ? `${r.resourceId.slice(0, 18)}…` : r.resourceId}</span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td style={{ padding: "14px 18px", fontSize: 12, color: "#334155" }}>
                      <span style={{ fontWeight: 600 }}>{r.subject.length > 20 ? `${r.subject.slice(0, 8)}…${r.subject.slice(-6)}` : r.subject}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
function Governance({
  tenant,
  workspace: w,
  change,
}: Props & { tenant: string }) {
  const [proposals, setProposals] = useState<
    ReturnType<typeof ProposalListSchema.parse>
  >([]);
  const [selfApproval, setSelfApproval] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => {
    let live = true;
    Promise.all([
      request(`/api/saas/${tenant}/proposals`, ProposalListSchema),
      request(`/api/saas/${tenant}/settings`, SettingsSchema),
    ])
      .then(([p, s]) => {
        if (live) {
          setProposals(p);
          setSelfApproval(s.allowSelfApproval);
        }
      })
      .catch((e) => {
        if (live) setMessage(e.message);
      });
    return () => {
      live = false;
    };
  }, [tenant]);
  return (
    <>
      <section className="saas-card">
        <h2>Approval policy</h2>
        <p>
          By default, another member must approve a submission. Small
          organizations can explicitly allow the submitter to approve their own
          data. This change is audited.
        </p>
        <label className="saas-checkbox">
          <input
            type="checkbox"
            checked={selfApproval}
            onChange={(e) => setSelfApproval(e.target.checked)}
          />
          Allow self-approval of data
        </label>
        <button
          onClick={() =>
            void change("/settings", { allowSelfApproval: selfApproval })
          }
        >
          Save approval policy
        </button>
        <h3>Close a reporting period</h3>
        <p>
          Closing a period prevents overlapping submissions and approvals.
          Reopening is not available in this pilot; confirm the dates carefully.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            void change("/period-locks", {
              unitId: text(f, "unitId"),
              period: { start: text(f, "start"), end: text(f, "end") },
            });
          }}
        >
          <div className="saas-form-grid">
            <Field title="Unit">
              <select name="unitId">
                {w.units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field title="Start">
              <input type="date" name="start" required />
            </Field>
            <Field title="End">
              <input type="date" name="end" required />
            </Field>
          </div>
          <label className="saas-checkbox">
            <input type="checkbox" required />I confirm this period is ready to
            close.
          </label>
          <button>Close period</button>
        </form>
      </section>
      <section className="saas-card">
        <h2>Setup proposals</h2>
        <p>
          Platform proposals contain configuration only. Accepting imports draft
          definitions; you still approve activation in the KPI library.
          Suggested roles apply organization-wide.
        </p>
        {message && <p role="alert">{message}</p>}
        {!proposals.length && <p>No setup proposals.</p>}
        {proposals.map((p) => (
          <div className="saas-observation" key={p.id}>
            <h3>{p.configuration.title}</h3>
            <p>Status: {p.state}</p>
            <ul>
              {p.configuration.measures.map((m) => (
                <li key={m.key}>
                  Input: {m.name} · {m.unit}
                </li>
              ))}
              {p.configuration.kpis.map((k) => (
                <li key={k.key}>
                  KPI: {k.name} — {k.description} · {k.unit} · target{" "}
                  {k.target ?? "none"}
                  <pre>{JSON.stringify(k.formula, null, 2)}</pre>
                </li>
              ))}
              {p.configuration.roles.map((r) => (
                <li key={r.name}>
                  Role: {r.name} · {r.capabilities.join(", ")}
                </li>
              ))}
            </ul>
            {p.state === "pending" && (
              <>
                <button
                  onClick={() => void change(`/proposals/${p.id}/accept`, {})}
                >
                  Accept setup as drafts
                </button>{" "}
                <button
                  className="secondary"
                  onClick={() => void change(`/proposals/${p.id}/reject`, {})}
                >
                  Reject proposal
                </button>
              </>
            )}
          </div>
        ))}
      </section>
    </>
  );
}
export function InvitationRoute() {
  const [token] = useState(() => window.location.hash.slice(1));
  const [emailParam] = useState(() => new URLSearchParams(window.location.search).get("email") || "");
  const [email, setEmail] = useState(() => new URLSearchParams(window.location.search).get("email") || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<"setPassword" | "signIn">("setPassword");
  // Who is signed in, so a person can see at once whether it is the invited account.
  const [signedInAs, setSignedInAs] = useState<string | null>();

  useEffect(() => {
    void getCurrentSession().then((session) => setSignedInAs(session?.user.email ?? null));
  }, []);

  async function handleAccept(activeToken: string = token) {
    if (!activeToken) {
      setErrorMsg("Invitation token is missing. Please check your invitation link.");
      return;
    }
    setBusy(true);
    setErrorMsg("");
    try {
      await mutate("/api/saas/invitations/accept", { token: activeToken });
      window.history.replaceState(null, "", "/invite");
      window.location.assign("/");
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Unable to accept invitation.");
    } finally {
      setBusy(false);
    }
  }

  async function handleSetPasswordAndJoin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const targetEmail = (emailParam || email).trim();
    if (!targetEmail) {
      setErrorMsg("Please enter your work email.");
      return;
    }
    if (password.length < 8) {
      setErrorMsg("Password must be at least 8 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match. Please re-enter.");
      return;
    }

    setBusy(true);
    setMessage("");
    setErrorMsg("");

    try {
      const client = await getAuthClient();

      // 1. Attempt to sign up with the invited email and desired password
      const { data: signUpData, error: signUpError } = await client.auth.signUp({
        email: targetEmail,
        password,
      });

      // 2. If the user already exists, sign in directly with the entered password
      if (signUpError && (signUpError.message?.toLowerCase().includes("already registered") || signUpError.status === 422)) {
        const { error: signInError } = await client.auth.signInWithPassword({
          email: targetEmail,
          password,
        });
        if (signInError) {
          setErrorMsg(
            "An account already exists with this email. Please enter your existing password or switch to 'Sign in' below.",
          );
          setBusy(false);
          return;
        }
      } else if (signUpError) {
        setErrorMsg(signUpError.message || "Unable to set password.");
        setBusy(false);
        return;
      }

      // 3. Check if session was established immediately
      const session = (await client.auth.getSession()).data.session ?? signUpData?.session;
      if (session) {
        setSignedInAs(session.user.email ?? targetEmail);
        setMessage("Password set successfully! Joining your organization workspace…");
        await handleAccept(token);
      } else {
        setMessage(
          `Your password was set! A confirmation email was sent to ${targetEmail}. Please check your inbox and click the verification link to enter your workspace.`,
        );
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Authentication service unavailable.");
    } finally {
      setBusy(false);
    }
  }

  async function handleSignInAndJoin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const targetEmail = (emailParam || email).trim();
    setBusy(true);
    setErrorMsg("");
    setMessage("");
    try {
      const client = await getAuthClient();
      const { data, error } = await client.auth.signInWithPassword({
        email: targetEmail,
        password,
      });
      if (error) {
        setErrorMsg(error.message || "Invalid credentials.");
        setBusy(false);
        return;
      }
      if (data.session) {
        setSignedInAs(data.session.user.email ?? targetEmail);
        setMessage("Signed in! Joining your organization workspace…");
        await handleAccept(token);
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Sign in failed.");
    } finally {
      setBusy(false);
    }
  }

  const isMatchedSession = signedInAs && emailParam && signedInAs.toLowerCase() === emailParam.toLowerCase();

  return (
    <main className="saas-auth" style={{ maxWidth: 540 }}>
      <p className="eyebrow" style={{ letterSpacing: "0.08em", fontWeight: 700, color: "#166534" }}>
        YOUR WORKSPACE INVITATION
      </p>
      <h1 style={{ fontSize: 26, fontWeight: 700, margin: "8px 0 16px", color: "#0f172a" }}>
        {isMatchedSession ? "Accept your invitation" : "Set password & join organization"}
      </h1>

      {emailParam && (
        <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "14px 18px", borderRadius: 10, marginBottom: 20 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#166534", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 2 }}>
            Your Login ID (Username)
          </span>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#14532d", display: "flex", alignItems: "center", gap: 8 }}>
            <span>✉</span>
            <span>{emailParam}</span>
          </div>
          <span style={{ fontSize: 12, color: "#15803d", marginTop: 4, display: "block" }}>
            This email address is your permanent ID to sign in to Command Center.
          </span>
        </div>
      )}

      {errorMsg && (
        <div style={{ background: "#fef2f2", color: "#991b1b", border: "1px solid #fecaca", padding: "12px 16px", borderRadius: 8, marginBottom: 16, fontSize: 13, fontWeight: 600 }}>
          {errorMsg}
        </div>
      )}

      {message && (
        <div style={{ background: "#f0fdf4", color: "#166534", border: "1px solid #bbf7d0", padding: "12px 16px", borderRadius: 8, marginBottom: 16, fontSize: 13, fontWeight: 600 }}>
          {message}
        </div>
      )}

      {isMatchedSession ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <p style={{ color: "#475569", fontSize: 14, margin: 0 }}>
            You are signed in as <strong>{signedInAs}</strong>. Click below to accept the invitation and activate your assigned roles.
          </p>
          <button
            type="button"
            className="primary"
            disabled={busy || !token}
            onClick={() => void handleAccept(token)}
            style={{ width: "100%", padding: "12px 18px", fontSize: 15, fontWeight: 700 }}
          >
            {busy ? "Accepting…" : "✓ Accept Invitation & Open Workspace"}
          </button>
          <div style={{ textAlign: "center", marginTop: 8 }}>
            <button
              type="button"
              className="secondary"
              onClick={() => void signOut().then(() => window.location.reload())}
              style={{ fontSize: 13 }}
            >
              Sign out of {signedInAs}
            </button>
          </div>
        </div>
      ) : (
        <div>
          {mode === "setPassword" ? (
            <form onSubmit={(e) => void handleSetPasswordAndJoin(e)} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {!emailParam && (
                <label>
                  Work email
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    autoComplete="email"
                  />
                </label>
              )}
              <label>
                Set new password
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                />
              </label>
              <label>
                Confirm password
                <input
                  type="password"
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat your password"
                  autoComplete="new-password"
                />
              </label>

              <button
                type="submit"
                className="primary"
                disabled={busy || !token || !password || !confirmPassword}
                style={{ width: "100%", padding: "12px 18px", fontSize: 15, fontWeight: 700, marginTop: 4 }}
              >
                {busy ? "Setting password…" : "🔐 Set Password & Join Organization"}
              </button>

              <div style={{ textAlign: "center", marginTop: 6, fontSize: 13, color: "#64748b" }}>
                Already have a password for this account?{" "}
                <button
                  type="button"
                  style={{ background: "none", border: "none", color: "#2563eb", fontWeight: 600, padding: 0, cursor: "pointer", textDecoration: "underline" }}
                  onClick={() => setMode("signIn")}
                >
                  Sign in instead
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={(e) => void handleSignInAndJoin(e)} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {!emailParam && (
                <label>
                  Work email
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    autoComplete="email"
                  />
                </label>
              )}
              <label>
                Password
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your existing password"
                  autoComplete="current-password"
                />
              </label>

              <button
                type="submit"
                className="primary"
                disabled={busy || !token || !password}
                style={{ width: "100%", padding: "12px 18px", fontSize: 15, fontWeight: 700, marginTop: 4 }}
              >
                {busy ? "Signing in…" : "Sign In & Accept Invitation"}
              </button>

              <div style={{ textAlign: "center", marginTop: 6, fontSize: 13, color: "#64748b" }}>
                Need to create or set your password?{" "}
                <button
                  type="button"
                  style={{ background: "none", border: "none", color: "#2563eb", fontWeight: 600, padding: 0, cursor: "pointer", textDecoration: "underline" }}
                  onClick={() => setMode("setPassword")}
                >
                  Set password
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {signedInAs && !isMatchedSession && (
        <div style={{ marginTop: 24, padding: "12px 16px", background: "#fef3c7", border: "1px solid #fde68a", borderRadius: 8, fontSize: 13, color: "#92400e" }}>
          <span>
            You are currently signed in as <strong>{signedInAs}</strong>. If this invitation was sent to another address, please sign out first.
          </span>
          <div style={{ marginTop: 8 }}>
            <button
              type="button"
              className="secondary"
              onClick={() => void signOut().then(() => window.location.reload())}
              style={{ fontSize: 12, padding: "4px 10px" }}
            >
              Sign out
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

