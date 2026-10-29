import "./executive.css";

interface AuxProps {
  onBackToBrief: () => void;
  onOpenChatbot: (seed?: string) => void;
}

export function ExecutiveAuxViews({
  tab,
  onBackToBrief,
  onOpenChatbot,
}: AuxProps & { tab: string }) {
  // ─── 1. KPI Dashboard View ───
  if (tab === "KPI Dashboard") {
    return (
      <div className="exec-brief-container" style={{ padding: "24px 28px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <div className="exec-eyebrows">
              <span className="exec-pill-blue">EXECUTIVE ANALYTICS</span>
              <span className="exec-pill-green">ALL 6 HOSPITALS</span>
            </div>
            <h1 className="exec-header-title">KPI Dashboard &amp; Scorecard</h1>
            <p className="exec-header-subtitle">
              Multi-dimensional operational, clinical, and financial performance run-rate across all Lifecare healthcare units.
            </p>
          </div>
          <button type="button" className="exec-btn-dark" onClick={() => onOpenChatbot("Analyze recent KPI trends across our 6 hospitals")}>
            Analyze with AI
          </button>
        </div>

        <div className="exec-card-panel" style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, margin: "0 0 14px", color: "#0f172a" }}>
            Operational Health Matrix
          </h3>
          <div className="exec-table-wrap">
            <table className="exec-table">
              <thead>
                <tr>
                  <th>METRIC FAMILY</th>
                  <th>CURRENT (JUL 2026)</th>
                  <th>TARGET</th>
                  <th>VARIANCE</th>
                  <th>STATUS</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Net Operating Revenue</strong></td>
                  <td>KSh 353.4M</td>
                  <td>KSh 358.0M</td>
                  <td>-1.3%</td>
                  <td><span className="exec-pill-status attention">● Variance Watch</span></td>
                </tr>
                <tr>
                  <td><strong>Group EBITDA Margin</strong></td>
                  <td>87.8% (KSh 31.5M)</td>
                  <td>80.2%</td>
                  <td>+7.6 pp</td>
                  <td><span className="exec-pill-status on-target">● On Target</span></td>
                </tr>
                <tr>
                  <td><strong>Hospital Bed Occupancy</strong></td>
                  <td>87.0%</td>
                  <td>90.5%</td>
                  <td>-3.5 pp</td>
                  <td><span className="exec-pill-status attention">● Capacity Alert</span></td>
                </tr>
                <tr>
                  <td><strong>Claim Clean Acceptance Rate</strong></td>
                  <td>96.8%</td>
                  <td>95.0%</td>
                  <td>+1.8 pp</td>
                  <td><span className="exec-pill-status on-target">● Optimal</span></td>
                </tr>
                <tr>
                  <td><strong>Clinical Safety Zero-Harm Score</strong></td>
                  <td>99.4%</td>
                  <td>99.0%</td>
                  <td>+0.4 pp</td>
                  <td><span className="exec-pill-status on-target">● High Reliability</span></td>
                </tr>
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

  // ─── 2. Priority Inbox View (Badge 8) ───
  if (tab === "Priority Inbox") {
    const inboxItems = [
      { id: "in-1", title: "Board Audit & Risk Committee Q3 review pack", level: "Critical", time: "12m ago", sender: "Group CFO", desc: "Awaiting Chairman sign-off on capex variance and revenue reconciliation." },
      { id: "in-2", title: "NHIF Aged Receivables escalation (>60d)", level: "High", time: "45m ago", sender: "Revenue Cycle Lead", desc: "MoH liaison meeting scheduled regarding KSh 14.8M outstanding claims." },
      { id: "in-3", title: "Jubilee & AAR Group Agreement endorsement", level: "High", time: "2h ago", sender: "Legal Head", desc: "Contract ready for signature covering 45,000 corporate lives." },
      { id: "in-4", title: "Eldoret Cath Lab Phase-1 capex proposal", level: "High", time: "3h ago", sender: "DHO Eldoret", desc: "KSh 18.5M cardiac catheterisation laboratory proposal for Q4." },
      { id: "in-5", title: "Medical Director annual performance pool", level: "Medium", time: "5h ago", sender: "HR Head", desc: "KSh 6.2M retention pool benchmarked to zero-harm safety." },
      { id: "in-6", title: "Linac Bunker bunker civil works delay (+12d)", level: "Medium", time: "Yesterday", sender: "Projects Director", desc: "Contingency reserve activated for Kikuyu oncology service line." },
      { id: "in-7", title: "Bungoma regional pathology supply contract", level: "Medium", time: "Yesterday", sender: "Procurement Lead", desc: "Review of vendor sole-source exemption for specialized reagents." },
      { id: "in-8", title: "Quarterly Patient Experience Index (Net: 88)", level: "Low", time: "2d ago", sender: "Clinical Governance", desc: "Patient satisfaction benchmarks up +2.4 points across all 6 facilities." },
    ];

    return (
      <div className="exec-brief-container" style={{ padding: "24px 28px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <div className="exec-eyebrows">
              <span className="exec-pill-blue">DECISION WORKFLOW</span>
              <span className="exec-badge-count">8 Active Items</span>
            </div>
            <h1 className="exec-header-title">Priority Inbox — Executive Escalations</h1>
            <p className="exec-header-subtitle">
              High-priority escalations, statutory reviews, and endorsement items requiring Chairman signoff.
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
                borderLeft: item.level === "Critical" ? "4px solid #dc2626" : item.level === "High" ? "4px solid #f59e0b" : "4px solid #3b82f6",
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

  // ─── 3. Facilities & COEs View ───
  if (tab === "Facilities & COEs") {
    const facilities = [
      { name: "Lifecare Hospital Kikuyu", region: "Region 1 (Central)", coe: "Comprehensive Oncology & Radiation COE", beds: 180, rev: "KSh 62.4M", ebitda: "24.2%" },
      { name: "Lifecare Hospital Meru", region: "Region 1 (Eastern)", coe: "Advanced Orthopedics & Trauma Centre", beds: 95, rev: "KSh 34.8M", ebitda: "21.5%" },
      { name: "Lifecare Hospital Mlolongo", region: "Region 1 (Machakos)", coe: "Rapid Acute Care & Day Surgery Unit", beds: 60, rev: "KSh 21.2M", ebitda: "18.4%" },
      { name: "Lifecare Hospital Bungoma", region: "Region 2 (Western)", coe: "Maternal Health & Neonatal Intensive Care", beds: 75, rev: "KSh 14.5M", ebitda: "19.8%" },
      { name: "Lifecare Hospital Eldoret", region: "Region 2 (North Rift)", coe: "Cardiovascular & Cath Lab COE (In Setup)", beds: 110, rev: "KSh 10.8M", ebitda: "17.2%" },
      { name: "Lifecare Hospital Migori", region: "Region 2 (South Nyanza)", coe: "Cross-Border Community Referral Hub", beds: 45, rev: "KSh 4.5M", ebitda: "16.5%" },
    ];

    return (
      <div className="exec-brief-container" style={{ padding: "24px 28px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <div className="exec-eyebrows">
              <span className="exec-pill-blue">CLINICAL NETWORK</span>
              <span className="exec-pill-green">6 HOSPITALS &amp; SPECIALIZED COES</span>
            </div>
            <h1 className="exec-header-title">Facilities &amp; Centers of Excellence (COEs)</h1>
            <p className="exec-header-subtitle">
              Network infrastructure, specialty service lines, registered bed capacity, and regional leadership.
            </p>
          </div>
          <button type="button" className="exec-btn-primary" onClick={onBackToBrief}>
            ← Back to Morning Brief
          </button>
        </div>

        <div className="exec-facility-grid">
          {facilities.map((f) => (
            <div key={f.name} className="exec-card-panel">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span className="exec-pill-blue" style={{ fontSize: 11 }}>{f.region}</span>
                <span className="exec-margin-pill green">{f.ebitda} Margin</span>
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 800, margin: "0 0 4px", color: "#0f172a" }}>{f.name}</h3>
              <p style={{ fontSize: 12, color: "#2563eb", fontWeight: 700, margin: "0 0 10px" }}>{f.coe}</p>
              <div style={{ fontSize: 12.5, color: "#475569", display: "grid", gap: 4, background: "#f8fafc", padding: "10px 12px", borderRadius: 8 }}>
                <div><strong>Inpatient Capacity:</strong> {f.beds} Registered Beds</div>
                <div><strong>Monthly Net Revenue:</strong> {f.rev}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ─── 4. Board Meetings & Follow... View ───
  if (tab === "Board Meetings") {
    return (
      <div className="exec-brief-container" style={{ padding: "24px 28px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <div className="exec-eyebrows">
              <span className="exec-pill-blue">CORPORATE GOVERNANCE</span>
              <span className="exec-pill-green">Q3 2026 CALENDAR</span>
            </div>
            <h1 className="exec-header-title">Board Meetings &amp; Resolutions Tracker</h1>
            <p className="exec-header-subtitle">
              Executive Board agendas, statutory committee review packs, resolutions, and governance follow-ups.
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
              <tr>
                <td><strong>Board Audit &amp; Risk Committee</strong></td>
                <td>Sep 08, 2026</td>
                <td>Audit Partner</td>
                <td><span className="exec-pill-status attention">Review Pack Ready</span></td>
                <td>Chairman Endorsement Required</td>
              </tr>
              <tr>
                <td><strong>Group Clinical Governance Committee</strong></td>
                <td>Sep 15, 2026</td>
                <td>Chief Clinical Director</td>
                <td><span className="exec-pill-status on-target">Pack Distributed</span></td>
                <td>Review of Zero-Harm Protocol</td>
              </tr>
              <tr>
                <td><strong>Remuneration &amp; Nominations Committee</strong></td>
                <td>Sep 22, 2026</td>
                <td>HR Committee Lead</td>
                <td><span className="exec-pill-status gray">Drafting</span></td>
                <td>Medical Director Incentive Benchmarks</td>
              </tr>
              <tr>
                <td><strong>Full Executive Board Meeting</strong></td>
                <td>Sep 29, 2026</td>
                <td>Executive Chairman</td>
                <td><span className="exec-pill-status gray">Agenda Finalized</span></td>
                <td>Approval of Eldoret Cath Lab Phase-1</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // ─── 5. Project Risk View ───
  if (tab === "Project Risk") {
    return (
      <div className="exec-brief-container" style={{ padding: "24px 28px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <div className="exec-eyebrows">
              <span className="exec-pill-blue">ENTERPRISE RISK MANAGEMENT</span>
              <span className="exec-badge-count">2 High · 4 Medium</span>
            </div>
            <h1 className="exec-header-title">Project Risk &amp; Mitigation Register</h1>
            <p className="exec-header-subtitle">
              Group-wide risk matrix across capital infrastructure, regulatory compliance, clinical safety, and cash liquidity.
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
              <tr>
                <td><strong>Kikuyu Linac Bunker Civil Overrun</strong></td>
                <td>Capital Works</td>
                <td><span className="exec-pill-status" style={{ background: "#fee2e2", color: "#b91c1c" }}>● High</span></td>
                <td>+6.8% variance</td>
                <td>Contingency allowance absorbed; contractor milestone inspected</td>
              </tr>
              <tr>
                <td><strong>Public Scheme NHIF Liquidity Strains</strong></td>
                <td>Financial Cycle</td>
                <td><span className="exec-pill-status" style={{ background: "#fee2e2", color: "#b91c1c" }}>● High</span></td>
                <td>KSh 14.8M (&gt;60d)</td>
                <td>Direct Ministry of Health liaison scheduled for next week</td>
              </tr>
              <tr>
                <td><strong>Western Surgical Theatre Bottlenecks</strong></td>
                <td>Clinical Capacity</td>
                <td><span className="exec-pill-status attention">● Medium</span></td>
                <td>-3.5 pp occupancy</td>
                <td>Dual theatre shifts implemented at Eldoret &amp; Bungoma</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // ─── 6. KPI Explorer View ───
  return (
    <div className="exec-brief-container" style={{ padding: "24px 28px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <div className="exec-eyebrows">
            <span className="exec-pill-blue">MATHEMATICAL AUDIT</span>
            <span className="exec-pill-green">29 DEFINITION FAMILIES</span>
          </div>
          <h1 className="exec-header-title">KPI Explorer — Catalog &amp; Formula Registry</h1>
          <p className="exec-header-subtitle">
            Inspect verified formula calculations, data sources, denominators, and audit trails for leadership indicators.
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
              <th>FORMULA</th>
              <th>CADENCE</th>
              <th>GRAIN</th>
              <th>DATA PROVENANCE</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Group Net Revenue</strong></td>
              <td><code>Sum(gross_billed_revenue) - Sum(contractual_discounts)</code></td>
              <td>Monthly</td>
              <td>Group, Region, Facility</td>
              <td>Verified Billing System</td>
            </tr>
            <tr>
              <td><strong>Group EBITDA Margin</strong></td>
              <td><code>(Operating_Revenue - Operating_Expenses) / Operating_Revenue</code></td>
              <td>Monthly</td>
              <td>Group, Facility</td>
              <td>General Ledger / Audited</td>
            </tr>
            <tr>
              <td><strong>Hospital Bed Occupancy</strong></td>
              <td><code>Total_Inpatient_Days / (Available_Beds * Days_In_Period)</code></td>
              <td>Daily / Monthly</td>
              <td>Facility, Ward</td>
              <td>ADT Admission Records</td>
            </tr>
            <tr>
              <td><strong>Return on Capital (ROCE)</strong></td>
              <td><code>EBIT / (Total_Assets - Current_Liabilities)</code></td>
              <td>Quarterly / FY</td>
              <td>Group</td>
              <td>Corporate Balance Sheet</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
