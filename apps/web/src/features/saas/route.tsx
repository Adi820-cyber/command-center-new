import "./saas.css";
import {
  useCallback,
  useEffect,
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
import { AskPanel } from "./ask-panel";
import { CatalogBrowser } from "./catalog-browser";
import { CsvImport } from "./csv-import";
import { TargetEditor } from "./target-editor";
import { CustomKpiForm } from "./custom-kpi";
import { KpiActions } from "./kpi-actions";
import { Dashboard } from "./dashboard";
import { OrgHub } from "./org-hub";
import { initialOf, roleLabel, viewingAs } from "./identity";
import { SaaSOrganizationsManager } from "../operator/saas-orgs-manager";
import { SaaSRevenueDashboard, type ControlOrg } from "../operator/saas-revenue-dashboard";
import "./v2.css";
type Tab =
  | "Dashboard"
  | "Ask"
  | "Data & approvals"
  | "KPI library"
  | "Actions"
  | "Organization"
  | "Activity"
  | "SaaS Orgs";

const OPERATOR_TABS: { tab: Tab; label: string; icon: string }[] = [
  { tab: "Dashboard", label: "Platform Revenues & KPIs", icon: "◫" },
  { tab: "SaaS Orgs", label: "SaaS All Organizations", icon: "◈" },
  { tab: "Ask", label: "Platform AI Assistant", icon: "✦" },
  { tab: "Activity", label: "Platform Activity & Audit", icon: "◷" },
];

const CUSTOMER_TABS: { tab: Tab; label: string; icon: string }[] = [
  { tab: "Dashboard", label: "Dashboard", icon: "◫" },
  { tab: "Ask", label: "Ask", icon: "✦" },
  { tab: "Data & approvals", label: "Data & approvals", icon: "⇅" },
  { tab: "KPI library", label: "KPI library", icon: "◇" },
  { tab: "Actions", label: "Actions", icon: "☑" },
  { tab: "Organization", label: "Organization", icon: "◎" },
  { tab: "Activity", label: "Activity", icon: "◷" },
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
const onSubmitAsync =
  (fn: (event: FormEvent<HTMLFormElement>) => Promise<void>) =>
  (event: FormEvent<HTMLFormElement>) => {
    void fn(event);
  };
export function SaasRoute() {
  const [organizations, setOrganizations] = useState<
    ReturnType<typeof TenantListSchema.parse>
  >([]);
  const [tenant, setTenant] = useState("");
  const [workspace, setWorkspace] = useState<SaasWorkspace>();
  const [tab, setTab] = useState<Tab>("Dashboard");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const generation = useRef(0);
  const [askSeed, setAskSeed] = useState("");
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [isOperator, setIsOperator] = useState(false);
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
    setTab("Dashboard");
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
          setTab("Dashboard");
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
          selectTenant((rows.find((r) => r.status === "active") ?? rows[0])?.id ?? "");
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
          setMessage(e.message);
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
    request(`/api/saas/${tenant}/workspace`, WorkspaceSchema)
      .then((value) => {
        if (current !== generation.current) return;
        setWorkspace(value);
        if (value.organization.owner) setTab("Organization");
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
        setMessage(
          result.token
            ? `Invitation: ${window.location.origin}/invite#${result.token}`
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
    <div className="saas-shell">
      <aside className="saas-sidebar">
        <a className="saas-brand" href="/">
          ◈{" "}
          <span>
            Command Center<small>PERFORMANCE WORKSPACE</small>
          </span>
        </a>

        {isOperator ? (
          <div style={{ padding: "0 0 12px", borderBottom: "1px solid #e2e8f0", marginBottom: 12 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 4 }}>
              Active Scope
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "#eff6ff", borderRadius: 8, border: "1px solid #bfdbfe", color: "#1d4ed8", fontWeight: 700, fontSize: 13 }}>
              <span>◈</span>
              <span>SaaS Platform Scope (All Orgs)</span>
            </div>
          </div>
        ) : (
          <Field title="Organization">
            <select
              aria-label="Organization"
              value={tenant}
              disabled={busy}
              onChange={(e) => {
                selectTenant(e.target.value);
              }}
            >
              <option value="" disabled>
                Select workspace
              </option>
              {organizations.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                  {o.status === "active" ? "" : ` (${o.status})`}
                </option>
              ))}
            </select>
          </Field>
        )}

        <nav aria-label="Workspace">
          {isOperator
            ? OPERATOR_TABS.map(({ tab: item, label, icon }) => (
                <button
                  key={item}
                  className={tab === item ? "selected" : ""}
                  aria-current={tab === item ? "page" : undefined}
                  onClick={() => setTab(item)}
                  style={
                    item === "Dashboard" || item === "SaaS Orgs"
                      ? {
                          fontWeight: tab === item ? 700 : 600,
                        }
                      : undefined
                  }
                >
                  <span aria-hidden="true">{icon}</span>
                  {label}
                </button>
              ))
            : CUSTOMER_TABS.map(({ tab: item, label, icon }) => (
                <button
                  key={item}
                  className={tab === item ? "selected" : ""}
                  aria-current={tab === item ? "page" : undefined}
                  onClick={() => setTab(item)}
                >
                  <span aria-hidden="true">{icon}</span>
                  {label}
                </button>
              ))}
        </nav>

        <div className="saas-sidebar-footer">
          <div className="whoami" aria-label="Signed in as">
            <span className="whoami-avatar" aria-hidden="true">{initialOf(email)}</span>
            <span className="whoami-text">
              <strong title={email}>{email || "Signed in"}</strong>
              <small>{isOperator ? "Platform Operator (Super Admin)" : (roleLabel(workspace?.me) || (closed ? closed.status : ""))}</small>
              <small className="whoami-org">{isOperator ? "SaaS Platform Provider" : (workspace?.organization.name ?? closed?.name ?? "")}</small>
            </span>
          </div>
          <a href="/change-password">Account security</a>
          <button
            onClick={() =>
              void signOut().then(() => window.location.assign("/login"))
            }
          >
            Sign out
          </button>
        </div>
      </aside>

      <div className="saas-main">
        <header className="saas-topbar">
          <span>
            {isOperator
              ? "SaaS Platform Management"
              : (workspace?.organization.name ?? "Your organization")}{" "}
            <span className="muted">
              {" "}
              /{" "}
              {tab === "SaaS Orgs"
                ? "All Organizations"
                : isOperator && tab === "Dashboard"
                  ? "Platform Revenues & KPIs"
                  : isOperator && tab === "Ask"
                    ? "Platform AI Assistant"
                    : isOperator && tab === "Activity"
                      ? "Platform Audit & Activity"
                      : tab}
            </span>
          </span>
          <span className="saas-badge">
            {isOperator
              ? "Platform Provider (Super Admin)"
              : workspace?.organization.owner
                ? "Organization owner"
                : "Member workspace"}
          </span>
        </header>

        <main>
          <div className="saas-page-heading">
            <div>
              <p className="eyebrow">
                {isOperator
                  ? "PLATFORM TELEMETRY · REVENUE & FINANCIAL KPIS · CLIENT MANAGEMENT"
                  : "MEASURE · UNDERSTAND · ACT"}
              </p>
              <h1>
                {isOperator
                  ? tab === "Dashboard"
                    ? "Platform Revenues & KPIs"
                    : tab === "SaaS Orgs"
                      ? "All Organizations (SaaS)"
                      : tab === "Ask"
                        ? "Platform AI Assistant"
                        : "Platform Activity & Audit"
                  : tab}
              </h1>
              <p className="muted">
                {isOperator ? operatorDescription(tab) : description(tab)}
                {!isOperator && tab === "Dashboard" && workspace ? ` ${viewingAs(workspace.me)}` : ""}
              </p>
            </div>
            {!isOperator && (
              <button
                className="secondary"
                onClick={() => setTab("Data & approvals")}
              >
                ＋ Submit data
              </button>
            )}
          </div>
          {message && <output className="saas-message">{message}</output>}

          {/* ── Operator Views ── */}
          {isOperator ? (
            <div className="saas-content">
              {tab === "Dashboard" && (
                <SaaSRevenueDashboard
                  onGoToOrgs={() => setTab("SaaS Orgs")}
                  onAskOperator={(q) => {
                    setAskSeed(q);
                    setTab("Ask");
                  }}
                />
              )}
              {tab === "SaaS Orgs" && (
                <SaaSOrganizationsManager
                  onSelectWorkspace={() => {
                    setTab("Dashboard");
                  }}
                  currentTenantId={tenant}
                  operatorEmail={email}
                />
              )}
              {tab === "Ask" && (
                <AskPanel
                  endpoint="/api/control/ask"
                  seed={askSeed}
                  onSeedUsed={() => setAskSeed("")}
                  title="Platform AI Assistant"
                  note="This platform operator assistant sees onboarding, subscription plans, platform revenues, and headcounts. It cannot access customer internal clinical data."
                  starters={[
                    "Give me a platform revenue summary",
                    "Which owners still need to reset their password?",
                    "Summarize subscription plans",
                    "How many organizations were onboarded recently?",
                    "What data can the operator see?",
                  ]}
                />
              )}
              {tab === "Activity" && <OperatorActivity />}
            </div>
          ) : (
            /* ── Customer / Tenant Views ── */
            <>
              {loading && !closed && <Empty>Loading your authorized workspace…</Empty>}
              {!loading && !tenant && (
                <Empty>
                  <h2>Your workspace starts with an invitation</h2>
                  <p>
                    Ask your organization owner for an invitation. Platform
                    operators can provision an empty organization.
                  </p>
                  <a href="/login">Sign in with an authorized account</a>
                </Empty>
              )}
              {closed && (
                <Empty>
                  <div className="status-panel">
                    <p className="eyebrow">{closed.name.toUpperCase()}</p>
                    <h2>
                      {closed.status === "pending"
                        ? "Your organization is waiting to be activated"
                        : closed.status === "suspended"
                          ? "Your organization is suspended"
                          : "This organization has been removed"}
                    </h2>
                    <p>
                      {closed.status === "pending"
                        ? "Your service provider is setting it up. You will be able to sign in and work as soon as they activate it."
                        : closed.status === "suspended"
                          ? "Access has been paused. Nothing has been lost. Contact your service provider to have it restored."
                          : "It is no longer available. Contact your service provider if you think this is a mistake."}
                    </p>
                    <button type="button" onClick={() => void signOut().then(() => window.location.assign("/login"))}>
                      Sign out
                    </button>
                  </div>
                </Empty>
              )}
              {workspace && !closed && (
                <fieldset disabled={busy} className="saas-content" key={tenant}>
                  {tab === "Dashboard" && (
                    <Dashboard
                      workspace={workspace}
                      change={change}
                      ask={(q) => {
                        setAskSeed(q);
                        setTab("Ask");
                      }}
                      goto={setTab}
                    />
                  )}
                  {tab === "Ask" && (
                    <AskPanel tenant={tenant} seed={askSeed} onSeedUsed={() => setAskSeed("")} />
                  )}
                  {tab === "KPI library" && (
                    <Kpis workspace={workspace} change={change} />
                  )}
                  {tab === "Data & approvals" && (
                    <>
                      <CsvImport workspace={workspace} reload={reload} />
                      <DataEntry
                        workspace={workspace}
                        change={change}
                        tenant={tenant}
                      />
                    </>
                  )}
                  {tab === "Organization" &&
                    (workspace.organization.owner ? (
                      <OrgHub
                        workspace={workspace}
                        change={change}
                        goto={setTab}
                        tenant={tenant}
                        reload={reload}
                        governance={<Governance tenant={tenant} workspace={workspace} change={change} />}
                      />
                    ) : (
                      <Organization workspace={workspace} change={change} />
                    ))}
                  {tab === "Actions" && (
                    <Actions workspace={workspace} change={change} />
                  )}
                  {tab === "Activity" && <Activity tenant={tenant} />}
                </fieldset>
              )}
            </>
          )}

          <footer className="saas-footer">
            {isOperator
              ? "Platform revenue and operational metrics are derived from active client subscriptions. Illustrative telemetry."
              : "Values appear only after approved inputs are calculated. Missing data is never treated as zero."}
          </footer>
        </main>
      </div>

      {isOperator ? (
        <>
          <button
            type="button"
            className="assistant-launcher"
            aria-expanded={assistantOpen}
            aria-controls="workspace-assistant"
            onClick={() => setAssistantOpen((open) => !open)}
          >
            {assistantOpen ? "Close assistant" : "Ask Platform AI"}
          </button>
          {assistantOpen && (
            <aside id="workspace-assistant" className="assistant-drawer" aria-label="Platform metadata assistant">
              <AskPanel
                endpoint="/api/control/ask"
                compact
                title="Platform AI Assistant"
                note="This platform assistant sees onboarding, subscription plans, platform revenues, and headcounts only. It cannot access customer internal clinical data."
                starters={[
                  "Give me a platform revenue summary",
                  "Which owners still need to reset their password?",
                  "Summarize subscription plans",
                  "What data can the operator see?",
                ]}
              />
            </aside>
          )}
        </>
      ) : (
        workspace && tab !== "Ask" && (
          <>
            <button
              type="button"
              className="assistant-launcher"
              aria-expanded={assistantOpen}
              aria-controls="workspace-assistant"
              onClick={() => setAssistantOpen((open) => !open)}
            >
              {assistantOpen ? "Close assistant" : "Ask AI"}
            </button>
            {assistantOpen && (
              <aside id="workspace-assistant" className="assistant-drawer" aria-label="Role-scoped data assistant">
                <AskPanel tenant={tenant} compact />
              </aside>
            )}
          </>
        )
      )}
    </div>
  );
}

function operatorDescription(tab: Tab) {
  return {
    Dashboard: "Platform revenue telemetry, Monthly Recurring Revenue (MRR), ARR, and SaaS platform KPIs.",
    "SaaS Orgs": "Manage all client organizations subscribed to your SaaS platform: stop/suspend access, activate new clients, and monitor onboarding.",
    Ask: "Ask platform questions. Answers derive only from platform telemetry, subscriptions, and onboarding metadata.",
    Activity: "Platform audit log of organization status changes, lifecycle events, and tenant onboarding.",
    "Data & approvals": "",
    "KPI library": "",
    Actions: "",
    Organization: "",
  }[tab];
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
  return {
    Dashboard: "Your morning brief: what changed, what is off target, and what to act on.",
    Ask: "Ask in plain words. Answers use only what your role can see.",
    "Data & approvals":
      "Submit aggregate measures and review them before publication.",
    "KPI library":
      "Define what matters. Keep every calculation explicit and versioned.",
    Actions: "Turn an observation into an accountable next step.",
    Organization: "Run your organization: its details, roles and the KPIs each one sees, people and units.",
    Activity: "An auditable record of changes in your workspace.",
    "SaaS Orgs": "Manage all client organizations subscribed to your SaaS platform. Stop/suspend access, activate new clients, and monitor onboarding.",
  }[tab];
}
type Props = {
  workspace: SaasWorkspace;
  change: (path: string, body: unknown) => Promise<boolean>;
};
function Kpis({ workspace: w, change }: Props) {
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
function Organization({ workspace: w, change }: Props) {
  return (
    <>
      <div className="saas-columns">
        <section className="saas-card">
          <h2>Organization structure</h2>
          <ul>
            {w.units.map((u) => (
              <li key={u.id}>
                {u.name}{" "}
                <small>
                  · {u.kind}
                  {u.parentId
                    ? ` · under ${w.units.find((p) => p.id === u.parentId)?.name}`
                    : ""}
                </small>
              </li>
            ))}
          </ul>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              void change("/units", {
                name: text(f, "name"),
                kind: text(f, "kind"),
                parentId: text(f, "parentId") || null,
              });
            }}
          >
            <Field title="Unit name">
              <input name="name" required maxLength={120} />
            </Field>
            <Field title="Unit type">
              <input
                name="kind"
                placeholder="Branch, team, department…"
                required
                maxLength={60}
              />
            </Field>
            <Field title="Parent">
              <select name="parentId">
                {w.units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </Field>
            <button>Add unit</button>
          </form>
        </section>
        {w.organization.owner && (
          <section className="saas-card">
            <h2>Create a business role</h2>
            <p>
              Role names do not grant authority. Choose explicit capabilities
              and a unit scope. This form grants all KPIs within that scope.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                void change("/roles", {
                  name: text(f, "name"),
                  grants: f
                    .getAll("capability")
                    .flatMap((capability) => {
                      const selected=f.getAll('kpis');
                      const ids=(capability==='view'||capability==='act')&&selected.length?selected:[null];
                      return ids.map(kpiId=>({capability,unitId:capability==='configure'?null:text(f,'unitId')||null,kpiId}));
                    }),
                });
              }}
            >
              <Field title="Role name">
                <input name="name" required maxLength={120} />
              </Field>
              <Field title="Scope">
                <select name="unitId">
                  <option value="">Entire organization</option>
                  {w.units.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} and descendants
                    </option>
                  ))}
                </select>
              </Field>
              {["view", "submit", "approve", "act", "configure"].map((c) => (
                <label className="saas-checkbox" key={c}>
                  <input type="checkbox" name="capability" value={c} />
                  {c === "configure"
                    ? "Configure definitions and units (organization-wide)"
                    : c}
                </label>
              ))}
              <Field title="Visible/actionable KPIs (optional)">
                <select name="kpis" multiple size={Math.min(5,Math.max(2,w.kpis.length))}>
                  {w.kpis.filter(k=>k.state==='active').map(k=><option key={k.id} value={k.id}>{k.name} (all versions)</option>)}
                </select>
              </Field>
              <p>Leave KPI selection empty to include all KPIs in scope. Submit and approve apply to aggregate input data for the selected unit.</p>
              <button>Create role</button>
            </form>
          </section>
        )}
      </div>
      {w.organization.owner && (
        <section className="saas-card">
          <h2>Invite a team member</h2>
          <p>
            Choose one or more roles. The recipient must sign in with this
            verified email before accepting the private invitation.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              void change("/invitations", {
                email: text(f, "email"),
                roleIds: f.getAll("roles"),
              });
            }}
          >
            <Field title="Work email">
              <input name="email" type="email" required />
            </Field>
            {w.roles.map((r) => (
              <label className="saas-checkbox" key={r.id}>
                <input name="roles" type="checkbox" value={r.id} />
                {r.name}
              </label>
            ))}
            <button disabled={!w.roles.length}>
              Create private invitation
            </button>
          </form>
        </section>
      )}
      <section className="saas-card">
        <h2>Members</h2>
        <p>
          There is no fixed number of users or business roles. Member
          identifiers are shown until profile names are configured.
        </p>
        <table>
          <thead>
            <tr>
              <th>Member</th>
              <th>Access</th>
              <th>Status</th>
              <th>Manage</th>
            </tr>
          </thead>
          <tbody>
            {w.members.map((m) => (
              <tr key={m.id}>
                <td>{m.subject === w.subject ? "You" : m.displayName}</td>
                <td>{m.owner ? "Owner" : "Assigned roles"}</td>
                <td>{m.active ? "Active" : "Revoked"}</td>
                <td>
                  {w.organization.owner && !m.owner && m.active && (
                    <button
                      className="secondary"
                      onClick={() => void change(`/members/${m.id}/revoke`, {})}
                    >
                      Revoke access
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {w.organization.owner&&<form onSubmit={e=>{
          e.preventDefault();const f=new FormData(e.currentTarget);
          void change(`/members/${text(f,'member')}/roles`,{roleIds:f.getAll('roles')});
        }}><h3>Replace a member’s role assignments</h3><Field title="Member"><select name="member" required>{w.members.filter(m=>m.active&&!m.owner).map(m=><option key={m.id} value={m.id}>{m.displayName}</option>)}</select></Field>
          {w.roles.map(r=><label className="saas-checkbox" key={r.id}><input type="checkbox" name="roles" value={r.id}/>{r.name}</label>)}
          <p>This replaces all existing assignments. Selecting none removes all role capabilities.</p><button disabled={!w.members.some(m=>m.active&&!m.owner)}>Replace assignments</button></form>}
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
        <h2>Action register</h2>
        {!w.actions.length ? (
          <Empty>No actions yet. Start from an approved result.</Empty>
        ) : (
          w.actions.map((a) => (
            <div className="saas-observation" key={a.id}>
              <h3>{a.title}</h3><button className="secondary" onClick={()=>{setEvidenceError('');void request(`/api/saas/${w.organization.id}/results/${a.resultId}`,ResultSchema).then(setEvidence).catch(e=>setEvidenceError(e.message));}}>View original evidence</button>
              <p>
                Due {a.dueDate} · Evidence {a.resultId}
              </p>
              <Field title="Status">
                <select
                  value={a.state}
                  onChange={(e) =>
                    void change(`/actions/${a.id}/transition`, {
                      state: e.target.value,
                      expectedVersion: a.version,
                    })
                  }
                >
                  <option value="open">Open</option>
                  <option value="in_progress">In progress</option>
                  <option value="done">Done</option>
                </select>
              </Field>
            </div>
          ))
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
  useEffect(() => {
    let active = true;
    request(`/api/saas/${tenant}/audit`, AuditResponseSchema)
      .then((r) => {
        if (active) setRows(r);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [tenant]);
  return (
    <section className="saas-card">
      <h2>Recent changes</h2>
      <p>
        Latest 200 events. Audit events record operations without copying input
        values.
      </p>
      {error && <p role="alert">{error}</p>}
      <table>
        <thead>
          <tr>
            <th>When</th>
            <th>Event</th>
            <th>Actor</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td>{r.createdAt}</td>
              <td>{r.event}</td>
              <td>{r.subject}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
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
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  // Who is signed in, so a person can see at once whether it is the invited account.
  const [signedInAs, setSignedInAs] = useState<string | null>();
  useEffect(() => {
    void getCurrentSession().then((session) => setSignedInAs(session?.user.email ?? null));
  }, []);
  return (
    <main className="saas-auth">
      <p className="eyebrow">YOUR WORKSPACE INVITATION</p>
      <h1>Join your organization</h1>
      <p>
        Sign in with the email that received this invitation, then accept. Your
        organization controls your access.
      </p>
      {signedInAs !== undefined && (
        <p className="warn" style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          {signedInAs ? (
            <>
              <span>
                You are signed in as <strong>{signedInAs}</strong>. If that is not the invited email, sign out first.
              </span>
              <button type="button" className="secondary" onClick={() => void signOut().then(() => window.location.reload())}>
                Sign out
              </button>
            </>
          ) : (
            <span>You are not signed in. Sign in (or create your account) with the invited email, then come back to this link.</span>
          )}
        </p>
      )}
      <button
        disabled={busy || !token}
        onClick={onClickAsync(async () => {
          setBusy(true);
          try {
            await mutate("/api/saas/invitations/accept", { token });
            window.history.replaceState(null, "", "/invite");
            window.location.assign("/");
          } catch (e) {
            setMessage(
              e instanceof Error ? e.message : "Unable to accept invitation.",
            );
          } finally {
            setBusy(false);
          }
        })}
      >
        Accept invitation
      </button>
      <output>{message}</output>
      <p>
        Keep this invitation link private. If you need to sign in, open sign-in
        in a separate tab and return here.
      </p>
      <a href="/login" target="_blank" rel="noreferrer">
        Sign in
      </a>
      <details>
        <summary>Create a sign-in account</summary>
        <p>
          Use the invited email. Confirm it using the email from the sign-in
          service, then return to this invitation.
        </p>
        <form
          onSubmit={onSubmitAsync(async (e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            setBusy(true);
            try {
              const client = await getAuthClient();
              const { error } = await client.auth.signUp({
                email: text(f, "email"),
                password: text(f, "password"),
              });
              setMessage(
                error
                  ? "Unable to create account. Check the email and password requirements."
                  : "Check your email to confirm your account, then sign in and accept this invitation.",
              );
            } catch {
              setMessage("Sign-in service unavailable.");
            } finally {
              setBusy(false);
            }
          })}
        >
          <label>
            Email
            <input name="email" type="email" required autoComplete="email" />
          </label>
          <label>
            Password
            <input
              name="password"
              type="password"
              minLength={12}
              required
              autoComplete="new-password"
            />
          </label>
          <button disabled={busy}>Create account</button>
        </form>
      </details>
    </main>
  );
}
