import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  ControlOrganizationListSchema,
  MutationResponseSchema,
  PurgeOrganizationResponseSchema,
  ProvisionResponseSchema,
  TemplateListSchema,
  type TemplateSummary,
} from "@orbit/contracts";
import { getCurrentSession, signOut } from "../../lib/auth";
import { mutate, request } from "../saas/client";
import { AccessPanel, type IssuedSet } from "../saas/access-panel";
import { AskPanel } from "../saas/ask-panel";
import "../saas/saas.css";
import "../saas/v2.css";

type Organizations = ReturnType<typeof ControlOrganizationListSchema.parse>;

const onSubmitAsync =
  (fn: (event: FormEvent<HTMLFormElement>) => Promise<void>) =>
  (event: FormEvent<HTMLFormElement>) => {
    void fn(event);
  };


type Access = "checking" | "granted" | "denied" | "unreachable";

export function OperatorConsoleRoute() {
  const [access, setAccess] = useState<Access>("checking");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [organizations, setOrganizations] = useState<Organizations>([]);
  const [templates, setTemplates] = useState<TemplateSummary[]>([]);
  const [issued, setIssued] = useState<IssuedSet>();
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [confirming, setConfirming] = useState<{ id: string; kind: "delete" | "erase"; typed: string }>();

  useEffect(() => {
    let active = true;
    void getCurrentSession().then((session) => {
      if (active) setEmail(session?.user.email ?? "");
    });
    // Find out first whether this account is a platform operator, so a customer
    // account gets an explanation instead of a form that cannot work.
    request("/api/control/me", MutationResponseSchema)
      .then(() => {
        if (!active) return;
        setAccess("granted");
        request("/api/control/organizations", ControlOrganizationListSchema)
          .then((rows) => active && setOrganizations(rows))
          .catch((e) => {
            if (!active) return;
            const msg = e instanceof Error ? e.message : "Unable to load organizations.";
            setMessage(msg.startsWith("[") && msg.includes("expected") ? "Unable to parse organization response from control API." : msg);
          });
        request("/api/control/templates", TemplateListSchema)
          .then((rows) => active && setTemplates(rows))
          .catch((e) => active && setMessage(`The industry templates could not be loaded: ${e.message}`));
      })
      .catch((e) => {
        if (!active) return;
        const msg = e instanceof Error ? e.message : "Access could not be checked.";
        setMessage(msg);
        if (
          msg.includes("API address is not configured") ||
          msg.includes("Failed to fetch") ||
          msg.includes("could not reach") ||
          msg.includes("NetworkError") ||
          msg.includes("Load failed")
        ) {
          setAccess("unreachable");
        } else {
          setAccess("denied");
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const byId = useMemo(() => new Map(templates.map((t) => [t.id, t])), [templates]);
  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const field = (name: string) => {
      const value = data.get(name);
      return typeof value === "string" ? value : "";
    };
    setBusy(true);
    setIssued(undefined);
    setMessage("");
    try {
      const result = await request("/api/control/organizations", ProvisionResponseSchema, {
        name: field("name"),
        industry: field("industry"),
        plan: field("plan"),
        ownerName: field("ownerName"),
        ownerEmail: field("email"),
        subscriptionStatus: "trial",
        ownerEmailVerified: true,
        activate: data.get("activate") === "on",
        members: [],
      });
      setIssued({ title: "Organization created", mode: result.mode, people: [result.owner] });
      setMessage(
        `“${field("name")}” was created. Send the owner their sign-in details. They choose a template or build their own roles and KPIs, and add their people.`,
      );
      form.reset();
      setOrganizations(await request("/api/control/organizations", ControlOrganizationListSchema));
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Unable to provision organization.");
    } finally {
      setBusy(false);
    }
  }

  // The time, kept current while the page is open, to decide whether a deleted organization may be erased.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(timer);
  }, []);
  const canErase = (purgeAfter: string | null) => purgeAfter !== null && new Date(purgeAfter).getTime() <= now;

  const refresh = async () => setOrganizations(await request("/api/control/organizations", ControlOrganizationListSchema));

  /** Moves an organization to a new status, then refreshes the list. */
  async function moveTo(org: Organizations[number], status: "active" | "suspended" | "deleted", confirmName?: string) {
    setBusy(true);
    setMessage("");
    try {
      await request(`/api/control/organizations/${org.id}/status`, MutationResponseSchema, { status, ...(confirmName ? { confirmName } : {}) });
      await refresh();
      setMessage(
        status === "active"
          ? `“${org.name}” is active.`
          : status === "suspended"
            ? org.status === "deleted"
              ? `“${org.name}” was restored. It is suspended until you activate it.`
              : `“${org.name}” is suspended. Nobody in it can work until you activate it again.`
            : `“${org.name}” was deleted. You can restore it for 30 days, then delete it permanently.`,
      );
      setConfirming(undefined);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "That did not work.");
    } finally {
      setBusy(false);
    }
  }

  async function erase(org: Organizations[number], confirmName: string) {
    setBusy(true);
    setMessage("");
    try {
      const result = await request(`/api/control/organizations/${org.id}/purge`, PurgeOrganizationResponseSchema, { confirmName });
      await refresh();
      setMessage(
        `“${org.name}” was permanently deleted, with ${result.removedLogins} login${result.removedLogins === 1 ? "" : "s"} removed.` +
          (result.failedLogins ? ` ${result.failedLogins} could not be removed; delete them in Supabase.` : ""),
      );
      setConfirming(undefined);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "That did not work.");
    } finally {
      setBusy(false);
    }
  }

  if (access !== "granted") {
    const isUnreachable = access === "unreachable";
    return (
      <main className="saas-console">
        <p className="eyebrow">PLATFORM SETUP</p>
        <h1>
          {access === "checking"
            ? "Checking your access…"
            : isUnreachable
              ? "Control API service is not connected"
              : "This account is not a platform operator"}
        </h1>
        {access !== "checking" && (
          <>
            <p>
              {email ? <>Signed in as <strong>{email}</strong>. </> : null}
              {isUnreachable ? (
                <>
                  The frontend cannot communicate with the platform Control API service.
                  Please ensure the Control API backend is running and reachable.
                </>
              ) : (
                <>
                  Only platform operator accounts can create organizations. A customer account (an owner or a member) works in its own workspace instead.
                </>
              )}
            </p>
            <p className="muted" style={{ padding: "8px 12px", background: "#f8fafc", borderRadius: 6, border: "1px solid #e2e8f0" }}>
              {message}
            </p>
            <div className="csv-actions">
              <button
                type="button"
                className="secondary"
                onClick={() => void signOut().then(() => window.location.assign("/login"))}
              >
                Sign out and use another account
              </button>
            </div>
          </>
        )}
      </main>
    );
  }

  return (
    <main className="saas-console operator-portal">
      <header className="operator-header">
        <div className="operator-header-brand">
          <span className="operator-brand-icon">◈</span>
          <div>
            <h1>Command Center</h1>
            <p className="eyebrow">PLATFORM OPERATOR CONSOLE</p>
          </div>
        </div>
        <div className="operator-header-user">
          <span className="operator-email-pill">
            <span className="operator-dot" />
            Signed in as <strong>{email || "Operator"}</strong>
          </span>
          <button
            type="button"
            className="secondary"
            style={{ padding: "6px 14px", fontSize: 13 }}
            onClick={() => void signOut().then(() => window.location.assign("/login"))}
          >
            Sign out
          </button>
        </div>
      </header>

      <section style={{ borderTop: "none", paddingTop: 0, marginTop: 0 }}>
        <h2>Create an organization</h2>
        <p className="muted" style={{ margin: "0 0 16px" }}>
          You only create the organization and its owner&apos;s initial login. The owner configures their own business:
          industry templates, custom KPIs, units, roles, and staff. This console never accesses customer business data.
        </p>

        <form onSubmit={(event) => void create(event)}>
          <div className="console-grid">
            <label>
              Organization name
              <input name="name" required maxLength={120} placeholder="e.g. Acme Corporation" />
            </label>
            <label>
              Industry
              <input name="industry" required maxLength={120} placeholder="e.g. Professional services" />
            </label>
            <label>
              Plan
              <input name="plan" required maxLength={80} defaultValue="Pilot" placeholder="e.g. Pilot" />
            </label>
            <label>
              Owner name
              <input name="ownerName" required maxLength={120} placeholder="e.g. Asha Sharma" />
            </label>
            <label>
              Owner’s sign-in email
              <input name="email" type="email" required placeholder="owner@acme.com" />
            </label>
          </div>
        <div className="console-checks">
          <label className="check-line">
            <input type="checkbox" name="verified" required />
            <span>
              I have verified that this email address belongs to the owner.
              <small className="muted"> The owner signs in with a temporary password and must choose their own.</small>
            </span>
          </label>
          <label className="check-line">
            <input type="checkbox" name="activate" defaultChecked />
            <span>
              Activate immediately.
              <small className="muted"> Untick to keep it pending; nobody can work in it until you activate it.</small>
            </span>
          </label>
        </div>
        <div>
          <button disabled={busy}>{busy ? "Creating…" : "Create organization"}</button>
        </div>
      </form>
    </section>
    {message && <output className="saas-message">{message}</output>}
    {issued && <AccessPanel set={issued} />}

    <section>
        <h2>Organizations</h2>
        {organizations.length === 0 ? (
          <p className="muted">No organizations yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Plan & status</th>
                <th>Owner</th>
                <th>Access</th>
                <th>Template</th>
                <th><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {organizations.map((o) => {
                const t = o.templateId ? byId.get(o.templateId) : undefined;
                return (
                  <tr key={o.id}>
                    <td>
                      <strong>{o.name}</strong>
                      <small className="muted" style={{ display: "block" }}>{o.industry}</small>
                    </td>
                    <td>
                      <strong>{o.plan}</strong>
                      <small className="muted" style={{ display: "block" }}>{o.subscriptionStatus.replace("_", " ")}</small>
                      <span className={`saas-badge ${o.status === "active" ? "good" : o.status === "pending" ? "" : "bad"}`}>{o.status}</span>
                      {o.status === "deleted" && o.purgeAfter && (
                        <small className="muted" style={{ display: "block", marginTop: 4 }}>
                          Permanent deletion from {new Date(o.purgeAfter).toLocaleDateString()}
                        </small>
                      )}
                    </td>
                    <td>
                      <strong>{o.ownerName ?? "Organization owner"}</strong>
                      <small className="muted" style={{ display: "block" }}>{o.ownerEmail ?? "—"}</small>
                      {o.ownerEmailVerifiedAt && (
                        <small className="muted" style={{ display: "block" }}>
                          email verified {new Date(o.ownerEmailVerifiedAt).toLocaleDateString()}
                        </small>
                      )}
                    </td>
                    <td>
                      <span className={`saas-badge ${o.credentialStatus === "verified" ? "good" : ""}`}>
                        {o.credentialStatus === "verified" ? "Password verified" : "Reset pending"}
                      </span>
                      <small className="muted" style={{ display: "block", marginTop: 4 }}>
                        {o.userCount} user{o.userCount === 1 ? "" : "s"} · {o.roleCount} role{o.roleCount === 1 ? "" : "s"}
                      </small>
                    </td>
                    <td>{t?.name ?? (o.templateId ? o.templateId : <span className="muted">Owner still choosing</span>)}</td>
                    <td>
                      <div className="csv-actions" style={{ marginTop: 0 }}>
                        {(o.status === "pending" || o.status === "suspended") && (
                          <button type="button" disabled={busy} onClick={() => void moveTo(o, "active")}>Activate</button>
                        )}
                        {o.status === "active" && (
                          <button type="button" className="secondary" disabled={busy} onClick={() => void moveTo(o, "suspended")}>Suspend</button>
                        )}
                        {o.status === "deleted" && (
                          <button type="button" disabled={busy} onClick={() => void moveTo(o, "suspended")}>Restore</button>
                        )}
                        {o.status !== "deleted" && (
                          <button type="button" className="secondary" disabled={busy} onClick={() => setConfirming({ id: o.id, kind: "delete", typed: "" })}>
                            Delete
                          </button>
                        )}
                        {o.status === "deleted" && (
                          <button
                            type="button"
                            className="secondary"
                            disabled={busy || !canErase(o.purgeAfter)}
                            title={canErase(o.purgeAfter) ? undefined : "Allowed after the 30-day restore window"}
                            onClick={() => setConfirming({ id: o.id, kind: "erase", typed: "" })}
                          >
                            Delete permanently
                          </button>
                        )}
                      </div>
                      {confirming?.id === o.id && (
                        <div className="warn" style={{ marginTop: 10 }}>
                          <p style={{ margin: "0 0 8px" }}>
                            {confirming.kind === "delete"
                              ? "Everyone in this organization is blocked at once. Nothing is erased, and you can restore it for 30 days."
                              : "This erases the organization's data and the logins that belong only to it. It cannot be undone."}
                            {" "}Type <strong>{o.name}</strong> to confirm.
                          </p>
                          <input
                            aria-label="Type the organization name to confirm"
                            value={confirming.typed}
                            onChange={(e) => setConfirming({ ...confirming, typed: e.target.value })}
                          />
                          <div className="csv-actions">
                            <button
                              type="button"
                              disabled={busy || confirming.typed.trim() !== o.name}
                              onClick={() => void (confirming.kind === "delete" ? moveTo(o, "deleted", confirming.typed.trim()) : erase(o, confirming.typed.trim()))}
                            >
                              {confirming.kind === "delete" ? "Delete organization" : "Delete permanently"}
                            </button>
                            <button type="button" className="secondary" onClick={() => setConfirming(undefined)}>Cancel</button>
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>

      <section>
        <h2>Propose a starter KPI</h2>
        <details>
          <summary>For organizations without a template</summary>
          <p>
            The customer reviews this setup proposal. It creates a draft, never
            an automatically activated calculation.
          </p>
          <form
            onSubmit={onSubmitAsync(async (e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              const v = (key: string) => {
                const value = f.get(key);
                return typeof value === "string" ? value.trim() : "";
              };
              setBusy(true);
              const percent = v("calculation") === "percent";
              const measureUnit = v("measureUnit");
              try {
                await mutate(`/api/control/organizations/${v("tenant")}/proposals`, {
                  title: v("name"),
                  measures: [
                    { key: v("inputA"), name: v("inputA"), unit: measureUnit },
                    ...(percent ? [{ key: v("inputB"), name: v("inputB"), unit: measureUnit }] : []),
                  ],
                  kpis: [
                    {
                      key: v("key"),
                      name: v("name"),
                      description: v("description"),
                      unit: percent ? "%" : measureUnit,
                      formula: percent
                        ? { op: "percent", left: { op: "measure", key: v("inputA") }, right: { op: "measure", key: v("inputB") } }
                        : { op: "measure", key: v("inputA") },
                      direction: "neutral",
                      target: null,
                    },
                  ],
                  roles: [],
                });
                setMessage("Proposal sent for customer review.");
              } catch (error) {
                setMessage(error instanceof Error ? error.message : "Unable to propose setup.");
              } finally {
                setBusy(false);
              }
            })}
          >
            <label>
              Organization
              <select name="tenant" required>
                {organizations.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="console-grid">
              <label>
                KPI name
                <input name="name" required maxLength={120} />
              </label>
              <label>
                KPI key
                <input name="key" required pattern="[a-z][a-z0-9_]*" />
              </label>
            </div>
            <label>
              Business definition
              <input name="description" required maxLength={2000} />
            </label>
            <div className="console-grid">
              <label>
                Calculation
                <select name="calculation">
                  <option value="direct">Direct measure</option>
                  <option value="percent">A ÷ B × 100</option>
                </select>
              </label>
              <label>
                Input unit
                <input name="measureUnit" required placeholder="orders, hours…" />
              </label>
              <label>
                Input A key
                <input name="inputA" required pattern="[a-z][a-z0-9_]*" />
              </label>
              <label>
                Input B key (for percentage)
                <input name="inputB" pattern="[a-z][a-z0-9_]*" />
              </label>
            </div>
            <div>
              <button disabled={busy || !organizations.length}>Send setup proposal</button>
            </div>
          </form>
        </details>
      </section>
      <button
        type="button"
        className="assistant-launcher"
        aria-expanded={assistantOpen}
        aria-controls="operator-assistant"
        onClick={() => setAssistantOpen((open) => !open)}
      >
        {assistantOpen ? "Close assistant" : "Ask platform AI"}
      </button>
      {assistantOpen && (
        <aside id="operator-assistant" className="assistant-drawer" aria-label="Platform metadata assistant">
          <AskPanel
            endpoint="/api/control/ask"
            compact
            title="Platform assistant"
            note="This assistant sees onboarding, plans, owner credential status, and headcounts only. It cannot access customer KPI data."
            starters={[
              "Give me a platform summary",
              "Which owners still need to reset their password?",
              "Summarize subscription plans",
              "What data can the operator see?",
            ]}
          />
        </aside>
      )}
    </main>
  );
}
