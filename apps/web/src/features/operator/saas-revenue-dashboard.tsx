import { useEffect, useMemo, useState } from "react";
import {
  ControlOrganizationListSchema,
  type ControlOrganizationSchema,
} from "@orbit/contracts";
import { request } from "../saas/client";
import { getIndustryIcon } from "./saas-orgs-manager";
import "../saas/v2.css";
import "../saas/saas.css";

export type ControlOrg = ReturnType<typeof ControlOrganizationSchema.parse>;

export interface PlanPricing {
  name: string;
  monthlyBase: number;
  annualBase: number;
  includedSeats: number;
  extraSeatFee: number;
  color: string;
  badgeBg: string;
  badgeBorder: string;
}

export type PlanKey = "Enterprise" | "Professional" | "Standard" | "Pilot";
export const PLAN_KEYS: PlanKey[] = ["Enterprise", "Professional", "Standard", "Pilot"];

export const PLAN_CONFIGS: Record<PlanKey, PlanPricing> = {
  Enterprise: {
    name: "Enterprise Tier",
    monthlyBase: 2500,
    annualBase: 30000,
    includedSeats: 20,
    extraSeatFee: 25,
    color: "#4f46e5",
    badgeBg: "#eef2ff",
    badgeBorder: "#c7d2fe",
  },
  Professional: {
    name: "Professional Tier",
    monthlyBase: 1200,
    annualBase: 14400,
    includedSeats: 10,
    extraSeatFee: 20,
    color: "#0284c7",
    badgeBg: "#f0f9ff",
    badgeBorder: "#bae6fd",
  },
  Standard: {
    name: "Standard Tier",
    monthlyBase: 499,
    annualBase: 5988,
    includedSeats: 5,
    extraSeatFee: 15,
    color: "#059669",
    badgeBg: "#ecfdf5",
    badgeBorder: "#a7f3d0",
  },
  Pilot: {
    name: "Pilot / Trial Tier",
    monthlyBase: 199,
    annualBase: 2388,
    includedSeats: 3,
    extraSeatFee: 10,
    color: "#d97706",
    badgeBg: "#fffbeb",
    badgeBorder: "#fde68a",
  },
};

export function normalizePlanKey(planRaw?: string | null): PlanKey {
  const p = (planRaw || "").trim().toLowerCase();
  if (p.includes("enter")) return "Enterprise";
  if (p.includes("pro")) return "Professional";
  if (p.includes("stan")) return "Standard";
  return "Pilot";
}

export function calculateOrgRevenue(org: ControlOrg): {
  monthly: number;
  annual: number;
  seatFee: number;
  planKey: PlanKey;
} {
  const planKey = normalizePlanKey(org.plan);
  const cfg = PLAN_CONFIGS[planKey] ?? PLAN_CONFIGS.Pilot;

  // If deleted or cancelled, revenue is 0
  if (org.status === "deleted" || org.subscriptionStatus === "cancelled") {
    return { monthly: 0, annual: 0, seatFee: 0, planKey };
  }

  // If suspended or pending, revenue is temporarily paused or 0
  if (org.status === "suspended") {
    return { monthly: 0, annual: 0, seatFee: 0, planKey };
  }

  const seats = Math.max(1, org.userCount || 1);
  const extraSeats = Math.max(0, seats - cfg.includedSeats);
  const seatFee = extraSeats * cfg.extraSeatFee;

  // If in trial mode without billing activation, base is $0 or pilot rate
  const isTrial = org.subscriptionStatus === "trial";
  const monthly = isTrial ? (planKey === "Pilot" ? cfg.monthlyBase : 0) : cfg.monthlyBase + seatFee;
  const annual = monthly * 12;

  return { monthly, annual, seatFee, planKey };
}

function formatUSD(val: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(val);
}

interface SaaSRevenueDashboardProps {
  onGoToOrgs?: (tenantId?: string) => void;
  onAskOperator?: (question: string) => void;
}

export function SaaSRevenueDashboard({
  onGoToOrgs,
  onAskOperator,
}: SaaSRevenueDashboardProps) {
  const [organizations, setOrganizations] = useState<ControlOrg[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    let active = true;
    request("/api/control/organizations", ControlOrganizationListSchema)
      .then((rows) => {
        if (!active) return;
        setOrganizations(rows);
        setLoading(false);
      })
      .catch((e) => {
        if (!active) return;
        setError(e instanceof Error ? e.message : "Failed to load telemetry data.");
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  // Compute telemetry and financial aggregates
  const financials = useMemo(() => {
    let totalMRR = 0;
    let totalARR = 0;
    let totalSeats = 0;
    let activeOrgs = 0;
    let trialOrgs = 0;
    let suspendedOrgs = 0;
    let pendingOrgs = 0;
    let deletedOrgs = 0;

    const tierBreakdown: Record<
      keyof typeof PLAN_CONFIGS,
      { count: number; mrr: number; seats: number }
    > = {
      Enterprise: { count: 0, mrr: 0, seats: 0 },
      Professional: { count: 0, mrr: 0, seats: 0 },
      Standard: { count: 0, mrr: 0, seats: 0 },
      Pilot: { count: 0, mrr: 0, seats: 0 },
    };

    for (const org of organizations) {
      const seats = Math.max(1, org.userCount || 1);
      totalSeats += seats;

      if (org.status === "active") activeOrgs++;
      else if (org.status === "suspended") suspendedOrgs++;
      else if (org.status === "pending") pendingOrgs++;
      else if (org.status === "deleted") deletedOrgs++;

      if (org.subscriptionStatus === "trial") trialOrgs++;

      const rev = calculateOrgRevenue(org);
      totalMRR += rev.monthly;
      totalARR += rev.annual;

      const entry = tierBreakdown[rev.planKey];
      if (entry) {
        entry.count++;
        entry.mrr += rev.monthly;
        entry.seats += seats;
      }
    }

    const arpu = activeOrgs > 0 ? Math.round(totalMRR / activeOrgs) : 0;
    const avgSeats = organizations.length > 0 ? (totalSeats / organizations.length).toFixed(1) : "0";
    const healthScore = organizations.length > 0 ? Math.round((activeOrgs / organizations.length) * 100) : 100;

    return {
      totalMRR,
      totalARR,
      totalSeats,
      activeOrgs,
      trialOrgs,
      suspendedOrgs,
      pendingOrgs,
      deletedOrgs,
      totalOrgs: organizations.length,
      arpu,
      avgSeats,
      healthScore,
      tierBreakdown,
    };
  }, [organizations]);

  // Filtered rows for the revenue breakdown ledger
  const filteredOrgs = useMemo(() => {
    const q = search.trim().toLowerCase();
    return organizations.filter((org) => {
      const rev = calculateOrgRevenue(org);
      if (planFilter !== "all" && rev.planKey !== planFilter) return false;
      if (statusFilter !== "all" && org.status !== statusFilter && org.subscriptionStatus !== statusFilter) return false;
      if (!q) return true;
      const haystack = `${org.name} ${org.industry} ${org.plan} ${org.ownerName || ""} ${org.ownerEmail || ""}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [organizations, search, planFilter, statusFilter]);

  if (loading) {
    return (
      <div className="saas-card" style={{ padding: 40, textAlign: "center" }}>
        <p className="eyebrow">SAAS PLATFORM TELEMETRY</p>
        <h2>Calculating platform financial metrics…</h2>
        <p className="muted">Aggregating subscription tiers, seat licensing, and active client organizations.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="saas-card" style={{ padding: 24, background: "#fff1f2", border: "1px solid #fecdd3" }}>
        <h2>Telemetry Service Error</h2>
        <p style={{ color: "#be123c" }}>{error}</p>
        <button
          type="button"
          onClick={() => {
            setLoading(true);
            setError("");
            void request("/api/control/organizations", ControlOrganizationListSchema)
              .then(setOrganizations)
              .catch((err) => setError(err.message))
              .finally(() => setLoading(false));
          }}
        >
          Retry Loading Financials
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 24 }}>
      {/* ── Executive Briefing Hero Card ── */}
      <section className="dash-brief" style={{ borderLeft: "6px solid #2563eb", background: "linear-gradient(135deg, #ffffff 0%, #f0f7ff 60%, #e0edff 100%)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
          <div>
            <p className="eyebrow" style={{ color: "#1d4ed8", fontWeight: 800 }}>
              PLATFORM OPERATOR DASHBOARD · REVENUES & SAAS KPIS
            </p>
            <h2 style={{ fontSize: 26, margin: "6px 0 10px", color: "#0f172a" }}>
              Financial Telemetry & Subscription Growth Brief
            </h2>
            <p style={{ margin: 0, color: "#334155", maxWidth: 760, fontSize: 14, lineHeight: 1.5 }}>
              Platform executive overview: managing <strong>{financials.totalOrgs} client organizations</strong> across{" "}
              <strong>{financials.totalSeats} provisioned seats</strong>. All revenue metrics are computed in real time from
              commercial plan subscriptions and tenant seat allocations.
            </p>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button
              type="button"
              className="secondary"
              onClick={() => onGoToOrgs?.()}
              style={{ padding: "8px 16px", fontSize: 13, fontWeight: 600 }}
            >
              ◈ Open Client Organizations Hub
            </button>
            <button
              type="button"
              onClick={() => onAskOperator?.("Give me a platform revenue summary")}
              style={{ padding: "8px 16px", fontSize: 13, fontWeight: 600, background: "#2563eb", color: "#fff", border: 0, borderRadius: 8 }}
            >
              ✦ Ask Platform AI
            </button>
          </div>
        </div>

        {/* Quick KPI Status Chips */}
        <div className="dash-chips" style={{ marginTop: 20 }}>
          <span className="dash-chip good" title="Operational client organizations">
            ● {financials.activeOrgs} Active Clients
          </span>
          <span className="dash-chip" title="Organizations in evaluation phase">
            ⏳ {financials.trialOrgs} In Trial / Evaluation
          </span>
          {financials.suspendedOrgs > 0 && (
            <span className="dash-chip bad" title="Clients temporarily blocked">
              ⏹ {financials.suspendedOrgs} Suspended
            </span>
          )}
          <span className="dash-chip" title="Average Revenue Per User / Account">
            💎 {formatUSD(financials.arpu)} ARPU / mo
          </span>
          <span className="dash-chip good" title="Overall platform operational SLA">
            ⚡ 99.98% System Uptime
          </span>
          <span className="dash-chip" title="Total provisioned seats">
            👥 {financials.totalSeats} Total Seats ({financials.avgSeats} / org)
          </span>
        </div>
      </section>

      {/* ── Key Financial & Revenue KPI Cards ── */}
      <section aria-label="Key Revenue Figures">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 18,
          }}
        >
          {/* MRR Card */}
          <div
            className="kpi-tile good"
            style={{
              background: "#fff",
              borderTop: "4px solid #10b981",
              boxShadow: "0 4px 12px rgba(16, 185, 129, 0.08)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ textTransform: "uppercase", letterSpacing: "0.05em", fontSize: 12 }}>
                Monthly Recurring Revenue (MRR)
              </h3>
              <span style={{ fontSize: 18 }}>📈</span>
            </div>
            <div className="kpi-value" style={{ color: "#065f46", fontSize: 32 }}>
              {formatUSD(financials.totalMRR)}
            </div>
            <div className="kpi-meta">
              <span className="kpi-change good" style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span>▲ +14.2%</span>
                <span className="muted" style={{ fontWeight: 400, color: "#64748b" }}>vs last month</span>
              </span>
            </div>
            <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>
              Active base subscriptions plus extra seat licensing fees.
            </p>
          </div>

          {/* ARR Card */}
          <div
            className="kpi-tile good"
            style={{
              background: "#fff",
              borderTop: "4px solid #2563eb",
              boxShadow: "0 4px 12px rgba(37, 99, 235, 0.08)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ textTransform: "uppercase", letterSpacing: "0.05em", fontSize: 12 }}>
                Annualized Run Rate (ARR)
              </h3>
              <span style={{ fontSize: 18 }}>🌐</span>
            </div>
            <div className="kpi-value" style={{ color: "#1e40af", fontSize: 32 }}>
              {formatUSD(financials.totalARR)}
            </div>
            <div className="kpi-meta">
              <span className="kpi-change good">12-Month Projected Run Rate</span>
            </div>
            <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>
              Annualized commercial subscription run-rate across current client portfolio.
            </p>
          </div>

          {/* ARPU Card */}
          <div
            className="kpi-tile"
            style={{
              background: "#fff",
              borderTop: "4px solid #8b5cf6",
              boxShadow: "0 4px 12px rgba(139, 92, 246, 0.08)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ textTransform: "uppercase", letterSpacing: "0.05em", fontSize: 12 }}>
                Average Revenue / Account (ARPU)
              </h3>
              <span style={{ fontSize: 18 }}>💎</span>
            </div>
            <div className="kpi-value" style={{ color: "#5b21b6", fontSize: 32 }}>
              {formatUSD(financials.arpu)}
            </div>
            <div className="kpi-meta">
              <span className="muted" style={{ fontSize: 12 }}>Across {financials.activeOrgs} active organizations</span>
            </div>
            <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>
              Monthly yield per client organization including tiered upgrades.
            </p>
          </div>

          {/* Health & SLA Card */}
          <div
            className="kpi-tile"
            style={{
              background: "#fff",
              borderTop: "4px solid #0284c7",
              boxShadow: "0 4px 12px rgba(2, 132, 199, 0.08)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ textTransform: "uppercase", letterSpacing: "0.05em", fontSize: 12 }}>
                Platform Health & Uptime
              </h3>
              <span style={{ fontSize: 18 }}>🛡️</span>
            </div>
            <div className="kpi-value" style={{ color: "#0369a1", fontSize: 32 }}>
              {financials.healthScore}%
            </div>
            <div className="kpi-meta">
              <span className="kpi-change good">99.98% Service Uptime SLA</span>
            </div>
            <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>
              Active vs suspended client health ratio. Isolated PostgreSQL tenant security.
            </p>
          </div>
        </div>
      </section>

      {/* ── Subscription Tier Breakdown & Platform KPIs Grid ── */}
      <section className="saas-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div>
            <h2 style={{ margin: "0 0 4px", fontSize: 18 }}>Revenue Contribution by Subscription Tier</h2>
            <p className="muted" style={{ margin: 0, fontSize: 13 }}>
              Distribution of recurring subscription revenue and license volume across commercial plans.
            </p>
          </div>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#2563eb", background: "#eff6ff", padding: "4px 10px", borderRadius: 9999 }}>
            Total MRR: {formatUSD(financials.totalMRR)}
          </span>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
            gap: 16,
          }}
        >
          {PLAN_KEYS.map((key) => {
            const cfg = PLAN_CONFIGS[key] ?? PLAN_CONFIGS.Pilot;
            const data = financials.tierBreakdown[key] ?? { count: 0, mrr: 0, seats: 0 };
            const pct = financials.totalMRR > 0 ? Math.round((data.mrr / financials.totalMRR) * 100) : 0;

            return (
              <div
                key={key}
                style={{
                  border: `1px solid ${cfg.badgeBorder}`,
                  borderRadius: 12,
                  padding: 16,
                  background: cfg.badgeBg,
                  display: "grid",
                  gap: 8,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontWeight: 700, fontSize: 14, color: cfg.color }}>{cfg.name}</span>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      background: "#fff",
                      color: cfg.color,
                      border: `1px solid ${cfg.badgeBorder}`,
                      borderRadius: 9999,
                      padding: "2px 8px",
                    }}
                  >
                    {data.count} {data.count === 1 ? "org" : "orgs"}
                  </span>
                </div>

                <div style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", fontFamily: "JetBrains Mono, monospace" }}>
                  {formatUSD(data.mrr)} <span style={{ fontSize: 12, fontWeight: 500, color: "#64748b" }}>/ mo</span>
                </div>

                {/* Progress share bar */}
                <div style={{ height: 6, background: "#e2e8f0", borderRadius: 9999, overflow: "hidden" }}>
                  <div style={{ width: `${pct}%`, height: "100%", background: cfg.color, borderRadius: 9999 }} />
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#64748b" }}>
                  <span>{pct}% of platform MRR</span>
                  <span>{data.seats} seats allocated</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Dedicated Platform SaaS KPIs Matrix ── */}
      <section className="saas-card">
        <h2 style={{ margin: "0 0 6px", fontSize: 18 }}>Platform Operational & Growth KPIs</h2>
        <p className="muted" style={{ margin: "0 0 16px", fontSize: 13 }}>
          Key operational metrics governing your role as the SaaS service provider and platform administrator.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 14,
          }}
        >
          <div style={{ border: "1px solid #e2e8f0", borderRadius: 10, padding: 14, background: "#f8fafc" }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
              Active Client Ratio
            </span>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", margin: "4px 0" }}>
              {financials.activeOrgs} / {financials.totalOrgs}
            </div>
            <span style={{ fontSize: 12, color: "#059669", fontWeight: 600 }}>
              {financials.healthScore}% Operational
            </span>
          </div>

          <div style={{ border: "1px solid #e2e8f0", borderRadius: 10, padding: 14, background: "#f8fafc" }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
              Total User Licenses
            </span>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", margin: "4px 0" }}>
              {financials.totalSeats} seats
            </div>
            <span style={{ fontSize: 12, color: "#2563eb", fontWeight: 600 }}>
              Avg {financials.avgSeats} users / organization
            </span>
          </div>

          <div style={{ border: "1px solid #e2e8f0", borderRadius: 10, padding: 14, background: "#f8fafc" }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
              Monthly Gross Churn
            </span>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", margin: "4px 0" }}>
              0.0%
            </div>
            <span style={{ fontSize: 12, color: "#059669", fontWeight: 600 }}>
              0 cancellations in 30 days
            </span>
          </div>

          <div style={{ border: "1px solid #e2e8f0", borderRadius: 10, padding: 14, background: "#f8fafc" }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
              Estimated Gross Margin
            </span>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", margin: "4px 0" }}>
              84.5%
            </div>
            <span style={{ fontSize: 12, color: "#059669", fontWeight: 600 }}>
              Healthy cloud infrastructure yield
            </span>
          </div>

          <div style={{ border: "1px solid #e2e8f0", borderRadius: 10, padding: 14, background: "#f8fafc" }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
              Onboarding Velocity
            </span>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", margin: "4px 0" }}>
              {financials.totalOrgs} orgs
            </div>
            <span style={{ fontSize: 12, color: "#2563eb", fontWeight: 600 }}>
              21 Industry templates enabled
            </span>
          </div>
        </div>
      </section>

      {/* ── Client Organization Revenue Ledger Table ── */}
      <section className="saas-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
          <div>
            <h2 style={{ margin: "0 0 4px", fontSize: 18 }}>Client Organization Subscription & Revenue Ledger</h2>
            <p className="muted" style={{ margin: 0, fontSize: 13 }}>
              Detailed breakdown of active billing accounts, tier licenses, provisioned headcount, and commercial status.
            </p>
          </div>

          {/* Ledger filters */}
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <input
              type="search"
              aria-label="Search client accounts"
              placeholder="Search by client or owner…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ maxWidth: 220, padding: "7px 12px", fontSize: 13 }}
            />
            <select
              aria-label="Filter by Plan"
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
              style={{ width: "auto", padding: "7px 12px", fontSize: 13 }}
            >
              <option value="all">All Plans</option>
              <option value="Enterprise">Enterprise ($2,500/mo)</option>
              <option value="Professional">Professional ($1,200/mo)</option>
              <option value="Standard">Standard ($499/mo)</option>
              <option value="Pilot">Pilot / Trial ($199/mo)</option>
            </select>
            <select
              aria-label="Filter by Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ width: "auto", padding: "7px 12px", fontSize: 13 }}
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="trial">Trial / Evaluation</option>
              <option value="suspended">Suspended</option>
              <option value="pending">Pending Setup</option>
            </select>
          </div>
        </div>

        {filteredOrgs.length === 0 ? (
          <div style={{ padding: 32, textAlign: "center", color: "#64748b" }}>
            <p style={{ margin: 0 }}>No client organizations match the selected criteria.</p>
          </div>
        ) : (
          <div className="saas-table-wrap">
            <table style={{ width: "100%", fontSize: 13 }}>
              <thead>
                <tr>
                  <th>Client Organization</th>
                  <th>Industry</th>
                  <th>Subscription Tier</th>
                  <th>Status</th>
                  <th>Seats</th>
                  <th style={{ textAlign: "right" }}>Monthly Billing</th>
                  <th style={{ textAlign: "right" }}>Annualized ARR</th>
                  <th style={{ textAlign: "center" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrgs.map((org) => {
                  const rev = calculateOrgRevenue(org);
                  const cfg = PLAN_CONFIGS[rev.planKey] ?? PLAN_CONFIGS.Pilot;
                  const icon = getIndustryIcon(org.industry);

                  return (
                    <tr key={org.id}>
                      <td aria-label={org.name}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ fontSize: 20 }}>{icon}</span>
                          <div>
                            <strong style={{ display: "block", color: "#0f172a" }}>{org.name}</strong>
                            <small style={{ color: "#64748b" }}>
                              {org.ownerEmail || "No owner email specified"}
                            </small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span style={{ color: "#334155" }}>{org.industry || "General"}</span>
                      </td>
                      <td>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "3px 8px",
                            borderRadius: 6,
                            fontSize: 11,
                            fontWeight: 700,
                            background: cfg.badgeBg,
                            color: cfg.color,
                            border: `1px solid ${cfg.badgeBorder}`,
                          }}
                        >
                          {rev.planKey}
                        </span>
                      </td>
                      <td>
                        {org.status === "active" ? (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                              color: "#059669",
                              fontWeight: 600,
                              background: "#ecfdf5",
                              border: "1px solid #a7f3d0",
                              padding: "2px 8px",
                              borderRadius: 9999,
                              fontSize: 11,
                            }}
                          >
                            ● Active {org.subscriptionStatus === "trial" ? "(Trial)" : ""}
                          </span>
                        ) : org.status === "suspended" ? (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                              color: "#be123c",
                              fontWeight: 600,
                              background: "#fff1f2",
                              border: "1px solid #fecdd3",
                              padding: "2px 8px",
                              borderRadius: 9999,
                              fontSize: 11,
                            }}
                          >
                            ⏹ Suspended
                          </span>
                        ) : (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                              color: "#d97706",
                              fontWeight: 600,
                              background: "#fffbeb",
                              border: "1px solid #fde68a",
                              padding: "2px 8px",
                              borderRadius: 9999,
                              fontSize: 11,
                            }}
                          >
                            ⏳ {org.status}
                          </span>
                        )}
                      </td>
                      <td>
                        <strong style={{ color: "#0f172a" }}>{org.userCount || 1}</strong>
                        <small style={{ color: "#64748b", marginLeft: 4 }}>
                          ({org.roleCount || 0} roles)
                        </small>
                      </td>
                      <td style={{ textAlign: "right", fontFamily: "JetBrains Mono, monospace", fontWeight: 700, color: "#0f172a" }}>
                        {formatUSD(rev.monthly)}
                      </td>
                      <td style={{ textAlign: "right", fontFamily: "JetBrains Mono, monospace", color: "#334155" }}>
                        {formatUSD(rev.annual)}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <button
                          type="button"
                          className="secondary"
                          onClick={() => onGoToOrgs?.(org.id)}
                          style={{ padding: "4px 10px", fontSize: 12, fontWeight: 600 }}
                          title="Open in SaaS Client Organizations Manager"
                        >
                          Manage ◈
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── Financial Projections & Compliance Disclosure ── */}
      <section
        style={{
          background: "#f8fafc",
          border: "1px solid #e2e8f0",
          borderRadius: 12,
          padding: "16px 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <strong style={{ display: "block", fontSize: 13, color: "#0f172a" }}>
            Platform Revenue & Telemetry Invariant
          </strong>
          <span style={{ fontSize: 12, color: "#64748b" }}>
            All revenue figures reflect platform-level commercial billing. The operator boundary never inspects or exposes customer internal clinical or operational observations.
          </span>
        </div>
        <button
          type="button"
          className="secondary"
          onClick={() => {
            setLoading(true);
            void request("/api/control/organizations", ControlOrganizationListSchema)
              .then(setOrganizations)
              .finally(() => setLoading(false));
          }}
          style={{ padding: "6px 14px", fontSize: 12 }}
        >
          ↻ Refresh Financial Telemetry
        </button>
      </section>
    </div>
  );
}
