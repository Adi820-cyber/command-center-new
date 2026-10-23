import { useEffect, useState, type FormEvent } from "react";
import {
  MutationResponseSchema,
} from "@orbit/contracts";
import { getCurrentSession, signOut } from "../../lib/auth";
import { mutate, request } from "../saas/client";
import { AskPanel } from "../saas/ask-panel";
import { SaaSOrganizationsManager } from "./saas-orgs-manager";
import "../saas/saas.css";
import "../saas/v2.css";

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
  const [assistantOpen, setAssistantOpen] = useState(false);

  useEffect(() => {
    let active = true;
    void getCurrentSession().then((session) => {
      if (active) setEmail(session?.user.email ?? "");
    });
    // Check if current account is a verified platform operator
    request("/api/control/me", MutationResponseSchema)
      .then(() => {
        if (!active) return;
        setAccess("granted");
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
                  Only platform operator accounts can manage organizations across the SaaS platform. A customer account (an owner or a member) works in its own workspace instead.
                </>
              )}
            </p>
            {message && (
              <p className="muted" style={{ padding: "8px 12px", background: "#f8fafc", borderRadius: 6, border: "1px solid #e2e8f0" }}>
                {message}
              </p>
            )}
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
    <main className="saas-console operator-portal" style={{ maxWidth: 1200, margin: "24px auto" }}>
      <header className="operator-header">
        <div className="operator-header-brand">
          <span className="operator-brand-icon">◈</span>
          <div>
            <h1>Command Center</h1>
            <p className="eyebrow">PLATFORM OPERATOR CONSOLE · SAAS DASHBOARD</p>
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
            style={{ padding: "6px 14px", fontSize: 13, fontWeight: 600 }}
            onClick={() => window.location.assign("/")}
            title="Switch to customer workspace view"
          >
            ◈ Open Workspace
          </button>
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

      {/* ── Main SaaS Organizations & Clients Manager ── */}
      <SaaSOrganizationsManager
        operatorEmail={email}
        onSelectWorkspace={(tenantId) => {
          window.location.assign(`/?tenant=${tenantId}`);
        }}
        title="SaaS Organizations & Clients"
        description="Manage all client organizations subscribed to your SaaS platform. Control operational status (stop / suspend, start / activate), monitor headcounts, and onboard new tenant organizations."
      />

      {/* ── Starter KPI Proposal Section ── */}
      <section className="saas-card" style={{ marginTop: 24 }}>
        <h2>Propose a starter KPI</h2>
        <details>
          <summary>Send a setup proposal to a client organization</summary>
          <p className="muted" style={{ margin: "8px 0 16px", fontSize: 13 }}>
            The customer reviews this proposal in their workspace. It creates a draft, never an automatically activated calculation.
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
              Organization ID
              <input name="tenant" required placeholder="Paste organization UUID" />
            </label>
            <div className="console-grid">
              <label>
                KPI name
                <input name="name" required maxLength={120} placeholder="e.g. Order Fill Rate" />
              </label>
              <label>
                KPI key
                <input name="key" required pattern="[a-z][a-z0-9_]*" placeholder="order_fill_rate" />
              </label>
            </div>
            <label>
              Business definition
              <input name="description" required maxLength={2000} placeholder="What does this KPI represent?" />
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
                <input name="inputA" required pattern="[a-z][a-z0-9_]*" placeholder="completed_orders" />
              </label>
              <label>
                Input B key (for percentage)
                <input name="inputB" pattern="[a-z][a-z0-9_]*" placeholder="total_orders" />
              </label>
            </div>
            {message && <output className="saas-message">{message}</output>}
            <div style={{ marginTop: 12 }}>
              <button disabled={busy}>Send setup proposal</button>
            </div>
          </form>
        </details>
      </section>

      {/* ── Platform Metadata AI Assistant ── */}
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
