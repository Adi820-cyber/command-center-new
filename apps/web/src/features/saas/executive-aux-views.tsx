import { useMemo } from "react";
import { type SaasWorkspace } from "@orbit/contracts";
import "./executive.css";

interface AuxProps {
  tab: string;
  onBackToBrief: () => void;
  onOpenChatbot: (seed?: string) => void;
  workspace?: SaasWorkspace;
}

export function ExecutiveAuxViews({
  tab,
  onBackToBrief,
  onOpenChatbot,
  workspace,
}: AuxProps) {
  const orgName = workspace?.organization.name || "Organization";
  const industry = workspace?.organization.industry || "";
  const templateId = workspace?.organization.templateId || "";

  const isDigitalMarketing = useMemo(() => {
    return (
      templateId === "digital-marketing-agency" ||
      industry.toLowerCase().includes("marketing") ||
      industry.toLowerCase().includes("social") ||
      orgName.toLowerCase().includes("being social")
    );
  }, [templateId, industry, orgName]);

  const isHealthcare = useMemo(() => {
    return (
      templateId === "healthcare-hospital" ||
      industry.toLowerCase().includes("health") ||
      industry.toLowerCase().includes("hospital") ||
      industry.toLowerCase().includes("clinic")
    );
  }, [templateId, industry]);

  // Helper to format values
  const formatMetric = (val: string | number | undefined, unit: string) => {
    if (val === undefined || val === null || val === "") return "—";
    const num = Number(val);
    if (isNaN(num)) return String(val);
    if (unit === "%") return `${num.toFixed(1)}%`;
    if (unit === "currency") {
      if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(2)}M`;
      if (num >= 1_000) return `$${(num / 1_000).toFixed(1)}k`;
      return `$${num.toLocaleString()}`;
    }
    if (unit === "ratio" || unit === "1") return `${num.toFixed(2)}x`;
    return num.toLocaleString();
  };

  // ─── 1. KPI Dashboard View ───
  if (tab === "KPI Dashboard") {
    const kpis = workspace?.kpis ?? [];
    const results = workspace?.results ?? [];

    const kpiMatrix = kpis.map((k) => {
      const match = results
        .filter((r) => r.kpiId === k.id)
        .sort((a, b) => b.end.localeCompare(a.end))[0];

      const val = typeof match?.value === "object" && match.value ? (match.value as any).value : match?.value;
      const targetVal = k.target;
      const onTarget = match?.onTarget === true;

      let varianceText = "—";
      if (val !== undefined && targetVal !== null && targetVal !== undefined) {
        const vNum = Number(val);
        const tNum = Number(targetVal);
        if (!isNaN(vNum) && !isNaN(tNum) && tNum !== 0) {
          const diffPct = ((vNum - tNum) / tNum) * 100;
          varianceText = `${diffPct >= 0 ? "+" : ""}${diffPct.toFixed(1)}%`;
        }
      }

      return {
        id: k.id,
        name: k.name,
        description: k.description,
        unit: k.unit,
        current: val !== undefined ? formatMetric(val, k.unit) : "Pending upload",
        target: targetVal !== null ? formatMetric(targetVal, k.unit) : "Target pending",
        variance: varianceText,
        onTarget: match ? onTarget : null,
      };
    });

    return (
      <div className="exec-brief-container" style={{ padding: "24px 28px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <div className="exec-eyebrows">
              <span className="exec-pill-blue">
                {isDigitalMarketing ? "DIGITAL AGENCY SCORECARD" : isHealthcare ? "CLINICAL & FINANCIAL MATRIX" : "ENTERPRISE SCORECARD"}
              </span>
              <span className="exec-pill-green">
                {workspace?.units.length ?? 0} ACTIVE {isDigitalMarketing ? "SERVICE UNITS" : "FACILITIES"}
              </span>
            </div>
            <h1 className="exec-header-title">{orgName} — KPI Dashboard &amp; Scorecard</h1>
            <p className="exec-header-subtitle">
              {isDigitalMarketing
                ? `Real-time multi-channel performance, ad spend ROAS, client retention, and revenue metrics across ${workspace?.units.length ?? 5} units.`
                : `Comprehensive run-rate and operational metrics matrix across all organizational units.`}
            </p>
          </div>
          <button
            type="button"
            className="exec-btn-dark"
            onClick={() => onOpenChatbot(`Analyze recent KPI performance and targets for ${orgName}`)}
          >
            Analyze with AI
          </button>
        </div>

        <div className="exec-card-panel" style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, margin: "0 0 14px", color: "#0f172a" }}>
            Operational Performance Health Matrix
          </h3>
          <div className="exec-table-wrap">
            <table className="exec-table">
              <thead>
                <tr>
                  <th>METRIC FAMILY &amp; KPI</th>
                  <th>CURRENT VALUE</th>
                  <th>TARGET</th>
                  <th>VARIANCE</th>
                  <th>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {kpiMatrix.length > 0 ? (
                  kpiMatrix.map((m) => (
                    <tr key={m.id}>
                      <td>
                        <strong>{m.name}</strong>
                        <span style={{ display: "block", fontSize: 11, color: "#64748b" }}>{m.description}</span>
                      </td>
                      <td style={{ fontWeight: 700, color: "#0f172a" }}>{m.current}</td>
                      <td>{m.target}</td>
                      <td style={{ fontWeight: 600 }}>{m.variance}</td>
                      <td>
                        {m.onTarget === true && (
                          <span className="exec-pill-status on-target">● On Target</span>
                        )}
                        {m.onTarget === false && (
                          <span className="exec-pill-status attention">● Variance Watch</span>
                        )}
                        {m.onTarget === null && (
                          <span className="exec-pill-status gray">● Data Pending</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center", padding: 24, color: "#64748b" }}>
                      No active KPIs configured. Browse the KPI Catalog to add predefined metrics.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <button type="button" className="exec-btn-primary" onClick={onBackToBrief}>
          ← Back to Morning Brief
        </button>
      </div>
    );
  }

  // ─── 2. Priority Inbox View ───
  if (tab === "Priority Inbox") {
    const digitalMarketingInbox = [
      {
        id: "in-1",
        title: "Q3 Performance Marketing Ad Spend & ROAS Batch Submission",
        level: "Critical",
        time: "15m ago",
        sender: "Growth Lead",
        desc: "Meta & Google Ads spend reconciliation and revenue attribution report ready for Executive approval.",
      },
      {
        id: "in-2",
        title: "Birdeye Reputation & Automated Review Response Escalation",
        level: "High",
        time: "45m ago",
        sender: "Reputation Lead",
        desc: "SLA response rate maintained at 97.93%. 4 client review escalations resolved with positive customer sentiment.",
      },
      {
        id: "in-3",
        title: "Enterprise Client Retainer Scope & Upsell Endorsement",
        level: "High",
        time: "2h ago",
        sender: "Client Success Director",
        desc: "Contract expansion ready for signoff covering short-form video content creation and paid influencer campaigns.",
      },
      {
        id: "in-4",
        title: "Social Media Campaign Studio Capacity & Creator Allocation",
        level: "Medium",
        time: "4h ago",
        sender: "Social Media Head",
        desc: "Production schedule for 45 brand reels and creative deliverables approved across agency design pods.",
      },
      {
        id: "in-5",
        title: "Annual Team Performance & Retention Incentive Pool",
        level: "Medium",
        time: "Yesterday",
        sender: "HR & Operations Lead",
        desc: "Staff performance incentives benchmarked against 98.28% client retention and zero-churn targets.",
      },
      {
        id: "in-6",
        title: "Quarterly Client NPS & Satisfaction Feedback Scorecard (Score: 81.15)",
        level: "Low",
        time: "2d ago",
        sender: "Client Accounts",
        desc: "Client sentiment benchmarks up +6.15 points across retainer accounts.",
      },
    ];

    const healthcareInbox = [
      { id: "in-1", title: "Board Audit & Risk Committee Q3 review pack", level: "Critical", time: "12m ago", sender: "Group CFO", desc: "Awaiting Chairman sign-off on capex variance and revenue reconciliation." },
      { id: "in-2", title: "Aged Receivables escalation (>60d)", level: "High", time: "45m ago", sender: "Revenue Cycle Lead", desc: "Ministry liaison meeting scheduled regarding outstanding claims." },
      { id: "in-3", title: "Corporate Healthcare Group Agreement endorsement", level: "High", time: "2h ago", sender: "Legal Head", desc: "Contract ready for signature covering corporate health lives." },
      { id: "in-4", title: "Diagnostic COE Phase-1 capex proposal", level: "High", time: "3h ago", sender: "Operations Head", desc: "Specialized clinical wing proposal for Q4 execution." },
      { id: "in-5", title: "Medical Director annual performance pool", level: "Medium", time: "5h ago", sender: "HR Head", desc: "Retention pool benchmarked to clinical safety protocols." },
      { id: "in-6", title: "Quarterly Patient Experience Index", level: "Low", time: "2d ago", sender: "Clinical Governance", desc: "Patient satisfaction benchmarks up across all healthcare facilities." },
    ];

    const inboxItems = isDigitalMarketing ? digitalMarketingInbox : healthcareInbox;

    return (
      <div className="exec-brief-container" style={{ padding: "24px 28px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <div className="exec-eyebrows">
              <span className="exec-pill-blue">DECISION WORKFLOW</span>
              <span className="exec-badge-count">{inboxItems.length} Active Items</span>
            </div>
            <h1 className="exec-header-title">Priority Inbox — {orgName}</h1>
            <p className="exec-header-subtitle">
              High-priority escalations, statutory reviews, and endorsement items requiring executive action.
            </p>
          </div>
          <button type="button" className="exec-btn-primary" onClick={onBackToBrief}>
            ← Back to Morning Brief
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {inboxItems.map((item) => (
            <div
              key={item.id}
              className="exec-tier-card"
              style={{
                borderLeft:
                  item.level === "Critical"
                    ? "4px solid #dc2626"
                    : item.level === "High"
                    ? "4px solid #f59e0b"
                    : "4px solid #3b82f6",
              }}
            >
              <div className="exec-tier-content">
                <div className="exec-tier-card-tags">
                  <span
                    className="exec-pill-status"
                    style={{
                      background: item.level === "Critical" ? "#fef2f2" : item.level === "High" ? "#fffbeb" : "#eff6ff",
                      color: item.level === "Critical" ? "#dc2626" : item.level === "High" ? "#b45309" : "#1d4ed8",
                      border: "1px solid",
                      borderColor: item.level === "Critical" ? "#fecaca" : item.level === "High" ? "#fde68a" : "#bfdbfe",
                    }}
                  >
                    ● {item.level}
                  </span>
                  <span className="exec-pill-status gray">👤 {item.sender}</span>
                  <span className="exec-pill-status gray">🕒 {item.time}</span>
                </div>
                <h3 className="exec-tier-card-title">{item.title}</h3>
                <p className="exec-tier-card-desc">{item.desc}</p>
              </div>

              <button
                type="button"
                className="exec-btn-dark"
                onClick={() => onOpenChatbot(`Provide summary and recommended decision for: ${item.title}`)}
              >
                Inspect
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ─── 3. Facilities & COEs / Units & Service Lines View ───
  if (tab === "Facilities & COEs") {
    const rawUnits = workspace?.units ?? [];

    const getUnitMeta = (name: string, kind: string) => {
      if (isDigitalMarketing) {
        if (name.includes("Campaign") || name.includes("Performance")) {
          return {
            category: "Core Service Line",
            badge: "Performance & ROAS",
            lead: "Campaign & Growth Analyst",
            desc: "Paid Ads (Meta, Google, LinkedIn), ROAS optimization, conversion tracking, and attribution.",
          };
        }
        if (name.includes("Social") || name.includes("Content")) {
          return {
            category: "Creative Service Line",
            badge: "Content & Strategy",
            lead: "Social Media & Brand Head",
            desc: "Content strategy, creative asset production, creator management, and community engagement.",
          };
        }
        if (name.includes("Reputation") || name.includes("Birdeye")) {
          return {
            category: "SaaS & CX Integration",
            badge: "Birdeye CX Platform",
            lead: "Reputation & Reviews Lead",
            desc: "Birdeye multi-channel review monitoring, sentiment analytics, and AI rapid response protocol.",
          };
        }
        if (name.includes("Client Success") || name.includes("Account")) {
          return {
            category: "Revenue & Retention",
            badge: "Client Retention",
            lead: "Client Success Director",
            desc: "Client account management, onboarding satisfaction, retainer expansion, and net retention.",
          };
        }
        return {
          category: "Executive Governance",
          badge: "Headquarters (HQ)",
          lead: "Organization Administrator",
          desc: "Central agency strategy, financial budgeting, team allocation, and company governance.",
        };
      }

      return {
        category: kind || "Business Unit",
        badge: "Operational Unit",
        lead: "Unit Administrator",
        desc: `Operational branch and service unit for ${orgName}.`,
      };
    };

    return (
      <div className="exec-brief-container" style={{ padding: "24px 28px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <div className="exec-eyebrows">
              <span className="exec-pill-blue">
                {isDigitalMarketing ? "ORGANIZATIONAL STRUCTURE" : "CLINICAL NETWORK"}
              </span>
              <span className="exec-pill-green">
                {rawUnits.length} {isDigitalMarketing ? "SERVICE UNITS & DEPARTMENTS" : "FACILITIES"}
              </span>
            </div>
            <h1 className="exec-header-title">
              {isDigitalMarketing ? "Departments & Service Lines" : "Facilities & Centers of Excellence (COEs)"}
            </h1>
            <p className="exec-header-subtitle">
              {isDigitalMarketing
                ? `Operational structure, service capabilities, dedicated leads, and performance run-rate across ${orgName}.`
                : `Network infrastructure, specialty service lines, registered bed capacity, and regional leadership.`}
            </p>
          </div>
          <button type="button" className="exec-btn-primary" onClick={onBackToBrief}>
            ← Back to Morning Brief
          </button>
        </div>

        <div className="exec-facility-grid">
          {rawUnits.length > 0 ? (
            rawUnits.map((u) => {
              const meta = getUnitMeta(u.name, u.kind);
              return (
                <div key={u.id} className="exec-card-panel">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <span className="exec-pill-blue" style={{ fontSize: 11 }}>
                      {meta.category}
                    </span>
                    <span className="exec-margin-pill green">{meta.badge}</span>
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 800, margin: "0 0 4px", color: "#0f172a" }}>
                    {u.name}
                  </h3>
                  <p style={{ fontSize: 12, color: "#2563eb", fontWeight: 700, margin: "0 0 10px" }}>
                    Lead: {meta.lead}
                  </p>
                  <p style={{ fontSize: 12, color: "#475569", margin: "0 0 10px", lineHeight: 1.5 }}>
                    {meta.desc}
                  </p>
                  <div
                    style={{
                      fontSize: 12,
                      color: "#475569",
                      display: "grid",
                      gap: 4,
                      background: "#f8fafc",
                      padding: "10px 12px",
                      borderRadius: 8,
                    }}
                  >
                    <div>
                      <strong>Unit Type:</strong> {u.kind}
                    </div>
                    <div>
                      <strong>Hierarchy:</strong> {u.parentId ? "Child Department" : "Top-level Unit"}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div style={{ color: "#64748b", padding: 24 }}>No units configured yet.</div>
          )}
        </div>
      </div>
    );
  }

  // ─── 4. Board Meetings & Follow-ups View ───
  if (tab === "Board Meetings") {
    const digitalMeetings = [
      {
        committee: "Executive Leadership & Growth Review",
        date: "Sep 08, 2026",
        chairperson: "Executive Director",
        status: "Review Pack Ready",
        pending: "Endorsement of Q3 Ad Spend & ROAS Allocations",
      },
      {
        committee: "Client Success & Account Review",
        date: "Sep 15, 2026",
        chairperson: "Client Success Director",
        status: "Pack Distributed",
        pending: "Review of 98.28% Client Retention and Upsell Target",
      },
      {
        committee: "Birdeye Reputation & CX Committee",
        date: "Sep 22, 2026",
        chairperson: "Reputation Lead",
        status: "Drafting",
        pending: "Birdeye AI Automated Response Protocol Rollout",
      },
      {
        committee: "Quarterly Strategy & Budget Session",
        date: "Sep 29, 2026",
        chairperson: "Organization Admin",
        status: "Agenda Finalized",
        pending: "Creator Network Expansion & Studio Investments",
      },
    ];

    const healthcareMeetings = [
      { committee: "Board Audit & Risk Committee", date: "Sep 08, 2026", chairperson: "Audit Partner", status: "Review Pack Ready", pending: "Chairman Endorsement Required" },
      { committee: "Group Clinical Governance Committee", date: "Sep 15, 2026", chairperson: "Chief Clinical Director", status: "Pack Distributed", pending: "Review of Zero-Harm Protocol" },
      { committee: "Remuneration & Nominations Committee", date: "Sep 22, 2026", chairperson: "HR Committee Lead", status: "Drafting", pending: "Medical Director Incentive Benchmarks" },
      { committee: "Full Executive Board Meeting", date: "Sep 29, 2026", chairperson: "Executive Chairman", status: "Agenda Finalized", pending: "Approval of Eldoret Cath Lab Phase-1" },
    ];

    const meetings = isDigitalMarketing ? digitalMeetings : healthcareMeetings;

    return (
      <div className="exec-brief-container" style={{ padding: "24px 28px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <div className="exec-eyebrows">
              <span className="exec-pill-blue">CORPORATE GOVERNANCE</span>
              <span className="exec-pill-green">Q3 2026 CALENDAR</span>
            </div>
            <h1 className="exec-header-title">Executive Meetings &amp; Resolutions Tracker</h1>
            <p className="exec-header-subtitle">
              Executive agendas, committee review packs, resolutions, and governance follow-ups for {orgName}.
            </p>
          </div>
          <button type="button" className="exec-btn-primary" onClick={onBackToBrief}>
            ← Back to Morning Brief
          </button>
        </div>

        <div className="exec-card-panel">
          <table className="exec-table">
            <thead>
              <tr>
                <th>MEETING / COMMITTEE</th>
                <th>DATE</th>
                <th>CHAIRPERSON</th>
                <th>PACK STATUS</th>
                <th>PENDING ACTION</th>
              </tr>
            </thead>
            <tbody>
              {meetings.map((m, idx) => (
                <tr key={idx}>
                  <td>
                    <strong>{m.committee}</strong>
                  </td>
                  <td>{m.date}</td>
                  <td>{m.chairperson}</td>
                  <td>
                    <span
                      className={`exec-pill-status ${
                        m.status === "Review Pack Ready"
                          ? "attention"
                          : m.status === "Pack Distributed"
                          ? "on-target"
                          : "gray"
                      }`}
                    >
                      {m.status}
                    </span>
                  </td>
                  <td>{m.pending}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // ─── 5. Project Risk View ───
  if (tab === "Project Risk") {
    const digitalRisks = [
      {
        title: "Ad Network CPM Fluctuations & Ad Fatigue",
        category: "Paid Media",
        severity: "Medium",
        exposure: "-6.2% ROAS variance",
        mitigation: "Dynamic creative rotation & audience expansion across Meta and Google.",
      },
      {
        title: "Birdeye Multi-location Review Escalations",
        category: "Customer Reputation",
        severity: "Low",
        exposure: "4 unanswered reviews",
        mitigation: "Automated AI review drafting deployed; response SLA verified under 2 hours.",
      },
      {
        title: "Content Studio Production Bandwidth Bottlenecks",
        category: "Creative Delivery",
        severity: "Medium",
        exposure: "+6d delivery variance",
        mitigation: "Freelancer creator network activated to meet short-form reel volume.",
      },
      {
        title: "Client Retainer Over-Servicing Exposure",
        category: "Agency Finance",
        severity: "Low",
        exposure: "12% unbilled hours",
        mitigation: "Scope re-alignment and retainer upsell proposal presented to client accounts.",
      },
    ];

    const healthcareRisks = [
      { title: "Capital Civil Works Overrun", category: "Capital Works", severity: "High", exposure: "+6.8% variance", mitigation: "Contingency reserve absorbed; contractor milestone inspected." },
      { title: "Public Scheme Aged Receivables Strains", category: "Financial Cycle", severity: "High", exposure: "Outstanding (>60d)", mitigation: "Direct Ministry liaison scheduled for next week." },
      { title: "Surgical Theatre Bottlenecks", category: "Clinical Capacity", severity: "Medium", exposure: "-3.5 pp occupancy", mitigation: "Dual theatre shifts implemented across regional centres." },
    ];

    const risks = isDigitalMarketing ? digitalRisks : healthcareRisks;

    return (
      <div className="exec-brief-container" style={{ padding: "24px 28px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <div className="exec-eyebrows">
              <span className="exec-pill-blue">ENTERPRISE RISK MANAGEMENT</span>
              <span className="exec-badge-count">{risks.length} Monitored Risks</span>
            </div>
            <h1 className="exec-header-title">Project Risk &amp; Mitigation Register</h1>
            <p className="exec-header-subtitle">
              Enterprise risk matrix across operational service lines, performance deliverables, client retention, and cash liquidity.
            </p>
          </div>
          <button type="button" className="exec-btn-primary" onClick={onBackToBrief}>
            ← Back to Morning Brief
          </button>
        </div>

        <div className="exec-card-panel">
          <table className="exec-table">
            <thead>
              <tr>
                <th>RISK TITLE</th>
                <th>CATEGORY</th>
                <th>SEVERITY</th>
                <th>EXPOSURE</th>
                <th>MITIGATION STATUS</th>
              </tr>
            </thead>
            <tbody>
              {risks.map((r, idx) => (
                <tr key={idx}>
                  <td>
                    <strong>{r.title}</strong>
                  </td>
                  <td>{r.category}</td>
                  <td>
                    <span
                      className="exec-pill-status"
                      style={{
                        background: r.severity === "High" ? "#fee2e2" : "#fef3c7",
                        color: r.severity === "High" ? "#b91c1c" : "#b45309",
                      }}
                    >
                      ● {r.severity}
                    </span>
                  </td>
                  <td>{r.exposure}</td>
                  <td>{r.mitigation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // ─── 6. KPI Explorer View ───
  const activeKpis = workspace?.kpis ?? [];

  return (
    <div className="exec-brief-container" style={{ padding: "24px 28px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <div className="exec-eyebrows">
            <span className="exec-pill-blue">MATHEMATICAL AUDIT</span>
            <span className="exec-pill-green">{activeKpis.length} ACTIVE KPI DEFINITIONS</span>
          </div>
          <h1 className="exec-header-title">KPI Explorer — Catalog &amp; Formula Registry</h1>
          <p className="exec-header-subtitle">
            Inspect verified formula calculations, data sources, denominators, and audit trails for {orgName}.
          </p>
        </div>
        <button type="button" className="exec-btn-primary" onClick={onBackToBrief}>
          ← Back to Morning Brief
        </button>
      </div>

      <div className="exec-card-panel">
        <table className="exec-table">
          <thead>
            <tr>
              <th>KPI NAME</th>
              <th>DESCRIPTION</th>
              <th>FORMULA</th>
              <th>UNIT</th>
              <th>DIRECTION</th>
              <th>DATA PROVENANCE</th>
            </tr>
          </thead>
          <tbody>
            {activeKpis.length > 0 ? (
              activeKpis.map((k) => (
                <tr key={k.id}>
                  <td>
                    <strong>{k.name}</strong>
                  </td>
                  <td style={{ fontSize: 12, color: "#475569", maxWidth: 260 }}>{k.description}</td>
                  <td>
                    <code>{typeof k.formula === "object" ? JSON.stringify(k.formula) : String(k.formula)}</code>
                  </td>
                  <td>{k.unit}</td>
                  <td>{k.direction === "higher" ? "Higher ↑" : k.direction === "lower" ? "Lower ↓" : "Neutral"}</td>
                  <td>
                    <span className="exec-pill-blue" style={{ fontSize: 10 }}>
                      Verified Data Ingestion
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: 24, color: "#64748b" }}>
                  No KPIs found. Browse the catalog to activate metrics.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
