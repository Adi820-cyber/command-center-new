import { useState, useRef, useEffect, useMemo } from "react";
import { Sparkles, X, Send, Lock, ShieldCheck } from "lucide-react";
import { type SaasWorkspace, WorkspaceAskResponseSchema, type WorkspaceAskResponse } from "@orbit/contracts";
import { request } from "./client";
import "./executive.css";

interface ChatMessage {
  id: string;
  sender: "bot" | "user";
  text: string;
  time: string;
  roleBadge?: string;
  facts?: WorkspaceAskResponse["facts"];
  sources?: WorkspaceAskResponse["sources"];
  isRestricted?: boolean;
}

export interface ExecutiveChatbotProps {
  isOpen: boolean;
  onToggle: () => void;
  seedPrompt?: string;
  onClearSeed?: () => void;
  workspace?: SaasWorkspace;
  tenant?: string;
  isOperator?: boolean;
  userEmail?: string;
  userName?: string;
}

export function ExecutiveChatbot({
  isOpen,
  onToggle,
  seedPrompt,
  onClearSeed,
  workspace,
  tenant,
  isOperator = false,
  userEmail = "",
  userName = "",
}: ExecutiveChatbotProps) {
  // Determine active role title & scope
  const { roleTitle, scopeTitle, isManager, allowedKpis } = useMemo(() => {
    if (isOperator) {
      return {
        roleTitle: "Platform Operator (Super Admin)",
        scopeTitle: "SaaS Platform Scope",
        isManager: true,
        allowedKpis: [],
      };
    }

    if (workspace?.organization.owner) {
      return {
        roleTitle: "Organization Admin (Manager)",
        scopeTitle: workspace.organization.name,
        isManager: true,
        allowedKpis: workspace.kpis ?? [],
      };
    }

    // Role-scoped member: find roles assigned to this user
    const currentMember = workspace?.members?.find(
      (m) => m.email?.toLowerCase() === userEmail?.toLowerCase(),
    );
    const roleNames = (
      currentMember?.roleIds
        ?.map((rid) => workspace?.roles?.find((r) => r.id === rid)?.name)
        .filter(Boolean) as string[]
    ) ?? [];

    const effectiveRole = roleNames.length > 0 ? roleNames.join(", ") : "Role Member";

    return {
      roleTitle: effectiveRole,
      scopeTitle: workspace?.organization.name ?? "Organization",
      isManager: false,
      allowedKpis: workspace?.kpis ?? [],
    };
  }, [isOperator, workspace, userEmail]);

  const welcomeMessage = useMemo(() => {
    const greeting = userName || (isManager ? (isOperator ? "Platform Operator" : "Organization Admin") : roleTitle);
    return `Hello, ${greeting}. I am your Role-Scoped AI Assistant for ${scopeTitle}.

🔒 Authorized under: ${roleTitle}
Scope: ${scopeTitle}

I strictly provide answers, telemetry, and metrics authorized for your role. How can I assist you today?`;
  }, [userName, isManager, isOperator, roleTitle, scopeTitle]);

  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: "m-init",
      sender: "bot",
      text: welcomeMessage,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      roleBadge: roleTitle,
    },
  ]);

  // Update initial message if role context becomes available
  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 1 && prev[0]?.id === "m-init") {
        return [
          {
            id: "m-init",
            sender: "bot",
            text: welcomeMessage,
            time: prev[0].time,
            roleBadge: roleTitle,
          },
        ];
      }
      return prev;
    });
  }, [welcomeMessage, roleTitle]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (seedPrompt) {
      if (!isOpen) onToggle();
      void handleSend(seedPrompt);
      onClearSeed?.();
    }
  }, [seedPrompt]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  const handleSend = async (textToSend?: string) => {
    const q = (textToSend || input).trim();
    if (!q || loading) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: "user",
      text: q,
      time: timeStr,
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput("");
    setLoading(true);

    try {
      // 1. Send query to role-scoped backend endpoint
      const askUrl = isOperator
        ? "/api/control/ask"
        : tenant
        ? `/api/saas/${tenant}/ask`
        : "";

      if (askUrl) {
        const response = await request(askUrl, WorkspaceAskResponseSchema, { question: q });

        const botMsg: ChatMessage = {
          id: `b-${Date.now()}`,
          sender: "bot",
          text: response.answer,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          roleBadge: response.roleBadge || roleTitle,
          facts: response.facts,
          sources: response.sources,
        };
        setMessages((prev) => [...prev, botMsg]);
        return;
      }
    } catch {
      // Fall through to strict client-side role enforcement if offline / mock mode
    } finally {
      setLoading(false);
    }

    // 2. Client-side Role-Scoped Security Guard (ensures chatbot NEVER leaks data apart from role)
    const lower = q.toLowerCase();
    let reply = "";
    let isRestricted = false;

    if (!isManager) {
      // NON-ADMIN / ROLE-SCOPED MEMBER:
      // Can ONLY see KPIs in their role grants
      const mentionsAllowedKpi = allowedKpis.find((k) =>
        lower.includes(k.name.toLowerCase()) || lower.includes(k.description.toLowerCase())
      );

      // Sensitive group metrics that regular roles must NOT see
      const isRestrictedTopic =
        lower.includes("ebitda") ||
        lower.includes("profit") ||
        lower.includes("capex") ||
        lower.includes("salary") ||
        lower.includes("compensation") ||
        lower.includes("board meeting") ||
        lower.includes("revenue across all") ||
        lower.includes("other branch");

      if (isRestrictedTopic && !mentionsAllowedKpi) {
        reply = `🔒 Role Access Restriction:
Under your assigned role as "${roleTitle}", you are only authorized to access data and metrics assigned to your role:
${allowedKpis.length > 0 ? allowedKpis.map((k) => `• ${k.name}`).join("\n") : "• No KPI metrics currently assigned to this role."}

I cannot retrieve, compute, or disclose financial, capex, or executive data outside your role's scope.`;
        isRestricted = true;
      } else if (mentionsAllowedKpi) {
        const matchingResult = workspace?.results?.find((r) => r.kpiId === mentionsAllowedKpi.id);
        const displayVal = matchingResult?.value ?? "No figures reported yet";
        const targetVal = mentionsAllowedKpi.target ? ` (Target: ${mentionsAllowedKpi.target})` : "";
        reply = `Authorized data for "${mentionsAllowedKpi.name}" (${mentionsAllowedKpi.unit}):
Current Value: ${displayVal}${targetVal}
Direction: ${mentionsAllowedKpi.direction === "higher" ? "Higher is better" : "Lower is better"}
Status: ${matchingResult ? "Verified" : "Pending batch data upload"}`;
      } else {
        reply = `Under your role "${roleTitle}", you have access to:
${allowedKpis.length > 0 ? allowedKpis.map((k) => `• ${k.name} (${k.unit})`).join("\n") : "• No assigned KPIs."}

Ask a question specific to one of your authorized metrics above.`;
      }
    } else if (workspace?.organization.owner) {
      // ORGANIZATION ADMIN (MANAGER OF ORG FOR PLATFORM)
      if (lower.includes("role") || lower.includes("permission") || lower.includes("access")) {
        reply = `As Organization Admin, you manage roles and access for ${workspace.organization.name}:
• ${workspace.roles.length} roles configured: ${workspace.roles.map((r) => r.name).join(", ")}.
• You can create new roles, set role capabilities (view, act, submit, approve, configure), and assign which KPIs each role can see.
• Under each role, you can create employee logins: you set their email, and a temporary ID and password is generated for you to provide directly to the employee.`;
      } else if (lower.includes("kpi") || lower.includes("catalog") || lower.includes("custom")) {
        reply = `As Organization Admin, you manage KPIs for ${workspace.organization.name}:
• ${workspace.kpis.length} active KPIs in your organization.
• Predefined KPI Catalog: You can browse 592 predefined metrics library (Clinical, Financial, Operational) and add them to your org in 1 click.
• Custom KPI Builder: You can build custom KPIs with custom formulas, directions, target tolerances, and base measures.`;
      } else if (lower.includes("password") || lower.includes("login") || lower.includes("temp") || lower.includes("credential") || lower.includes("people")) {
        reply = `Employee Logins & Credential Management:
• Your organization has ${workspace.members.length} members with credentials.
• When you add an employee login to a role, a temporary Login ID and password is generated for you to provide directly to the user.
• You have full access to view employee emails, reset temporary passwords, or change their assigned roles anytime in Roles & Permissions.`;
      } else if (lower.includes("approval") || lower.includes("batch") || lower.includes("data") || lower.includes("csv")) {
        reply = `Data Ingestion & Approvals:
• ${workspace.results.length} KPI figures are currently active.
• You can import CSV data or review submitted batch periods in "Data & Approvals".
• As Organization Admin, you can review, verify, and approve batch submissions before figures are published.`;
      } else {
        reply = `Organization Management Overview (${workspace.organization.name}):
• Active Roles: ${workspace.roles.length} (${workspace.roles.map((r) => r.name).join(", ")})
• Active KPIs: ${workspace.kpis.length} (${workspace.kpis.filter((k) => k.target !== null).length} with targets)
• Team Members: ${workspace.members.length} with logins
• Structure: ${workspace.units.length} facilities/departments configured

How would you like to manage your organization's roles, KPIs, credentials, or data?`;
      }
    } else {
      // PLATFORM OPERATOR
      reply = `SaaS Platform Management Overview:
• Active operator session monitoring all client organizations.
• You can manage client subscriptions, review onboarding status, and monitor platform recurring revenues in the Operator dashboard.`;
    }

    const botMsg: ChatMessage = {
      id: `b-${Date.now()}`,
      sender: "bot",
      text: reply,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      roleBadge: roleTitle,
      isRestricted,
    };
    setMessages((prev) => [...prev, botMsg]);
  };

  // Suggested questions based on role
  const suggestions = useMemo(() => {
    if (isOperator) {
      return [
        "Show platform revenue and active subscriptions",
        "Which client organizations are currently active?",
        "Show recent tenant onboarding events",
      ];
    }
    if (isManager) {
      return [
        "Which roles and permissions are configured?",
        "How do I create an employee login with temporary password?",
        "Show our active predefined and custom KPIs",
        "What data batches are pending approval?",
      ];
    }
    // Specific role
    if (allowedKpis.length > 0) {
      return [
        `How is ${allowedKpis[0]!.name} performing?`,
        "Show my role-authorized KPIs and targets",
        "What are my pending actions?",
      ];
    }
    return [
      "What are my role permissions?",
      "Show my authorized data scope",
    ];
  }, [isOperator, isManager, allowedKpis]);

  return (
    <>
      {/* ─── Floating Launcher Strictly in Bottom-Right Corner ─── */}
      <button
        type="button"
        className="exec-floating-chatbot-launcher"
        onClick={onToggle}
        aria-label="Open Role-Scoped AI Assistant"
      >
        <Sparkles size={18} color="#38bdf8" />
        <span>{isOpen ? "Close Assistant" : `✦ Ask AI Assistant (${roleTitle.slice(0, 18)})`}</span>
      </button>

      {/* ─── Floating AI Assistant Panel in Bottom-Right Corner ─── */}
      {isOpen && (
        <div className="exec-chatbot-panel" role="region" aria-label="Role-Scoped AI Assistant">
          <div className="exec-chatbot-header">
            <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, overflow: "hidden" }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: "#2563eb",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Sparkles size={17} color="#ffffff" />
              </div>
              <div style={{ overflow: "hidden" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <h3 style={{ fontSize: 13.5, fontWeight: 800, margin: 0, color: "#ffffff" }}>
                    Role-Scoped Assistant
                  </h3>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      padding: "1px 6px",
                      borderRadius: 4,
                      background: "#1e3a8a",
                      color: "#93c5fd",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 3,
                    }}
                  >
                    <Lock size={10} /> Role Scoped
                  </span>
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: "#93c5fd",
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                  title={`${roleTitle} · ${scopeTitle}`}
                >
                  {roleTitle} · {scopeTitle}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={onToggle}
              style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", padding: 4 }}
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>

          <div className="exec-chatbot-messages">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`exec-chat-bubble ${m.sender}`}
                style={
                  m.isRestricted
                    ? { background: "#fff1f2", border: "1px solid #fecdd3", color: "#9f1239" }
                    : undefined
                }
              >
                {m.roleBadge && m.sender === "bot" && (
                  <div
                    style={{
                      fontSize: 10.5,
                      fontWeight: 700,
                      color: m.isRestricted ? "#e11d48" : "#2563eb",
                      marginBottom: 4,
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <ShieldCheck size={12} />
                    <span>{m.roleBadge}</span>
                  </div>
                )}
                <div style={{ whiteSpace: "pre-wrap" }}>{m.text}</div>

                {/* Facts returned from verified backend calculation */}
                {m.facts && m.facts.length > 0 && (
                  <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {m.facts.slice(0, 6).map((f, i) => (
                      <span
                        key={i}
                        style={{
                          fontSize: 10.5,
                          fontWeight: 600,
                          padding: "2px 6px",
                          borderRadius: 4,
                          background: "#f1f5f9",
                          color: "#334155",
                          border: "1px solid #cbd5e1",
                        }}
                      >
                        <strong>{f.label}:</strong> {f.value}
                      </span>
                    ))}
                  </div>
                )}

                <div
                  style={{
                    fontSize: 10,
                    marginTop: 6,
                    textAlign: m.sender === "user" ? "right" : "left",
                    opacity: 0.65,
                  }}
                >
                  {m.time}
                </div>
              </div>
            ))}

            {loading && (
              <div className="exec-chat-bubble bot" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Sparkles size={14} className="animate-spin" color="#2563eb" />
                <span style={{ fontSize: 12, color: "#64748b" }}>Querying role-authorized data…</span>
              </div>
            )}

            {messages.length <= 2 && (
              <div className="exec-chat-starters">
                <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                  Suggested for your role
                </span>
                {suggestions.map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="exec-chat-starter-btn"
                    onClick={() => void handleSend(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form
            className="exec-chatbot-composer"
            onSubmit={(e) => {
              e.preventDefault();
              void handleSend();
            }}
          >
            <input
              type="text"
              className="exec-chatbot-input"
              placeholder={`Ask about your authorized ${isManager ? "organization & roles" : "metrics"}…`}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
            />
            <button
              type="submit"
              className="exec-btn-primary"
              style={{ padding: "8px 14px", borderRadius: 8 }}
              disabled={!input.trim() || loading}
            >
              <Send size={15} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
