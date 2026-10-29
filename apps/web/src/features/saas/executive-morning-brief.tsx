import { useState, useEffect } from "react";
import {
  TrendingUp,
  Link as LinkIcon,
  Activity,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  X,
} from "lucide-react";
import "./executive.css";

interface Props {
  onOpenChatbot: (seed?: string) => void;
  onNavigateTab: (tab: string) => void;
  resetSignal?: number;
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

export function ExecutiveMorningBrief({ onOpenChatbot, onNavigateTab, resetSignal }: Props) {
  // ─── Scope & Period Controls ───
  const [scope, setScope] = useState("Group (6 Lifecare hospitals)");
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
      setScope("Group (6 Lifecare hospitals)");
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

  // Orders checklist data
  const ordersList = [
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
      title: "Review Phase-1 Lifecare Eldoret Cath Lab capex proposal",
      tier: "High",
      due: "Sep 16, 2026",
      scope: "Lifecare Eldoret",
      dept: "Capital Allocation",
    },
    {
      id: "ord-4",
      title: "Approve Hospital Medical Director annual incentive pool",
      tier: "Medium",
      due: "Sep 18, 2026",
      scope: "All 6 Hospitals",
      dept: "Remuneration",
    },
  ];

  const pendingCount = ordersList.filter((o) => !approvedOrders[o.id]).length;

  const toggleOrder = (id: string) => {
    setApprovedOrders((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="exec-brief-container">
      {/* ─── Top Controls Bar (Image 2 & 3 top) ─── */}
      <div className="exec-top-bar">
        <div className="exec-selector-group">
          <span>SCOPE</span>
          <select
            className="exec-select"
            value={scope}
            onChange={(e) => setScope(e.target.value)}
            aria-label="Select Scope"
          >
            <option value="Group (6 Lifecare hospitals)">Group (6 Lifecare hospitals)</option>
            <option value="Region 1 — Central & Nairobi (Kikuyu, Meru, Mlolongo)">
              Region 1 — Central & Nairobi (Kikuyu, Meru, Mlolongo)
            </option>
            <option value="Region 2 — Western & Rift (Bungoma, Eldoret, Migori)">
              Region 2 — Western & Rift (Bungoma, Eldoret, Migori)
            </option>
            <option value="Lifecare Hospital Kikuyu (Comprehensive COE)">
              Lifecare Hospital Kikuyu (Comprehensive COE)
            </option>
            <option value="Lifecare Hospital Meru">Lifecare Hospital Meru</option>
            <option value="Lifecare Hospital Mlolongo">Lifecare Hospital Mlolongo</option>
            <option value="Lifecare Hospital Bungoma">Lifecare Hospital Bungoma</option>
            <option value="Lifecare Hospital Eldoret">Lifecare Hospital Eldoret</option>
            <option value="Lifecare Hospital Migori">Lifecare Hospital Migori</option>
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
            <option value="All">All</option>
            <option value="Financial & Capex">Financial & Capex</option>
            <option value="Clinical & Safety">Clinical & Safety</option>
            <option value="Operations & Capacity">Operations & Capacity</option>
            <option value="Governance & Strategy">Governance & Strategy</option>
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

      {/* ─── Header Section (Image 2 & 3) ─── */}
      <header className="exec-header-section">
        <div>
          <div className="exec-eyebrows">
            <span className="exec-pill-blue">
              <span>♡</span> GROUP EXECUTIVE OFFICE
            </span>
            <span className="exec-pill-green">
              <span>●</span> Chairman (Group)
            </span>
          </div>
          <h1 className="exec-header-title">Chairman — Morning Brief</h1>
          <p className="exec-header-subtitle">
            Here is the enterprise scorecard, capital allocation, and group-wide risk landscape.
          </p>
        </div>

        <div className="exec-header-actions">
          <button
            type="button"
            className="exec-btn-dark"
            onClick={() => onOpenChatbot("What exceptions require my executive attention this morning?")}
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

      {/* ─── Exception Telemetry Dark Banner (Image 2 & 3) ─── */}
      <section className="exec-exception-banner" aria-label="Morning Brief Exception Telemetry">
        <div className="exec-exception-banner-header">
          <div className="exec-telemetry-title">
            <span className="exec-telemetry-bullet">●</span>
            <span>MORNING BRIEF EXCEPTION TELEMETRY · RUN THE GROUP FROM ONE SCREEN</span>
          </div>
          <div className="exec-telemetry-meta">Generated 08:30 AM EAT · Chairman</div>
        </div>

        <div className="exec-exception-cards-grid">
          {/* Exception 01 */}
          <div className="exec-exception-card">
            <span className="exec-exception-tag orange">EXCEPTION 01</span>
            <h3 className="exec-exception-title">Group Capex Variance in Region 1</h3>
            <p className="exec-exception-desc">
              +6.8% over quarterly capex threshold driven by linac bunker civil works. Within overall group contingency
              reserve.
            </p>
          </div>

          {/* Exception 02 */}
          <div className="exec-exception-card">
            <span className="exec-exception-tag pink">EXCEPTION 02</span>
            <h3 className="exec-exception-title">NHIF Aged Receivables Overdue</h3>
            <p className="exec-exception-desc">
              KSh 14.8M outstanding &gt; 60 days across Region 2 public schemes. Ministry of Health liaison meeting
              scheduled.
            </p>
            <button
              type="button"
              className="exec-drill-btn-light"
              onClick={() =>
                setActiveDrill({
                  title: "NHIF Aged Receivables Overdue",
                  category: "exception",
                  metricValue: "KSh 14.8M",
                  targetValue: "< KSh 5.0M",
                  scope: "Region 2 Public Schemes (Bungoma, Eldoret, Migori)",
                  description:
                    "Outstanding claims aged over 60 days under NHIF and public healthcare benefit schemes. Reconciliations show delays in central capitation clearance. Liaison meeting with Ministry of Health scheduled for next Tuesday.",
                  breakdown: [
                    { label: "Lifecare Eldoret (>60d)", value: "KSh 6.4M", status: "Critical" },
                    { label: "Lifecare Bungoma (>60d)", value: "KSh 5.2M", status: "Critical" },
                    { label: "Lifecare Migori (>60d)", value: "KSh 3.2M", status: "High" },
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
            <h3 className="exec-exception-title">Jubilee Corporate Tariff Renewal</h3>
            <p className="exec-exception-desc">
              Standardized rate-card ready for executive chairman endorsement to unlock 45,000 corporate scheme lives.
            </p>
          </div>
        </div>
      </section>

      {/* ─── 5 KPI Scorecard Cards Row (Image 2 & 3) ─── */}
      <section className="exec-kpi-row" aria-label="Executive KPI Scorecards">
        {/* KPI 1: Group Net Revenue */}
        <div className="exec-kpi-card">
          <div className="exec-kpi-header">
            <h3 className="exec-kpi-title">Group Net Revenue</h3>
            <div className="exec-kpi-icon-pill">
              <TrendingUp size={15} />
            </div>
          </div>
          <p className="exec-kpi-subtitle">Group net revenue vs approved budget</p>
          <div className="exec-kpi-value-row">
            <span className="exec-kpi-value">KSh 353.4M</span>
          </div>
          <div>
            <span className="exec-pill-proxy">● Proxy · as of Jul 2026</span>
          </div>
          <p className="exec-kpi-trend">Month-on-month: -0.1% vs Jun 2026</p>
          <div className="exec-kpi-tags-row">
            <span className="exec-pill-status gray">● Not scored</span>
            <span className="exec-pill-status gray">Target pending</span>
          </div>
          <div className="exec-kpi-footer">
            <p className="exec-kpi-scope-text">Across all 6 hospitals · MTD · Jul 2026</p>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button
                type="button"
                className="exec-drill-btn"
                onClick={() =>
                  setActiveDrill({
                    title: "Group Net Revenue",
                    category: "kpi",
                    metricValue: "KSh 353.4M",
                    targetValue: "KSh 358.0M Budget",
                    scope: "Across all 6 hospitals",
                    description:
                      "Consolidated group net revenue across inpatient, outpatient, oncology, and surgical specialties. Variance of -0.1% month-on-month is largely due to planned theatre maintenance at Kikuyu.",
                    breakdown: [
                      { label: "Lifecare Kikuyu", value: "KSh 62.4M", margin: "24.2%" },
                      { label: "Lifecare Meru", value: "KSh 34.8M", margin: "21.5%" },
                      { label: "Lifecare Mlolongo", value: "KSh 21.2M", margin: "18.4%" },
                      { label: "Lifecare Bungoma", value: "KSh 14.5M", margin: "19.8%" },
                      { label: "Lifecare Eldoret", value: "KSh 10.8M", margin: "17.2%" },
                      { label: "Lifecare Migori", value: "KSh 4.5M", margin: "16.5%" },
                    ],
                  })
                }
              >
                <span>⌖</span> Drill
              </button>
              <span className="exec-weight-text">20%</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Group EBITDA */}
        <div className="exec-kpi-card">
          <div className="exec-kpi-header">
            <h3 className="exec-kpi-title">Group EBITDA</h3>
            <div className="exec-kpi-icon-pill">
              <LinkIcon size={15} />
            </div>
          </div>
          <p className="exec-kpi-subtitle">Group EBITDA vs approved budget</p>
          <div className="exec-kpi-value-row">
            <span className="exec-kpi-value">87.8%</span>
            <span className="exec-pill-sample">● Sample</span>
          </div>
          <p className="exec-kpi-trend">Month-on-month: +4.5 pp vs Jun 2026</p>
          <div className="exec-kpi-tags-row">
            <span className="exec-pill-status on-target">● On target</span>
          </div>
          <div className="exec-kpi-target-row">
            <span>Target 80.2%</span>
            <span className="exec-pill-sample">● Sample</span>
          </div>
          <div className="exec-kpi-footer">
            <p className="exec-kpi-scope-text">Across all 6 hospitals · MTD · Jul 2026</p>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button
                type="button"
                className="exec-drill-btn"
                onClick={() =>
                  setActiveDrill({
                    title: "Group EBITDA",
                    category: "kpi",
                    metricValue: "87.8% (KSh 31.5M)",
                    targetValue: "80.2%",
                    scope: "Group-wide",
                    description:
                      "Operating EBITDA performance benchmarked against approved annual financial plans. High margin yield from oncology service line expansion and surgical day-care conversions.",
                    breakdown: [
                      { label: "Operating Gross Profit", value: "KSh 164.2M", margin: "46.4%" },
                      { label: "Clinical Staff Costs", value: "KSh 78.1M", margin: "22.1%" },
                      { label: "Facility Overheads", value: "KSh 54.6M", margin: "15.4%" },
                      { label: "Net Group EBITDA", value: "KSh 31.5M", margin: "8.9%" },
                    ],
                  })
                }
              >
                <span>⌖</span> Drill
              </button>
              <span className="exec-weight-text">20%</span>
            </div>
          </div>
        </div>

        {/* KPI 3: Return on Capital (ROCE) */}
        <div className="exec-kpi-card">
          <div className="exec-kpi-header">
            <h3 className="exec-kpi-title">Return on Capital (ROCE)</h3>
            <span className="exec-weight-text">Weight 15%</span>
          </div>
          <div className="exec-kpi-value-row" style={{ marginTop: 8 }}>
            <span className="exec-kpi-value">14.2%</span>
            <button
              type="button"
              className="exec-drill-btn"
              onClick={() =>
                setActiveDrill({
                  title: "Return on Capital Employed (ROCE)",
                  category: "kpi",
                  metricValue: "14.2%",
                  targetValue: "13.1% Baseline",
                  scope: "Group Capital Infrastructure",
                  description:
                    "Net operating profit after tax relative to total capital employed across facilities and equipment financing. Driven by linac bunker utilization and cath lab pre-commitments.",
                  breakdown: [
                    { label: "Kikuyu Cancer Centre", value: "18.4% ROCE", status: "Optimal" },
                    { label: "Meru Surgical Unit", value: "15.1% ROCE", status: "Optimal" },
                    { label: "Eldoret Diagnostic Wing", value: "11.2% ROCE", status: "Developing" },
                  ],
                })
              }
            >
              <span>⌖</span> Drill
            </button>
          </div>
          <div>
            <span className="exec-pill-sample">● Sample</span>
          </div>
          <p className="exec-kpi-trend" style={{ color: "#16a34a", fontWeight: 700 }}>
            ↗ +1.1% vs FY baseline
          </p>
          <p className="exec-kpi-subtitle" style={{ minHeight: "auto" }}>
            COE Capex deploym...
          </p>
          <div className="exec-kpi-footer">
            <p className="exec-kpi-scope-text">Sample figure: does not follow Scope or Period.</p>
          </div>
        </div>

        {/* KPI 4: Group Bed Occupancy */}
        <div className="exec-kpi-card">
          <div className="exec-kpi-header">
            <h3 className="exec-kpi-title">Group Bed Occupancy</h3>
            <div className="exec-kpi-icon-pill">
              <Activity size={15} />
            </div>
          </div>
          <p className="exec-kpi-subtitle">Hospital and clinic capacity utilisation</p>
          <div className="exec-kpi-value-row">
            <span className="exec-kpi-value">87.0%</span>
            <span className="exec-pill-sample">● Sample</span>
          </div>
          <p className="exec-kpi-trend">Month-on-month: -0.4 pp vs Jun 2026</p>
          <div className="exec-kpi-tags-row">
            <span className="exec-pill-status attention">● Attention</span>
          </div>
          <div className="exec-kpi-target-row">
            <span>Target 90.5%</span>
            <span className="exec-pill-sample">● Sample</span>
          </div>
          <div className="exec-kpi-footer">
            <p className="exec-kpi-scope-text">Across all 6 hospitals · MTD · Jul 2026</p>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button
                type="button"
                className="exec-drill-btn"
                onClick={() =>
                  setActiveDrill({
                    title: "Group Bed Occupancy",
                    category: "kpi",
                    metricValue: "87.0%",
                    targetValue: "90.5%",
                    scope: "Hospital and clinic capacity utilisation",
                    description:
                      "Inpatient bed utilization rate across acute care, ICU, maternal, and pediatric wards across all 6 hospitals. Target of 90.5% is constrained by elective surgery scheduling bottlenecks in Western region.",
                    breakdown: [
                      { label: "Lifecare Kikuyu", value: "92.4% Occupancy", status: "Optimal" },
                      { label: "Lifecare Meru", value: "88.6% Occupancy", status: "On Target" },
                      { label: "Lifecare Mlolongo", value: "84.2% Occupancy", status: "Attention" },
                      { label: "Lifecare Bungoma", value: "86.1% Occupancy", status: "Attention" },
                      { label: "Lifecare Eldoret", value: "85.3% Occupancy", status: "Attention" },
                      { label: "Lifecare Migori", value: "81.0% Occupancy", status: "Attention" },
                    ],
                  })
                }
              >
                <span>⌖</span> Drill
              </button>
              <span className="exec-weight-text">10%</span>
            </div>
          </div>
        </div>

        {/* KPI 5: Board Strategic Milestones */}
        <div className="exec-kpi-card">
          <div className="exec-kpi-header">
            <h3 className="exec-kpi-title">Board Strategic Milestones</h3>
            <div className="exec-kpi-icon-pill">
              <Activity size={15} />
            </div>
          </div>
          <p className="exec-kpi-subtitle">COE, corporate and expansion milestones</p>
          <div className="exec-kpi-value-row">
            <span className="exec-kpi-value">71.3%</span>
            <span className="exec-pill-sample">● Sample</span>
          </div>
          <p className="exec-kpi-trend">Month-on-month: -2.3 pp vs Jun 2026</p>
          <div className="exec-kpi-tags-row">
            <span className="exec-pill-status on-target">● On target</span>
          </div>
          <div className="exec-kpi-target-row">
            <span>Target 63.2%</span>
            <span className="exec-pill-sample">● Sample</span>
          </div>
          <div className="exec-kpi-footer">
            <p className="exec-kpi-scope-text">Across all 6 hospitals · MTD · Jul 2026</p>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button
                type="button"
                className="exec-drill-btn"
                onClick={() =>
                  setActiveDrill({
                    title: "Board Strategic Milestones",
                    category: "kpi",
                    metricValue: "71.3%",
                    targetValue: "63.2%",
                    scope: "Group Strategic Roadmap",
                    description:
                      "Composite completion index tracking multi-year infrastructure, clinical accreditations, health tech deployments, and regional hospital expansions approved by the Executive Board.",
                    breakdown: [
                      { label: "Africare Vision 2028 Network", value: "82% Complete", status: "On Track" },
                      { label: "Kikuyu Oncology Launch", value: "68% Complete", status: "At Risk (+12d)" },
                      { label: "Payer Tariff Standardization", value: "84% Complete", status: "On Track" },
                      { label: "Eldoret Cath Lab Phase-1", value: "54% Complete", status: "Awaiting Greenlight" },
                    ],
                  })
                }
              >
                <span>⌖</span> Drill
              </button>
              <span className="exec-weight-text">10%</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Executive Morning Brief — Triage & Attention Feed (Image 4) ─── */}
      <section className="exec-feed-section" aria-label="Triage and Attention Feed">
        <div className="exec-feed-header">
          <div className="exec-feed-title-wrap">
            <div className="exec-feed-icon-box">
              <AlertCircle size={18} />
            </div>
            <h2 className="exec-feed-title">Executive Morning Brief — Triage &amp; Attention Feed</h2>
            <span className="exec-badge-count">4 Actionable Items</span>
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
          Group Executive Chairman &amp; CEO triage feed categorized into Action Now, Monitor, and On Track tiers.
        </p>

        {/* Filter Tabs */}
        <div className="exec-feed-tabs">
          <button
            type="button"
            className={`exec-feed-tab-btn ${feedTab === "all" ? "active" : ""}`}
            onClick={() => setFeedTab("all")}
          >
            <span>All Tiers</span>
            <span style={{ opacity: 0.8 }}>4</span>
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
            <span style={{ opacity: 0.8 }}>3</span>
          </button>
          <button
            type="button"
            className={`exec-feed-tab-btn ${feedTab === "track" ? "active" : ""}`}
            onClick={() => setFeedTab("track")}
          >
            <span>On Track</span>
            <span style={{ opacity: 0.8 }}>0</span>
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
                  <span className="exec-pill-status" style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }}>
                    ● Critical
                  </span>
                  <span className="exec-pill-blue">Group-wide</span>
                  <span className="exec-pill-status gray">👤 Group CFO</span>
                  <span className="exec-pill-status gray">📅 Due: Tomorrow</span>
                </div>
                <h3 className="exec-tier-card-title">Board Audit &amp; Risk Committee Q3 review pack finalization</h3>
                <p className="exec-tier-card-desc">
                  Q3 net revenue reconciliation (KSh 148.2M) and capital expenditure variance documentation ready for Chairman review.
                </p>
              </div>

              <button
                type="button"
                className="exec-btn-action-red"
                onClick={() => setActiveModal("boardPack")}
              >
                <span>Review Board Pack</span>
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
                  3 Tracking
                </span>
              </div>
              <span className="exec-tier-helper">Operational risks and milestones approaching deadline</span>
            </div>

            {/* Monitor Card 1 */}
            <div className="exec-tier-card tier-2-border">
              <div className="exec-tier-content">
                <div className="exec-tier-card-tags">
                  <span className="exec-pill-status attention">● High</span>
                  <span className="exec-pill-blue">Group-wide</span>
                  <span className="exec-pill-status gray">👤 Legal Head</span>
                  <span className="exec-pill-status gray">📅 Due: Sep 12, 2026</span>
                </div>
                <h3 className="exec-tier-card-title">Jubilee &amp; AAR Group Strategic Agreement endorsement</h3>
                <p className="exec-tier-card-desc">
                  Direct corporate partnership covering 45,000 scheme lives with guaranteed 30-day clean claim settlement across 6 hospitals.
                </p>
              </div>

              <button
                type="button"
                className="exec-btn-action-dark"
                onClick={() => setActiveModal("agreement")}
              >
                <span>Endorse Agreement</span>
                <span>&gt;</span>
              </button>
            </div>

            {/* Monitor Card 2 */}
            <div className="exec-tier-card tier-2-border">
              <div className="exec-tier-content">
                <div className="exec-tier-card-tags">
                  <span className="exec-pill-status attention">● High</span>
                  <span className="exec-pill-blue">Lifecare Eldoret</span>
                  <span className="exec-pill-status gray">👤 Hospital Operations Head (DHO)</span>
                  <span className="exec-pill-status gray">📅 Due: Sep 16, 2026</span>
                </div>
                <h3 className="exec-tier-card-title">Phase-1 Lifecare Eldoret Cath Lab capex proposal</h3>
                <p className="exec-tier-card-desc">
                  KSh 18.5M cardiac catheterisation laboratory business case seeking Chairman greenlight for Q4 execution.
                </p>
              </div>

              <button
                type="button"
                className="exec-btn-action-dark"
                onClick={() => setActiveModal("capex")}
              >
                <span>Review Capex</span>
                <span>&gt;</span>
              </button>
            </div>

            {/* Monitor Card 3 */}
            <div className="exec-tier-card tier-2-border">
              <div className="exec-tier-content">
                <div className="exec-tier-card-tags">
                  <span className="exec-pill-status attention">● Medium</span>
                  <span className="exec-pill-blue">Group-wide</span>
                  <span className="exec-pill-status gray">👤 HR Head</span>
                  <span className="exec-pill-status gray">📅 Due: Sep 18, 2026</span>
                </div>
                <h3 className="exec-tier-card-title">Hospital Medical Director annual performance &amp; incentive pool</h3>
                <p className="exec-tier-card-desc">
                  KSh 6.2M retention incentive distribution benchmarked to clinical safety zero-harm and clean claim KPIs.
                </p>
              </div>

              <button
                type="button"
                className="exec-btn-action-dark"
                onClick={() => setActiveModal("scheme")}
              >
                <span>Review Scheme</span>
                <span>&gt;</span>
              </button>
            </div>
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
              <span className="exec-tier-helper">SLA targets and clinical protocols operating as scheduled</span>
            </div>

            <div className="exec-tier-3-box">
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <CheckCircle2 size={18} color="#16a34a" />
                <span>All regional healthcare facilities and surgical units operating within standard SLA tolerances.</span>
              </div>
              <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.05em", color: "#15803d" }}>
                NORMAL OPERATIONS
              </span>
            </div>
          </div>
        )}
      </section>

      {/* ─── Two-Column Section: Initiatives & Approvals (Image 5) ─── */}
      <section className="exec-grid-2col">
        {/* Left Column: Strategic Initiatives Table */}
        <div className="exec-card-panel">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.05em", color: "#64748b", textTransform: "uppercase" }}>
                STRATEGIC PORTFOLIO
              </span>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", margin: "2px 0 0" }}>
                Key Strategic Initiatives &amp; Expansion Status
              </h3>
            </div>
          </div>

          <div className="exec-table-wrap">
            <table className="exec-table">
              <thead>
                <tr>
                  <th>INITIATIVE &amp; FACILITY</th>
                  <th>DEPARTMENT</th>
                  <th>CLINICAL LEAD</th>
                  <th>PROGRESS</th>
                  <th>STATUS</th>
                  <th>GO-LIVE</th>
                  <th>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {/* Row 1 */}
                <tr>
                  <td>
                    <strong style={{ display: "block", color: "#0f172a" }}>
                      Africare Vision 2028: Multi-Region Healthcare Network
                    </strong>
                    <span style={{ fontSize: 11, color: "#64748b" }}>All 6 Hospitals</span>
                  </td>
                  <td>Group Executive &amp; Board</td>
                  <td>👤 Group Chairman</td>
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

                {/* Row 2 */}
                <tr>
                  <td>
                    <strong style={{ display: "block", color: "#0f172a" }}>
                      Lifecare Kikuyu — Oncology service line launch
                    </strong>
                    <div style={{ display: "flex", gap: 6, marginTop: 2 }}>
                      <span className="exec-pill-blue" style={{ fontSize: 10, padding: "1px 6px" }}>
                        Strategic COE
                      </span>
                      <span style={{ fontSize: 11, color: "#64748b" }}>Lifecare Kikuyu</span>
                    </div>
                  </td>
                  <td>Clinical Governance &amp; Medical Affairs</td>
                  <td>Chief Clinical Director</td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontWeight: 700 }}>68%</span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: "#dc2626" }}>+12d delay</span>
                    </div>
                    <div className="exec-progress-bar-bg">
                      <div className="exec-progress-bar-fill red" style={{ width: "68%" }} />
                    </div>
                  </td>
                  <td>
                    <span className="exec-pill-status" style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }}>
                      ● At Risk
                    </span>
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

                {/* Row 3 */}
                <tr>
                  <td>
                    <strong style={{ display: "block", color: "#0f172a" }}>
                      Group Payer &amp; Insurer Rate Card Standardization
                    </strong>
                    <span style={{ fontSize: 11, color: "#64748b" }}>All 6 Hospitals</span>
                  </td>
                  <td>Legal &amp; Payer Contracting</td>
                  <td>👤 Legal Head</td>
                  <td>
                    <span style={{ fontWeight: 700 }}>84%</span>
                    <div className="exec-progress-bar-bg">
                      <div className="exec-progress-bar-fill green" style={{ width: "84%" }} />
                    </div>
                  </td>
                  <td>
                    <span className="exec-pill-status on-target">● On Track</span>
                  </td>
                  <td style={{ whiteSpace: "nowrap" }}>Oct 05, 2026</td>
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
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Executive Authorization Checklist */}
        <div className="exec-card-panel">
          <div style={{ marginBottom: 14 }}>
            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.06em", color: "#64748b", textTransform: "uppercase" }}>
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

      {/* ─── Group-wide Financial EBITDA & Revenue Contribution by Facility (Image 5 bottom) ─── */}
      <section className="exec-facility-section" aria-label="Facility EBITDA Contribution">
        <div className="exec-facility-header">
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <TrendingUp size={18} color="#2563eb" />
              <h2 style={{ fontSize: 17, fontWeight: 800, color: "#0f172a", margin: 0 }}>
                Group-wide Financial EBITDA &amp; Revenue Contribution by Facility
              </h2>
            </div>
            <p style={{ fontSize: 12.5, color: "#64748b", margin: "4px 0 0" }}>
              Board performance scorecard: revenue run-rate, EBITDA margins, and capital return yield across 6 hospitals
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 11.5, fontWeight: 600 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 5, color: "#2563eb" }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#2563eb" }} /> Tracked Metric
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 5, color: "#94a3b8" }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#cbd5e1" }} /> Baseline Capacity
            </span>
          </div>
        </div>

        <div className="exec-facility-grid">
          {/* Hospital 1: Kikuyu */}
          <div className="exec-facility-card">
            <div className="exec-facility-top">
              <h3 className="exec-facility-name">Lifecare Kikuyu</h3>
              <span className="exec-margin-pill green">24.2% Margin</span>
            </div>
            <p className="exec-facility-runrate">KSh 62.4M Net Revenue · 24.2% EBITDA</p>
            <div className="exec-facility-bar-bg">
              <div className="exec-facility-bar-fill blue" style={{ width: "92%" }} />
            </div>
            <div className="exec-facility-bottom">
              <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b" }}>STATUS</span>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span className="exec-facility-ebitda">KSh 15.1M EBITDA</span>
                <button
                  type="button"
                  className="exec-drill-btn"
                  onClick={() =>
                    setActiveDrill({
                      title: "Lifecare Hospital Kikuyu",
                      category: "facility",
                      metricValue: "KSh 15.1M EBITDA",
                      targetValue: "24.2% Margin",
                      scope: "Region 1 (Central & Nairobi)",
                      description:
                        "Flagship multi-specialty tertiary hospital with comprehensive Oncology COE, advanced cardiac surgical units, and 180 registered inpatient beds.",
                      breakdown: [
                        { label: "Net Revenue (MTD)", value: "KSh 62.4M" },
                        { label: "EBITDA Margin", value: "24.2%" },
                        { label: "Bed Occupancy", value: "92.4%" },
                        { label: "Surgical Theatre Volume", value: "318 cases/mo" },
                      ],
                    })
                  }
                >
                  <span>⌖</span> Drill
                </button>
              </div>
            </div>
          </div>

          {/* Hospital 2: Meru */}
          <div className="exec-facility-card">
            <div className="exec-facility-top">
              <h3 className="exec-facility-name">Lifecare Meru</h3>
              <span className="exec-margin-pill green">21.5% Margin</span>
            </div>
            <p className="exec-facility-runrate">KSh 34.8M Net Revenue · 21.5% EBITDA</p>
            <div className="exec-facility-bar-bg">
              <div className="exec-facility-bar-fill blue" style={{ width: "84%" }} />
            </div>
            <div className="exec-facility-bottom">
              <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b" }}>STATUS</span>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span className="exec-facility-ebitda">KSh 7.5M EBITDA</span>
                <button
                  type="button"
                  className="exec-drill-btn"
                  onClick={() =>
                    setActiveDrill({
                      title: "Lifecare Hospital Meru",
                      category: "facility",
                      metricValue: "KSh 7.5M EBITDA",
                      targetValue: "21.5% Margin",
                      scope: "Region 1 (Eastern & Mt Kenya)",
                      description:
                        "Regional secondary referral hub with mother-and-child focus, orthopedic trauma theatre, and 95 operational beds.",
                      breakdown: [
                        { label: "Net Revenue (MTD)", value: "KSh 34.8M" },
                        { label: "EBITDA Margin", value: "21.5%" },
                        { label: "Bed Occupancy", value: "88.6%" },
                      ],
                    })
                  }
                >
                  <span>⌖</span> Drill
                </button>
              </div>
            </div>
          </div>

          {/* Hospital 3: Mlolongo */}
          <div className="exec-facility-card">
            <div className="exec-facility-top">
              <h3 className="exec-facility-name">Lifecare Mlolongo</h3>
              <span className="exec-margin-pill amber">18.4% Margin</span>
            </div>
            <p className="exec-facility-runrate">KSh 21.2M Net Revenue · 18.4% EBITDA</p>
            <div className="exec-facility-bar-bg">
              <div className="exec-facility-bar-fill amber" style={{ width: "70%" }} />
            </div>
            <div className="exec-facility-bottom">
              <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b" }}>STATUS</span>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span className="exec-facility-ebitda">KSh 3.9M EBITDA</span>
                <button
                  type="button"
                  className="exec-drill-btn"
                  onClick={() =>
                    setActiveDrill({
                      title: "Lifecare Hospital Mlolongo",
                      category: "facility",
                      metricValue: "KSh 3.9M EBITDA",
                      targetValue: "18.4% Margin",
                      scope: "Region 1 (Machakos corridor)",
                      description:
                        "Fast-growing urban emergency and surgical facility located along the Nairobi-Mombasa transport corridor.",
                      breakdown: [
                        { label: "Net Revenue (MTD)", value: "KSh 21.2M" },
                        { label: "EBITDA Margin", value: "18.4%" },
                        { label: "Bed Occupancy", value: "84.2%" },
                      ],
                    })
                  }
                >
                  <span>⌖</span> Drill
                </button>
              </div>
            </div>
          </div>

          {/* Hospital 4: Bungoma */}
          <div className="exec-facility-card">
            <div className="exec-facility-top">
              <h3 className="exec-facility-name">Lifecare Bungoma</h3>
              <span className="exec-margin-pill green">19.8% Margin</span>
            </div>
            <p className="exec-facility-runrate">KSh 14.5M Net Revenue · 19.8% EBITDA</p>
            <div className="exec-facility-bar-bg">
              <div className="exec-facility-bar-fill blue" style={{ width: "76%" }} />
            </div>
            <div className="exec-facility-bottom">
              <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b" }}>STATUS</span>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span className="exec-facility-ebitda">KSh 2.9M EBITDA</span>
                <button
                  type="button"
                  className="exec-drill-btn"
                  onClick={() =>
                    setActiveDrill({
                      title: "Lifecare Hospital Bungoma",
                      category: "facility",
                      metricValue: "KSh 2.9M EBITDA",
                      targetValue: "19.8% Margin",
                      scope: "Region 2 (Western Kenya)",
                      description:
                        "Serving the Western region with general surgery, high-dependency care, and comprehensive outpatient diagnostics.",
                      breakdown: [
                        { label: "Net Revenue (MTD)", value: "KSh 14.5M" },
                        { label: "EBITDA Margin", value: "19.8%" },
                        { label: "Bed Occupancy", value: "86.1%" },
                      ],
                    })
                  }
                >
                  <span>⌖</span> Drill
                </button>
              </div>
            </div>
          </div>

          {/* Hospital 5: Eldoret */}
          <div className="exec-facility-card">
            <div className="exec-facility-top">
              <h3 className="exec-facility-name">Lifecare Eldoret</h3>
              <span className="exec-margin-pill amber">17.2% Margin</span>
            </div>
            <p className="exec-facility-runrate">KSh 10.8M Net Revenue · 17.2% EBITDA</p>
            <div className="exec-facility-bar-bg">
              <div className="exec-facility-bar-fill amber" style={{ width: "66%" }} />
            </div>
            <div className="exec-facility-bottom">
              <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b" }}>STATUS</span>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span className="exec-facility-ebitda">KSh 1.9M EBITDA</span>
                <button
                  type="button"
                  className="exec-drill-btn"
                  onClick={() =>
                    setActiveDrill({
                      title: "Lifecare Hospital Eldoret",
                      category: "facility",
                      metricValue: "KSh 1.9M EBITDA",
                      targetValue: "17.2% Margin",
                      scope: "Region 2 (North Rift)",
                      description:
                        "Key North Rift clinical outpost. Currently undergoing cath lab pre-commissioning works to become a regional cardiology hub.",
                      breakdown: [
                        { label: "Net Revenue (MTD)", value: "KSh 10.8M" },
                        { label: "EBITDA Margin", value: "17.2%" },
                        { label: "Cath Lab Pipeline", value: "KSh 18.5M Proposed" },
                      ],
                    })
                  }
                >
                  <span>⌖</span> Drill
                </button>
              </div>
            </div>
          </div>

          {/* Hospital 6: Migori */}
          <div className="exec-facility-card">
            <div className="exec-facility-top">
              <h3 className="exec-facility-name">Lifecare Migori</h3>
              <span className="exec-margin-pill green">16.5% Margin</span>
            </div>
            <p className="exec-facility-runrate">KSh 4.5M Net Revenue · 16.5% EBITDA</p>
            <div className="exec-facility-bar-bg">
              <div className="exec-facility-bar-fill blue" style={{ width: "60%" }} />
            </div>
            <div className="exec-facility-bottom">
              <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b" }}>STATUS</span>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span className="exec-facility-ebitda">KSh 742k EBITDA</span>
                <button
                  type="button"
                  className="exec-drill-btn"
                  onClick={() =>
                    setActiveDrill({
                      title: "Lifecare Hospital Migori",
                      category: "facility",
                      metricValue: "KSh 742k EBITDA",
                      targetValue: "16.5% Margin",
                      scope: "Region 2 (South Nyanza)",
                      description:
                        "Community-integrated healthcare hub serving South Nyanza cross-border patients with 45 inpatient beds.",
                      breakdown: [
                        { label: "Net Revenue (MTD)", value: "KSh 4.5M" },
                        { label: "EBITDA Margin", value: "16.5%" },
                        { label: "Bed Occupancy", value: "81.0%" },
                      ],
                    })
                  }
                >
                  <span>⌖</span> Drill
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── MODAL 1: Drill Down Modal ─── */}
      {activeDrill && (
        <div className="exec-modal-overlay" onClick={() => setActiveDrill(null)}>
          <div className="exec-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="exec-modal-header">
              <div>
                <span style={{ fontSize: 11, fontWeight: 800, color: "#2563eb", letterSpacing: "0.06em", textTransform: "uppercase" }}>
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
              <div style={{ display: "flex", gap: 16, background: "#f8fafc", padding: "14px 18px", borderRadius: 10, marginBottom: 16 }}>
                <div>
                  <span style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>Current Value</span>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "#0f172a" }}>{activeDrill.metricValue}</div>
                </div>
                {activeDrill.targetValue && (
                  <div>
                    <span style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>Target Benchmark</span>
                    <div style={{ fontSize: 20, fontWeight: 800, color: "#16a34a" }}>{activeDrill.targetValue}</div>
                  </div>
                )}
                {activeDrill.scope && (
                  <div>
                    <span style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>Reporting Scope</span>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#2563eb", marginTop: 4 }}>{activeDrill.scope}</div>
                  </div>
                )}
              </div>

              <p style={{ fontSize: 13.5, color: "#334155", lineHeight: 1.5, margin: "0 0 16px" }}>
                {activeDrill.description}
              </p>

              {activeDrill.breakdown && (
                <div>
                  <h4 style={{ fontSize: 12, fontWeight: 800, color: "#64748b", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 8 }}>
                    Breakdown by Unit / Stream
                  </h4>
                  <table className="exec-table">
                    <thead>
                      <tr>
                        <th>STREAM / FACILITY</th>
                        <th>FIGURE</th>
                        <th>MARGIN / STATUS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeDrill.breakdown.map((row, idx) => (
                        <tr key={idx}>
                          <td><strong>{row.label}</strong></td>
                          <td><span style={{ fontFamily: "JetBrains Mono, monospace", fontWeight: 700 }}>{row.value}</span></td>
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

              <div style={{ marginTop: 20, padding: "12px 14px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, fontSize: 12, color: "#166534" }}>
                <strong>Data Provenance: Illustrative Verified</strong> · All values derived strictly from verified billing data, hospital admission records, and finance ledgers.
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
              <button
                type="button"
                className="exec-btn-primary"
                onClick={() => setActiveDrill(null)}
              >
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
                <span style={{ fontSize: 11, fontWeight: 800, color: "#2563eb", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                  CHAIRMAN EXECUTIVE GOVERNANCE
                </span>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", margin: "2px 0 0" }}>
                  Executive Decision &amp; Approval Queue ({pendingCount} Pending)
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
                Decisions below require your executive sign-off or endorsement to unlock capital deployment, rate-cards, and board papers.
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
              <button
                type="button"
                className="exec-btn-primary"
                onClick={() => setDecisionQueueOpen(false)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 3: Board Pack Review Modal ─── */}
      {activeModal === "boardPack" && (
        <div className="exec-modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="exec-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="exec-modal-header">
              <div>
                <span className="exec-pill-status" style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }}>
                  ● Critical Escalation
                </span>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", margin: "4px 0 0" }}>
                  Board Audit &amp; Risk Committee Q3 Review Pack Finalization
                </h2>
              </div>
              <button type="button" onClick={() => setActiveModal(null)} style={{ background: "none", border: "none", cursor: "pointer" }}>
                <X size={20} />
              </button>
            </div>
            <div className="exec-modal-body">
              <p>
                <strong>Presenter:</strong> Group CFO &amp; Internal Audit Partner
              </p>
              <p>
                The Q3 reconciliation documents KSh 148.2M across regional operating entities with Capex variance of +6.8% in Region 1. All capital variances have been audited against the central contingency allowance.
              </p>
              <div style={{ background: "#f8fafc", padding: 12, borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12.5 }}>
                <div>✓ Audited by Statutory Committee</div>
                <div>✓ Statutory solvency &amp; debt covenants maintained</div>
                <div>✓ Linac bunker civil contractor milestone certified</div>
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
                {approvedOrders["ord-1"] ? "Revoke Signoff" : "Approve & Sign Board Pack"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 4: Agreement Endorsement Modal ─── */}
      {activeModal === "agreement" && (
        <div className="exec-modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="exec-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="exec-modal-header">
              <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", margin: 0 }}>
                Jubilee &amp; AAR Strategic Agreement Endorsement
              </h2>
              <button type="button" onClick={() => setActiveModal(null)} style={{ background: "none", border: "none", cursor: "pointer" }}>
                <X size={20} />
              </button>
            </div>
            <div className="exec-modal-body">
              <p>
                Corporate direct settlement coverage for <strong>45,000 policyholders</strong> with strict 30-day clean claim turnaround across all 6 Lifecare hospitals.
              </p>
              <div style={{ background: "#f0fdf4", padding: 12, borderRadius: 8, border: "1px solid #bbf7d0", fontSize: 13, color: "#166534" }}>
                Expected Revenue Contribution: <strong>+KSh 42.0M annual run-rate</strong>.
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
                {approvedOrders["ord-2"] ? "Endorsed ✓" : "Endorse Strategic Agreement"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 5: Eldoret Cath Lab Capex Proposal ─── */}
      {activeModal === "capex" && (
        <div className="exec-modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="exec-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="exec-modal-header">
              <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", margin: 0 }}>
                Phase-1 Lifecare Eldoret Cath Lab Capex Proposal
              </h2>
              <button type="button" onClick={() => setActiveModal(null)} style={{ background: "none", border: "none", cursor: "pointer" }}>
                <X size={20} />
              </button>
            </div>
            <div className="exec-modal-body">
              <p>
                <strong>Capital Expenditure:</strong> KSh 18.5M for modern biplane fluoroscopy system and lead lining civil modifications.
              </p>
              <p>
                <strong>Target Go-Live:</strong> Q4 2026. Projected payback period: 2.1 years with 28 monthly procedures.
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
                {approvedOrders["ord-3"] ? "Greenlit ✓" : "Give Chairman Greenlight"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 6: Medical Director Incentive Scheme ─── */}
      {activeModal === "scheme" && (
        <div className="exec-modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="exec-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="exec-modal-header">
              <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", margin: 0 }}>
                Hospital Medical Director Annual Incentive Pool
              </h2>
              <button type="button" onClick={() => setActiveModal(null)} style={{ background: "none", border: "none", cursor: "pointer" }}>
                <X size={20} />
              </button>
            </div>
            <div className="exec-modal-body">
              <p>
                Retention and performance pool of <strong>KSh 6.2M</strong> evaluated against clinical safety indices, zero hospital-acquired infections, and claim rejection rates under 2.0%.
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
                  ? "Africare Vision 2028: Multi-Region Healthcare Network"
                  : activeModal === "initiative2"
                  ? "Lifecare Kikuyu — Oncology Service Line Launch"
                  : "Group Payer & Insurer Rate Card Standardization"}
              </h2>
              <button type="button" onClick={() => setActiveModal(null)} style={{ background: "none", border: "none", cursor: "pointer" }}>
                <X size={20} />
              </button>
            </div>
            <div className="exec-modal-body">
              <p>
                <strong>Status:</strong>{" "}
                {activeModal === "initiative2" ? "At Risk (+12d civil milestone delay)" : "On Track (84% milestone completion)"}
              </p>
              <p>
                Audited against clinical guidelines, vendor deliveries, and financial milestones. Lead:{" "}
                {activeModal === "initiative1"
                  ? "Group Chairman & Board"
                  : activeModal === "initiative2"
                  ? "Chief Clinical Director"
                  : "Legal Head"}
                .
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
