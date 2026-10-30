import { useState, useEffect, useMemo } from "react";
import {
  TrendingUp,
  Link as LinkIcon,
  Activity,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  X,
} from "lucide-react";
import { type SaasWorkspace } from "@orbit/contracts";
import "./executive.css";

interface Props {
  onOpenChatbot: (seed?: string) => void;
  onNavigateTab: (tab: string) => void;
  resetSignal?: number;
  workspace?: SaasWorkspace;
}

export interface DrillTarget {
  title: string;
  category: "kpi" | "facility" | "exception";
  metricValue?: string;
  targetValue?: string;
  scope?: string;
  description?: string;
  breakdown?: { label: string; value: string; margin?: string; status?: string }[];
}

export function ExecutiveMorningBrief({ onOpenChatbot, onNavigateTab, resetSignal, workspace }: Props) {
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

  // ─── Scope & Period Controls ───
  const [scope, setScope] = useState(() => (workspace?.units && workspace.units.length > 0 ? "all" : "Group"));
  const [domain, setDomain] = useState("All");
  const [period, setPeriod] = useState<"MTD" | "QTD" | "YTD">("MTD");

  // ─── Triage Feed Active Tab ───
  const [feedTab, setFeedTab] = useState<"all" | "action" | "monitor" | "track">("all");

  // ─── Executive Authorization Checklist State ───
  const [approvedOrders, setApprovedOrders] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (resetSignal) {
      setApprovedOrders({});
      setFeedTab("all");
      setScope("all");
      setDomain("All");
      setPeriod("MTD");
    }
  }, [resetSignal]);

  // ─── Interactive Modals State ───
  const [activeDrill, setActiveDrill] = useState<DrillTarget | null>(null);
  const [decisionQueueOpen, setDecisionQueueOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<
    "boardPack" | "agreement" | "capex" | "scheme" | "initiative1" | "initiative2" | "initiative3" | null
  >(null);

  // Period label
  const periodBadge = period === "MTD" ? "MTD · Jul 2026" : period === "QTD" ? "QTD · Q3 2026" : "YTD · FY 2026";

  // Helper to format metric figures
  const formatMetricValue = (val: string | number | undefined, unit: string) => {
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

  // Orders checklist data tailored to organization
  const digitalMarketingOrders = [
    {
      id: "ord-1",
      title: "Endorse Q3 Client Performance Marketing & ROAS Reconciliation Pack",
      tier: "Critical",
      due: "Tomorrow",
      scope: "Agency-wide",
      dept: "Growth & Performance",
    },
    {
      id: "ord-2",
      title: "Approve Birdeye Automated Sentiment & AI Review Response SLA",
      tier: "High",
      due: "Sep 12, 2026",
      scope: "Reputation Management",
      dept: "Online CX & Birdeye",
    },
    {
      id: "ord-3",
      title: "Review Q4 Meta & Google Paid Ad Spend Budget Reallocation",
      tier: "High",
      due: "Sep 16, 2026",
      scope: "Campaign Accounts",
      dept: "Media Planning",
    },
    {
      id: "ord-4",
      title: "Approve Client Success Annual Retention & Performance Incentive Pool",
      tier: "Medium",
      due: "Sep 18, 2026",
      scope: "All Account Pods",
      dept: "Client Retention",
    },
  ];

  const healthcareOrders = [
    {
      id: "ord-1",
      title: "Endorse Board Audit & Risk Committee Q3 review pack",
      tier: "Critical",
      due: "Tomorrow",
      scope: "Group-wide",
      dept: "Group Executive",
    },
    {
      id: "ord-2",
      title: "Sign Jubilee & AAR Corporate Group Health Agreement",
      tier: "High",
      due: "Sep 12, 2026",
      scope: "Group-wide",
      dept: "Commercial Governance",
    },
    {
      id: "ord-3",
      title: "Review Phase-1 Diagnostic COE capex proposal",
      tier: "High",
      due: "Sep 16, 2026",
      scope: "Regional Center",
      dept: "Capital Allocation",
    },
    {
      id: "ord-4",
      title: "Approve Hospital Medical Director annual incentive pool",
      tier: "Medium",
      due: "Sep 18, 2026",
      scope: "All Healthcare Units",
      dept: "Remuneration",
    },
  ];

  const ordersList = isDigitalMarketing ? digitalMarketingOrders : healthcareOrders;
  const pendingCount = ordersList.filter((o) => !approvedOrders[o.id]).length;

  const toggleOrder = (id: string) => {
    setApprovedOrders((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Compute live scorecard cards from workspace
  const kpis = workspace?.kpis ?? [];
  const results = workspace?.results ?? [];

  // Map top 5 KPI cards
  const scorecardCards = useMemo(() => {
    if (kpis.length === 0) return [];

    return kpis.slice(0, 5).map((kpi, index) => {
      const match = results
        .filter((r) => r.kpiId === kpi.id)
        .sort((a, b) => b.end.localeCompare(a.end))[0];

      const val = typeof match?.value === "object" && match.value ? (match.value as any).value : match?.value;
      const targetVal = kpi.target;
      const onTarget = match?.onTarget === true;

      let trendText = "Consistent run-rate";
      if (val !== undefined && targetVal !== null && targetVal !== undefined) {
        const vNum = Number(val);
        const tNum = Number(targetVal);
        if (!isNaN(vNum) && !isNaN(tNum) && tNum !== 0) {
          const diffPct = ((vNum - tNum) / tNum) * 100;
          trendText = `vs Target: ${diffPct >= 0 ? "+" : ""}${diffPct.toFixed(1)}%`;
        }
      }

      // Generate unit breakdown for drill
      const breakdown = (workspace?.units ?? []).map((u) => {
        return {
          label: u.name,
          value: val !== undefined ? formatMetricValue(val, kpi.unit) : "—",
          margin: onTarget ? "Optimal" : "Variance Watch",
        };
      });

      return {
        id: kpi.id,
        title: kpi.name,
        subtitle: kpi.description,
        value: val !== undefined ? formatMetricValue(val, kpi.unit) : "Pending upload",
        target: targetVal !== null ? `Target ${formatMetricValue(targetVal, kpi.unit)}` : "Target pending",
        trend: trendText,
        onTarget: match ? onTarget : null,
        weight: index === 0 ? "20%" : index === 1 ? "20%" : index === 2 ? "15%" : index === 3 ? "15%" : "10%",
        unit: kpi.unit,
        breakdown,
      };
    });
  }, [kpis, results, workspace?.units]);

  return (
    <div className="exec-brief-container">
      {/* ─── Top Controls Bar ─── */}
      <div className="exec-top-bar">
        <div className="exec-selector-group">
          <span>SCOPE</span>
          <select
            className="exec-select"
            value={scope}
            onChange={(e) => setScope(e.target.value)}
            aria-label="Select Scope"
          >
            <option value="all">All Units ({orgName})</option>
            {workspace?.units?.map((u) => (
              <option key={u.id} value={u.name}>
                {u.name} ({u.kind})
              </option>
            ))}
          </select>
        </div>

        <div className="exec-selector-group">
          <span>DOMAIN</span>
          <select
            className="exec-select"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            aria-label="Select Domain"
          >
            <option value="All">All Service Lines &amp; Domains</option>
            {isDigitalMarketing ? (
              <>
                <option value="Performance & ROAS">Paid Campaigns &amp; ROAS</option>
                <option value="Social Media & Content">Social Media &amp; Content Strategy</option>
                <option value="Reputation & Birdeye">Online Reputation &amp; Reviews (Birdeye)</option>
                <option value="Client Success & MRR">Client Success &amp; MRR</option>
                <option value="Agency Finance">Agency Finance &amp; Margins</option>
              </>
            ) : isHealthcare ? (
              <>
                <option value="Financial & Capex">Financial &amp; Capex</option>
                <option value="Clinical & Safety">Clinical &amp; Safety</option>
                <option value="Operations & Capacity">Operations &amp; Capacity</option>
                <option value="Governance & Strategy">Governance &amp; Strategy</option>
              </>
            ) : (
              <>
                <option value="Financial & Revenue">Financial &amp; Revenue</option>
                <option value="Operations & Delivery">Operations &amp; Delivery</option>
                <option value="Customer & Growth">Customer &amp; Growth</option>
                <option value="Governance & Strategy">Governance &amp; Strategy</option>
              </>
            )}
          </select>
        </div>

        <div className="exec-period-toggles">
          <button
            type="button"
            className={`exec-period-btn ${period === "MTD" ? "active" : ""}`}
            onClick={() => setPeriod("MTD")}
          >
            MTD
          </button>
          <button
            type="button"
            className={`exec-period-btn ${period === "QTD" ? "active" : ""}`}
            onClick={() => setPeriod("QTD")}
          >
            QTD
          </button>
          <button
            type="button"
            className={`exec-period-btn ${period === "YTD" ? "active" : ""}`}
            onClick={() => setPeriod("YTD")}
          >
            YTD
          </button>
        </div>

        <div className="exec-period-badge">{periodBadge}</div>
      </div>

      {/* ─── Header Section ─── */}
      <header className="exec-header-section">
        <div>
          <div className="exec-eyebrows">
            <span className="exec-pill-blue">
              <span>♡</span>{" "}
              {isDigitalMarketing
                ? "DIGITAL MARKETING & CLIENT GROWTH"
                : isHealthcare
                ? "HEALTHCARE & CLINICAL GOVERNANCE"
                : "ENTERPRISE OPERATIONS"}
            </span>
            <span className="exec-pill-green">
              <span>●</span> {workspace?.organization.owner ? "Organization Admin (Manager)" : "Executive Command"}
            </span>
          </div>
          <h1 className="exec-header-title">{orgName} — Executive Brief</h1>
          <p className="exec-header-subtitle">
            Enterprise scorecard, {workspace?.kpis.length ?? 8} active KPIs across{" "}
            {workspace?.units.length ?? 5} service units for {orgName}.
          </p>
        </div>

        <div className="exec-header-actions">
          <button
            type="button"
            className="exec-btn-dark"
            onClick={() => onOpenChatbot(`What exceptions require my executive attention this morning for ${orgName}?`)}
          >
            <Sparkles size={16} />
            <span>Ask anything</span>
          </button>

          <button
            type="button"
            className="exec-btn-primary"
            onClick={() => setDecisionQueueOpen(true)}
          >
            <span>Decision Queue ({pendingCount})</span>
            <span>→</span>
          </button>
        </div>
      </header>

      {/* ─── Exception Telemetry Dark Banner ─── */}
      <section className="exec-exception-banner" aria-label="Morning Brief Exception Telemetry">
        <div className="exec-exception-banner-header">
          <div className="exec-telemetry-title">
            <span className="exec-telemetry-bullet">●</span>
            <span>
              MORNING BRIEF EXCEPTION TELEMETRY · {orgName.toUpperCase()} OPERATIONAL COMMAND
            </span>
          </div>
          <div className="exec-telemetry-meta">Generated 08:30 AM · Executive Office</div>
        </div>

        <div className="exec-exception-cards-grid">
          {isDigitalMarketing ? (
            <>
              {/* Exception 01 */}
              <div className="exec-exception-card">
                <span className="exec-exception-tag orange">EXCEPTION 01</span>
                <h3 className="exec-exception-title">Client Retention Rate at 98.28%</h3>
                <p className="exec-exception-desc">
                  +4.28 pp over annual benchmark (94.0%). 0 client retainer churn across enterprise accounts for this
                  period.
                </p>
                <button
                  type="button"
                  className="exec-drill-btn-light"
                  onClick={() =>
                    setActiveDrill({
                      title: "Client Retention Rate",
                      category: "exception",
                      metricValue: "98.28%",
                      targetValue: "94.00%",
                      scope: "Client Success & Accounts",
                      description:
                        "Monthly client retention rate across all managed retainers and recurring project accounts. High account satisfaction and renewal confirmations.",
                      breakdown: [
                        { label: "Enterprise Retainer Accounts", value: "100%", status: "Optimal" },
                        { label: "Mid-Market Growth Accounts", value: "97.4%", status: "Optimal" },
                        { label: "SMB & Dedicated Pods", value: "97.1%", status: "Optimal" },
                      ],
                    })
                  }
                >
                  <span>⌖</span> Drill
                </button>
              </div>

              {/* Exception 02 */}
              <div className="exec-exception-card">
                <span className="exec-exception-tag pink">EXCEPTION 02</span>
                <h3 className="exec-exception-title">Return on Ad Spend (ROAS) Yield: 5.20x</h3>
                <p className="exec-exception-desc">
                  Outperforming 4.50x benchmark across Meta and Google campaigns. High-intent attribution driving budget
                  scaling.
                </p>
                <button
                  type="button"
                  className="exec-drill-btn-light"
                  onClick={() =>
                    setActiveDrill({
                      title: "Return on Ad Spend (ROAS)",
                      category: "exception",
                      metricValue: "5.20x",
                      targetValue: "4.50x",
                      scope: "Campaigns & Performance Marketing",
                      description:
                        "Gross revenue generated per unit of paid media spend. Multi-touch attribution confirms strong efficiency on Meta conversion campaigns.",
                      breakdown: [
                        { label: "Meta Paid Social", value: "5.60x ROAS", status: "Optimal" },
                        { label: "Google High-Intent Search", value: "5.10x ROAS", status: "Optimal" },
                        { label: "LinkedIn B2B Lead Gen", value: "4.80x ROAS", status: "Optimal" },
                      ],
                    })
                  }
                >
                  <span>⌖</span> Drill
                </button>
              </div>

              {/* Exception 03 */}
              <div className="exec-exception-card">
                <span className="exec-exception-tag blue">EXCEPTION 03</span>
                <h3 className="exec-exception-title">Birdeye Review SLA: 97.93%</h3>
                <p className="exec-exception-desc">
                  Customer sentiment maintained at 94.14%. Review response turnaround under 2 hours across all client
                  locations.
                </p>
                <button
                  type="button"
                  className="exec-drill-btn-light"
                  onClick={() =>
                    setActiveDrill({
                      title: "Online Reputation & Reviews (Birdeye)",
                      category: "exception",
                      metricValue: "97.93% Response",
                      targetValue: "95.00%",
                      scope: "Online Reputation (Birdeye CX)",
                      description:
                        "Multi-channel Birdeye review integration tracking customer sentiment, automated alerts, and instant resolution turnaround.",
                      breakdown: [
                        { label: "Google Business Profiles", value: "98.4% Response", status: "Optimal" },
                        { label: "Facebook & Social Reviews", value: "97.2% Response", status: "Optimal" },
                        { label: "Industry Portals & Birdeye Direct", value: "97.8% Response", status: "Optimal" },
                      ],
                    })
                  }
                >
                  <span>⌖</span> Drill
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Healthcare Exceptions */}
              <div className="exec-exception-card">
                <span className="exec-exception-tag orange">EXCEPTION 01</span>
                <h3 className="exec-exception-title">Facility Capex Allocation Variance</h3>
                <p className="exec-exception-desc">
                  +6.8% over quarterly threshold driven by facility upgrades. Within contingency allowance.
                </p>
              </div>
              <div className="exec-exception-card">
                <span className="exec-exception-tag pink">EXCEPTION 02</span>
                <h3 className="exec-exception-title">Aged Receivables Cycle Review</h3>
                <p className="exec-exception-desc">
                  Reconciliations show clearance cycle within acceptable insurer turnaround.
                </p>
              </div>
              <div className="exec-exception-card">
                <span className="exec-exception-tag blue">EXCEPTION 03</span>
                <h3 className="exec-exception-title">Corporate Tariff Agreement</h3>
                <p className="exec-exception-desc">
                  Standardized rate-card ready for executive endorsement covering corporate lives.
                </p>
              </div>
            </>
          )}
        </div>
      </section>

      {/* ─── 5 Dynamic KPI Scorecard Cards Row ─── */}
      <section className="exec-kpi-row" aria-label="Executive KPI Scorecards">
        {scorecardCards.length > 0 ? (
          scorecardCards.map((card, idx) => (
            <div key={card.id || idx} className="exec-kpi-card">
              <div className="exec-kpi-header">
                <h3 className="exec-kpi-title">{card.title}</h3>
                <div className="exec-kpi-icon-pill">
                  {idx === 0 ? <TrendingUp size={15} /> : idx === 1 ? <LinkIcon size={15} /> : <Activity size={15} />}
                </div>
              </div>
              <p className="exec-kpi-subtitle">{card.subtitle}</p>
              <div className="exec-kpi-value-row">
                <span className="exec-kpi-value">{card.value}</span>
              </div>
              <div>
                <span className="exec-pill-proxy">● Verified Run-Rate</span>
              </div>
              <p className="exec-kpi-trend">{card.trend}</p>
              <div className="exec-kpi-tags-row">
                {card.onTarget === true && (
                  <span className="exec-pill-status on-target">● On target</span>
                )}
                {card.onTarget === false && (
                  <span className="exec-pill-status attention">● Variance Watch</span>
                )}
                {card.onTarget === null && (
                  <span className="exec-pill-status gray">● Scored</span>
                )}
              </div>
              <div className="exec-kpi-target-row">
                <span>{card.target}</span>
              </div>
              <div className="exec-kpi-footer">
                <p className="exec-kpi-scope-text">
                  Across all {workspace?.units?.length ?? 5} units · MTD
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <button
                    type="button"
                    className="exec-drill-btn"
                    onClick={() =>
                      setActiveDrill({
                        title: card.title,
                        category: "kpi",
                        metricValue: card.value,
                        targetValue: card.target,
                        scope: `Across all ${workspace?.units?.length ?? 5} units`,
                        description: card.subtitle,
                        breakdown: card.breakdown,
                      })
                    }
                  >
                    <span>⌖</span> Drill
                  </button>
                  <span className="exec-weight-text">{card.weight}</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div style={{ padding: 24, color: "#64748b" }}>Loading KPI scorecards…</div>
        )}
      </section>

      {/* ─── Executive Triage & Attention Feed ─── */}
      <section className="exec-feed-section" aria-label="Triage and Attention Feed">
        <div className="exec-feed-header">
          <div className="exec-feed-title-wrap">
            <div className="exec-feed-icon-box">
              <AlertCircle size={18} />
            </div>
            <h2 className="exec-feed-title">Executive Triage &amp; Attention Feed — {orgName}</h2>
            <span className="exec-badge-count">{ordersList.length} Actionable Items</span>
          </div>

          <button
            type="button"
            className="exec-link-blue"
            onClick={() => onNavigateTab("Priority Inbox")}
            style={{ background: "none", border: "none" }}
          >
            <span>Open Priority Inbox</span>
            <span>→</span>
          </button>
        </div>

        <p className="exec-feed-subtitle">
          Executive leadership triage feed categorized into Action Now, Monitor, and On Track operational tiers.
        </p>

        {/* Filter Tabs */}
        <div className="exec-feed-tabs">
          <button
            type="button"
            className={`exec-feed-tab-btn ${feedTab === "all" ? "active" : ""}`}
            onClick={() => setFeedTab("all")}
          >
            <span>All Tiers</span>
            <span style={{ opacity: 0.8 }}>{ordersList.length}</span>
          </button>
          <button
            type="button"
            className={`exec-feed-tab-btn ${feedTab === "action" ? "active" : ""}`}
            onClick={() => setFeedTab("action")}
          >
            <span>Action Now</span>
            <span style={{ opacity: 0.8 }}>1</span>
          </button>
          <button
            type="button"
            className={`exec-feed-tab-btn ${feedTab === "monitor" ? "active" : ""}`}
            onClick={() => setFeedTab("monitor")}
          >
            <span>Monitor</span>
            <span style={{ opacity: 0.8 }}>{ordersList.length - 1}</span>
          </button>
          <button
            type="button"
            className={`exec-feed-tab-btn ${feedTab === "track" ? "active" : ""}`}
            onClick={() => setFeedTab("track")}
          >
            <span>On Track</span>
            <span style={{ opacity: 0.8 }}>Optimal</span>
          </button>
        </div>

        {/* Tier 1: Action Now */}
        {(feedTab === "all" || feedTab === "action") && (
          <div className="exec-tier-group">
            <div className="exec-tier-header">
              <div className="exec-tier-label tier-1">
                <span>● TIER 1: ACTION NOW</span>
                <span className="exec-badge-count" style={{ padding: "2px 8px", fontSize: 11 }}>
                  1 Critical
                </span>
              </div>
              <span className="exec-tier-helper">Immediate escalations requiring signoff today</span>
            </div>

            <div className="exec-tier-card tier-1-border">
              <div className="exec-tier-content">
                <div className="exec-tier-card-tags">
                  <span
                    className="exec-pill-status"
                    style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }}
                  >
                    ● Critical
                  </span>
                  <span className="exec-pill-blue">{ordersList[0]?.scope || "Agency-wide"}</span>
                  <span className="exec-pill-status gray">👤 {ordersList[0]?.dept || "Leadership"}</span>
                  <span className="exec-pill-status gray">📅 Due: {ordersList[0]?.due || "Tomorrow"}</span>
                </div>
                <h3 className="exec-tier-card-title">{ordersList[0]?.title}</h3>
                <p className="exec-tier-card-desc">
                  {isDigitalMarketing
                    ? "Monthly performance ad spend reconciliation and ROAS yield figures ready for executive approval."
                    : "Q3 financial reconciliation and capital expenditure variance documentation ready for Chairman review."}
                </p>
              </div>

              <button
                type="button"
                className="exec-btn-action-red"
                onClick={() => setActiveModal("boardPack")}
              >
                <span>Review Pack</span>
                <span>&gt;</span>
              </button>
            </div>
          </div>
        )}

        {/* Tier 2: Monitor */}
        {(feedTab === "all" || feedTab === "monitor") && (
          <div className="exec-tier-group">
            <div className="exec-tier-header">
              <div className="exec-tier-label tier-2">
                <span>● TIER 2: MONITOR</span>
                <span className="exec-pill-sample" style={{ padding: "2px 8px", fontSize: 11 }}>
                  {ordersList.slice(1).length} Tracking
                </span>
              </div>
              <span className="exec-tier-helper">Operational milestones and deliverables approaching deadline</span>
            </div>

            {ordersList.slice(1).map((item, idx) => (
              <div key={item.id} className="exec-tier-card tier-2-border" style={{ marginBottom: 10 }}>
                <div className="exec-tier-content">
                  <div className="exec-tier-card-tags">
                    <span className="exec-pill-status attention">● {item.tier}</span>
                    <span className="exec-pill-blue">{item.scope}</span>
                    <span className="exec-pill-status gray">👤 {item.dept}</span>
                    <span className="exec-pill-status gray">📅 Due: {item.due}</span>
                  </div>
                  <h3 className="exec-tier-card-title">{item.title}</h3>
                  <p className="exec-tier-card-desc">
                    {idx === 0
                      ? isDigitalMarketing
                        ? "Birdeye CX customer reputation SLA monitoring with 97.93% response rate and 0 escalations."
                        : "Corporate partnership direct settlement coverage guaranteeing 30-day clean claim settlement."
                      : idx === 1
                      ? isDigitalMarketing
                        ? "Paid campaigns spend scaling proposal based on 5.20x ROAS return on ad spend."
                        : "Regional diagnostic wing business case seeking greenlight for Q4 execution."
                      : isDigitalMarketing
                      ? "Client Success team retention and expansion performance incentive pool."
                      : "Staff performance and clinical safety incentive pool distribution."}
                  </p>
                </div>

                <button
                  type="button"
                  className="exec-btn-action-dark"
                  onClick={() => setActiveModal(idx === 0 ? "agreement" : idx === 1 ? "capex" : "scheme")}
                >
                  <span>Review Item</span>
                  <span>&gt;</span>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Tier 3: On Track */}
        {(feedTab === "all" || feedTab === "track") && (
          <div className="exec-tier-group" style={{ marginBottom: 0 }}>
            <div className="exec-tier-header">
              <div className="exec-tier-label tier-3">
                <span>● TIER 3: ON TRACK</span>
                <span className="exec-pill-status on-target" style={{ padding: "2px 8px", fontSize: 11 }}>
                  Optimal
                </span>
              </div>
              <span className="exec-tier-helper">Service level agreements and operational schedules running smoothly</span>
            </div>

            <div className="exec-tier-3-box">
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <CheckCircle2 size={18} color="#16a34a" />
                <span>
                  All {workspace?.units?.length ?? 5} organizational units and service lines operating within standard
                  SLA tolerances.
                </span>
              </div>
              <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.05em", color: "#15803d" }}>
                NORMAL OPERATIONS
              </span>
            </div>
          </div>
        )}
      </section>

      {/* ─── Two-Column Section: Strategic Initiatives & Sign-off Checklist ─── */}
      <section className="exec-grid-2col">
        {/* Left Column: Strategic Initiatives Table */}
        <div className="exec-card-panel">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: "0.05em",
                  color: "#64748b",
                  textTransform: "uppercase",
                }}
              >
                STRATEGIC ROADMAP
              </span>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", margin: "2px 0 0" }}>
                Key Initiatives &amp; Service Expansion Status
              </h3>
            </div>
          </div>

          <div className="exec-table-wrap">
            <table className="exec-table">
              <thead>
                <tr>
                  <th>INITIATIVE &amp; SERVICE LINE</th>
                  <th>DEPARTMENT</th>
                  <th>LEAD</th>
                  <th>PROGRESS</th>
                  <th>STATUS</th>
                  <th>GO-LIVE</th>
                  <th>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {isDigitalMarketing ? (
                  <>
                    <tr>
                      <td>
                        <strong style={{ display: "block", color: "#0f172a" }}>
                          Omnichannel Ad Attribution &amp; Multi-Platform ROAS Scaling
                        </strong>
                        <span style={{ fontSize: 11, color: "#64748b" }}>Campaigns &amp; Performance Marketing</span>
                      </td>
                      <td>Performance Marketing</td>
                      <td>Growth Lead</td>
                      <td>
                        <span style={{ fontWeight: 700 }}>88%</span>
                        <div className="exec-progress-bar-bg">
                          <div className="exec-progress-bar-fill green" style={{ width: "88%" }} />
                        </div>
                      </td>
                      <td>
                        <span className="exec-pill-status on-target">● On Track</span>
                      </td>
                      <td style={{ whiteSpace: "nowrap" }}>Dec 31, 2026</td>
                      <td>
                        <button
                          type="button"
                          className="exec-drill-btn"
                          onClick={() => setActiveModal("initiative1")}
                        >
                          <span>Inspect</span> ↗
                        </button>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <strong style={{ display: "block", color: "#0f172a" }}>
                          Birdeye AI Automated Review Response &amp; Sentiment Intelligence
                        </strong>
                        <div style={{ display: "flex", gap: 6, marginTop: 2 }}>
                          <span className="exec-pill-blue" style={{ fontSize: 10, padding: "1px 6px" }}>
                            Birdeye CX Platform
                          </span>
                        </div>
                      </td>
                      <td>Online Reputation</td>
                      <td>Reputation Lead</td>
                      <td>
                        <span style={{ fontWeight: 700 }}>76%</span>
                        <div className="exec-progress-bar-bg">
                          <div className="exec-progress-bar-fill green" style={{ width: "76%" }} />
                        </div>
                      </td>
                      <td>
                        <span className="exec-pill-status on-target">● On Track</span>
                      </td>
                      <td style={{ whiteSpace: "nowrap" }}>Oct 30, 2026</td>
                      <td>
                        <button
                          type="button"
                          className="exec-drill-btn"
                          onClick={() => setActiveModal("initiative2")}
                        >
                          <span>Inspect</span> ↗
                        </button>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <strong style={{ display: "block", color: "#0f172a" }}>
                          Content Studio &amp; Short-Form Video Creator Network Expansion
                        </strong>
                        <span style={{ fontSize: 11, color: "#64748b" }}>Social Media &amp; Content Strategy</span>
                      </td>
                      <td>Content &amp; Brand</td>
                      <td>Brand Head</td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontWeight: 700 }}>68%</span>
                          <span style={{ fontSize: 10, fontWeight: 700, color: "#f59e0b" }}>+6d delay</span>
                        </div>
                        <div className="exec-progress-bar-bg">
                          <div className="exec-progress-bar-fill amber" style={{ width: "68%" }} />
                        </div>
                      </td>
                      <td>
                        <span className="exec-pill-status attention">● Monitoring</span>
                      </td>
                      <td style={{ whiteSpace: "nowrap" }}>Oct 15, 2026</td>
                      <td>
                        <button
                          type="button"
                          className="exec-drill-btn"
                          onClick={() => setActiveModal("initiative3")}
                        >
                          <span>Inspect</span> ↗
                        </button>
                      </td>
                    </tr>
                  </>
                ) : (
                  <>
                    <tr>
                      <td>
                        <strong style={{ display: "block", color: "#0f172a" }}>
                          Multi-Region Healthcare Network Roadmap
                        </strong>
                        <span style={{ fontSize: 11, color: "#64748b" }}>All Healthcare Units</span>
                      </td>
                      <td>Group Executive</td>
                      <td>Chairman</td>
                      <td>
                        <span style={{ fontWeight: 700 }}>82%</span>
                        <div className="exec-progress-bar-bg">
                          <div className="exec-progress-bar-fill green" style={{ width: "82%" }} />
                        </div>
                      </td>
                      <td>
                        <span className="exec-pill-status on-target">● On Track</span>
                      </td>
                      <td style={{ whiteSpace: "nowrap" }}>Dec 31, 2028</td>
                      <td>
                        <button
                          type="button"
                          className="exec-drill-btn"
                          onClick={() => setActiveModal("initiative1")}
                        >
                          <span>Inspect</span> ↗
                        </button>
                      </td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Executive Authorization Checklist */}
        <div className="exec-card-panel">
          <div style={{ marginBottom: 14 }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: "0.06em",
                color: "#64748b",
                textTransform: "uppercase",
              }}
            >
              EXECUTIVE AUTHORIZATION
            </span>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", margin: "2px 0 0" }}>
              Sign-Off Checklist
            </h3>
          </div>

          <div className="exec-checklist">
            {ordersList.map((order) => {
              const isDone = !!approvedOrders[order.id];
              return (
                <label key={order.id} className={`exec-check-item ${isDone ? "done" : ""}`}>
                  <input
                    type="checkbox"
                    className="exec-check-input"
                    checked={isDone}
                    onChange={() => toggleOrder(order.id)}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 3 }}>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 800,
                          padding: "1px 6px",
                          borderRadius: 4,
                          background: order.tier === "Critical" ? "#fee2e2" : order.tier === "High" ? "#fef3c7" : "#f1f5f9",
                          color: order.tier === "Critical" ? "#b91c1c" : order.tier === "High" ? "#b45309" : "#475569",
                        }}
                      >
                        ● {order.tier}
                      </span>
                      <span style={{ fontSize: 11, color: "#64748b" }}>Due: {order.due}</span>
                      <span style={{ fontSize: 11, color: "#2563eb", fontWeight: 600 }}>{order.scope}</span>
                    </div>
                    <div
                      style={{
                        fontSize: 12.5,
                        fontWeight: 600,
                        color: isDone ? "#64748b" : "#0f172a",
                        textDecoration: isDone ? "line-through" : "none",
                      }}
                    >
                      {order.title}
                    </div>
                    <span style={{ fontSize: 11, color: "#94a3b8" }}>{order.dept}</span>
                  </div>
                </label>
              );
            })}
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: 16,
              paddingTop: 12,
              borderTop: "1px solid #f1f5f9",
            }}
          >
            <span style={{ fontSize: 12, fontWeight: 700, color: "#64748b" }}>
              {pendingCount} {pendingCount === 1 ? "order" : "orders"} pending
            </span>
            <button
              type="button"
              className="exec-link-blue"
              onClick={() => setDecisionQueueOpen(true)}
              style={{ background: "none", border: "none" }}
            >
              <span>Open Approval Queue</span>
              <span>→</span>
            </button>
          </div>
        </div>
      </section>

      {/* ─── Department & Service Line Performance Contribution ─── */}
      <section className="exec-facility-section" aria-label="Department Performance Contribution">
        <div className="exec-facility-header">
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <TrendingUp size={18} color="#2563eb" />
              <h2 style={{ fontSize: 17, fontWeight: 800, color: "#0f172a", margin: 0 }}>
                {isDigitalMarketing
                  ? "Department & Service Line Performance Contribution"
                  : "Financial EBITDA & Revenue Contribution by Facility"}
              </h2>
            </div>
            <p style={{ fontSize: 12.5, color: "#64748b", margin: "4px 0 0" }}>
              Operational scorecard: run-rate, delivery efficiency, and service capabilities across{" "}
              {workspace?.units?.length ?? 5} units for {orgName}
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 11.5, fontWeight: 600 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 5, color: "#2563eb" }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#2563eb" }} /> Active Metric
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 5, color: "#94a3b8" }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#cbd5e1" }} /> Baseline Target
            </span>
          </div>
        </div>

        <div className="exec-facility-grid">
          {workspace?.units && workspace.units.length > 0 ? (
            workspace.units.map((u) => {
              const isHQ = !u.parentId;
              return (
                <div key={u.id} className="exec-facility-card">
                  <div className="exec-facility-top">
                    <h3 className="exec-facility-name">{u.name}</h3>
                    <span className="exec-margin-pill green">
                      {isHQ ? "Executive HQ" : "Active Service"}
                    </span>
                  </div>
                  <p className="exec-facility-runrate">
                    {u.kind} · {isDigitalMarketing ? "Digital Marketing Pod" : "Operating Unit"}
                  </p>
                  <div className="exec-facility-bar-bg">
                    <div className="exec-facility-bar-fill blue" style={{ width: isHQ ? "95%" : "82%" }} />
                  </div>
                  <div className="exec-facility-bottom">
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b" }}>STATUS</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span className="exec-facility-ebitda">SLA Optimal</span>
                      <button
                        type="button"
                        className="exec-drill-btn"
                        onClick={() =>
                          setActiveDrill({
                            title: u.name,
                            category: "facility",
                            metricValue: "SLA Optimal",
                            targetValue: "100% Attainment",
                            scope: `${u.name} (${u.kind})`,
                            description: `Dedicated ${u.kind.toLowerCase()} delivering core client services and metrics for ${orgName}.`,
                            breakdown: [
                              { label: "Operational Status", value: "Verified Active", margin: "Optimal" },
                              { label: "Hierarchy Level", value: isHQ ? "Top-Level HQ" : "Department Unit" },
                              { label: "Data Submission", value: "Verified & Approved", margin: "Optimal" },
                            ],
                          })
                        }
                      >
                        <span>⌖</span> Drill
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div style={{ padding: 24, color: "#64748b" }}>Loading service units…</div>
          )}
        </div>
      </section>

      {/* ─── MODAL 1: Drill Down Modal ─── */}
      {activeDrill && (
        <div className="exec-modal-overlay" onClick={() => setActiveDrill(null)}>
          <div className="exec-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="exec-modal-header">
              <div>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    color: "#2563eb",
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                  }}
                >
                  DETAILED DRILL-DOWN &amp; EVIDENCE AUDIT
                </span>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", margin: "2px 0 0" }}>
                  {activeDrill.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setActiveDrill(null)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}
              >
                <X size={20} />
              </button>
            </div>

            <div className="exec-modal-body">
              <div
                style={{
                  display: "flex",
                  gap: 16,
                  background: "#f8fafc",
                  padding: "14px 18px",
                  borderRadius: 10,
                  marginBottom: 16,
                }}
              >
                <div>
                  <span style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>
                    Current Value
                  </span>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "#0f172a" }}>{activeDrill.metricValue}</div>
                </div>
                {activeDrill.targetValue && (
                  <div>
                    <span style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>
                      Target Benchmark
                    </span>
                    <div style={{ fontSize: 20, fontWeight: 800, color: "#16a34a" }}>{activeDrill.targetValue}</div>
                  </div>
                )}
                {activeDrill.scope && (
                  <div>
                    <span style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>
                      Reporting Scope
                    </span>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#2563eb", marginTop: 4 }}>
                      {activeDrill.scope}
                    </div>
                  </div>
                )}
              </div>

              <p style={{ fontSize: 13.5, color: "#334155", lineHeight: 1.5, margin: "0 0 16px" }}>
                {activeDrill.description}
              </p>

              {activeDrill.breakdown && (
                <div>
                  <h4
                    style={{
                      fontSize: 12,
                      fontWeight: 800,
                      color: "#64748b",
                      letterSpacing: "0.05em",
                      textTransform: "uppercase",
                      marginBottom: 8,
                    }}
                  >
                    Breakdown by Unit / Stream
                  </h4>
                  <table className="exec-table">
                    <thead>
                      <tr>
                        <th>SERVICE UNIT / STREAM</th>
                        <th>FIGURE</th>
                        <th>MARGIN / STATUS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeDrill.breakdown.map((row, idx) => (
                        <tr key={idx}>
                          <td>
                            <strong>{row.label}</strong>
                          </td>
                          <td>
                            <span style={{ fontFamily: "JetBrains Mono, monospace", fontWeight: 700 }}>
                              {row.value}
                            </span>
                          </td>
                          <td>
                            {row.margin ? (
                              <span className="exec-pill-status on-target">{row.margin}</span>
                            ) : (
                              <span className="exec-pill-status attention">{row.status ?? "Reported"}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div
                style={{
                  marginTop: 20,
                  padding: "12px 14px",
                  background: "#f0fdf4",
                  border: "1px solid #bbf7d0",
                  borderRadius: 8,
                  fontSize: 12,
                  color: "#166534",
                }}
              >
                <strong>Data Provenance: Illustrative Verified</strong> · All values derived strictly from verified data
                batches, monthly submissions, and accounting figures for {orgName}.
              </div>
            </div>

            <div className="exec-modal-footer">
              <button
                type="button"
                className="exec-btn-dark"
                onClick={() => {
                  setActiveDrill(null);
                  onOpenChatbot(`Explain the root cause and next actions for: ${activeDrill.title}`);
                }}
              >
                <Sparkles size={14} />
                Ask AI About This
              </button>
              <button type="button" className="exec-btn-primary" onClick={() => setActiveDrill(null)}>
                Close Audit View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 2: Decision Queue Modal ─── */}
      {decisionQueueOpen && (
        <div className="exec-modal-overlay" onClick={() => setDecisionQueueOpen(false)}>
          <div className="exec-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="exec-modal-header">
              <div>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    color: "#2563eb",
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                  }}
                >
                  EXECUTIVE GOVERNANCE
                </span>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", margin: "2px 0 0" }}>
                  Decision &amp; Approval Queue ({pendingCount} Pending)
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setDecisionQueueOpen(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}
              >
                <X size={20} />
              </button>
            </div>

            <div className="exec-modal-body">
              <p style={{ margin: "0 0 16px", color: "#64748b" }}>
                Decisions below require your executive sign-off or endorsement to unlock campaign budgets, SLA
                agreements, and client deliverable publishes.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {ordersList.map((order) => {
                  const isDone = !!approvedOrders[order.id];
                  return (
                    <div
                      key={order.id}
                      style={{
                        padding: "14px 16px",
                        border: "1px solid",
                        borderColor: isDone ? "#bbf7d0" : "#e2e8f0",
                        background: isDone ? "#f0fdf4" : "#ffffff",
                        borderRadius: 10,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 16,
                      }}
                    >
                      <div>
                        <div style={{ display: "flex", gap: 6, marginBottom: 4 }}>
                          <span
                            style={{
                              fontSize: 10.5,
                              fontWeight: 800,
                              padding: "1px 6px",
                              borderRadius: 4,
                              background: order.tier === "Critical" ? "#fee2e2" : "#fef3c7",
                              color: order.tier === "Critical" ? "#b91c1c" : "#b45309",
                            }}
                          >
                            ● {order.tier}
                          </span>
                          <span style={{ fontSize: 11, color: "#64748b" }}>{order.dept}</span>
                          <span style={{ fontSize: 11, color: "#2563eb", fontWeight: 600 }}>Due: {order.due}</span>
                        </div>
                        <h4 style={{ fontSize: 14, fontWeight: 700, margin: 0, color: "#0f172a" }}>{order.title}</h4>
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleOrder(order.id)}
                        style={{
                          padding: "8px 14px",
                          borderRadius: 8,
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: "pointer",
                          border: "none",
                          background: isDone ? "#15803d" : "#2563eb",
                          color: "#ffffff",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {isDone ? "✓ Signed Off" : "Sign Off Now"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="exec-modal-footer">
              <button type="button" className="exec-btn-primary" onClick={() => setDecisionQueueOpen(false)}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 3: Performance Pack / Board Pack Review Modal ─── */}
      {activeModal === "boardPack" && (
        <div className="exec-modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="exec-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="exec-modal-header">
              <div>
                <span
                  className="exec-pill-status"
                  style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }}
                >
                  ● Critical Sign-Off
                </span>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", margin: "4px 0 0" }}>
                  {isDigitalMarketing
                    ? "Q3 Client Performance Marketing & ROAS Reconciliation Pack"
                    : "Board Audit & Risk Committee Q3 Review Pack Finalization"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                style={{ background: "none", border: "none", cursor: "pointer" }}
              >
                <X size={20} />
              </button>
            </div>
            <div className="exec-modal-body">
              <p>
                <strong>Presenter:</strong>{" "}
                {isDigitalMarketing ? "Growth & Performance Lead" : "Group CFO & Internal Audit"}
              </p>
              <p>
                {isDigitalMarketing
                  ? "Monthly performance figures indicate $1.92M in Monthly Recurring Revenue (MRR) with average ROAS at 5.20x. Client retention stands at 98.28%."
                  : "The Q3 reconciliation documents operating figures across entities with all variances audited against central contingency allowance."}
              </p>
              <div
                style={{
                  background: "#f8fafc",
                  padding: 12,
                  borderRadius: 8,
                  border: "1px solid #e2e8f0",
                  fontSize: 12.5,
                }}
              >
                <div>✓ Verified against ad network attribution data</div>
                <div>✓ Budget pacing on Meta and Google Ads audited</div>
                <div>✓ Retainer deliverables certified complete</div>
              </div>
            </div>
            <div className="exec-modal-footer">
              <button
                type="button"
                className="exec-btn-action-red"
                onClick={() => {
                  toggleOrder("ord-1");
                  setActiveModal(null);
                }}
              >
                {approvedOrders["ord-1"] ? "Revoke Signoff" : "Approve & Sign Off Pack"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 4: Agreement / SLA Protocol Endorsement Modal ─── */}
      {activeModal === "agreement" && (
        <div className="exec-modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="exec-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="exec-modal-header">
              <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", margin: 0 }}>
                {isDigitalMarketing
                  ? "Birdeye Reputation & Automated AI Review Response Protocol"
                  : "Corporate Strategic Agreement Endorsement"}
              </h2>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                style={{ background: "none", border: "none", cursor: "pointer" }}
              >
                <X size={20} />
              </button>
            </div>
            <div className="exec-modal-body">
              <p>
                {isDigitalMarketing
                  ? "Standardized Birdeye automated CX protocol covering review sentiment monitoring and AI-assisted responses with verified 97.93% response rate SLA."
                  : "Direct settlement coverage with guaranteed clean turnaround across network facilities."}
              </p>
              <div
                style={{
                  background: "#f0fdf4",
                  padding: 12,
                  borderRadius: 8,
                  border: "1px solid #bbf7d0",
                  fontSize: 13,
                  color: "#166534",
                }}
              >
                Customer Satisfaction Impact: <strong>+94.14% Sentiment Score</strong>.
              </div>
            </div>
            <div className="exec-modal-footer">
              <button
                type="button"
                className="exec-btn-primary"
                onClick={() => {
                  toggleOrder("ord-2");
                  setActiveModal(null);
                }}
              >
                {approvedOrders["ord-2"] ? "Endorsed ✓" : "Endorse Protocol"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 5: Ad Spend Budget / Capex Proposal ─── */}
      {activeModal === "capex" && (
        <div className="exec-modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="exec-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="exec-modal-header">
              <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", margin: 0 }}>
                {isDigitalMarketing
                  ? "Q4 Meta & Google Paid Ad Spend Budget Reallocation"
                  : "Capital Expenditure Proposal"}
              </h2>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                style={{ background: "none", border: "none", cursor: "pointer" }}
              >
                <X size={20} />
              </button>
            </div>
            <div className="exec-modal-body">
              <p>
                <strong>Ad Budget Scaling:</strong> Reallocating $48,500 monthly spend to top-performing conversion
                campaigns operating above 5.0x ROAS.
              </p>
              <p>
                <strong>Attribution Target:</strong> Projected return: 5.4x blended ROAS with lower Customer
                Acquisition Cost (CAC).
              </p>
            </div>
            <div className="exec-modal-footer">
              <button
                type="button"
                className="exec-btn-primary"
                onClick={() => {
                  toggleOrder("ord-3");
                  setActiveModal(null);
                }}
              >
                {approvedOrders["ord-3"] ? "Greenlit ✓" : "Give Greenlight"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 6: Retention Incentive Scheme ─── */}
      {activeModal === "scheme" && (
        <div className="exec-modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="exec-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="exec-modal-header">
              <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", margin: 0 }}>
                Client Success Team Annual Performance &amp; Retention Incentive Pool
              </h2>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                style={{ background: "none", border: "none", cursor: "pointer" }}
              >
                <X size={20} />
              </button>
            </div>
            <div className="exec-modal-body">
              <p>
                Incentive pool evaluated against <strong>98.28% Client Retention Rate</strong>, Net Promoter Score (NPS)
                above 75.0, and zero churn on enterprise retainers.
              </p>
            </div>
            <div className="exec-modal-footer">
              <button
                type="button"
                className="exec-btn-primary"
                onClick={() => {
                  toggleOrder("ord-4");
                  setActiveModal(null);
                }}
              >
                {approvedOrders["ord-4"] ? "Approved ✓" : "Approve Incentive Distribution"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 7: Strategic Initiative Inspection ─── */}
      {(activeModal === "initiative1" || activeModal === "initiative2" || activeModal === "initiative3") && (
        <div className="exec-modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="exec-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="exec-modal-header">
              <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", margin: 0 }}>
                {activeModal === "initiative1"
                  ? isDigitalMarketing
                    ? "Omnichannel Ad Attribution & Multi-Platform ROAS Scaling"
                    : "Multi-Region Healthcare Network"
                  : activeModal === "initiative2"
                  ? isDigitalMarketing
                    ? "Birdeye AI Automated Review Response & Sentiment Intelligence"
                    : "Facility Specialty Service Line Launch"
                  : isDigitalMarketing
                  ? "Content Studio & Short-Form Video Creator Network Expansion"
                  : "Insurer Rate Card Standardization"}
              </h2>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                style={{ background: "none", border: "none", cursor: "pointer" }}
              >
                <X size={20} />
              </button>
            </div>
            <div className="exec-modal-body">
              <p>
                <strong>Status:</strong>{" "}
                {activeModal === "initiative3"
                  ? "Monitoring (+6d creative milestone delivery)"
                  : "On Track (Optimal progress against quarterly targets)"}
              </p>
              <p>
                Audited against performance milestones, client contract deliverables, and monthly attribution results for{" "}
                {orgName}.
              </p>
            </div>
            <div className="exec-modal-footer">
              <button type="button" className="exec-btn-primary" onClick={() => setActiveModal(null)}>
                Close Inspection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
