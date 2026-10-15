/**
 * GENERATED FILE — DO NOT EDIT BY HAND.
 * Produced by scripts/import-workbook.ts from Africare_Group_KPI_Framework.xlsx.
 * Regenerate with: npm run import -- <path-to-xlsx>
 */

import type { RoleKpiAssignment } from "../types.ts";

export const ROLE_KPI_ASSIGNMENTS: readonly RoleKpiAssignment[] = [
  {
    "assignmentId": "chairman:group-net-revenue-vs-approved-budget",
    "sourceRow": 6,
    "level": "Group governance",
    "role": "Chairman",
    "roleId": "chairman",
    "reportsTo": "Board / shareholders",
    "keyDeliverable": "Profitable group growth",
    "kpi": "Group net revenue vs approved budget",
    "definition": "Finance-approved group net revenue for the period divided by the approved budget for the same period.",
    "weight": 0.2,
    "targetBasis": "Board-approved annual and monthly budget",
    "review": "Monthly",
    "primaryDataSource": "Finance ERP / management accounts",
    "keyCollaborator": "Group CFO; Regional COOs",
    "definitionFamilies": [
      "Net revenue"
    ],
    "unresolvedReason": null,
    "catalogId": "RKM-001",
    "domain": "Financial performance",
    "aggType": "sum",
    "unit": "KES",
    "direction": "higher",
    "scopes": [
      "group",
      "region",
      "hospital"
    ],
    "drill": "generic",
    "measureKey": "RKM-001",
    "realNotes": {
      "scope": "Group: Lifecare six + Bliss clinics + Fertility Point (months 2025-07 onward; MAKL and Star excluded)",
      "howComputed": "Gross billed revenue (positive bill lines) per site and month, summed across the group's operating sites. Net (after discounts and credit notes) exists only for Bungoma, Kikuyu, Migori and Mlolongo to 2026-04 and for Bliss and Fertility Point.",
      "gaps": "No approved budget, so no attainment percentage. Billed revenue from billing systems, not Finance-approved net revenue. Latest month partial."
    }
  },
  {
    "assignmentId": "chairman:group-ebitda-vs-approved-budget",
    "sourceRow": 7,
    "level": "Group governance",
    "role": "Chairman",
    "roleId": "chairman",
    "reportsTo": "Board / shareholders",
    "keyDeliverable": "Profitable group growth",
    "kpi": "Group EBITDA vs approved budget",
    "definition": "Finance-approved group EBITDA compared with approved budget, using one group accounting definition.",
    "weight": 0.2,
    "targetBasis": "Board-approved EBITDA plan",
    "review": "Monthly",
    "primaryDataSource": "Finance ERP / management accounts",
    "keyCollaborator": "Group CFO; Regional COOs",
    "definitionFamilies": [
      "EBITDA"
    ],
    "unresolvedReason": null,
    "catalogId": "RKM-002",
    "domain": "Financial performance",
    "aggType": "ratio",
    "unit": "percent",
    "direction": "higher",
    "scopes": [
      "group",
      "region",
      "hospital"
    ],
    "drill": "generic",
    "measureKey": "RKM-002",
    "realNotes": {
      "scope": "",
      "howComputed": "",
      "gaps": "Needs Finance ERP / management accounts (EBITDA, costs)."
    }
  },
  {
    "assignmentId": "chairman:operating-cash-flow-and-working-capital-vs-plan",
    "sourceRow": 8,
    "level": "Group governance",
    "role": "Chairman",
    "roleId": "chairman",
    "reportsTo": "Board / shareholders",
    "keyDeliverable": "Financial sustainability",
    "kpi": "Operating cash flow and working capital vs plan",
    "definition": "Operating cash flow and working-capital position compared with the approved cash plan.",
    "weight": 0.15,
    "targetBasis": "Board-approved cash-flow plan",
    "review": "Monthly",
    "primaryDataSource": "Treasury / finance ERP",
    "keyCollaborator": "Group CFO; Billing & Revenue Leads",
    "definitionFamilies": [
      "Operating cash flow"
    ],
    "unresolvedReason": null,
    "catalogId": "RKM-003",
    "domain": "Financial performance",
    "aggType": "ratio",
    "unit": "percent",
    "direction": "higher",
    "scopes": [
      "group",
      "region",
      "hospital"
    ],
    "drill": "generic",
    "measureKey": "RKM-003",
    "realNotes": {
      "scope": "",
      "howComputed": "",
      "gaps": "Needs treasury / finance ERP cash-flow and working-capital data."
    }
  },
  {
    "assignmentId": "chairman:group-clinical-quality-and-safety-index",
    "sourceRow": 9,
    "level": "Group governance",
    "role": "Chairman",
    "roleId": "chairman",
    "reportsTo": "Board / shareholders",
    "keyDeliverable": "Safe, effective clinical care",
    "kpi": "Group clinical quality and safety index",
    "definition": "Approved clinical-quality composite, reported with its approved component definitions and risk adjustment where applicable.",
    "weight": 0.15,
    "targetBasis": "Board-approved clinical quality plan",
    "review": "Monthly",
    "primaryDataSource": "Quality system / HIS / clinical audit",
    "keyCollaborator": "Chief / Group Clinical Medical Director",
    "definitionFamilies": [
      "Clinical quality scorecard"
    ],
    "unresolvedReason": null,
    "catalogId": "RKM-004",
    "domain": "Clinical quality",
    "aggType": "average",
    "unit": "score",
    "direction": "higher",
    "scopes": [
      "group",
      "region",
      "hospital"
    ],
    "drill": "generic",
    "measureKey": "RKM-004",
    "realNotes": {
      "scope": "",
      "howComputed": "",
      "gaps": "Needs a clinical quality system / clinical audit data."
    }
  },
  {
    "assignmentId": "chairman:group-patient-experience-index",
    "sourceRow": 10,
    "level": "Group governance",
    "role": "Chairman",
    "roleId": "chairman",
    "reportsTo": "Board / shareholders",
    "keyDeliverable": "Patient-centred care",
    "kpi": "Group patient experience index",
    "definition": "Approved patient-experience survey composite for hospitals and clinics, with response-rate context.",
    "weight": 0.1,
    "targetBasis": "Annual patient-experience plan",
    "review": "Monthly",
    "primaryDataSource": "Patient feedback platform / complaint register",
    "keyCollaborator": "Regional COOs; DHOs",
    "definitionFamilies": [
      "Patient experience"
    ],
    "unresolvedReason": null,
    "catalogId": "RKM-005",
    "domain": "Patient experience",
    "aggType": "average",
    "unit": "score",
    "direction": "higher",
    "scopes": [
      "group",
      "region",
      "hospital"
    ],
    "drill": "generic",
    "measureKey": "RKM-005",
    "realNotes": {
      "scope": "",
      "howComputed": "",
      "gaps": "Needs a patient feedback platform / complaint register."
    }
  },
  {
    "assignmentId": "chairman:coe-corporate-and-expansion-milestones",
    "sourceRow": 11,
    "level": "Group governance",
    "role": "Chairman",
    "roleId": "chairman",
    "reportsTo": "Board / shareholders",
    "keyDeliverable": "Strategic growth",
    "kpi": "COE, corporate and expansion milestones",
    "definition": "Share of Board-approved growth milestones completed on time and to approved financial and clinical cases.",
    "weight": 0.1,
    "targetBasis": "Board-approved strategic plan",
    "review": "Monthly",
    "primaryDataSource": "Strategy tracker / finance / CRM",
    "keyCollaborator": "Clinical Medical Director; Corporate Revenue & Insurance Lead",
    "definitionFamilies": [
      "COE contribution",
      "Contract utilisation"
    ],
    "unresolvedReason": null,
    "catalogId": "RKM-006",
    "domain": "Commercial growth",
    "aggType": "ratio",
    "unit": "percent",
    "direction": "higher",
    "scopes": [
      "group",
      "region",
      "hospital"
    ],
    "drill": "generic",
    "measureKey": "RKM-006",
    "realNotes": {
      "scope": "",
      "howComputed": "",
      "gaps": "Needs a strategy / milestone tracker."
    }
  },
  {
    "assignmentId": "chairman:critical-governance-legal-and-audit-actions-closed",
    "sourceRow": 12,
    "level": "Group governance",
    "role": "Chairman",
    "roleId": "chairman",
    "reportsTo": "Board / shareholders",
    "keyDeliverable": "Governance and resilience",
    "kpi": "Critical governance, legal and audit actions closed",
    "definition": "Critical actions closed by the agreed due date divided by critical actions due in the period.",
    "weight": 0.1,
    "targetBasis": "Board governance calendar",
    "review": "Monthly",
    "primaryDataSource": "Governance tracker / legal register / audit tracker",
    "keyCollaborator": "Legal Head; Group CFO; HR Head",
    "definitionFamilies": [
      "Legal and compliance closure"
    ],
    "unresolvedReason": null,
    "catalogId": "RKM-007",
    "domain": "Governance & data",
    "aggType": "ratio",
    "unit": "percent",
    "direction": "higher",
    "scopes": [
      "group",
      "region",
      "hospital"
    ],
    "drill": "generic",
    "measureKey": "RKM-007",
    "realNotes": {
      "scope": "",
      "howComputed": "",
      "gaps": "Needs governance, legal and audit action trackers."
    }
  },
  {
    "assignmentId": "clinical-director:clinical-quality-scorecard",
    "sourceRow": 13,
    "level": "Group clinical leadership",
    "role": "Chief / Group Clinical Medical Director",
    "roleId": "clinical-director",
    "reportsTo": "Chairman",
    "keyDeliverable": "Clinical governance",
    "kpi": "Clinical quality scorecard",
    "definition": "Approved clinical-quality composite across the group, using documented indicators and valid denominators.",
    "weight": 0.2,
    "targetBasis": "Approved annual clinical-quality plan",
    "review": "Monthly",
    "primaryDataSource": "Quality system / HIS / clinical audit",
    "keyCollaborator": "Regional COOs; CoE Leads",
    "definitionFamilies": [
      "Clinical quality scorecard"
    ],
    "unresolvedReason": null,
    "catalogId": "RKM-008",
    "domain": "Clinical quality",
    "aggType": "ratio",
    "unit": "percent",
    "direction": "higher",
    "scopes": [
      "group",
      "region",
      "hospital"
    ],
    "drill": "generic",
    "measureKey": "RKM-008",
    "realNotes": {
      "scope": "",
      "howComputed": "",
      "gaps": "Needs a clinical quality system / clinical audit data."
    }
  },
  {
    "assignmentId": "clinical-director:serious-adverse-event-rate-and-review-closure",
    "sourceRow": 14,
    "level": "Group clinical leadership",
    "role": "Chief / Group Clinical Medical Director",
    "roleId": "clinical-director",
    "reportsTo": "Chairman",
    "keyDeliverable": "Clinical safety",
    "kpi": "Serious adverse-event rate and review closure",
    "definition": "Risk-adjusted serious adverse events, together with completion of required reviews and corrective actions.",
    "weight": 0.15,
    "targetBasis": "Clinical governance plan and approved thresholds",
    "review": "Monthly",
    "primaryDataSource": "Incident reporting system / quality register",
    "keyCollaborator": "DHOs; CoE Leads",
    "definitionFamilies": [
      "Serious adverse events"
    ],
    "unresolvedReason": null,
    "catalogId": "RKM-009",
    "domain": "Clinical quality",
    "aggType": "ratio",
    "unit": "percent",
    "direction": "higher",
    "scopes": [
      "group",
      "region",
      "hospital"
    ],
    "drill": "generic",
    "measureKey": "RKM-009",
    "realNotes": {
      "scope": "",
      "howComputed": "",
      "gaps": "Needs an incident reporting system."
    }
  },
  {
    "assignmentId": "clinical-director:protocol-compliance-and-critical-audit-closure",
    "sourceRow": 15,
    "level": "Group clinical leadership",
    "role": "Chief / Group Clinical Medical Director",
    "roleId": "clinical-director",
    "reportsTo": "Chairman",
    "keyDeliverable": "Standardised practice",
    "kpi": "Protocol compliance and critical audit closure",
    "definition": "Compliance with approved protocols and clinical-audit critical actions closed by due date.",
    "weight": 0.15,
    "targetBasis": "Approved protocol and audit plan",
    "review": "Monthly",
    "primaryDataSource": "Clinical audit / quality system",
    "keyCollaborator": "CoE Leads; DHOs",
    "definitionFamilies": [
      "Protocol compliance"
    ],
    "unresolvedReason": null,
    "catalogId": "RKM-010",
    "domain": "Clinical quality",
    "aggType": "ratio",
    "unit": "percent",
    "direction": "higher",
    "scopes": [
      "group",
      "region",
      "hospital"
    ],
    "drill": "generic",
    "measureKey": "RKM-010",
    "realNotes": {
      "scope": "",
      "howComputed": "",
      "gaps": "Needs a clinical audit system."
    }
  },
  {
    "assignmentId": "clinical-director:clinical-patient-experience-score",
    "sourceRow": 16,
    "level": "Group clinical leadership",
    "role": "Chief / Group Clinical Medical Director",
    "roleId": "clinical-director",
    "reportsTo": "Chairman",
    "keyDeliverable": "Clinical patient experience",
    "kpi": "Clinical patient experience score",
    "definition": "Approved clinical-care experience score, reported with response rate and service-line context.",
    "weight": 0.1,
    "targetBasis": "Annual patient-experience plan",
    "review": "Monthly",
    "primaryDataSource": "Patient feedback platform",
    "keyCollaborator": "Regional COOs; DHOs",
    "definitionFamilies": [
      "Patient experience"
    ],
    "unresolvedReason": null,
    "catalogId": "RKM-011",
    "domain": "Patient experience",
    "aggType": "average",
    "unit": "score",
    "direction": "higher",
    "scopes": [
      "group",
      "region",
      "hospital"
    ],
    "drill": "generic",
    "measureKey": "RKM-011",
    "realNotes": {
      "scope": "",
      "howComputed": "",
      "gaps": "Needs a patient feedback platform."
    }
  },
  {
    "assignmentId": "clinical-director:medical-credentialing-and-capability-completion",
    "sourceRow": 17,
    "level": "Group clinical leadership",
    "role": "Chief / Group Clinical Medical Director",
    "roleId": "clinical-director",
    "reportsTo": "Chairman",
    "keyDeliverable": "Medical capability",
    "kpi": "Medical credentialing and capability completion",
    "definition": "Required medical staff with current credentials and completed competency requirements divided by total required staff.",
    "weight": 0.1,
    "targetBasis": "Medical workforce and credentialing plan",
    "review": "Monthly",
    "primaryDataSource": "Medical affairs / HRIS",
    "keyCollaborator": "HR Head; People Executives",
    "definitionFamilies": [
      "Mandatory learning / credentialing"
    ],
    "unresolvedReason": null,
    "catalogId": "RKM-012",
    "domain": "People",
    "aggType": "ratio",
    "unit": "percent",
    "direction": "higher",
    "scopes": [
      "group",
      "region",
      "hospital"
    ],
    "drill": "generic",
    "measureKey": "RKM-012",
    "realNotes": {
      "scope": "",
      "howComputed": "",
      "gaps": "Needs medical affairs / HRIS credentialing data."
    }
  },
  {
    "assignmentId": "clinical-director:coe-revenue-and-contribution-vs-plan",
    "sourceRow": 18,
    "level": "Group clinical leadership",
    "role": "Chief / Group Clinical Medical Director",
    "roleId": "clinical-director",
    "reportsTo": "Chairman",
    "keyDeliverable": "Centres of Excellence",
    "kpi": "COE revenue and contribution vs plan",
    "definition": "Finance-approved revenue and contribution from Board-approved COE programmes compared with plan.",
    "weight": 0.12,
    "targetBasis": "Approved COE business plan",
    "review": "Monthly",
    "primaryDataSource": "Finance ERP / HIS",
    "keyCollaborator": "CoE Leads; Group CFO",
    "definitionFamilies": [
      "COE contribution"
    ],
    "unresolvedReason": null,
    "catalogId": "RKM-013",
    "domain": "Commercial growth",
    "aggType": "sum",
    "unit": "KES",
    "direction": "higher",
    "scopes": [
      "group",
      "region",
      "hospital"
    ],
    "drill": "generic",
    "measureKey": "RKM-013",
    "realNotes": {
      "scope": "Fertility Point sites (Upper Hill, Parklands, Kisumu, Mombasa) used as the centre of excellence",
      "howComputed": "Net billed revenue (all lines, including negative credit lines) of the Fertility Point centres per month.",
      "gaps": "No approved COE plan, no cost or contribution data, and other COEs cannot be identified in the data. Billed revenue, not Finance-approved. Months 2025-01 onward."
    }
  },
  {
    "assignmentId": "clinical-director:clinical-propositions-converted-to-revenue",
    "sourceRow": 19,
    "level": "Group clinical leadership",
    "role": "Chief / Group Clinical Medical Director",
    "roleId": "clinical-director",
    "reportsTo": "Chairman",
    "keyDeliverable": "Corporate and insurer solutions",
    "kpi": "Clinical propositions converted to revenue",
    "definition": "Approved corporate or insurer clinical propositions launched and generating revenue compared with plan.",
    "weight": 0.1,
    "targetBasis": "Corporate and insurer growth plan",
    "review": "Monthly",
    "primaryDataSource": "CRM / contract register / finance",
    "keyCollaborator": "Corporate Revenue & Insurance Lead",
    "definitionFamilies": [
      "New business revenue",
      "Qualified pipeline"
    ],
    "unresolvedReason": null,
    "catalogId": "RKM-014",
    "domain": "Commercial growth",
    "aggType": "sum",
    "unit": "KES",
    "direction": "higher",
    "scopes": [
      "group",
      "region",
      "hospital"
    ],
    "drill": "generic",
    "measureKey": "RKM-014",
    "realNotes": {
      "scope": "",
      "howComputed": "",
      "gaps": "Needs a CRM / contract register of clinical propositions."
    }
  },
  {
    "assignmentId": "clinical-director:priority-care-referral-conversion",
    "sourceRow": 20,
    "level": "Group clinical leadership",
    "role": "Chief / Group Clinical Medical Director",
    "roleId": "clinical-director",
    "reportsTo": "Chairman",
    "keyDeliverable": "Continuum of care",
    "kpi": "Priority-care referral conversion",
    "definition": "Eligible internal or external referrals completing the intended consultation, admission or procedure divided by eligible referrals.",
    "weight": 0.08,
    "targetBasis": "Service-line growth plan",
    "review": "Monthly",
    "primaryDataSource": "HIS / referral tracker",
    "keyCollaborator": "Regional COOs; DHOs",
    "definitionFamilies": [
      "Referral conversion"
    ],
    "unresolvedReason": null,
    "catalogId": "RKM-015",
    "domain": "Capacity & throughput",
    "aggType": "ratio",
    "unit": "percent",
    "direction": "higher",
    "scopes": [
      "group",
      "region",
      "hospital"
    ],
    "drill": "generic",
    "measureKey": "RKM-015",
    "realNotes": {
      "scope": "",
      "howComputed": "",
      "gaps": "Needs a referral tracker (eligible referrals and completion)."
    }
  },
  {
    "assignmentId": "regional-coo:regional-net-revenue-vs-approved-budget",
    "sourceRow": 21,
    "level": "Regional management",
    "role": "Regional COO",
    "roleId": "regional-coo",
    "reportsTo": "Chairman",
    "keyDeliverable": "Regional financial performance",
    "kpi": "Regional net revenue vs approved budget",
    "definition": "Finance-approved regional net revenue compared with the approved budget for the period.",
    "weight": 0.15,
    "targetBasis": "Approved regional monthly budget",
    "review": "Monthly",
    "primaryDataSource": "Finance ERP / management accounts",
    "keyCollaborator": "DHOs; Group CFO",
    "definitionFamilies": [
      "Net revenue"
    ],
    "unresolvedReason": null,
    "catalogId": "RKM-016",
    "domain": "Financial performance",
    "aggType": "sum",
    "unit": "KES",
    "direction": "higher",
    "scopes": [
      "group",
      "region",
      "hospital"
    ],
    "drill": "generic",
    "measureKey": "RKM-016",
    "realNotes": {
      "scope": "the six Lifecare hospitals (each its own region), months 2025-01 onward",
      "howComputed": "Gross billed revenue (positive bill lines) of the hospital per month. Net after discounts is available for Bungoma, Kikuyu, Migori and Mlolongo to 2026-04 only.",
      "gaps": "No approved regional budget, so no attainment percentage. Billed revenue, not Finance-approved net revenue. Latest month partial."
    }
  },
  {
    "assignmentId": "regional-coo:regional-ebitda-vs-approved-budget",
    "sourceRow": 22,
    "level": "Regional management",
    "role": "Regional COO",
    "roleId": "regional-coo",
    "reportsTo": "Chairman",
    "keyDeliverable": "Regional financial performance",
    "kpi": "Regional EBITDA vs approved budget",
    "definition": "Finance-approved regional EBITDA compared with the approved budget for the period.",
    "weight": 0.15,
    "targetBasis": "Approved regional monthly budget",
    "review": "Monthly",
    "primaryDataSource": "Finance ERP / management accounts",
    "keyCollaborator": "DHOs; Group CFO",
    "definitionFamilies": [
      "EBITDA"
    ],
    "unresolvedReason": null,
    "catalogId": "RKM-017",
    "domain": "Financial performance",
    "aggType": "ratio",
    "unit": "percent",
    "direction": "higher",
    "scopes": [
      "group",
      "region",
      "hospital"
    ],
    "drill": "generic",
    "measureKey": "RKM-017",
    "realNotes": {
      "scope": "",
      "howComputed": "",
      "gaps": "Needs Finance ERP / management accounts (EBITDA)."
    }
  },
  {
    "assignmentId": "regional-coo:hospital-and-clinic-capacity-utilisation",
    "sourceRow": 23,
    "level": "Regional management",
    "role": "Regional COO",
    "roleId": "regional-coo",
    "reportsTo": "Chairman",
    "keyDeliverable": "Capacity and throughput",
    "kpi": "Hospital and clinic capacity utilisation",
    "definition": "Service-line utilisation using staffed bed days, appointment slots, equipment hours or other approved capacity denominators; do not aggregate unlike units.",
    "weight": 0.1,
    "targetBasis": "Approved capacity plan by service line",
    "review": "Monthly",
    "primaryDataSource": "HIS / scheduling / equipment logs",
    "keyCollaborator": "DHOs",
    "definitionFamilies": [
      "Capacity utilisation"
    ],
    "unresolvedReason": null,
    "catalogId": "RKM-018",
    "domain": "Capacity & throughput",
    "aggType": "ratio",
    "unit": "percent",
    "direction": "higher",
    "scopes": [
      "group",
      "region",
      "hospital"
    ],
    "drill": "full",
    "measureKey": "bed-occupancy",
    "realNotes": {
      "scope": "the six Lifecare hospitals (each its own region), months 2023-03 onward (Mlolongo from 2025-04)",
      "howComputed": "Occupied bed-days (midnights in overnight wards) per hospital and month, from the inpatient census.",
      "gaps": "Utilisation percent needs bed capacity or staffed-bed data, which exists nowhere in the data, so only the numerator is available. Outpatient, theatre and equipment capacity also missing."
    }
  },
  {
    "assignmentId": "regional-coo:patient-volume-and-referral-conversion",
    "sourceRow": 24,
    "level": "Regional management",
    "role": "Regional COO",
    "roleId": "regional-coo",
    "reportsTo": "Chairman",
    "keyDeliverable": "Demand and continuity",
    "kpi": "Patient volume and referral conversion",
    "definition": "Patient volume compared with plan and eligible referrals completing the intended next service divided by eligible referrals.",
    "weight": 0.1,
    "targetBasis": "Regional volume and referral plan",
    "review": "Monthly",
    "primaryDataSource": "HIS / referral tracker",
    "keyCollaborator": "DHOs; Business Development Leads",
    "definitionFamilies": [
      "Referral conversion"
    ],
    "unresolvedReason": null,
    "catalogId": "RKM-019",
    "domain": "Capacity & throughput",
    "aggType": "count",
    "unit": "count",
    "direction": "higher",
    "scopes": [
      "group",
      "region",
      "hospital"
    ],
    "drill": "generic",
    "measureKey": "RKM-019",
    "realNotes": {
      "scope": "the six Lifecare hospitals (each its own region), months 2025-01 onward",
      "howComputed": "Distinct visits billed per hospital and month (outpatient and inpatient).",
      "gaps": "Volume against plan needs a volume plan (none). Referral conversion needs a referral tracker (none)."
    }
  },
  {
    "assignmentId": "regional-coo:collections-and-dso-vs-plan",
    "sourceRow": 25,
    "level": "Regional management",
    "role": "Regional COO",
    "roleId": "regional-coo",
    "reportsTo": "Chairman",
    "keyDeliverable": "Cash conversion",
    "kpi": "Collections and DSO vs plan",
    "definition": "Cash collections versus plan and debtor days using the group-approved DSO calculation.",
    "weight": 0.12,
    "targetBasis": "Approved cash and collections plan",
    "review": "Monthly",
    "primaryDataSource": "Billing system / finance ERP",
    "keyCollaborator": "Billing & Revenue Leads; Group CFO",
    "definitionFamilies": [
      "Collections"
    ],
    "unresolvedReason": null,
    "catalogId": "RKM-020",
    "domain": "Collections & receivables",
    "aggType": "sum",
    "unit": "KES",
    "direction": "higher",
    "scopes": [
      "group",
      "region",
      "hospital"
    ],
    "drill": "generic",
    "measureKey": "RKM-020",
    "realNotes": {
      "scope": "the six Lifecare hospitals (each its own region), months 2025-02 to 2026-03 (Bungoma gap months left out)",
      "howComputed": "Cash received through the claims portal (paid amount by remittance month) per hospital.",
      "gaps": "Portal claims only: not total collections (cash, direct insurers and MAKL are missing). No collections plan. DSO is a separate claims-only proxy (M25, as-of 2026-05)."
    }
  },
  {
    "assignmentId": "regional-coo:claim-clean-rate-and-denial-value",
    "sourceRow": 26,
    "level": "Regional management",
    "role": "Regional COO",
    "roleId": "regional-coo",
    "reportsTo": "Chairman",
    "keyDeliverable": "Revenue-cycle discipline",
    "kpi": "Claim clean rate and denial value",
    "definition": "First-pass accepted claims divided by submitted claims, and rejected or denied claim value divided by submitted claim value.",
    "weight": 0.1,
    "targetBasis": "Approved revenue-cycle targets",
    "review": "Monthly",
    "primaryDataSource": "Billing / payer portals",
    "keyCollaborator": "Billing & Revenue Leads",
    "definitionFamilies": [
      "First-pass claim acceptance",
      "Denied or rejected claim value"
    ],
    "unresolvedReason": null,
    "catalogId": "RKM-021",
    "domain": "Claims & payers",
    "aggType": "ratio",
    "unit": "percent",
    "direction": "higher",
    "scopes": [
      "group",
      "region",
      "hospital"
    ],
    "drill": "generic",
    "measureKey": "RKM-021",
    "realNotes": {
      "scope": "the six Lifecare hospitals (each its own region), submission months 2025-01 to 2026-05",
      "howComputed": "Claims accepted (Approved or Paid) with no rework or resubmission divided by claims that have had an outcome, per hospital and submission month; rejected value share shown as supporting.",
      "gaps": "Portal claims only. Rework is inferred from the current status and repeated invoice numbers, so first-pass is likely overstated. Bungoma 2025-07..2026-04 missing. Recent cohorts immature (see decided share)."
    }
  },
  {
    "assignmentId": "regional-coo:patient-experience-and-capa-closure",
    "sourceRow": 27,
    "level": "Regional management",
    "role": "Regional COO",
    "roleId": "regional-coo",
    "reportsTo": "Chairman",
    "keyDeliverable": "Patient-centred operations",
    "kpi": "Patient experience and CAPA closure",
    "definition": "Approved patient-experience score and complaints or adverse feedback corrective actions closed by due date.",
    "weight": 0.1,
    "targetBasis": "Annual patient-experience and quality plan",
    "review": "Monthly",
    "primaryDataSource": "Feedback platform / complaint register",
    "keyCollaborator": "DHOs",
    "definitionFamilies": [
      "Patient experience"
    ],
    "unresolvedReason": null,
    "catalogId": "RKM-022",
    "domain": "Patient experience",
    "aggType": "ratio",
    "unit": "percent",
    "direction": "higher",
    "scopes": [
      "group",
      "region",
      "hospital"
    ],
    "drill": "generic",
    "measureKey": "RKM-022",
    "realNotes": {
      "scope": "",
      "howComputed": "",
      "gaps": "Needs a patient feedback platform / complaint register."
    }
  },
  {
    "assignmentId": "regional-coo:engagement-and-critical-role-retention",
    "sourceRow": 28,
    "level": "Regional management",
    "role": "Regional COO",
    "roleId": "regional-coo",
    "reportsTo": "Chairman",
    "keyDeliverable": "People performance",
    "kpi": "Engagement and critical-role retention",
    "definition": "Approved engagement score and retention of designated critical roles, reported by hospital.",
    "weight": 0.08,
    "targetBasis": "Regional people plan",
    "review": "Monthly",
    "primaryDataSource": "HRIS / engagement survey",
    "keyCollaborator": "People Executives; HR Head",
    "definitionFamilies": [
      "Engagement"
    ],
    "unresolvedReason": null,
    "catalogId": "RKM-023",
    "domain": "People",
    "aggType": "ratio",
    "unit": "percent",
    "direction": "higher",
    "scopes": [
      "group",
      "region",
      "hospital"
    ],
    "drill": "generic",
    "measureKey": "RKM-023",
    "realNotes": {
      "scope": "",
      "howComputed": "",
      "gaps": "Needs HRIS / engagement survey data (payroll is one snapshot with no exits)."
    }
  },
  {
    "assignmentId": "regional-coo:new-service-coe-and-corporate-revenue-vs-plan",
    "sourceRow": 29,
    "level": "Regional management",
    "role": "Regional COO",
    "roleId": "regional-coo",
    "reportsTo": "Chairman",
    "keyDeliverable": "Growth initiatives",
    "kpi": "New service, COE and corporate revenue vs plan",
    "definition": "Finance-approved revenue from approved new services, COE programmes and corporate channels versus plan.",
    "weight": 0.1,
    "targetBasis": "Regional growth plan",
    "review": "Monthly",
    "primaryDataSource": "Finance ERP / CRM / HIS",
    "keyCollaborator": "DHOs; Clinical Medical Director",
    "definitionFamilies": [
      "New business revenue",
      "COE contribution"
    ],
    "unresolvedReason": null,
    "catalogId": "RKM-024",
    "domain": "Commercial growth",
    "aggType": "sum",
    "unit": "KES",
    "direction": "higher",
    "scopes": [
      "group",
      "region",
      "hospital"
    ],
    "drill": "generic",
    "measureKey": "RKM-024",
    "realNotes": {
      "scope": "the six Lifecare hospitals (each its own region), months 2025-01 onward",
      "howComputed": "Gross billed revenue from the Corporate & insurer payer group (corporate, insurer and parastatal accounts) per hospital and month.",
      "gaps": "New services and COE revenue are not separable at hospital level and there is no plan, so this covers the corporate channel only."
    }
  },
  {
    "assignmentId": "hospital-dho:hospital-net-revenue-vs-approved-budget",
    "sourceRow": 30,
    "level": "Hospital leadership",
    "role": "Hospital DHO",
    "roleId": "hospital-dho",
    "reportsTo": "Regional COO",
    "keyDeliverable": "Facility financial performance",
    "kpi": "Hospital net revenue vs approved budget",
    "definition": "Finance-approved hospital net revenue compared with approved budget for the period.",
    "weight": 0.15,
    "targetBasis": "Approved hospital monthly budget",
    "review": "Monthly",
    "primaryDataSource": "Finance ERP / management accounts",
    "keyCollaborator": "Billing & Revenue Lead; Business Development Lead",
    "definitionFamilies": [
      "Net revenue"
    ],
    "unresolvedReason": null,
    "catalogId": "RKM-025",
    "domain": "Financial performance",
    "aggType": "sum",
    "unit": "KES",
    "direction": "higher",
    "scopes": [
      "group",
      "region",
      "hospital"
    ],
    "drill": "generic",
    "measureKey": "RKM-025",
    "realNotes": {
      "scope": "the six Lifecare hospitals (each its own region), months 2025-01 onward",
      "howComputed": "Gross billed revenue (positive bill lines) of the hospital per month; net where discounts are recorded (four hospitals to 2026-04).",
      "gaps": "No approved hospital budget, so no attainment percentage. Billed revenue, not Finance-approved net revenue. Latest month partial."
    }
  },
  {
    "assignmentId": "hospital-dho:hospital-ebitda-vs-approved-budget",
    "sourceRow": 31,
    "level": "Hospital leadership",
    "role": "Hospital DHO",
    "roleId": "hospital-dho",
    "reportsTo": "Regional COO",
    "keyDeliverable": "Facility financial performance",
    "kpi": "Hospital EBITDA vs approved budget",
    "definition": "Finance-approved hospital EBITDA compared with approved budget for the period.",
    "weight": 0.12,
    "targetBasis": "Approved hospital monthly budget",
    "review": "Monthly",
    "primaryDataSource": "Finance ERP / management accounts",
    "keyCollaborator": "Regional COO; Group CFO",
    "definitionFamilies": [
      "EBITDA"
    ],
    "unresolvedReason": null,
    "catalogId": "RKM-026",
    "domain": "Financial performance",
    "aggType": "ratio",
    "unit": "percent",
    "direction": "higher",
    "scopes": [
      "group",
      "region",
      "hospital"
    ],
    "drill": "generic",
    "measureKey": "RKM-026",
    "realNotes": {
      "scope": "",
      "howComputed": "",
      "gaps": "Needs Finance ERP / management accounts (EBITDA)."
    }
  },
  {
    "assignmentId": "hospital-dho:capacity-utilisation-and-patient-throughput",
    "sourceRow": 32,
    "level": "Hospital leadership",
    "role": "Hospital DHO",
    "roleId": "hospital-dho",
    "reportsTo": "Regional COO",
    "keyDeliverable": "Capacity and operations",
    "kpi": "Capacity utilisation and patient throughput",
    "definition": "Service-line utilisation against approved capacity and completed patient throughput versus plan, using consistent local definitions.",
    "weight": 0.12,
    "targetBasis": "Hospital capacity and volume plan",
    "review": "Monthly",
    "primaryDataSource": "HIS / scheduling / equipment logs",
    "keyCollaborator": "Service Heads",
    "definitionFamilies": [
      "Capacity utilisation"
    ],
    "unresolvedReason": null,
    "catalogId": "RKM-027",
    "domain": "Capacity & throughput",
    "aggType": "ratio",
    "unit": "percent",
    "direction": "higher",
    "scopes": [
      "group",
      "region",
      "hospital"
    ],
    "drill": "full",
    "measureKey": "bed-occupancy",
    "realNotes": {
      "scope": "the six Lifecare hospitals (each its own region), months 2025-01 onward",
      "howComputed": "Patient throughput as distinct visits billed per hospital and month; inpatient admissions, length of stay and occupied bed-days are supporting.",
      "gaps": "Capacity utilisation needs bed capacity (none). No capacity or volume plan."
    }
  },
  {
    "assignmentId": "hospital-dho:referral-conversion-and-new-service-revenue",
    "sourceRow": 33,
    "level": "Hospital leadership",
    "role": "Hospital DHO",
    "roleId": "hospital-dho",
    "reportsTo": "Regional COO",
    "keyDeliverable": "Growth and referrals",
    "kpi": "Referral conversion and new service revenue",
    "definition": "Eligible referrals completing the intended service divided by eligible referrals, plus net revenue from approved new services.",
    "weight": 0.1,
    "targetBasis": "Hospital growth plan",
    "review": "Monthly",
    "primaryDataSource": "HIS / CRM / finance",
    "keyCollaborator": "Business Development Lead; Clinical Leads",
    "definitionFamilies": [
      "Referral conversion"
    ],
    "unresolvedReason": null,
    "catalogId": "RKM-028",
    "domain": "Capacity & throughput",
    "aggType": "sum",
    "unit": "KES",
    "direction": "higher",
    "scopes": [
      "group",
      "region",
      "hospital"
    ],
    "drill": "generic",
    "measureKey": "RKM-028",
    "realNotes": {
      "scope": "",
      "howComputed": "",
      "gaps": "Needs a referral tracker and new-service revenue tagging."
    }
  },
  {
    "assignmentId": "hospital-dho:patient-experience-and-complaint-capa-closure",
    "sourceRow": 34,
    "level": "Hospital leadership",
    "role": "Hospital DHO",
    "roleId": "hospital-dho",
    "reportsTo": "Regional COO",
    "keyDeliverable": "Patient experience",
    "kpi": "Patient experience and complaint CAPA closure",
    "definition": "Approved non-clinical patient-experience score and complaints or adverse feedback actions closed by due date.",
    "weight": 0.1,
    "targetBasis": "Annual patient-experience plan",
    "review": "Monthly",
    "primaryDataSource": "Feedback platform / complaint register",
    "keyCollaborator": "Facility team; Regional COO",
    "definitionFamilies": [
      "Patient experience"
    ],
    "unresolvedReason": null,
    "catalogId": "RKM-029",
    "domain": "Patient experience",
    "aggType": "ratio",
    "unit": "percent",
    "direction": "higher",
    "scopes": [
      "group",
      "region",
      "hospital"
    ],
    "drill": "generic",
    "measureKey": "RKM-029",
    "realNotes": {
      "scope": "",
      "howComputed": "",
      "gaps": "Needs a patient feedback platform / complaint register."
    }
  },
  {
    "assignmentId": "hospital-dho:collections-dso-and-unbilled-revenue",
    "sourceRow": 35,
    "level": "Hospital leadership",
    "role": "Hospital DHO",
    "roleId": "hospital-dho",
    "reportsTo": "Regional COO",
    "keyDeliverable": "Cash conversion",
    "kpi": "Collections, DSO and unbilled revenue",
    "definition": "Cash collections versus plan, debtor days and completed services not yet billed, using group-approved definitions.",
    "weight": 0.12,
    "targetBasis": "Hospital cash and collections plan",
    "review": "Monthly",
    "primaryDataSource": "Billing system / finance ERP",
    "keyCollaborator": "Billing & Revenue Lead",
    "definitionFamilies": [
      "Collections"
    ],
    "unresolvedReason": null,
    "catalogId": "RKM-030",
    "domain": "Collections & receivables",
    "aggType": "sum",
    "unit": "KES",
    "direction": "higher",
    "scopes": [
      "group",
      "region",
      "hospital"
    ],
    "drill": "generic",
    "measureKey": "RKM-030",
    "realNotes": {
      "scope": "the six Lifecare hospitals (each its own region), months 2025-02 to 2026-03",
      "howComputed": "Cash received through the claims portal per hospital and month; claims DSO proxy and the share of discharged inpatients with no billing line are supporting.",
      "gaps": "Portal claims only, no collections plan, DSO is claims-only and as-of a single date, and the unbilled measure counts visits, not value."
    }
  },
  {
    "assignmentId": "hospital-dho:claim-first-pass-acceptance-and-rejection-value",
    "sourceRow": 36,
    "level": "Hospital leadership",
    "role": "Hospital DHO",
    "roleId": "hospital-dho",
    "reportsTo": "Regional COO",
    "keyDeliverable": "Revenue-cycle quality",
    "kpi": "Claim first-pass acceptance and rejection value",
    "definition": "Claims accepted at first submission divided by submitted claims, plus rejected or denied claim value divided by submitted value.",
    "weight": 0.1,
    "targetBasis": "Approved revenue-cycle targets",
    "review": "Monthly",
    "primaryDataSource": "Billing / payer portals",
    "keyCollaborator": "Billing & Revenue Lead",
    "definitionFamilies": [
      "First-pass claim acceptance",
      "Denied or rejected claim value"
    ],
    "unresolvedReason": null,
    "catalogId": "RKM-031",
    "domain": "Claims & payers",
    "aggType": "ratio",
    "unit": "percent",
    "direction": "higher",
    "scopes": [
      "group",
      "region",
      "hospital"
    ],
    "drill": "generic",
    "measureKey": "RKM-031",
    "realNotes": {
      "scope": "the six Lifecare hospitals (each its own region), submission months 2025-01 to 2026-05",
      "howComputed": "Claims accepted without rework divided by claims with an outcome, per hospital and submission month; rejected value share is supporting.",
      "gaps": "Portal claims only; rework inferred from status; Bungoma 2025-07..2026-04 missing; recent cohorts immature."
    }
  },
  {
    "assignmentId": "hospital-dho:people-productivity-engagement-and-critical-attrition",
    "sourceRow": 37,
    "level": "Hospital leadership",
    "role": "Hospital DHO",
    "roleId": "hospital-dho",
    "reportsTo": "Regional COO",
    "keyDeliverable": "People effectiveness",
    "kpi": "People productivity, engagement and critical attrition",
    "definition": "Approved output-per-FTE measures by function, engagement score and attrition among designated critical roles.",
    "weight": 0.1,
    "targetBasis": "Hospital people plan",
    "review": "Monthly",
    "primaryDataSource": "HRIS / HIS / roster data",
    "keyCollaborator": "People Executive",
    "definitionFamilies": [
      "Engagement"
    ],
    "unresolvedReason": null,
    "catalogId": "RKM-032",
    "domain": "People",
    "aggType": "ratio",
    "unit": "ratio",
    "direction": "higher",
    "scopes": [
      "group",
      "region",
      "hospital"
    ],
    "drill": "generic",
    "measureKey": "RKM-032",
    "realNotes": {
      "scope": "the six Lifecare hospitals (each its own region), pay month 2026-06 only",
      "howComputed": "Billed visits in June 2026 divided by paid headcount (permanent staff plus locums) at the hospital.",
      "gaps": "Engagement and critical-role attrition have no source; payroll is one monthly snapshot so there is no trend, and headcount is not FTE."
    }
  },
  {
    "assignmentId": "hospital-dho:facility-readiness-licensure-and-safety-actions",
    "sourceRow": 38,
    "level": "Hospital leadership",
    "role": "Hospital DHO",
    "roleId": "hospital-dho",
    "reportsTo": "Regional COO",
    "keyDeliverable": "Operational readiness",
    "kpi": "Facility readiness, licensure and safety actions",
    "definition": "Critical operational, safety, licensure and facility actions closed by due date; report exceptions separately.",
    "weight": 0.09,
    "targetBasis": "Hospital compliance and maintenance plan",
    "review": "Monthly",
    "primaryDataSource": "Facilities / compliance tracker",
    "keyCollaborator": "Facilities; Legal Head",
    "definitionFamilies": [
      "Legal and compliance closure"
    ],
    "unresolvedReason": null,
    "catalogId": "RKM-033",
    "domain": "Clinical quality",
    "aggType": "ratio",
    "unit": "percent",
    "direction": "higher",
    "scopes": [
      "group",
      "region",
      "hospital"
    ],
    "drill": "generic",
    "measureKey": "RKM-033",
    "realNotes": {
      "scope": "",
      "howComputed": "",
      "gaps": "Needs a facilities / compliance tracker."
    }
  },
  {
    "assignmentId": "people-executive:approved-position-fill-rate-and-time-to-fill",
    "sourceRow": 39,
    "level": "Hospital functional leadership",
    "role": "People Executive",
    "roleId": "people-executive",
    "reportsTo": "Hospital DHO",
    "keyDeliverable": "Staffing readiness",
    "kpi": "Approved position fill rate and time to fill",
    "definition": "Approved positions filled divided by approved positions, plus median or approved time-to-fill for critical vacancies.",
    "weight": 0.15,
    "targetBasis": "Approved workforce plan",
    "review": "Monthly",
    "primaryDataSource": "HRIS / recruitment tracker",
    "keyCollaborator": "Hospital DHO; HR Head",
    "definitionFamilies": [
      "Critical-role attrition"
    ],
    "unresolvedReason": null,
    "catalogId": "RKM-034",
    "domain": "People",
    "aggType": "ratio",
    "unit": "percent",
    "direction": "higher",
    "scopes": [
      "group",
      "region",
      "hospital"
    ],
    "drill": "generic",
    "measureKey": "RKM-034",
    "realNotes": {
      "scope": "",
      "howComputed": "",
      "gaps": "Needs HRIS / recruitment tracker (approved positions, time to fill)."
    }
  },
  {
    "assignmentId": "people-executive:roster-adherence-and-labour-productivity",
    "sourceRow": 40,
    "level": "Hospital functional leadership",
    "role": "People Executive",
    "roleId": "people-executive",
    "reportsTo": "Hospital DHO",
    "keyDeliverable": "Workforce productivity",
    "kpi": "Roster adherence and labour productivity",
    "definition": "Rostered staffing delivered versus approved roster, and approved output-per-paid-FTE measures by function.",
    "weight": 0.15,
    "targetBasis": "Approved staffing and productivity plan",
    "review": "Monthly",
    "primaryDataSource": "HRIS / roster / HIS",
    "keyCollaborator": "Hospital DHO",
    "definitionFamilies": [
      "Workforce productivity"
    ],
    "unresolvedReason": null,
    "catalogId": "RKM-035",
    "domain": "People",
    "aggType": "ratio",
    "unit": "ratio",
    "direction": "higher",
    "scopes": [
      "group",
      "region",
      "hospital"
    ],
    "drill": "generic",
    "measureKey": "RKM-035",
    "realNotes": {
      "scope": "the six Lifecare hospitals (each its own region), pay month 2026-06 only",
      "howComputed": "Billed visits divided by paid headcount, and gross billed revenue per head, for June 2026.",
      "gaps": "Roster adherence needs a roster; headcount is not FTE and clinical and non-clinical staff are mixed; one month only."
    }
  },
  {
    "assignmentId": "people-executive:critical-role-attrition",
    "sourceRow": 41,
    "level": "Hospital functional leadership",
    "role": "People Executive",
    "roleId": "people-executive",
    "reportsTo": "Hospital DHO",
    "keyDeliverable": "Retention",
    "kpi": "Critical-role attrition",
    "definition": "Voluntary and total attrition among designated critical roles compared with the approved retention plan.",
    "weight": 0.15,
    "targetBasis": "Approved people plan",
    "review": "Monthly",
    "primaryDataSource": "HRIS",
    "keyCollaborator": "Hospital DHO; HR Head",
    "definitionFamilies": [
      "Critical-role attrition"
    ],
    "unresolvedReason": null,
    "catalogId": "RKM-036",
    "domain": "People",
    "aggType": "ratio",
    "unit": "percent",
    "direction": "higher",
    "scopes": [
      "group",
      "region",
      "hospital"
    ],
    "drill": "generic",
    "measureKey": "RKM-036",
    "realNotes": {
      "scope": "",
      "howComputed": "",
      "gaps": "Needs HRIS exit data (payroll is a single 2026-06 snapshot with no leavers)."
    }
  },
  {
    "assignmentId": "people-executive:engagement-score-and-action-closure",
    "sourceRow": 42,
    "level": "Hospital functional leadership",
    "role": "People Executive",
    "roleId": "people-executive",
    "reportsTo": "Hospital DHO",
    "keyDeliverable": "Employee experience",
    "kpi": "Engagement score and action closure",
    "definition": "Approved engagement survey score and action-plan items closed by due date.",
    "weight": 0.15,
    "targetBasis": "Annual engagement plan",
    "review": "Monthly",
    "primaryDataSource": "Engagement survey / HR action tracker",
    "keyCollaborator": "Hospital DHO",
    "definitionFamilies": [
      "Engagement"
    ],
    "unresolvedReason": null,
    "catalogId": "RKM-037",
    "domain": "People",
    "aggType": "average",
    "unit": "score",
    "direction": "higher",
    "scopes": [
      "group",
      "region",
      "hospital"
    ],
    "drill": "generic",
    "measureKey": "RKM-037",
    "realNotes": {
      "scope": "",
      "howComputed": "",
      "gaps": "Needs an engagement survey / HR action tracker."
    }
  },
  {
    "assignmentId": "people-executive:performance-review-and-talent-matrix-completion",
    "sourceRow": 43,
    "level": "Hospital functional leadership",
    "role": "People Executive",
    "roleId": "people-executive",
    "reportsTo": "Hospital DHO",
    "keyDeliverable": "Performance management",
    "kpi": "Performance review and talent-matrix completion",
    "definition": "Eligible employees with completed performance review and current talent assessment divided by eligible employees.",
    "weight": 0.1,
    "targetBasis": "Group performance calendar",
    "review": "Monthly",
    "primaryDataSource": "HRIS",
    "keyCollaborator": "HR Head",
    "definitionFamilies": [
      "Mandatory learning / credentialing"
    ],
    "unresolvedReason": null,
    "catalogId": "RKM-038",
    "domain": "People",
    "aggType": "ratio",
    "unit": "percent",
    "direction": "higher",
    "scopes": [
      "group",
      "region",
      "hospital"
    ],
    "drill": "generic",
    "measureKey": "RKM-038",
    "realNotes": {
      "scope": "",
      "howComputed": "",
      "gaps": "Needs HRIS performance-review data."
    }
  },
  {
    "assignmentId": "people-executive:mandatory-training-and-credentialing-completion",
    "sourceRow": 44,
    "level": "Hospital functional leadership",
    "role": "People Executive",
    "roleId": "people-executive",
    "reportsTo": "Hospital DHO",
    "keyDeliverable": "Compliance and capability",
    "kpi": "Mandatory training and credentialing completion",
    "definition": "Required employees with completed mandatory learning and current role credentials divided by required employees.",
    "weight": 0.15,
    "targetBasis": "Approved training and credentialing plan",
    "review": "Monthly",
    "primaryDataSource": "LMS / HRIS / medical affairs",
    "keyCollaborator": "Clinical Medical Director; Hospital DHO",
    "definitionFamilies": [
      "Mandatory learning / credentialing"
    ],
    "unresolvedReason": null,
    "catalogId": "RKM-039",
    "domain": "People",
    "aggType": "ratio",
    "unit": "percent",
    "direction": "higher",
    "scopes": [
      "group",
      "region",
      "hospital"
    ],
    "drill": "generic",
    "measureKey": "RKM-039",
    "realNotes": {
      "scope": "",
      "howComputed": "",
      "gaps": "Needs LMS / HRIS training and credentialing data."
    }
  },
  {
    "assignmentId": "people-executive:hr-and-statutory-actions-closed-on-time",
    "sourceRow": 45,
    "level": "Hospital functional leadership",
    "role": "People Executive",
    "roleId": "people-executive",
    "reportsTo": "Hospital DHO",
    "keyDeliverable": "Employment compliance",
    "kpi": "HR and statutory actions closed on time",
    "definition": "Required HR, employee-relations and statutory actions closed by due date divided by actions due.",
    "weight": 0.1,
    "targetBasis": "HR compliance calendar",
    "review": "Monthly",
    "primaryDataSource": "HR compliance tracker",
    "keyCollaborator": "HR Head; Legal Head",
    "definitionFamilies": [
      "Legal and compliance closure"
    ],
    "unresolvedReason": null,
    "catalogId": "RKM-040",
    "domain": "People",
    "aggType": "ratio",
    "unit": "percent",
    "direction": "higher",
    "scopes": [
      "group",
      "region",
      "hospital"
    ],
    "drill": "generic",
    "measureKey": "RKM-040",
    "realNotes": {
      "scope": "",
      "howComputed": "",
      "gaps": "Needs an HR compliance tracker."
    }
  },
  {
    "assignmentId": "people-executive:manpower-cost-vs-plan",
    "sourceRow": 46,
    "level": "Hospital functional leadership",
    "role": "People Executive",
    "roleId": "people-executive",
    "reportsTo": "Hospital DHO",
    "keyDeliverable": "Cost discipline",
    "kpi": "Manpower cost vs plan",
    "definition": "Approved manpower cost for the facility compared with budget, with vacancy and overtime context.",
    "weight": 0.05,
    "targetBasis": "Approved manpower budget",
    "review": "Monthly",
    "primaryDataSource": "Payroll / finance ERP",
    "keyCollaborator": "Hospital DHO; Group CFO",
    "definitionFamilies": [
      "Workforce productivity"
    ],
    "unresolvedReason": null,
    "catalogId": "RKM-041",
    "domain": "People",
    "aggType": "sum",
    "unit": "KES",
    "direction": "range",
    "scopes": [
      "group",
      "region",
      "hospital"
    ],
    "drill": "generic",
    "measureKey": "RKM-041",
    "realNotes": {
      "scope": "the six Lifecare hospitals (each its own region), pay month 2026-06 only",
      "howComputed": "Monthly gross payroll of permanent staff plus locums at the hospital.",
      "gaps": "No approved manpower budget, no vacancy or overtime data; gross pay only (employer costs not included); one month only."
    }
  },
  {
    "assignmentId": "bd-lead:new-business-revenue-vs-plan",
    "sourceRow": 47,
    "level": "Hospital functional leadership",
    "role": "Business Development Lead",
    "roleId": "bd-lead",
    "reportsTo": "Hospital DHO",
    "keyDeliverable": "New demand generation",
    "kpi": "New business revenue vs plan",
    "definition": "Finance-approved revenue attributable to approved business-development channels or campaigns versus plan.",
    "weight": 0.2,
    "targetBasis": "Hospital growth plan",
    "review": "Monthly",
    "primaryDataSource": "CRM / HIS / finance",
    "keyCollaborator": "Hospital DHO",
    "definitionFamilies": [
      "New business revenue"
    ],
    "unresolvedReason": null,
    "catalogId": "RKM-042",
    "domain": "Commercial growth",
    "aggType": "sum",
    "unit": "KES",
    "direction": "higher",
    "scopes": [
      "group",
      "region",
      "hospital"
    ],
    "drill": "generic",
    "measureKey": "RKM-042",
    "realNotes": {
      "scope": "the six Lifecare hospitals (each its own region), months 2025-07 onward",
      "howComputed": "Billed revenue in the month from Corporate & insurer billing accounts first seen at the hospital in the last six months.",
      "gaps": "Accounts are billing account names, not campaign or channel attributions; no plan; first-seen is measured only from 2025-01, so figures start in 2025-07."
    }
  },
  {
    "assignmentId": "bd-lead:qualified-pipeline-coverage",
    "sourceRow": 48,
    "level": "Hospital functional leadership",
    "role": "Business Development Lead",
    "roleId": "bd-lead",
    "reportsTo": "Hospital DHO",
    "keyDeliverable": "Pipeline health",
    "kpi": "Qualified pipeline coverage",
    "definition": "Qualified, documented revenue pipeline compared with the approved future-period pipeline requirement.",
    "weight": 0.1,
    "targetBasis": "Approved pipeline coverage requirement",
    "review": "Monthly",
    "primaryDataSource": "CRM",
    "keyCollaborator": "Hospital DHO",
    "definitionFamilies": [
      "Qualified pipeline"
    ],
    "unresolvedReason": null,
    "catalogId": "RKM-043",
    "domain": "Commercial growth",
    "aggType": "ratio",
    "unit": "percent",
    "direction": "higher",
    "scopes": [
      "group",
      "region",
      "hospital"
    ],
    "drill": "generic",
    "measureKey": "RKM-043",
    "realNotes": {
      "scope": "",
      "howComputed": "",
      "gaps": "Needs a CRM (qualified pipeline)."
    }
  },
  {
    "assignmentId": "bd-lead:lead-to-revenue-conversion",
    "sourceRow": 49,
    "level": "Hospital functional leadership",
    "role": "Business Development Lead",
    "roleId": "bd-lead",
    "reportsTo": "Hospital DHO",
    "keyDeliverable": "Conversion",
    "kpi": "Lead-to-revenue conversion",
    "definition": "Qualified leads that generate a completed billable service or contract divided by qualified leads, using CRM attribution rules.",
    "weight": 0.15,
    "targetBasis": "Hospital conversion plan",
    "review": "Monthly",
    "primaryDataSource": "CRM / HIS",
    "keyCollaborator": "Hospital DHO; Billing & Revenue Lead",
    "definitionFamilies": [
      "New business revenue",
      "Qualified pipeline"
    ],
    "unresolvedReason": null,
    "catalogId": "RKM-044",
    "domain": "Commercial growth",
    "aggType": "sum",
    "unit": "KES",
    "direction": "higher",
    "scopes": [
      "group",
      "region",
      "hospital"
    ],
    "drill": "generic",
    "measureKey": "RKM-044",
    "realNotes": {
      "scope": "",
      "howComputed": "",
      "gaps": "Needs a CRM (leads and conversion)."
    }
  },
  {
    "assignmentId": "bd-lead:active-referrer-network-and-referral-revenue",
    "sourceRow": 50,
    "level": "Hospital functional leadership",
    "role": "Business Development Lead",
    "roleId": "bd-lead",
    "reportsTo": "Hospital DHO",
    "keyDeliverable": "Referrer ecosystem",
    "kpi": "Active referrer network and referral revenue",
    "definition": "Active referrers meeting the approved activity criterion and finance-approved revenue from their referrals.",
    "weight": 0.15,
    "targetBasis": "Referrer network plan",
    "review": "Monthly",
    "primaryDataSource": "CRM / HIS / finance",
    "keyCollaborator": "Clinical Leads; Hospital DHO",
    "definitionFamilies": [
      "Referral conversion",
      "New business revenue"
    ],
    "unresolvedReason": null,
    "catalogId": "RKM-045",
    "domain": "Commercial growth",
    "aggType": "sum",
    "unit": "KES",
    "direction": "higher",
    "scopes": [
      "group",
      "region",
      "hospital"
    ],
    "drill": "generic",
    "measureKey": "RKM-045",
    "realNotes": {
      "scope": "",
      "howComputed": "",
      "gaps": "Needs a CRM / referrer register."
    }
  },
  {
    "assignmentId": "bd-lead:new-service-and-coe-lead-conversion",
    "sourceRow": 51,
    "level": "Hospital functional leadership",
    "role": "Business Development Lead",
    "roleId": "bd-lead",
    "reportsTo": "Hospital DHO",
    "keyDeliverable": "COE and service development",
    "kpi": "New-service and COE lead conversion",
    "definition": "Qualified leads for approved new services or COEs that convert to completed service or revenue.",
    "weight": 0.15,
    "targetBasis": "COE and service-line growth plan",
    "review": "Monthly",
    "primaryDataSource": "CRM / HIS",
    "keyCollaborator": "CoE Lead; Clinical Medical Director",
    "definitionFamilies": [
      "Qualified pipeline",
      "COE contribution"
    ],
    "unresolvedReason": null,
    "catalogId": "RKM-046",
    "domain": "Commercial growth",
    "aggType": "ratio",
    "unit": "percent",
    "direction": "higher",
    "scopes": [
      "group",
      "region",
      "hospital"
    ],
    "drill": "generic",
    "measureKey": "RKM-046",
    "realNotes": {
      "scope": "",
      "howComputed": "",
      "gaps": "Needs a CRM (COE and new-service leads)."
    }
  },
  {
    "assignmentId": "bd-lead:corporate-opportunities-handed-over-and-accepted",
    "sourceRow": 52,
    "level": "Hospital functional leadership",
    "role": "Business Development Lead",
    "roleId": "bd-lead",
    "reportsTo": "Hospital DHO",
    "keyDeliverable": "Corporate channel support",
    "kpi": "Corporate opportunities handed over and accepted",
    "definition": "Qualified corporate opportunities formally accepted by the Corporate Revenue & Insurance team divided by qualified handovers.",
    "weight": 0.1,
    "targetBasis": "Corporate opportunity plan",
    "review": "Monthly",
    "primaryDataSource": "CRM",
    "keyCollaborator": "Corporate Revenue & Insurance Lead",
    "definitionFamilies": [
      "Qualified pipeline"
    ],
    "unresolvedReason": null,
    "catalogId": "RKM-047",
    "domain": "Commercial growth",
    "aggType": "ratio",
    "unit": "percent",
    "direction": "higher",
    "scopes": [
      "group",
      "region",
      "hospital"
    ],
    "drill": "generic",
    "measureKey": "RKM-047",
    "realNotes": {
      "scope": "",
      "howComputed": "",
      "gaps": "Needs a CRM (corporate opportunity hand-over)."
    }
  },
  {
    "assignmentId": "bd-lead:crm-completeness-and-forecast-accuracy",
    "sourceRow": 53,
    "level": "Hospital functional leadership",
    "role": "Business Development Lead",
    "roleId": "bd-lead",
    "reportsTo": "Hospital DHO",
    "keyDeliverable": "Forecast discipline",
    "kpi": "CRM completeness and forecast accuracy",
    "definition": "Required CRM fields complete for active opportunities and forecast compared with realised attributed revenue.",
    "weight": 0.05,
    "targetBasis": "CRM data-quality standard",
    "review": "Monthly",
    "primaryDataSource": "CRM / analytics",
    "keyCollaborator": "Head of Analytics & Digital Transformation",
    "definitionFamilies": [
      "Forecast accuracy"
    ],
    "unresolvedReason": null,
    "catalogId": "RKM-048",
    "domain": "Financial performance",
    "aggType": "ratio",
    "unit": "percent",
    "direction": "higher",
    "scopes": [
      "group",
      "region",
      "hospital"
    ],
    "drill": "generic",
    "measureKey": "RKM-048",
    "realNotes": {
      "scope": "",
      "howComputed": "",
      "gaps": "Needs CRM field-completeness and forecast data."
    }
  },
  {
    "assignmentId": "bd-lead:acquisition-economics-vs-plan",
    "sourceRow": 54,
    "level": "Hospital functional leadership",
    "role": "Business Development Lead",
    "roleId": "bd-lead",
    "reportsTo": "Hospital DHO",
    "keyDeliverable": "Channel effectiveness",
    "kpi": "Acquisition economics vs plan",
    "definition": "Approved acquisition cost and attributable new revenue compared with channel plan; use finance-approved attribution.",
    "weight": 0.1,
    "targetBasis": "Approved channel plan",
    "review": "Monthly",
    "primaryDataSource": "CRM / finance",
    "keyCollaborator": "Hospital DHO; Group CFO",
    "definitionFamilies": [
      "New business revenue"
    ],
    "unresolvedReason": null,
    "catalogId": "RKM-049",
    "domain": "Commercial growth",
    "aggType": "ratio",
    "unit": "percent",
    "direction": "higher",
    "scopes": [
      "group",
      "region",
      "hospital"
    ],
    "drill": "generic",
    "measureKey": "RKM-049",
    "realNotes": {
      "scope": "",
      "howComputed": "",
      "gaps": "Needs CRM / finance acquisition-cost data."
    }
  },
  {
    "assignmentId": "billing-lead:claim-first-pass-acceptance-rate",
    "sourceRow": 55,
    "level": "Hospital functional leadership",
    "role": "Billing & Revenue Lead",
    "roleId": "billing-lead",
    "reportsTo": "Hospital DHO",
    "keyDeliverable": "Clean billing",
    "kpi": "Claim first-pass acceptance rate",
    "definition": "Claims accepted without resubmission divided by claims submitted in the period.",
    "weight": 0.15,
    "targetBasis": "Approved revenue-cycle target",
    "review": "Monthly",
    "primaryDataSource": "Billing system / payer portals",
    "keyCollaborator": "Hospital DHO; Clinical documentation owners",
    "definitionFamilies": [
      "First-pass claim acceptance"
    ],
    "unresolvedReason": null,
    "catalogId": "RKM-050",
    "domain": "Claims & payers",
    "aggType": "ratio",
    "unit": "percent",
    "direction": "higher",
    "scopes": [
      "group",
      "region",
      "hospital"
    ],
    "drill": "generic",
    "measureKey": "RKM-050",
    "realNotes": {
      "scope": "the six Lifecare hospitals (each its own region), submission months 2025-01 to 2026-05",
      "howComputed": "Claims accepted (Approved or Paid) with no rework or resubmission divided by claims that have had an outcome, per hospital and submission month.",
      "gaps": "Portal claims only. The status is a current snapshot, so a claim returned and later approved may count as first-pass unless its invoice number repeats. Bungoma 2025-07..2026-04 missing."
    }
  },
  {
    "assignmentId": "billing-lead:claim-submission-turnaround-time",
    "sourceRow": 56,
    "level": "Hospital functional leadership",
    "role": "Billing & Revenue Lead",
    "roleId": "billing-lead",
    "reportsTo": "Hospital DHO",
    "keyDeliverable": "Timely submission",
    "kpi": "Claim submission turnaround time",
    "definition": "Median or approved percentile days from discharge or service completion to complete claim submission.",
    "weight": 0.1,
    "targetBasis": "Approved revenue-cycle target",
    "review": "Monthly",
    "primaryDataSource": "Billing system / HIS",
    "keyCollaborator": "Clinical documentation owners",
    "definitionFamilies": [
      "First-pass claim acceptance"
    ],
    "unresolvedReason": null,
    "catalogId": "RKM-051",
    "domain": "Claims & payers",
    "aggType": "average",
    "unit": "days",
    "direction": "lower",
    "scopes": [
      "group",
      "region",
      "hospital"
    ],
    "drill": "generic",
    "measureKey": "RKM-051",
    "realNotes": {
      "scope": "the six Lifecare hospitals (each its own region), submission months 2025-01 to 2026-05",
      "howComputed": "Median whole days between discharge date and submission date of portal claims, per hospital and month (90th percentile as supporting).",
      "gaps": "Portal claims only; claims submitted before discharge (32) excluded; Bungoma 2025-07..2026-04 missing."
    }
  },
  {
    "assignmentId": "billing-lead:rejected-or-denied-claim-value",
    "sourceRow": 57,
    "level": "Hospital functional leadership",
    "role": "Billing & Revenue Lead",
    "roleId": "billing-lead",
    "reportsTo": "Hospital DHO",
    "keyDeliverable": "Denial reduction",
    "kpi": "Rejected or denied claim value",
    "definition": "Rejected or denied claim value divided by submitted claim value, reported by payer and root cause.",
    "weight": 0.15,
    "targetBasis": "Approved denial-reduction plan",
    "review": "Monthly",
    "primaryDataSource": "Billing system / payer portals",
    "keyCollaborator": "Hospital DHO; Corporate Revenue & Insurance Lead",
    "definitionFamilies": [
      "Denied or rejected claim value"
    ],
    "unresolvedReason": null,
    "catalogId": "RKM-052",
    "domain": "Claims & payers",
    "aggType": "ratio",
    "unit": "percent",
    "direction": "lower",
    "scopes": [
      "group",
      "region",
      "hospital"
    ],
    "drill": "generic",
    "measureKey": "RKM-052",
    "realNotes": {
      "scope": "the six Lifecare hospitals (each its own region), submission months 2025-01 to 2026-05",
      "howComputed": "Value of rejected claims divided by value of all submitted claims, per hospital and submission month; returned-for-changes value and rejection reasons are supporting.",
      "gaps": "Portal claims only; recent cohorts include claims still under review in the denominator; no split by payer scheme in the delivered figure; Bungoma 2025-07..2026-04 missing."
    }
  },
  {
    "assignmentId": "billing-lead:cash-collections-vs-monthly-plan",
    "sourceRow": 58,
    "level": "Hospital functional leadership",
    "role": "Billing & Revenue Lead",
    "roleId": "billing-lead",
    "reportsTo": "Hospital DHO",
    "keyDeliverable": "Cash collection",
    "kpi": "Cash collections vs monthly plan",
    "definition": "Cash posted and reconciled in the period compared with approved monthly collection plan.",
    "weight": 0.15,
    "targetBasis": "Approved cash collections plan",
    "review": "Monthly",
    "primaryDataSource": "Billing system / finance ERP",
    "keyCollaborator": "Hospital DHO; Group CFO",
    "definitionFamilies": [
      "Collections"
    ],
    "unresolvedReason": null,
    "catalogId": "RKM-053",
    "domain": "Collections & receivables",
    "aggType": "sum",
    "unit": "KES",
    "direction": "higher",
    "scopes": [
      "group",
      "region",
      "hospital"
    ],
    "drill": "generic",
    "measureKey": "RKM-053",
    "realNotes": {
      "scope": "the six Lifecare hospitals (each its own region), months 2025-02 to 2026-03",
      "howComputed": "Cash received through the claims portal per hospital and remittance month.",
      "gaps": "Portal claims only, not total collections; no monthly collection plan; no remittances recorded after 2026-03-30."
    }
  },
  {
    "assignmentId": "billing-lead:dso-and-aged-receivables",
    "sourceRow": 59,
    "level": "Hospital functional leadership",
    "role": "Billing & Revenue Lead",
    "roleId": "billing-lead",
    "reportsTo": "Hospital DHO",
    "keyDeliverable": "Receivables control",
    "kpi": "DSO and aged receivables",
    "definition": "Debtor days using the group-approved calculation, with receivables beyond the approved ageing threshold separately reported.",
    "weight": 0.15,
    "targetBasis": "Approved DSO and ageing plan",
    "review": "Monthly",
    "primaryDataSource": "Finance ERP / billing system",
    "keyCollaborator": "Hospital DHO; Group CFO",
    "definitionFamilies": [
      "DSO"
    ],
    "unresolvedReason": null,
    "catalogId": "RKM-054",
    "domain": "Collections & receivables",
    "aggType": "average",
    "unit": "days",
    "direction": "lower",
    "scopes": [
      "group",
      "region",
      "hospital"
    ],
    "drill": "generic",
    "measureKey": "RKM-054",
    "realNotes": {
      "scope": "Five Lifecare hospitals (Bungoma not eligible), as of 2026-05-18 only",
      "howComputed": "Open portal-claim value (not Paid, not Rejected) divided by average daily invoiced claim value over the last 90 days; the ageing of open value is supporting.",
      "gaps": "Portal claims only, not trade receivables; a single as-of snapshot because status cannot be replayed; Bungoma claims gap."
    }
  },
  {
    "assignmentId": "billing-lead:unbilled-revenue-and-cash-posting-reconciliation",
    "sourceRow": 60,
    "level": "Hospital functional leadership",
    "role": "Billing & Revenue Lead",
    "roleId": "billing-lead",
    "reportsTo": "Hospital DHO",
    "keyDeliverable": "Revenue completeness",
    "kpi": "Unbilled revenue and cash-posting reconciliation",
    "definition": "Completed services not billed and unreconciled cash items, reported with age and action owner.",
    "weight": 0.15,
    "targetBasis": "Approved revenue-integrity target",
    "review": "Monthly",
    "primaryDataSource": "HIS / billing system / finance ERP",
    "keyCollaborator": "Hospital DHO",
    "definitionFamilies": [
      "Unbilled revenue"
    ],
    "unresolvedReason": null,
    "catalogId": "RKM-055",
    "domain": "Collections & receivables",
    "aggType": "ratio",
    "unit": "percent",
    "direction": "lower",
    "scopes": [
      "group",
      "region",
      "hospital"
    ],
    "drill": "generic",
    "measureKey": "RKM-055",
    "realNotes": {
      "scope": "the six Lifecare hospitals (each its own region), discharge months 2025-01 to 2026-07",
      "howComputed": "Share of discharged overnight inpatients whose visit code has no line in the revenue table.",
      "gaps": "Counts visits, not value; cash-posting reconciliation and unbilled outpatient services are not covered."
    }
  },
  {
    "assignmentId": "billing-lead:payer-reconciliation-and-documentation-completeness",
    "sourceRow": 61,
    "level": "Hospital functional leadership",
    "role": "Billing & Revenue Lead",
    "roleId": "billing-lead",
    "reportsTo": "Hospital DHO",
    "keyDeliverable": "Payer discipline",
    "kpi": "Payer reconciliation and documentation completeness",
    "definition": "Payer accounts reconciled to schedule and submitted claims meeting required documentation standards.",
    "weight": 0.1,
    "targetBasis": "Payer reconciliation calendar",
    "review": "Monthly",
    "primaryDataSource": "Billing system / payer portals",
    "keyCollaborator": "Corporate Revenue & Insurance Lead",
    "definitionFamilies": [
      "Unbilled revenue"
    ],
    "unresolvedReason": null,
    "catalogId": "RKM-056",
    "domain": "Claims & payers",
    "aggType": "ratio",
    "unit": "percent",
    "direction": "lower",
    "scopes": [
      "group",
      "region",
      "hospital"
    ],
    "drill": "generic",
    "measureKey": "RKM-056",
    "realNotes": {
      "scope": "the six Lifecare hospitals (each its own region), submission months 2025-01 to 2026-05",
      "howComputed": "Value of claims rejected for missing or incomplete documents divided by value submitted, per hospital and month.",
      "gaps": "A negative proxy for documentation completeness (only failures that led to rejection). Payer reconciliation to schedule is not covered. Portal claims only."
    }
  },
  {
    "assignmentId": "billing-lead:revenue-leakage-and-avoidable-credit-notes",
    "sourceRow": 62,
    "level": "Hospital functional leadership",
    "role": "Billing & Revenue Lead",
    "roleId": "billing-lead",
    "reportsTo": "Hospital DHO",
    "keyDeliverable": "Leakage prevention",
    "kpi": "Revenue leakage and avoidable credit notes",
    "definition": "Finance-approved avoidable revenue leakage and credit-note value compared with approved target and root-cause actions.",
    "weight": 0.05,
    "targetBasis": "Approved revenue-integrity target",
    "review": "Monthly",
    "primaryDataSource": "Finance ERP / billing audit",
    "keyCollaborator": "Group CFO; Hospital DHO",
    "definitionFamilies": [
      "Unbilled revenue"
    ],
    "unresolvedReason": null,
    "catalogId": "RKM-057",
    "domain": "Collections & receivables",
    "aggType": "ratio",
    "unit": "percent",
    "direction": "lower",
    "scopes": [
      "group",
      "region",
      "hospital"
    ],
    "drill": "generic",
    "measureKey": "RKM-057",
    "realNotes": {
      "scope": "Bungoma, Kikuyu, Migori, Mlolongo 2025-01 to 2026-04 (Eldoret and Meru have no discount records)",
      "howComputed": "Recorded discounts, capitation discounts, rebates and credit notes divided by gross billed revenue.",
      "gaps": "Counts all recorded deductions, not only avoidable ones; no approved target."
    }
  },
  {
    "assignmentId": "coe-lead:coe-net-revenue-vs-plan",
    "sourceRow": 63,
    "level": "Clinical growth",
    "role": "COE Lead",
    "roleId": "coe-lead",
    "reportsTo": "Chief / Group Clinical Medical Director",
    "keyDeliverable": "COE financial performance",
    "kpi": "COE net revenue vs plan",
    "definition": "Finance-approved revenue from the COE compared with its approved plan.",
    "weight": 0.2,
    "targetBasis": "Approved COE business plan",
    "review": "Monthly",
    "primaryDataSource": "Finance ERP / HIS",
    "keyCollaborator": "Group CFO; Regional COOs",
    "definitionFamilies": [
      "Net revenue"
    ],
    "unresolvedReason": null,
    "catalogId": "RKM-058",
    "domain": "Financial performance",
    "aggType": "sum",
    "unit": "KES",
    "direction": "higher",
    "scopes": [
      "group",
      "region",
      "hospital"
    ],
    "drill": "generic",
    "measureKey": "RKM-058",
    "realNotes": {
      "scope": "Fertility Point sites, months 2025-01 onward",
      "howComputed": "Net billed revenue (all lines, including negative credit lines) of each Fertility Point centre per month.",
      "gaps": "No approved COE plan. Billed revenue, not Finance-approved. Latest month partial."
    }
  },
  {
    "assignmentId": "coe-lead:coe-contribution-margin-or-ebitda-vs-plan",
    "sourceRow": 64,
    "level": "Clinical growth",
    "role": "COE Lead",
    "roleId": "coe-lead",
    "reportsTo": "Chief / Group Clinical Medical Director",
    "keyDeliverable": "COE financial performance",
    "kpi": "COE contribution margin or EBITDA vs plan",
    "definition": "Finance-approved contribution margin or EBITDA for the COE compared with approved plan.",
    "weight": 0.15,
    "targetBasis": "Approved COE business plan",
    "review": "Monthly",
    "primaryDataSource": "Finance ERP / management accounts",
    "keyCollaborator": "Group CFO",
    "definitionFamilies": [
      "EBITDA"
    ],
    "unresolvedReason": null,
    "catalogId": "RKM-059",
    "domain": "Financial performance",
    "aggType": "ratio",
    "unit": "percent",
    "direction": "higher",
    "scopes": [
      "group",
      "region",
      "hospital"
    ],
    "drill": "generic",
    "measureKey": "RKM-059",
    "realNotes": {
      "scope": "",
      "howComputed": "",
      "gaps": "Needs finance cost data (contribution margin or EBITDA)."
    }
  },
  {
    "assignmentId": "coe-lead:coe-capacity-utilisation-and-case-volume",
    "sourceRow": 65,
    "level": "Clinical growth",
    "role": "COE Lead",
    "roleId": "coe-lead",
    "reportsTo": "Chief / Group Clinical Medical Director",
    "keyDeliverable": "Capacity and throughput",
    "kpi": "COE capacity utilisation and case volume",
    "definition": "Approved COE capacity utilised and completed case volume compared with plan, using service-specific denominators.",
    "weight": 0.1,
    "targetBasis": "COE capacity and volume plan",
    "review": "Monthly",
    "primaryDataSource": "HIS / scheduling",
    "keyCollaborator": "Regional COOs; DHOs",
    "definitionFamilies": [
      "Capacity utilisation"
    ],
    "unresolvedReason": null,
    "catalogId": "RKM-060",
    "domain": "Capacity & throughput",
    "aggType": "count",
    "unit": "count",
    "direction": "higher",
    "scopes": [
      "group",
      "region",
      "hospital"
    ],
    "drill": "generic",
    "measureKey": "RKM-060",
    "realNotes": {
      "scope": "Fertility Point sites, months 2025-01 onward",
      "howComputed": "Distinct visits billed per Fertility Point centre and month.",
      "gaps": "Capacity utilisation needs capacity data (none); case volume against plan needs a plan; visits are not cycles or procedures."
    }
  },
  {
    "assignmentId": "coe-lead:coe-referral-conversion",
    "sourceRow": 66,
    "level": "Clinical growth",
    "role": "COE Lead",
    "roleId": "coe-lead",
    "reportsTo": "Chief / Group Clinical Medical Director",
    "keyDeliverable": "Referral continuity",
    "kpi": "COE referral conversion",
    "definition": "Eligible referrals that complete the intended COE consultation, procedure or care plan divided by eligible referrals.",
    "weight": 0.15,
    "targetBasis": "COE referral plan",
    "review": "Monthly",
    "primaryDataSource": "HIS / referral tracker",
    "keyCollaborator": "Business Development Leads; DHOs",
    "definitionFamilies": [
      "Referral conversion"
    ],
    "unresolvedReason": null,
    "catalogId": "RKM-061",
    "domain": "Capacity & throughput",
    "aggType": "ratio",
    "unit": "percent",
    "direction": "higher",
    "scopes": [
      "group",
      "region",
      "hospital"
    ],
    "drill": "generic",
    "measureKey": "RKM-061",
    "realNotes": {
      "scope": "",
      "howComputed": "",
      "gaps": "Needs a referral tracker."
    }
  },
  {
    "assignmentId": "coe-lead:coe-outcomes-and-protocol-compliance",
    "sourceRow": 67,
    "level": "Clinical growth",
    "role": "COE Lead",
    "roleId": "coe-lead",
    "reportsTo": "Chief / Group Clinical Medical Director",
    "keyDeliverable": "Clinical excellence",
    "kpi": "COE outcomes and protocol compliance",
    "definition": "COE clinical outcomes and protocol compliance, using the approved service-line scorecard and risk adjustment where applicable.",
    "weight": 0.15,
    "targetBasis": "Approved COE clinical-quality plan",
    "review": "Monthly",
    "primaryDataSource": "Quality system / HIS / clinical audit",
    "keyCollaborator": "Clinical Medical Director",
    "definitionFamilies": [
      "Protocol compliance"
    ],
    "unresolvedReason": null,
    "catalogId": "RKM-062",
    "domain": "Clinical quality",
    "aggType": "ratio",
    "unit": "percent",
    "direction": "higher",
    "scopes": [
      "group",
      "region",
      "hospital"
    ],
    "drill": "generic",
    "measureKey": "RKM-062",
    "realNotes": {
      "scope": "",
      "howComputed": "",
      "gaps": "Needs clinical outcome and protocol audit data."
    }
  },
  {
    "assignmentId": "coe-lead:coe-patient-experience-score",
    "sourceRow": 68,
    "level": "Clinical growth",
    "role": "COE Lead",
    "roleId": "coe-lead",
    "reportsTo": "Chief / Group Clinical Medical Director",
    "keyDeliverable": "Patient-centred care",
    "kpi": "COE patient experience score",
    "definition": "Approved patient-experience score for the COE, reported with response rate and key corrective actions.",
    "weight": 0.1,
    "targetBasis": "COE patient-experience plan",
    "review": "Monthly",
    "primaryDataSource": "Patient feedback platform",
    "keyCollaborator": "DHOs; Regional COOs",
    "definitionFamilies": [
      "Patient experience"
    ],
    "unresolvedReason": null,
    "catalogId": "RKM-063",
    "domain": "Patient experience",
    "aggType": "average",
    "unit": "score",
    "direction": "higher",
    "scopes": [
      "group",
      "region",
      "hospital"
    ],
    "drill": "generic",
    "measureKey": "RKM-063",
    "realNotes": {
      "scope": "",
      "howComputed": "",
      "gaps": "Needs a patient feedback platform."
    }
  },
  {
    "assignmentId": "coe-lead:approved-coe-programme-milestones",
    "sourceRow": 69,
    "level": "Clinical growth",
    "role": "COE Lead",
    "roleId": "coe-lead",
    "reportsTo": "Chief / Group Clinical Medical Director",
    "keyDeliverable": "Innovation and expansion",
    "kpi": "Approved COE programme milestones",
    "definition": "Approved programme, technology or geographic expansion milestones completed on time and within approved business case.",
    "weight": 0.1,
    "targetBasis": "Approved COE roadmap",
    "review": "Monthly",
    "primaryDataSource": "COE roadmap / finance",
    "keyCollaborator": "Clinical Medical Director; Regional COOs",
    "definitionFamilies": [
      "COE contribution"
    ],
    "unresolvedReason": null,
    "catalogId": "RKM-064",
    "domain": "Commercial growth",
    "aggType": "ratio",
    "unit": "percent",
    "direction": "higher",
    "scopes": [
      "group",
      "region",
      "hospital"
    ],
    "drill": "generic",
    "measureKey": "RKM-064",
    "realNotes": {
      "scope": "",
      "howComputed": "",
      "gaps": "Needs a COE roadmap / milestone tracker."
    }
  },
  {
    "assignmentId": "coe-lead:coe-medical-team-capability-and-engagement",
    "sourceRow": 70,
    "level": "Clinical growth",
    "role": "COE Lead",
    "roleId": "coe-lead",
    "reportsTo": "Chief / Group Clinical Medical Director",
    "keyDeliverable": "Medical capability",
    "kpi": "COE medical-team capability and engagement",
    "definition": "Required competency milestones achieved and approved medical-team engagement measure for the COE.",
    "weight": 0.05,
    "targetBasis": "COE workforce plan",
    "review": "Monthly",
    "primaryDataSource": "Medical affairs / HRIS",
    "keyCollaborator": "HR Head; People Executives",
    "definitionFamilies": [
      "Engagement"
    ],
    "unresolvedReason": null,
    "catalogId": "RKM-065",
    "domain": "People",
    "aggType": "ratio",
    "unit": "percent",
    "direction": "higher",
    "scopes": [
      "group",
      "region",
      "hospital"
    ],
    "drill": "generic",
    "measureKey": "RKM-065",
    "realNotes": {
      "scope": "",
      "howComputed": "",
      "gaps": "Needs medical affairs / HRIS data."
    }
  },
  {
    "assignmentId": "corporate-revenue-lead:corporate-and-insurer-net-revenue-and-margin-vs-plan",
    "sourceRow": 71,
    "level": "Commercial growth",
    "role": "Corporate Revenue & Insurance Lead",
    "roleId": "corporate-revenue-lead",
    "reportsTo": "Chief / Group Clinical Medical Director",
    "keyDeliverable": "Corporate and insurance growth",
    "kpi": "Corporate and insurer net revenue and margin vs plan",
    "definition": "Finance-approved net revenue and margin from corporate and insurer accounts compared with plan.",
    "weight": 0.2,
    "targetBasis": "Approved corporate and insurer plan",
    "review": "Monthly",
    "primaryDataSource": "Finance ERP / contract register",
    "keyCollaborator": "Group CFO; Regional COOs",
    "definitionFamilies": [
      "Net revenue"
    ],
    "unresolvedReason": null,
    "catalogId": "RKM-066",
    "domain": "Financial performance",
    "aggType": "sum",
    "unit": "KES",
    "direction": "higher",
    "scopes": [
      "group",
      "region",
      "hospital"
    ],
    "drill": "generic",
    "measureKey": "RKM-066",
    "realNotes": {
      "scope": "Group operating sites (Lifecare six, Bliss, Fertility Point), months 2025-01 onward (group from 2025-07)",
      "howComputed": "Gross billed revenue from the Corporate & insurer payer group per site and month.",
      "gaps": "Margin needs cost data (none); no plan; government schemes (SHA, MAKL/TSC/NPS) are excluded from this group by design."
    }
  },
  {
    "assignmentId": "corporate-revenue-lead:active-contracted-accounts-vs-plan",
    "sourceRow": 72,
    "level": "Commercial growth",
    "role": "Corporate Revenue & Insurance Lead",
    "roleId": "corporate-revenue-lead",
    "reportsTo": "Chief / Group Clinical Medical Director",
    "keyDeliverable": "Account portfolio",
    "kpi": "Active contracted accounts vs plan",
    "definition": "Accounts with active, compliant agreements and expected revenue activity compared with plan.",
    "weight": 0.15,
    "targetBasis": "Approved account-acquisition plan",
    "review": "Monthly",
    "primaryDataSource": "Contract register / CRM",
    "keyCollaborator": "Legal Head; Business Development Leads",
    "definitionFamilies": [
      "Contract utilisation"
    ],
    "unresolvedReason": null,
    "catalogId": "RKM-067",
    "domain": "Commercial growth",
    "aggType": "snapshot",
    "unit": "count",
    "direction": "higher",
    "scopes": [
      "group"
    ],
    "drill": "generic",
    "measureKey": "RKM-067",
    "realNotes": {
      "scope": "Group (distinct across sites), months 2025-07 onward",
      "howComputed": "Distinct Corporate & insurer billing accounts with positive billed revenue in the month.",
      "gaps": "Billing account names, not signed contracts; no account plan. A distinct count across sites, so it is delivered as one group row, not summed from sites."
    }
  },
  {
    "assignmentId": "corporate-revenue-lead:new-corporate-and-insurer-tie-up-conversion",
    "sourceRow": 73,
    "level": "Commercial growth",
    "role": "Corporate Revenue & Insurance Lead",
    "roleId": "corporate-revenue-lead",
    "reportsTo": "Chief / Group Clinical Medical Director",
    "keyDeliverable": "New tie-ups",
    "kpi": "New corporate and insurer tie-up conversion",
    "definition": "Qualified corporate or insurer opportunities converted to signed, approved agreements divided by qualified opportunities.",
    "weight": 0.15,
    "targetBasis": "Approved new tie-up plan",
    "review": "Monthly",
    "primaryDataSource": "CRM / contract register",
    "keyCollaborator": "Legal Head; Clinical Medical Director",
    "definitionFamilies": [
      "Qualified pipeline"
    ],
    "unresolvedReason": null,
    "catalogId": "RKM-068",
    "domain": "Commercial growth",
    "aggType": "ratio",
    "unit": "percent",
    "direction": "higher",
    "scopes": [
      "group",
      "region",
      "hospital"
    ],
    "drill": "generic",
    "measureKey": "RKM-068",
    "realNotes": {
      "scope": "",
      "howComputed": "",
      "gaps": "Needs a CRM / contract register (opportunities converted to signed agreements)."
    }
  },
  {
    "assignmentId": "corporate-revenue-lead:contract-renewal-and-account-retention-rate",
    "sourceRow": 74,
    "level": "Commercial growth",
    "role": "Corporate Revenue & Insurance Lead",
    "roleId": "corporate-revenue-lead",
    "reportsTo": "Chief / Group Clinical Medical Director",
    "keyDeliverable": "Retention",
    "kpi": "Contract renewal and account retention rate",
    "definition": "Eligible accounts renewed by due date divided by eligible accounts due for renewal, with lost revenue reported.",
    "weight": 0.1,
    "targetBasis": "Annual account-retention plan",
    "review": "Monthly",
    "primaryDataSource": "Contract register / CRM",
    "keyCollaborator": "Legal Head; Group CFO",
    "definitionFamilies": [
      "Contract utilisation"
    ],
    "unresolvedReason": null,
    "catalogId": "RKM-069",
    "domain": "Commercial growth",
    "aggType": "ratio",
    "unit": "percent",
    "direction": "higher",
    "scopes": [
      "group",
      "region",
      "hospital"
    ],
    "drill": "generic",
    "measureKey": "RKM-069",
    "realNotes": {
      "scope": "",
      "howComputed": "",
      "gaps": "Needs a contract register with renewal dates (an activity-based retention proxy could be built from 2026-01 but is not part of this build)."
    }
  },
  {
    "assignmentId": "corporate-revenue-lead:contract-utilisation-and-revenue-per-account",
    "sourceRow": 75,
    "level": "Commercial growth",
    "role": "Corporate Revenue & Insurance Lead",
    "roleId": "corporate-revenue-lead",
    "reportsTo": "Chief / Group Clinical Medical Director",
    "keyDeliverable": "Account activation",
    "kpi": "Contract utilisation and revenue per account",
    "definition": "Actual use of agreed services and revenue per active account compared with account plan.",
    "weight": 0.1,
    "targetBasis": "Approved account plans",
    "review": "Monthly",
    "primaryDataSource": "HIS / finance ERP / CRM",
    "keyCollaborator": "Regional COOs; DHOs",
    "definitionFamilies": [
      "Contract utilisation"
    ],
    "unresolvedReason": null,
    "catalogId": "RKM-070",
    "domain": "Commercial growth",
    "aggType": "average",
    "unit": "KES",
    "direction": "higher",
    "scopes": [
      "group"
    ],
    "drill": "generic",
    "measureKey": "RKM-070",
    "realNotes": {
      "scope": "Group, months 2025-07 onward",
      "howComputed": "Gross billed revenue from Corporate & insurer accounts divided by the number of active accounts in the month.",
      "gaps": "Billing accounts, not contracts; utilisation against an approved account expectation needs contract data (none)."
    }
  },
  {
    "assignmentId": "corporate-revenue-lead:commercial-term-yield",
    "sourceRow": 76,
    "level": "Commercial growth",
    "role": "Corporate Revenue & Insurance Lead",
    "roleId": "corporate-revenue-lead",
    "reportsTo": "Chief / Group Clinical Medical Director",
    "keyDeliverable": "Commercial discipline",
    "kpi": "Commercial term yield",
    "definition": "Net realised rates and approved commercial terms compared with contracted rate cards and approved margin floors.",
    "weight": 0.1,
    "targetBasis": "Approved pricing and margin guardrails",
    "review": "Monthly",
    "primaryDataSource": "Contract register / finance",
    "keyCollaborator": "Group CFO; Legal Head",
    "definitionFamilies": [
      "Contract utilisation"
    ],
    "unresolvedReason": null,
    "catalogId": "RKM-071",
    "domain": "Commercial growth",
    "aggType": "ratio",
    "unit": "percent",
    "direction": "higher",
    "scopes": [
      "group",
      "region",
      "hospital"
    ],
    "drill": "generic",
    "measureKey": "RKM-071",
    "realNotes": {
      "scope": "",
      "howComputed": "",
      "gaps": "Needs a contract register / rate cards and net realised rates."
    }
  },
  {
    "assignmentId": "corporate-revenue-lead:payer-issue-closure",
    "sourceRow": 77,
    "level": "Commercial growth",
    "role": "Corporate Revenue & Insurance Lead",
    "roleId": "corporate-revenue-lead",
    "reportsTo": "Chief / Group Clinical Medical Director",
    "keyDeliverable": "Payer issue resolution",
    "kpi": "Payer issue closure",
    "definition": "Payer or corporate billing issues resolved within agreed service levels, with root causes tracked.",
    "weight": 0.1,
    "targetBasis": "Approved payer-service standard",
    "review": "Monthly",
    "primaryDataSource": "Billing system / issue tracker",
    "keyCollaborator": "Billing & Revenue Leads",
    "definitionFamilies": [
      "Denied or rejected claim value"
    ],
    "unresolvedReason": null,
    "catalogId": "RKM-072",
    "domain": "Claims & payers",
    "aggType": "ratio",
    "unit": "percent",
    "direction": "higher",
    "scopes": [
      "group",
      "region",
      "hospital"
    ],
    "drill": "generic",
    "measureKey": "RKM-072",
    "realNotes": {
      "scope": "",
      "howComputed": "",
      "gaps": "Needs a payer issue tracker (third-party payer decision times are in M12 for context only)."
    }
  },
  {
    "assignmentId": "corporate-revenue-lead:pipeline-forecast-accuracy-and-crm-completeness",
    "sourceRow": 78,
    "level": "Commercial growth",
    "role": "Corporate Revenue & Insurance Lead",
    "roleId": "corporate-revenue-lead",
    "reportsTo": "Chief / Group Clinical Medical Director",
    "keyDeliverable": "Commercial predictability",
    "kpi": "Pipeline forecast accuracy and CRM completeness",
    "definition": "Forecast compared with realised contracted revenue and completeness of required CRM fields for active accounts.",
    "weight": 0.1,
    "targetBasis": "CRM data-quality and forecast standard",
    "review": "Monthly",
    "primaryDataSource": "CRM / analytics",
    "keyCollaborator": "Head of Analytics & Digital Transformation",
    "definitionFamilies": [
      "Forecast accuracy"
    ],
    "unresolvedReason": null,
    "catalogId": "RKM-073",
    "domain": "Financial performance",
    "aggType": "ratio",
    "unit": "percent",
    "direction": "higher",
    "scopes": [
      "group",
      "region",
      "hospital"
    ],
    "drill": "generic",
    "measureKey": "RKM-073",
    "realNotes": {
      "scope": "",
      "howComputed": "",
      "gaps": "Needs CRM and forecast data."
    }
  },
  {
    "assignmentId": "group-cfo:group-ebitda-vs-approved-budget",
    "sourceRow": 79,
    "level": "Group support",
    "role": "Group CFO",
    "roleId": "group-cfo",
    "reportsTo": "Chairman",
    "keyDeliverable": "Profitability",
    "kpi": "Group EBITDA vs approved budget",
    "definition": "Finance-approved group EBITDA compared with approved budget, with region and hospital drivers reconciled.",
    "weight": 0.2,
    "targetBasis": "Board-approved EBITDA plan",
    "review": "Monthly",
    "primaryDataSource": "Finance ERP / management accounts",
    "keyCollaborator": "Chairman; Regional COOs",
    "definitionFamilies": [
      "EBITDA"
    ],
    "unresolvedReason": null,
    "catalogId": "RKM-074",
    "domain": "Financial performance",
    "aggType": "ratio",
    "unit": "percent",
    "direction": "higher",
    "scopes": [
      "group",
      "region",
      "hospital"
    ],
    "drill": "generic",
    "measureKey": "RKM-074",
    "realNotes": {
      "scope": "",
      "howComputed": "",
      "gaps": "Needs Finance ERP / management accounts (EBITDA)."
    }
  },
  {
    "assignmentId": "group-cfo:cash-flow-liquidity-and-working-capital-vs-plan",
    "sourceRow": 80,
    "level": "Group support",
    "role": "Group CFO",
    "roleId": "group-cfo",
    "reportsTo": "Chairman",
    "keyDeliverable": "Liquidity",
    "kpi": "Cash flow, liquidity and working capital vs plan",
    "definition": "Operating cash flow, liquidity headroom and working-capital position compared with approved cash plan.",
    "weight": 0.15,
    "targetBasis": "Board-approved cash-flow plan",
    "review": "Monthly",
    "primaryDataSource": "Treasury / finance ERP",
    "keyCollaborator": "Billing & Revenue Leads",
    "definitionFamilies": [
      "Operating cash flow"
    ],
    "unresolvedReason": null,
    "catalogId": "RKM-075",
    "domain": "Financial performance",
    "aggType": "ratio",
    "unit": "percent",
    "direction": "higher",
    "scopes": [
      "group",
      "region",
      "hospital"
    ],
    "drill": "generic",
    "measureKey": "RKM-075",
    "realNotes": {
      "scope": "",
      "howComputed": "",
      "gaps": "Needs treasury / finance ERP cash-flow data."
    }
  },
  {
    "assignmentId": "group-cfo:group-collections-and-dso-vs-plan",
    "sourceRow": 81,
    "level": "Group support",
    "role": "Group CFO",
    "roleId": "group-cfo",
    "reportsTo": "Chairman",
    "keyDeliverable": "Cash conversion",
    "kpi": "Group collections and DSO vs plan",
    "definition": "Group cash collections versus plan and debtor days using the group-approved calculation.",
    "weight": 0.15,
    "targetBasis": "Approved collections and DSO plan",
    "review": "Monthly",
    "primaryDataSource": "Billing system / finance ERP",
    "keyCollaborator": "Billing & Revenue Leads; Regional COOs",
    "definitionFamilies": [
      "Collections"
    ],
    "unresolvedReason": null,
    "catalogId": "RKM-076",
    "domain": "Collections & receivables",
    "aggType": "sum",
    "unit": "KES",
    "direction": "higher",
    "scopes": [
      "group",
      "region",
      "hospital"
    ],
    "drill": "generic",
    "measureKey": "RKM-076",
    "realNotes": {
      "scope": "Lifecare six hospitals (sum), months 2025-02 to 2026-03",
      "howComputed": "Cash received through the claims portal per hospital and month, summed across the hospitals; claims DSO proxy is supporting.",
      "gaps": "Portal claims only: not group collections (Bliss, Fertility Point, cash and direct insurers are missing); no collections plan; DSO is claims-only."
    }
  },
  {
    "assignmentId": "group-cfo:forecast-and-budget-quality",
    "sourceRow": 82,
    "level": "Group support",
    "role": "Group CFO",
    "roleId": "group-cfo",
    "reportsTo": "Chairman",
    "keyDeliverable": "Planning discipline",
    "kpi": "Forecast and budget quality",
    "definition": "Timely forecast submission and approved forecast accuracy for revenue, EBITDA, cash and major cost drivers.",
    "weight": 0.1,
    "targetBasis": "Finance planning calendar and accuracy standard",
    "review": "Monthly",
    "primaryDataSource": "FP&A models / finance ERP",
    "keyCollaborator": "Head of Analytics & Digital Transformation",
    "definitionFamilies": [
      "Forecast accuracy"
    ],
    "unresolvedReason": null,
    "catalogId": "RKM-077",
    "domain": "Financial performance",
    "aggType": "ratio",
    "unit": "percent",
    "direction": "higher",
    "scopes": [
      "group",
      "region",
      "hospital"
    ],
    "drill": "generic",
    "measureKey": "RKM-077",
    "realNotes": {
      "scope": "",
      "howComputed": "",
      "gaps": "Needs FP&A forecast and budget data."
    }
  },
  {
    "assignmentId": "group-cfo:controllable-cost-improvement-vs-plan",
    "sourceRow": 83,
    "level": "Group support",
    "role": "Group CFO",
    "roleId": "group-cfo",
    "reportsTo": "Chairman",
    "keyDeliverable": "Cost improvement",
    "kpi": "Controllable cost improvement vs plan",
    "definition": "Finance-validated controllable cost improvement and cost-per-service trend compared with plan, preserving quality and availability.",
    "weight": 0.15,
    "targetBasis": "Approved cost-improvement plan",
    "review": "Monthly",
    "primaryDataSource": "Finance ERP / procurement / HIS",
    "keyCollaborator": "Procurement Head; Regional COOs",
    "definitionFamilies": [
      "Procurement savings"
    ],
    "unresolvedReason": null,
    "catalogId": "RKM-078",
    "domain": "Financial performance",
    "aggType": "sum",
    "unit": "KES",
    "direction": "lower",
    "scopes": [
      "group",
      "region",
      "hospital"
    ],
    "drill": "generic",
    "measureKey": "RKM-078",
    "realNotes": {
      "scope": "",
      "howComputed": "",
      "gaps": "Needs Finance-validated cost-improvement data."
    }
  },
  {
    "assignmentId": "group-cfo:financial-controls-and-leakage-actions-closed",
    "sourceRow": 84,
    "level": "Group support",
    "role": "Group CFO",
    "roleId": "group-cfo",
    "reportsTo": "Chairman",
    "keyDeliverable": "Financial control",
    "kpi": "Financial controls and leakage actions closed",
    "definition": "Material control gaps, reconciliations and leakage actions closed by due date, with residual risk reported.",
    "weight": 0.1,
    "targetBasis": "Finance control plan",
    "review": "Monthly",
    "primaryDataSource": "Finance controls / internal audit",
    "keyCollaborator": "Billing & Revenue Leads; Legal Head",
    "definitionFamilies": [
      "Legal and compliance closure"
    ],
    "unresolvedReason": null,
    "catalogId": "RKM-079",
    "domain": "Financial performance",
    "aggType": "ratio",
    "unit": "percent",
    "direction": "higher",
    "scopes": [
      "group",
      "region",
      "hospital"
    ],
    "drill": "generic",
    "measureKey": "RKM-079",
    "realNotes": {
      "scope": "",
      "howComputed": "",
      "gaps": "Needs finance controls / internal audit trackers."
    }
  },
  {
    "assignmentId": "group-cfo:finance-compliance-and-audit-action-closure",
    "sourceRow": 85,
    "level": "Group support",
    "role": "Group CFO",
    "roleId": "group-cfo",
    "reportsTo": "Chairman",
    "keyDeliverable": "Compliance",
    "kpi": "Finance compliance and audit-action closure",
    "definition": "Finance statutory and audit actions completed by due date divided by actions due.",
    "weight": 0.15,
    "targetBasis": "Finance compliance calendar",
    "review": "Monthly",
    "primaryDataSource": "Finance compliance / audit tracker",
    "keyCollaborator": "Legal Head",
    "definitionFamilies": [
      "Legal and compliance closure"
    ],
    "unresolvedReason": null,
    "catalogId": "RKM-080",
    "domain": "Governance & data",
    "aggType": "ratio",
    "unit": "percent",
    "direction": "higher",
    "scopes": [
      "group",
      "region",
      "hospital"
    ],
    "drill": "generic",
    "measureKey": "RKM-080",
    "realNotes": {
      "scope": "",
      "howComputed": "",
      "gaps": "Needs finance compliance / audit trackers."
    }
  },
  {
    "assignmentId": "procurement-head:finance-validated-procurement-savings-vs-plan",
    "sourceRow": 86,
    "level": "Group support",
    "role": "Procurement Head",
    "roleId": "procurement-head",
    "reportsTo": "Chairman",
    "keyDeliverable": "Cost performance",
    "kpi": "Finance-validated procurement savings vs plan",
    "definition": "Finance-validated savings from negotiated purchasing versus approved baseline, compared with plan.",
    "weight": 0.2,
    "targetBasis": "Approved procurement savings plan",
    "review": "Monthly",
    "primaryDataSource": "Procurement system / finance ERP",
    "keyCollaborator": "Group CFO; Regional COOs",
    "definitionFamilies": [
      "Procurement savings"
    ],
    "unresolvedReason": null,
    "catalogId": "RKM-081",
    "domain": "Procurement & supply",
    "aggType": "sum",
    "unit": "KES",
    "direction": "higher",
    "scopes": [
      "group",
      "region",
      "hospital"
    ],
    "drill": "generic",
    "measureKey": "RKM-081",
    "realNotes": {
      "scope": "",
      "howComputed": "",
      "gaps": "Needs a procurement system with Finance-validated baselines."
    }
  },
  {
    "assignmentId": "procurement-head:contract-and-purchase-order-compliance",
    "sourceRow": 87,
    "level": "Group support",
    "role": "Procurement Head",
    "roleId": "procurement-head",
    "reportsTo": "Chairman",
    "keyDeliverable": "Buying compliance",
    "kpi": "Contract and purchase-order compliance",
    "definition": "Spend placed through approved contracts and purchase orders divided by addressable spend.",
    "weight": 0.1,
    "targetBasis": "Approved procurement compliance standard",
    "review": "Monthly",
    "primaryDataSource": "Procurement system / finance ERP",
    "keyCollaborator": "Group CFO",
    "definitionFamilies": [
      "Legal and compliance closure"
    ],
    "unresolvedReason": null,
    "catalogId": "RKM-082",
    "domain": "Procurement & supply",
    "aggType": "ratio",
    "unit": "percent",
    "direction": "higher",
    "scopes": [
      "group",
      "region",
      "hospital"
    ],
    "drill": "generic",
    "measureKey": "RKM-082",
    "realNotes": {
      "scope": "Fertility Point Parklands stores, 2026-06 only",
      "howComputed": "Share of goods-received lines that carry a purchase-order (LPO) number.",
      "gaps": "34 receipt lines from one store group in one month; spend outside receipts and contract compliance are not visible."
    }
  },
  {
    "assignmentId": "procurement-head:critical-consumable-stockouts-and-service-disruption",
    "sourceRow": 88,
    "level": "Group support",
    "role": "Procurement Head",
    "roleId": "procurement-head",
    "reportsTo": "Chairman",
    "keyDeliverable": "Supply continuity",
    "kpi": "Critical consumable stockouts and service disruption",
    "definition": "Critical stockout events and related service disruption, reported by item and root cause; no universal threshold is assumed.",
    "weight": 0.15,
    "targetBasis": "Approved critical inventory plan",
    "review": "Monthly",
    "primaryDataSource": "Inventory system / incident register",
    "keyCollaborator": "DHOs; Clinical Medical Director",
    "definitionFamilies": [
      "Inventory days / obsolete stock"
    ],
    "unresolvedReason": null,
    "catalogId": "RKM-083",
    "domain": "Procurement & supply",
    "aggType": "ratio",
    "unit": "percent",
    "direction": "higher",
    "scopes": [
      "group",
      "region",
      "hospital"
    ],
    "drill": "generic",
    "measureKey": "RKM-083",
    "realNotes": {
      "scope": "",
      "howComputed": "",
      "gaps": "Needs an inventory system and incident register (stockouts)."
    }
  },
  {
    "assignmentId": "procurement-head:inventory-days-and-obsolete-stock",
    "sourceRow": 89,
    "level": "Group support",
    "role": "Procurement Head",
    "roleId": "procurement-head",
    "reportsTo": "Chairman",
    "keyDeliverable": "Inventory discipline",
    "kpi": "Inventory days and obsolete stock",
    "definition": "Inventory days and obsolete or expiring stock value measured using the group-approved inventory policy.",
    "weight": 0.15,
    "targetBasis": "Approved inventory plan",
    "review": "Monthly",
    "primaryDataSource": "Inventory system / finance ERP",
    "keyCollaborator": "Group CFO; DHOs",
    "definitionFamilies": [
      "Inventory days / obsolete stock"
    ],
    "unresolvedReason": null,
    "catalogId": "RKM-084",
    "domain": "Procurement & supply",
    "aggType": "ratio",
    "unit": "percent",
    "direction": "lower",
    "scopes": [
      "group",
      "region",
      "hospital"
    ],
    "drill": "generic",
    "measureKey": "RKM-084",
    "realNotes": {
      "scope": "Fertility Point Parklands stores, 2026-06 only",
      "howComputed": "Value of goods received that expire within 12 months of the latest receipt, as a share of value received.",
      "gaps": "Receipts only, not stock on hand, and no consumption data, so inventory days cannot be computed; one store group, one month."
    }
  },
  {
    "assignmentId": "procurement-head:purchase-request-to-purchase-order-turnaround",
    "sourceRow": 90,
    "level": "Group support",
    "role": "Procurement Head",
    "roleId": "procurement-head",
    "reportsTo": "Chairman",
    "keyDeliverable": "Service responsiveness",
    "kpi": "Purchase request to purchase-order turnaround",
    "definition": "Median or approved percentile time from complete approved request to issued purchase order.",
    "weight": 0.1,
    "targetBasis": "Approved procurement service level",
    "review": "Monthly",
    "primaryDataSource": "Procurement system",
    "keyCollaborator": "DHOs",
    "definitionFamilies": [
      "Procurement savings"
    ],
    "unresolvedReason": null,
    "catalogId": "RKM-085",
    "domain": "Procurement & supply",
    "aggType": "ratio",
    "unit": "percent",
    "direction": "higher",
    "scopes": [
      "group",
      "region",
      "hospital"
    ],
    "drill": "generic",
    "measureKey": "RKM-085",
    "realNotes": {
      "scope": "",
      "howComputed": "",
      "gaps": "Needs a procurement system (request and PO timestamps)."
    }
  },
  {
    "assignmentId": "procurement-head:supplier-quality-and-service-level-performance",
    "sourceRow": 91,
    "level": "Group support",
    "role": "Procurement Head",
    "roleId": "procurement-head",
    "reportsTo": "Chairman",
    "keyDeliverable": "Vendor performance",
    "kpi": "Supplier quality and service-level performance",
    "definition": "Supplier delivery, quality and service performance against approved service levels.",
    "weight": 0.1,
    "targetBasis": "Approved vendor scorecard",
    "review": "Monthly",
    "primaryDataSource": "Procurement system / user feedback",
    "keyCollaborator": "DHOs; Clinical Leads",
    "definitionFamilies": [
      "Procurement savings"
    ],
    "unresolvedReason": null,
    "catalogId": "RKM-086",
    "domain": "Procurement & supply",
    "aggType": "ratio",
    "unit": "percent",
    "direction": "higher",
    "scopes": [
      "group",
      "region",
      "hospital"
    ],
    "drill": "generic",
    "measureKey": "RKM-086",
    "realNotes": {
      "scope": "",
      "howComputed": "",
      "gaps": "Needs supplier delivery and quality records (supplier concentration is in M16 for context only)."
    }
  },
  {
    "assignmentId": "procurement-head:rate-card-adherence-and-maverick-spend",
    "sourceRow": 92,
    "level": "Group support",
    "role": "Procurement Head",
    "roleId": "procurement-head",
    "reportsTo": "Chairman",
    "keyDeliverable": "Price discipline",
    "kpi": "Rate-card adherence and maverick spend",
    "definition": "Spend at approved prices and outside approved buying channels, reported with remediation actions.",
    "weight": 0.1,
    "targetBasis": "Approved rate-card and compliance standard",
    "review": "Monthly",
    "primaryDataSource": "Procurement system / finance ERP",
    "keyCollaborator": "Group CFO",
    "definitionFamilies": [
      "Procurement savings"
    ],
    "unresolvedReason": null,
    "catalogId": "RKM-087",
    "domain": "Procurement & supply",
    "aggType": "ratio",
    "unit": "percent",
    "direction": "lower",
    "scopes": [
      "group",
      "region",
      "hospital"
    ],
    "drill": "generic",
    "measureKey": "RKM-087",
    "realNotes": {
      "scope": "Fertility Point Parklands stores, 2026-06 only",
      "howComputed": "Share of items received at more than one unit rate in the month.",
      "gaps": "No approved rate card exists in the data; one store group, one month; maverick spend outside approved channels not visible."
    }
  },
  {
    "assignmentId": "procurement-head:supplier-risk-and-continuity-actions-closed",
    "sourceRow": 93,
    "level": "Group support",
    "role": "Procurement Head",
    "roleId": "procurement-head",
    "reportsTo": "Chairman",
    "keyDeliverable": "Resilience",
    "kpi": "Supplier risk and continuity actions closed",
    "definition": "High-risk supplier continuity actions closed by due date divided by actions due.",
    "weight": 0.1,
    "targetBasis": "Approved supplier-risk plan",
    "review": "Monthly",
    "primaryDataSource": "Supplier risk register",
    "keyCollaborator": "Legal Head; DHOs",
    "definitionFamilies": [
      "Inventory days / obsolete stock"
    ],
    "unresolvedReason": null,
    "catalogId": "RKM-088",
    "domain": "Procurement & supply",
    "aggType": "ratio",
    "unit": "percent",
    "direction": "higher",
    "scopes": [
      "group",
      "region",
      "hospital"
    ],
    "drill": "generic",
    "measureKey": "RKM-088",
    "realNotes": {
      "scope": "",
      "howComputed": "",
      "gaps": "Needs a supplier risk register."
    }
  },
  {
    "assignmentId": "hr-head:group-workforce-cost-and-productivity-vs-plan",
    "sourceRow": 94,
    "level": "Group support",
    "role": "HR Head",
    "roleId": "hr-head",
    "reportsTo": "Chairman",
    "keyDeliverable": "Workforce economics",
    "kpi": "Group workforce cost and productivity vs plan",
    "definition": "Approved workforce cost and output-per-FTE measures compared with plan, reported by function and facility.",
    "weight": 0.15,
    "targetBasis": "Approved workforce and productivity plan",
    "review": "Monthly",
    "primaryDataSource": "HRIS / payroll / HIS / finance",
    "keyCollaborator": "Group CFO; Regional COOs",
    "definitionFamilies": [
      "Workforce productivity"
    ],
    "unresolvedReason": null,
    "catalogId": "RKM-089",
    "domain": "People",
    "aggType": "ratio",
    "unit": "percent",
    "direction": "lower",
    "scopes": [
      "group",
      "region",
      "hospital"
    ],
    "drill": "generic",
    "measureKey": "RKM-089",
    "realNotes": {
      "scope": "Operating sites with both payroll and revenue, pay month 2026-06 only",
      "howComputed": "Monthly gross payroll (permanent plus locum) divided by gross billed revenue at the site, with visits per head as productivity context.",
      "gaps": "Direct site payroll only (head-office costs not included); no approved plan; one month; headcount not FTE."
    }
  },
  {
    "assignmentId": "hr-head:critical-role-staffing-and-time-to-hire",
    "sourceRow": 95,
    "level": "Group support",
    "role": "HR Head",
    "roleId": "hr-head",
    "reportsTo": "Chairman",
    "keyDeliverable": "Critical talent",
    "kpi": "Critical-role staffing and time to hire",
    "definition": "Critical roles filled divided by approved critical roles, plus time-to-fill for critical vacancies.",
    "weight": 0.15,
    "targetBasis": "Approved workforce plan",
    "review": "Monthly",
    "primaryDataSource": "HRIS / recruitment tracker",
    "keyCollaborator": "People Executives; DHOs",
    "definitionFamilies": [
      "Critical-role attrition"
    ],
    "unresolvedReason": null,
    "catalogId": "RKM-090",
    "domain": "People",
    "aggType": "ratio",
    "unit": "percent",
    "direction": "higher",
    "scopes": [
      "group",
      "region",
      "hospital"
    ],
    "drill": "generic",
    "measureKey": "RKM-090",
    "realNotes": {
      "scope": "",
      "howComputed": "",
      "gaps": "Needs HRIS / recruitment tracker."
    }
  },
  {
    "assignmentId": "hr-head:group-and-critical-role-attrition",
    "sourceRow": 96,
    "level": "Group support",
    "role": "HR Head",
    "roleId": "hr-head",
    "reportsTo": "Chairman",
    "keyDeliverable": "Retention",
    "kpi": "Group and critical-role attrition",
    "definition": "Voluntary and total attrition, including designated critical roles, compared with approved retention plan.",
    "weight": 0.15,
    "targetBasis": "Approved retention plan",
    "review": "Monthly",
    "primaryDataSource": "HRIS",
    "keyCollaborator": "People Executives; Regional COOs",
    "definitionFamilies": [
      "Critical-role attrition"
    ],
    "unresolvedReason": null,
    "catalogId": "RKM-091",
    "domain": "People",
    "aggType": "ratio",
    "unit": "percent",
    "direction": "higher",
    "scopes": [
      "group",
      "region",
      "hospital"
    ],
    "drill": "generic",
    "measureKey": "RKM-091",
    "realNotes": {
      "scope": "",
      "howComputed": "",
      "gaps": "Needs HRIS exit data."
    }
  },
  {
    "assignmentId": "hr-head:group-engagement-score-and-action-closure",
    "sourceRow": 97,
    "level": "Group support",
    "role": "HR Head",
    "roleId": "hr-head",
    "reportsTo": "Chairman",
    "keyDeliverable": "Employee experience",
    "kpi": "Group engagement score and action closure",
    "definition": "Approved group engagement score and action-plan completion by due date.",
    "weight": 0.15,
    "targetBasis": "Annual engagement plan",
    "review": "Monthly",
    "primaryDataSource": "Engagement survey / HR tracker",
    "keyCollaborator": "People Executives; Regional COOs",
    "definitionFamilies": [
      "Engagement"
    ],
    "unresolvedReason": null,
    "catalogId": "RKM-092",
    "domain": "People",
    "aggType": "average",
    "unit": "score",
    "direction": "higher",
    "scopes": [
      "group",
      "region",
      "hospital"
    ],
    "drill": "generic",
    "measureKey": "RKM-092",
    "realNotes": {
      "scope": "",
      "howComputed": "",
      "gaps": "Needs an engagement survey / HR tracker."
    }
  },
  {
    "assignmentId": "hr-head:mandatory-learning-capability-and-succession-coverage",
    "sourceRow": 98,
    "level": "Group support",
    "role": "HR Head",
    "roleId": "hr-head",
    "reportsTo": "Chairman",
    "keyDeliverable": "Capability and succession",
    "kpi": "Mandatory learning, capability and succession coverage",
    "definition": "Required workforce meeting learning or capability requirements and critical roles with approved succession coverage.",
    "weight": 0.15,
    "targetBasis": "Approved capability and succession plan",
    "review": "Monthly",
    "primaryDataSource": "LMS / HRIS / medical affairs",
    "keyCollaborator": "Clinical Medical Director",
    "definitionFamilies": [
      "Mandatory learning / credentialing"
    ],
    "unresolvedReason": null,
    "catalogId": "RKM-093",
    "domain": "People",
    "aggType": "ratio",
    "unit": "percent",
    "direction": "higher",
    "scopes": [
      "group",
      "region",
      "hospital"
    ],
    "drill": "generic",
    "measureKey": "RKM-093",
    "realNotes": {
      "scope": "",
      "howComputed": "",
      "gaps": "Needs LMS / HRIS / medical affairs data."
    }
  },
  {
    "assignmentId": "hr-head:performance-management-and-talent-review-completion",
    "sourceRow": 99,
    "level": "Group support",
    "role": "HR Head",
    "roleId": "hr-head",
    "reportsTo": "Chairman",
    "keyDeliverable": "Performance culture",
    "kpi": "Performance-management and talent-review completion",
    "definition": "Eligible workforce with completed performance review and current talent review divided by eligible workforce.",
    "weight": 0.1,
    "targetBasis": "Group performance calendar",
    "review": "Monthly",
    "primaryDataSource": "HRIS",
    "keyCollaborator": "People Executives",
    "definitionFamilies": [
      "Mandatory learning / credentialing"
    ],
    "unresolvedReason": null,
    "catalogId": "RKM-094",
    "domain": "People",
    "aggType": "ratio",
    "unit": "percent",
    "direction": "higher",
    "scopes": [
      "group",
      "region",
      "hospital"
    ],
    "drill": "generic",
    "measureKey": "RKM-094",
    "realNotes": {
      "scope": "",
      "howComputed": "",
      "gaps": "Needs HRIS performance and talent-review data."
    }
  },
  {
    "assignmentId": "hr-head:employment-compliance-and-grievance-closure",
    "sourceRow": 100,
    "level": "Group support",
    "role": "HR Head",
    "roleId": "hr-head",
    "reportsTo": "Chairman",
    "keyDeliverable": "Employment governance",
    "kpi": "Employment compliance and grievance closure",
    "definition": "Employment compliance actions and grievances closed to approved service levels, with material exceptions escalated.",
    "weight": 0.15,
    "targetBasis": "HR compliance calendar",
    "review": "Monthly",
    "primaryDataSource": "HR compliance tracker",
    "keyCollaborator": "Legal Head",
    "definitionFamilies": [
      "Legal and compliance closure"
    ],
    "unresolvedReason": null,
    "catalogId": "RKM-095",
    "domain": "People",
    "aggType": "ratio",
    "unit": "percent",
    "direction": "higher",
    "scopes": [
      "group",
      "region",
      "hospital"
    ],
    "drill": "generic",
    "measureKey": "RKM-095",
    "realNotes": {
      "scope": "",
      "howComputed": "",
      "gaps": "Needs an HR compliance / grievance tracker."
    }
  },
  {
    "assignmentId": "legal-head:contract-turnaround-time",
    "sourceRow": 101,
    "level": "Group support",
    "role": "Legal Head",
    "roleId": "legal-head",
    "reportsTo": "Chairman",
    "keyDeliverable": "Commercial enablement",
    "kpi": "Contract turnaround time",
    "definition": "Median or approved percentile time to complete standard and non-standard contracts, segmented by risk category.",
    "weight": 0.15,
    "targetBasis": "Approved legal service levels",
    "review": "Monthly",
    "primaryDataSource": "Contract lifecycle system",
    "keyCollaborator": "Corporate Revenue & Insurance Lead; Procurement Head",
    "definitionFamilies": [
      "Legal and compliance closure"
    ],
    "unresolvedReason": null,
    "catalogId": "RKM-096",
    "domain": "Governance & data",
    "aggType": "ratio",
    "unit": "percent",
    "direction": "higher",
    "scopes": [
      "group",
      "region",
      "hospital"
    ],
    "drill": "generic",
    "measureKey": "RKM-096",
    "realNotes": {
      "scope": "",
      "howComputed": "",
      "gaps": "Needs a contract lifecycle system."
    }
  },
  {
    "assignmentId": "legal-head:high-risk-contract-review-and-approval-compliance",
    "sourceRow": 102,
    "level": "Group support",
    "role": "Legal Head",
    "roleId": "legal-head",
    "reportsTo": "Chairman",
    "keyDeliverable": "Risk management",
    "kpi": "High-risk contract review and approval compliance",
    "definition": "High-risk agreements receiving required review and approval before execution divided by high-risk agreements executed.",
    "weight": 0.15,
    "targetBasis": "Approved contract approval policy",
    "review": "Monthly",
    "primaryDataSource": "Contract register",
    "keyCollaborator": "Corporate Revenue & Insurance Lead; Procurement Head",
    "definitionFamilies": [
      "Legal and compliance closure"
    ],
    "unresolvedReason": null,
    "catalogId": "RKM-097",
    "domain": "Governance & data",
    "aggType": "ratio",
    "unit": "percent",
    "direction": "higher",
    "scopes": [
      "group",
      "region",
      "hospital"
    ],
    "drill": "generic",
    "measureKey": "RKM-097",
    "realNotes": {
      "scope": "",
      "howComputed": "",
      "gaps": "Needs a contract register with approval records."
    }
  },
  {
    "assignmentId": "legal-head:license-filing-and-regulatory-calendar-compliance",
    "sourceRow": 103,
    "level": "Group support",
    "role": "Legal Head",
    "roleId": "legal-head",
    "reportsTo": "Chairman",
    "keyDeliverable": "Regulatory compliance",
    "kpi": "License, filing and regulatory-calendar compliance",
    "definition": "Required filings, licences and registrations completed or renewed by due date divided by items due.",
    "weight": 0.2,
    "targetBasis": "Approved regulatory calendar",
    "review": "Monthly",
    "primaryDataSource": "Legal compliance register",
    "keyCollaborator": "DHOs; HR Head",
    "definitionFamilies": [
      "Legal and compliance closure"
    ],
    "unresolvedReason": null,
    "catalogId": "RKM-098",
    "domain": "Governance & data",
    "aggType": "ratio",
    "unit": "percent",
    "direction": "higher",
    "scopes": [
      "group",
      "region",
      "hospital"
    ],
    "drill": "generic",
    "measureKey": "RKM-098",
    "realNotes": {
      "scope": "",
      "howComputed": "",
      "gaps": "Needs a legal compliance register."
    }
  },
  {
    "assignmentId": "legal-head:material-litigation-and-dispute-action-milestones",
    "sourceRow": 104,
    "level": "Group support",
    "role": "Legal Head",
    "roleId": "legal-head",
    "reportsTo": "Chairman",
    "keyDeliverable": "Dispute management",
    "kpi": "Material litigation and dispute action milestones",
    "definition": "Material matters with current strategy, owner and action milestones completed by due date; report exposure separately.",
    "weight": 0.15,
    "targetBasis": "Approved legal risk plan",
    "review": "Monthly",
    "primaryDataSource": "Legal matter tracker",
    "keyCollaborator": "Group CFO; Chairman",
    "definitionFamilies": [
      "Legal and compliance closure"
    ],
    "unresolvedReason": null,
    "catalogId": "RKM-099",
    "domain": "Governance & data",
    "aggType": "ratio",
    "unit": "percent",
    "direction": "higher",
    "scopes": [
      "group",
      "region",
      "hospital"
    ],
    "drill": "generic",
    "measureKey": "RKM-099",
    "realNotes": {
      "scope": "",
      "howComputed": "",
      "gaps": "Needs a legal matter tracker."
    }
  },
  {
    "assignmentId": "legal-head:commercial-and-payer-dispute-support-turnaround",
    "sourceRow": 105,
    "level": "Group support",
    "role": "Legal Head",
    "roleId": "legal-head",
    "reportsTo": "Chairman",
    "keyDeliverable": "Revenue protection",
    "kpi": "Commercial and payer dispute support turnaround",
    "definition": "Commercial or payer disputes supported within agreed service levels, with recovery or avoidance value reported where validated.",
    "weight": 0.1,
    "targetBasis": "Approved legal service levels",
    "review": "Monthly",
    "primaryDataSource": "Legal matter tracker / billing tracker",
    "keyCollaborator": "Billing & Revenue Leads; Corporate Revenue & Insurance Lead",
    "definitionFamilies": [
      "Legal and compliance closure"
    ],
    "unresolvedReason": null,
    "catalogId": "RKM-100",
    "domain": "Governance & data",
    "aggType": "ratio",
    "unit": "percent",
    "direction": "higher",
    "scopes": [
      "group",
      "region",
      "hospital"
    ],
    "drill": "generic",
    "measureKey": "RKM-100",
    "realNotes": {
      "scope": "",
      "howComputed": "",
      "gaps": "Needs a legal matter / billing dispute tracker."
    }
  },
  {
    "assignmentId": "legal-head:policy-refresh-and-required-legal-training-completion",
    "sourceRow": 106,
    "level": "Group support",
    "role": "Legal Head",
    "roleId": "legal-head",
    "reportsTo": "Chairman",
    "keyDeliverable": "Policy governance",
    "kpi": "Policy refresh and required legal training completion",
    "definition": "Policies due for review refreshed and required legal or compliance learning completed by required employees.",
    "weight": 0.1,
    "targetBasis": "Policy calendar and training plan",
    "review": "Monthly",
    "primaryDataSource": "Policy register / LMS",
    "keyCollaborator": "HR Head",
    "definitionFamilies": [
      "Legal and compliance closure"
    ],
    "unresolvedReason": null,
    "catalogId": "RKM-101",
    "domain": "Governance & data",
    "aggType": "ratio",
    "unit": "percent",
    "direction": "higher",
    "scopes": [
      "group",
      "region",
      "hospital"
    ],
    "drill": "generic",
    "measureKey": "RKM-101",
    "realNotes": {
      "scope": "",
      "howComputed": "",
      "gaps": "Needs a policy register / LMS."
    }
  },
  {
    "assignmentId": "legal-head:governance-and-audit-legal-actions-closed",
    "sourceRow": 107,
    "level": "Group support",
    "role": "Legal Head",
    "roleId": "legal-head",
    "reportsTo": "Chairman",
    "keyDeliverable": "Assurance",
    "kpi": "Governance and audit legal actions closed",
    "definition": "Legal, governance and audit actions closed by due date divided by actions due, with critical exceptions escalated.",
    "weight": 0.15,
    "targetBasis": "Governance action plan",
    "review": "Monthly",
    "primaryDataSource": "Governance tracker / audit tracker",
    "keyCollaborator": "Chairman; Group CFO",
    "definitionFamilies": [
      "Legal and compliance closure"
    ],
    "unresolvedReason": null,
    "catalogId": "RKM-102",
    "domain": "Governance & data",
    "aggType": "ratio",
    "unit": "percent",
    "direction": "higher",
    "scopes": [
      "group",
      "region",
      "hospital"
    ],
    "drill": "generic",
    "measureKey": "RKM-102",
    "realNotes": {
      "scope": "",
      "howComputed": "",
      "gaps": "Needs a governance / audit tracker."
    }
  },
  {
    "assignmentId": "analytics-head:kpi-dashboard-availability-and-refresh-on-time",
    "sourceRow": 108,
    "level": "Group support",
    "role": "Head of Analytics & Digital Transformation",
    "roleId": "analytics-head",
    "reportsTo": "Chairman",
    "keyDeliverable": "Reliable decision support",
    "kpi": "KPI dashboard availability and refresh on time",
    "definition": "Critical approved dashboards available and refreshed to the agreed timetable divided by dashboards due.",
    "weight": 0.15,
    "targetBasis": "Approved reporting calendar and service level",
    "review": "Monthly",
    "primaryDataSource": "BI platform / data operations log",
    "keyCollaborator": "All executive owners",
    "definitionFamilies": [
      "KPI data quality"
    ],
    "unresolvedReason": null,
    "catalogId": "RKM-103",
    "domain": "Governance & data",
    "aggType": "ratio",
    "unit": "percent",
    "direction": "higher",
    "scopes": [
      "group",
      "region",
      "hospital"
    ],
    "drill": "generic",
    "measureKey": "RKM-103",
    "realNotes": {
      "scope": "",
      "howComputed": "",
      "gaps": "Needs a BI platform refresh log (source-data freshness is in M20 for context only)."
    }
  },
  {
    "assignmentId": "analytics-head:kpi-data-quality-and-reconciliation",
    "sourceRow": 109,
    "level": "Group support",
    "role": "Head of Analytics & Digital Transformation",
    "roleId": "analytics-head",
    "reportsTo": "Chairman",
    "keyDeliverable": "Trusted data",
    "kpi": "KPI data quality and reconciliation",
    "definition": "Critical KPI data meeting defined completeness, consistency and finance or source-system reconciliation checks.",
    "weight": 0.2,
    "targetBasis": "Approved data-quality standards",
    "review": "Monthly",
    "primaryDataSource": "Data-quality controls / finance reconciliation",
    "keyCollaborator": "Group CFO; Billing & Revenue Leads",
    "definitionFamilies": [
      "KPI data quality"
    ],
    "unresolvedReason": null,
    "catalogId": "RKM-104",
    "domain": "Governance & data",
    "aggType": "ratio",
    "unit": "percent",
    "direction": "higher",
    "scopes": [
      "group"
    ],
    "drill": "generic",
    "measureKey": "RKM-104",
    "realNotes": {
      "scope": "The 11 source tables feeding the KPIs, latest data month",
      "howComputed": "Share of completeness and consistency checks passed across the source tables (key present, key unique where expected, site mapped), inside each table's clean window.",
      "gaps": "No reconciliation to Finance or to source systems, no timeliness-to-calendar check; the clean rules remove part of some tables."
    }
  },
  {
    "assignmentId": "analytics-head:monthly-kpi-pack-delivered-to-calendar",
    "sourceRow": 110,
    "level": "Group support",
    "role": "Head of Analytics & Digital Transformation",
    "roleId": "analytics-head",
    "reportsTo": "Chairman",
    "keyDeliverable": "Timely management information",
    "kpi": "Monthly KPI pack delivered to calendar",
    "definition": "Monthly management KPI pack delivered complete and accurate by the agreed date divided by packs due.",
    "weight": 0.15,
    "targetBasis": "Group reporting calendar",
    "review": "Monthly",
    "primaryDataSource": "BI platform / reporting calendar",
    "keyCollaborator": "Chairman; Group CFO",
    "definitionFamilies": [
      "KPI data quality"
    ],
    "unresolvedReason": null,
    "catalogId": "RKM-105",
    "domain": "Governance & data",
    "aggType": "ratio",
    "unit": "percent",
    "direction": "higher",
    "scopes": [
      "group",
      "region",
      "hospital"
    ],
    "drill": "generic",
    "measureKey": "RKM-105",
    "realNotes": {
      "scope": "",
      "howComputed": "",
      "gaps": "Needs a reporting calendar and delivery log."
    }
  },
  {
    "assignmentId": "analytics-head:priority-dashboard-adoption-and-report-rationalisation",
    "sourceRow": 111,
    "level": "Group support",
    "role": "Head of Analytics & Digital Transformation",
    "roleId": "analytics-head",
    "reportsTo": "Chairman",
    "keyDeliverable": "Adoption",
    "kpi": "Priority dashboard adoption and report rationalisation",
    "definition": "Target users actively using priority dashboards and retirement of duplicate manual reports against plan.",
    "weight": 0.1,
    "targetBasis": "Approved analytics adoption plan",
    "review": "Monthly",
    "primaryDataSource": "BI usage logs / report inventory",
    "keyCollaborator": "All executive owners",
    "definitionFamilies": [
      "KPI data quality"
    ],
    "unresolvedReason": null,
    "catalogId": "RKM-106",
    "domain": "Governance & data",
    "aggType": "ratio",
    "unit": "percent",
    "direction": "higher",
    "scopes": [
      "group",
      "region",
      "hospital"
    ],
    "drill": "generic",
    "measureKey": "RKM-106",
    "realNotes": {
      "scope": "",
      "howComputed": "",
      "gaps": "Needs BI usage logs."
    }
  },
  {
    "assignmentId": "analytics-head:revenue-collections-and-cash-forecast-accuracy",
    "sourceRow": 112,
    "level": "Group support",
    "role": "Head of Analytics & Digital Transformation",
    "roleId": "analytics-head",
    "reportsTo": "Chairman",
    "keyDeliverable": "Forecast support",
    "kpi": "Revenue, collections and cash forecast accuracy",
    "definition": "Approved forecast accuracy measure comparing forecast with actual revenue, collections and cash over the agreed horizon.",
    "weight": 0.15,
    "targetBasis": "Finance planning accuracy standard",
    "review": "Monthly",
    "primaryDataSource": "BI platform / finance ERP",
    "keyCollaborator": "Group CFO; Regional COOs",
    "definitionFamilies": [
      "Collections"
    ],
    "unresolvedReason": null,
    "catalogId": "RKM-107",
    "domain": "Financial performance",
    "aggType": "sum",
    "unit": "KES",
    "direction": "higher",
    "scopes": [
      "group",
      "region",
      "hospital"
    ],
    "drill": "generic",
    "measureKey": "RKM-107",
    "realNotes": {
      "scope": "",
      "howComputed": "",
      "gaps": "Needs FP&A forecast and actuals for revenue, collections and cash."
    }
  },
  {
    "assignmentId": "analytics-head:approved-insight-actions-closed",
    "sourceRow": 113,
    "level": "Group support",
    "role": "Head of Analytics & Digital Transformation",
    "roleId": "analytics-head",
    "reportsTo": "Chairman",
    "keyDeliverable": "Actionable insight",
    "kpi": "Approved insight actions closed",
    "definition": "Prioritised data-led actions accepted by owners and closed by due date divided by actions due.",
    "weight": 0.1,
    "targetBasis": "Approved insight-action plan",
    "review": "Monthly",
    "primaryDataSource": "Analytics action tracker",
    "keyCollaborator": "Regional COOs; DHOs",
    "definitionFamilies": [
      "KPI data quality"
    ],
    "unresolvedReason": null,
    "catalogId": "RKM-108",
    "domain": "Governance & data",
    "aggType": "ratio",
    "unit": "percent",
    "direction": "higher",
    "scopes": [
      "group",
      "region",
      "hospital"
    ],
    "drill": "generic",
    "measureKey": "RKM-108",
    "realNotes": {
      "scope": "",
      "howComputed": "",
      "gaps": "Needs an analytics action tracker."
    }
  },
  {
    "assignmentId": "analytics-head:digital-roadmap-and-benefit-realisation",
    "sourceRow": 114,
    "level": "Group support",
    "role": "Head of Analytics & Digital Transformation",
    "roleId": "analytics-head",
    "reportsTo": "Chairman",
    "keyDeliverable": "Digital value",
    "kpi": "Digital roadmap and benefit realisation",
    "definition": "Approved digital milestones delivered and finance-validated benefits realised versus business case.",
    "weight": 0.15,
    "targetBasis": "Approved digital roadmap and business cases",
    "review": "Monthly",
    "primaryDataSource": "Project portfolio / finance",
    "keyCollaborator": "Chairman; Group CFO",
    "definitionFamilies": [
      "Forecast accuracy"
    ],
    "unresolvedReason": null,
    "catalogId": "RKM-109",
    "domain": "Governance & data",
    "aggType": "ratio",
    "unit": "percent",
    "direction": "higher",
    "scopes": [
      "group",
      "region",
      "hospital"
    ],
    "drill": "generic",
    "measureKey": "RKM-109",
    "realNotes": {
      "scope": "",
      "howComputed": "",
      "gaps": "Needs a project portfolio / benefit register."
    }
  }
] as const;
