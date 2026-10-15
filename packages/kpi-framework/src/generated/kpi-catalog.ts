/**
 * GENERATED FILE — Command Center KPI Catalog (RKM-001 to RKM-109).
 * Combines Command Center domain/unit/aggregation/drill metadata with
 * the canonical workbook assignments and definition families.
 */

import type { KpiCatalogEntry, KpiDomain } from "../types.ts";

export const DOMAINS: readonly KpiDomain[] = [
  "Financial performance",
  "Collections & receivables",
  "Capacity & throughput",
  "Patient experience",
  "Clinical quality",
  "Claims & payers",
  "People",
  "Commercial growth",
  "Procurement & supply",
  "Governance & data"
] as const;

export const KPI_CATALOG: readonly KpiCatalogEntry[] = [
  {
    "id": "RKM-001",
    "personaId": "chairman",
    "role": "Chairman",
    "level": "Group governance",
    "reportsTo": "Board / shareholders",
    "keyDeliverable": "Profitable group growth",
    "label": "Group net revenue vs approved budget",
    "definition": "Finance-approved group net revenue for the period divided by the approved budget for the same period.",
    "weight": 0.2,
    "targetBasis": "Board-approved annual and monthly budget",
    "cadence": "Monthly",
    "primarySource": "Finance ERP / management accounts",
    "collaborators": "Group CFO; Regional COOs",
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
    },
    "assignmentId": "chairman:group-net-revenue-vs-approved-budget",
    "roleId": "chairman",
    "sourceRow": 6,
    "definitionFamilies": [
      "Net revenue"
    ]
  },
  {
    "id": "RKM-002",
    "personaId": "chairman",
    "role": "Chairman",
    "level": "Group governance",
    "reportsTo": "Board / shareholders",
    "keyDeliverable": "Profitable group growth",
    "label": "Group EBITDA vs approved budget",
    "definition": "Finance-approved group EBITDA compared with approved budget, using one group accounting definition.",
    "weight": 0.2,
    "targetBasis": "Board-approved EBITDA plan",
    "cadence": "Monthly",
    "primarySource": "Finance ERP / management accounts",
    "collaborators": "Group CFO; Regional COOs",
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
    },
    "assignmentId": "chairman:group-ebitda-vs-approved-budget",
    "roleId": "chairman",
    "sourceRow": 7,
    "definitionFamilies": [
      "EBITDA"
    ]
  },
  {
    "id": "RKM-003",
    "personaId": "chairman",
    "role": "Chairman",
    "level": "Group governance",
    "reportsTo": "Board / shareholders",
    "keyDeliverable": "Financial sustainability",
    "label": "Operating cash flow and working capital vs plan",
    "definition": "Operating cash flow and working-capital position compared with the approved cash plan.",
    "weight": 0.15,
    "targetBasis": "Board-approved cash-flow plan",
    "cadence": "Monthly",
    "primarySource": "Treasury / finance ERP",
    "collaborators": "Group CFO; Billing & Revenue Leads",
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
    },
    "assignmentId": "chairman:operating-cash-flow-and-working-capital-vs-plan",
    "roleId": "chairman",
    "sourceRow": 8,
    "definitionFamilies": [
      "Operating cash flow"
    ]
  },
  {
    "id": "RKM-004",
    "personaId": "chairman",
    "role": "Chairman",
    "level": "Group governance",
    "reportsTo": "Board / shareholders",
    "keyDeliverable": "Safe, effective clinical care",
    "label": "Group clinical quality and safety index",
    "definition": "Approved clinical-quality composite, reported with its approved component definitions and risk adjustment where applicable.",
    "weight": 0.15,
    "targetBasis": "Board-approved clinical quality plan",
    "cadence": "Monthly",
    "primarySource": "Quality system / HIS / clinical audit",
    "collaborators": "Chief / Group Clinical Medical Director",
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
    },
    "assignmentId": "chairman:group-clinical-quality-and-safety-index",
    "roleId": "chairman",
    "sourceRow": 9,
    "definitionFamilies": [
      "Clinical quality scorecard"
    ]
  },
  {
    "id": "RKM-005",
    "personaId": "chairman",
    "role": "Chairman",
    "level": "Group governance",
    "reportsTo": "Board / shareholders",
    "keyDeliverable": "Patient-centred care",
    "label": "Group patient experience index",
    "definition": "Approved patient-experience survey composite for hospitals and clinics, with response-rate context.",
    "weight": 0.1,
    "targetBasis": "Annual patient-experience plan",
    "cadence": "Monthly",
    "primarySource": "Patient feedback platform / complaint register",
    "collaborators": "Regional COOs; DHOs",
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
    },
    "assignmentId": "chairman:group-patient-experience-index",
    "roleId": "chairman",
    "sourceRow": 10,
    "definitionFamilies": [
      "Patient experience"
    ]
  },
  {
    "id": "RKM-006",
    "personaId": "chairman",
    "role": "Chairman",
    "level": "Group governance",
    "reportsTo": "Board / shareholders",
    "keyDeliverable": "Strategic growth",
    "label": "COE, corporate and expansion milestones",
    "definition": "Share of Board-approved growth milestones completed on time and to approved financial and clinical cases.",
    "weight": 0.1,
    "targetBasis": "Board-approved strategic plan",
    "cadence": "Monthly",
    "primarySource": "Strategy tracker / finance / CRM",
    "collaborators": "Clinical Medical Director; Corporate Revenue & Insurance Lead",
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
    },
    "assignmentId": "chairman:coe-corporate-and-expansion-milestones",
    "roleId": "chairman",
    "sourceRow": 11,
    "definitionFamilies": [
      "COE contribution",
      "Contract utilisation"
    ]
  },
  {
    "id": "RKM-007",
    "personaId": "chairman",
    "role": "Chairman",
    "level": "Group governance",
    "reportsTo": "Board / shareholders",
    "keyDeliverable": "Governance and resilience",
    "label": "Critical governance, legal and audit actions closed",
    "definition": "Critical actions closed by the agreed due date divided by critical actions due in the period.",
    "weight": 0.1,
    "targetBasis": "Board governance calendar",
    "cadence": "Monthly",
    "primarySource": "Governance tracker / legal register / audit tracker",
    "collaborators": "Legal Head; Group CFO; HR Head",
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
    },
    "assignmentId": "chairman:critical-governance-legal-and-audit-actions-closed",
    "roleId": "chairman",
    "sourceRow": 12,
    "definitionFamilies": [
      "Legal and compliance closure"
    ]
  },
  {
    "id": "RKM-008",
    "personaId": "chief-group-clinical-medical-director",
    "role": "Chief / Group Clinical Medical Director",
    "level": "Group clinical leadership",
    "reportsTo": "Chairman",
    "keyDeliverable": "Clinical governance",
    "label": "Clinical quality scorecard",
    "definition": "Approved clinical-quality composite across the group, using documented indicators and valid denominators.",
    "weight": 0.2,
    "targetBasis": "Approved annual clinical-quality plan",
    "cadence": "Monthly",
    "primarySource": "Quality system / HIS / clinical audit",
    "collaborators": "Regional COOs; CoE Leads",
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
    },
    "assignmentId": "clinical-director:clinical-quality-scorecard",
    "roleId": "clinical-director",
    "sourceRow": 13,
    "definitionFamilies": [
      "Clinical quality scorecard"
    ]
  },
  {
    "id": "RKM-009",
    "personaId": "chief-group-clinical-medical-director",
    "role": "Chief / Group Clinical Medical Director",
    "level": "Group clinical leadership",
    "reportsTo": "Chairman",
    "keyDeliverable": "Clinical safety",
    "label": "Serious adverse-event rate and review closure",
    "definition": "Risk-adjusted serious adverse events, together with completion of required reviews and corrective actions.",
    "weight": 0.15,
    "targetBasis": "Clinical governance plan and approved thresholds",
    "cadence": "Monthly",
    "primarySource": "Incident reporting system / quality register",
    "collaborators": "DHOs; CoE Leads",
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
    },
    "assignmentId": "clinical-director:serious-adverse-event-rate-and-review-closure",
    "roleId": "clinical-director",
    "sourceRow": 14,
    "definitionFamilies": [
      "Serious adverse events"
    ]
  },
  {
    "id": "RKM-010",
    "personaId": "chief-group-clinical-medical-director",
    "role": "Chief / Group Clinical Medical Director",
    "level": "Group clinical leadership",
    "reportsTo": "Chairman",
    "keyDeliverable": "Standardised practice",
    "label": "Protocol compliance and critical audit closure",
    "definition": "Compliance with approved protocols and clinical-audit critical actions closed by due date.",
    "weight": 0.15,
    "targetBasis": "Approved protocol and audit plan",
    "cadence": "Monthly",
    "primarySource": "Clinical audit / quality system",
    "collaborators": "CoE Leads; DHOs",
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
    },
    "assignmentId": "clinical-director:protocol-compliance-and-critical-audit-closure",
    "roleId": "clinical-director",
    "sourceRow": 15,
    "definitionFamilies": [
      "Protocol compliance"
    ]
  },
  {
    "id": "RKM-011",
    "personaId": "chief-group-clinical-medical-director",
    "role": "Chief / Group Clinical Medical Director",
    "level": "Group clinical leadership",
    "reportsTo": "Chairman",
    "keyDeliverable": "Clinical patient experience",
    "label": "Clinical patient experience score",
    "definition": "Approved clinical-care experience score, reported with response rate and service-line context.",
    "weight": 0.1,
    "targetBasis": "Annual patient-experience plan",
    "cadence": "Monthly",
    "primarySource": "Patient feedback platform",
    "collaborators": "Regional COOs; DHOs",
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
    },
    "assignmentId": "clinical-director:clinical-patient-experience-score",
    "roleId": "clinical-director",
    "sourceRow": 16,
    "definitionFamilies": [
      "Patient experience"
    ]
  },
  {
    "id": "RKM-012",
    "personaId": "chief-group-clinical-medical-director",
    "role": "Chief / Group Clinical Medical Director",
    "level": "Group clinical leadership",
    "reportsTo": "Chairman",
    "keyDeliverable": "Medical capability",
    "label": "Medical credentialing and capability completion",
    "definition": "Required medical staff with current credentials and completed competency requirements divided by total required staff.",
    "weight": 0.1,
    "targetBasis": "Medical workforce and credentialing plan",
    "cadence": "Monthly",
    "primarySource": "Medical affairs / HRIS",
    "collaborators": "HR Head; People Executives",
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
    },
    "assignmentId": "clinical-director:medical-credentialing-and-capability-completion",
    "roleId": "clinical-director",
    "sourceRow": 17,
    "definitionFamilies": [
      "Mandatory learning / credentialing"
    ]
  },
  {
    "id": "RKM-013",
    "personaId": "chief-group-clinical-medical-director",
    "role": "Chief / Group Clinical Medical Director",
    "level": "Group clinical leadership",
    "reportsTo": "Chairman",
    "keyDeliverable": "Centres of Excellence",
    "label": "COE revenue and contribution vs plan",
    "definition": "Finance-approved revenue and contribution from Board-approved COE programmes compared with plan.",
    "weight": 0.12,
    "targetBasis": "Approved COE business plan",
    "cadence": "Monthly",
    "primarySource": "Finance ERP / HIS",
    "collaborators": "CoE Leads; Group CFO",
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
    },
    "assignmentId": "clinical-director:coe-revenue-and-contribution-vs-plan",
    "roleId": "clinical-director",
    "sourceRow": 18,
    "definitionFamilies": [
      "COE contribution"
    ]
  },
  {
    "id": "RKM-014",
    "personaId": "chief-group-clinical-medical-director",
    "role": "Chief / Group Clinical Medical Director",
    "level": "Group clinical leadership",
    "reportsTo": "Chairman",
    "keyDeliverable": "Corporate and insurer solutions",
    "label": "Clinical propositions converted to revenue",
    "definition": "Approved corporate or insurer clinical propositions launched and generating revenue compared with plan.",
    "weight": 0.1,
    "targetBasis": "Corporate and insurer growth plan",
    "cadence": "Monthly",
    "primarySource": "CRM / contract register / finance",
    "collaborators": "Corporate Revenue & Insurance Lead",
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
    },
    "assignmentId": "clinical-director:clinical-propositions-converted-to-revenue",
    "roleId": "clinical-director",
    "sourceRow": 19,
    "definitionFamilies": [
      "New business revenue",
      "Qualified pipeline"
    ]
  },
  {
    "id": "RKM-015",
    "personaId": "chief-group-clinical-medical-director",
    "role": "Chief / Group Clinical Medical Director",
    "level": "Group clinical leadership",
    "reportsTo": "Chairman",
    "keyDeliverable": "Continuum of care",
    "label": "Priority-care referral conversion",
    "definition": "Eligible internal or external referrals completing the intended consultation, admission or procedure divided by eligible referrals.",
    "weight": 0.08,
    "targetBasis": "Service-line growth plan",
    "cadence": "Monthly",
    "primarySource": "HIS / referral tracker",
    "collaborators": "Regional COOs; DHOs",
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
    },
    "assignmentId": "clinical-director:priority-care-referral-conversion",
    "roleId": "clinical-director",
    "sourceRow": 20,
    "definitionFamilies": [
      "Referral conversion"
    ]
  },
  {
    "id": "RKM-016",
    "personaId": "regional-coo",
    "role": "Regional COO",
    "level": "Regional management",
    "reportsTo": "Chairman",
    "keyDeliverable": "Regional financial performance",
    "label": "Regional net revenue vs approved budget",
    "definition": "Finance-approved regional net revenue compared with the approved budget for the period.",
    "weight": 0.15,
    "targetBasis": "Approved regional monthly budget",
    "cadence": "Monthly",
    "primarySource": "Finance ERP / management accounts",
    "collaborators": "DHOs; Group CFO",
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
    },
    "assignmentId": "regional-coo:regional-net-revenue-vs-approved-budget",
    "roleId": "regional-coo",
    "sourceRow": 21,
    "definitionFamilies": [
      "Net revenue"
    ]
  },
  {
    "id": "RKM-017",
    "personaId": "regional-coo",
    "role": "Regional COO",
    "level": "Regional management",
    "reportsTo": "Chairman",
    "keyDeliverable": "Regional financial performance",
    "label": "Regional EBITDA vs approved budget",
    "definition": "Finance-approved regional EBITDA compared with the approved budget for the period.",
    "weight": 0.15,
    "targetBasis": "Approved regional monthly budget",
    "cadence": "Monthly",
    "primarySource": "Finance ERP / management accounts",
    "collaborators": "DHOs; Group CFO",
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
    },
    "assignmentId": "regional-coo:regional-ebitda-vs-approved-budget",
    "roleId": "regional-coo",
    "sourceRow": 22,
    "definitionFamilies": [
      "EBITDA"
    ]
  },
  {
    "id": "RKM-018",
    "personaId": "regional-coo",
    "role": "Regional COO",
    "level": "Regional management",
    "reportsTo": "Chairman",
    "keyDeliverable": "Capacity and throughput",
    "label": "Hospital and clinic capacity utilisation",
    "definition": "Service-line utilisation using staffed bed days, appointment slots, equipment hours or other approved capacity denominators; do not aggregate unlike units.",
    "weight": 0.1,
    "targetBasis": "Approved capacity plan by service line",
    "cadence": "Monthly",
    "primarySource": "HIS / scheduling / equipment logs",
    "collaborators": "DHOs",
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
    },
    "assignmentId": "regional-coo:hospital-and-clinic-capacity-utilisation",
    "roleId": "regional-coo",
    "sourceRow": 23,
    "definitionFamilies": [
      "Capacity utilisation"
    ]
  },
  {
    "id": "RKM-019",
    "personaId": "regional-coo",
    "role": "Regional COO",
    "level": "Regional management",
    "reportsTo": "Chairman",
    "keyDeliverable": "Demand and continuity",
    "label": "Patient volume and referral conversion",
    "definition": "Patient volume compared with plan and eligible referrals completing the intended next service divided by eligible referrals.",
    "weight": 0.1,
    "targetBasis": "Regional volume and referral plan",
    "cadence": "Monthly",
    "primarySource": "HIS / referral tracker",
    "collaborators": "DHOs; Business Development Leads",
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
    },
    "assignmentId": "regional-coo:patient-volume-and-referral-conversion",
    "roleId": "regional-coo",
    "sourceRow": 24,
    "definitionFamilies": [
      "Referral conversion"
    ]
  },
  {
    "id": "RKM-020",
    "personaId": "regional-coo",
    "role": "Regional COO",
    "level": "Regional management",
    "reportsTo": "Chairman",
    "keyDeliverable": "Cash conversion",
    "label": "Collections and DSO vs plan",
    "definition": "Cash collections versus plan and debtor days using the group-approved DSO calculation.",
    "weight": 0.12,
    "targetBasis": "Approved cash and collections plan",
    "cadence": "Monthly",
    "primarySource": "Billing system / finance ERP",
    "collaborators": "Billing & Revenue Leads; Group CFO",
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
    },
    "assignmentId": "regional-coo:collections-and-dso-vs-plan",
    "roleId": "regional-coo",
    "sourceRow": 25,
    "definitionFamilies": [
      "Collections"
    ]
  },
  {
    "id": "RKM-021",
    "personaId": "regional-coo",
    "role": "Regional COO",
    "level": "Regional management",
    "reportsTo": "Chairman",
    "keyDeliverable": "Revenue-cycle discipline",
    "label": "Claim clean rate and denial value",
    "definition": "First-pass accepted claims divided by submitted claims, and rejected or denied claim value divided by submitted claim value.",
    "weight": 0.1,
    "targetBasis": "Approved revenue-cycle targets",
    "cadence": "Monthly",
    "primarySource": "Billing / payer portals",
    "collaborators": "Billing & Revenue Leads",
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
    },
    "assignmentId": "regional-coo:claim-clean-rate-and-denial-value",
    "roleId": "regional-coo",
    "sourceRow": 26,
    "definitionFamilies": [
      "First-pass claim acceptance",
      "Denied or rejected claim value"
    ]
  },
  {
    "id": "RKM-022",
    "personaId": "regional-coo",
    "role": "Regional COO",
    "level": "Regional management",
    "reportsTo": "Chairman",
    "keyDeliverable": "Patient-centred operations",
    "label": "Patient experience and CAPA closure",
    "definition": "Approved patient-experience score and complaints or adverse feedback corrective actions closed by due date.",
    "weight": 0.1,
    "targetBasis": "Annual patient-experience and quality plan",
    "cadence": "Monthly",
    "primarySource": "Feedback platform / complaint register",
    "collaborators": "DHOs",
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
    },
    "assignmentId": "regional-coo:patient-experience-and-capa-closure",
    "roleId": "regional-coo",
    "sourceRow": 27,
    "definitionFamilies": [
      "Patient experience"
    ]
  },
  {
    "id": "RKM-023",
    "personaId": "regional-coo",
    "role": "Regional COO",
    "level": "Regional management",
    "reportsTo": "Chairman",
    "keyDeliverable": "People performance",
    "label": "Engagement and critical-role retention",
    "definition": "Approved engagement score and retention of designated critical roles, reported by hospital.",
    "weight": 0.08,
    "targetBasis": "Regional people plan",
    "cadence": "Monthly",
    "primarySource": "HRIS / engagement survey",
    "collaborators": "People Executives; HR Head",
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
    },
    "assignmentId": "regional-coo:engagement-and-critical-role-retention",
    "roleId": "regional-coo",
    "sourceRow": 28,
    "definitionFamilies": [
      "Engagement"
    ]
  },
  {
    "id": "RKM-024",
    "personaId": "regional-coo",
    "role": "Regional COO",
    "level": "Regional management",
    "reportsTo": "Chairman",
    "keyDeliverable": "Growth initiatives",
    "label": "New service, COE and corporate revenue vs plan",
    "definition": "Finance-approved revenue from approved new services, COE programmes and corporate channels versus plan.",
    "weight": 0.1,
    "targetBasis": "Regional growth plan",
    "cadence": "Monthly",
    "primarySource": "Finance ERP / CRM / HIS",
    "collaborators": "DHOs; Clinical Medical Director",
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
    },
    "assignmentId": "regional-coo:new-service-coe-and-corporate-revenue-vs-plan",
    "roleId": "regional-coo",
    "sourceRow": 29,
    "definitionFamilies": [
      "New business revenue",
      "COE contribution"
    ]
  },
  {
    "id": "RKM-025",
    "personaId": "hospital-dho",
    "role": "Hospital DHO",
    "level": "Hospital leadership",
    "reportsTo": "Regional COO",
    "keyDeliverable": "Facility financial performance",
    "label": "Hospital net revenue vs approved budget",
    "definition": "Finance-approved hospital net revenue compared with approved budget for the period.",
    "weight": 0.15,
    "targetBasis": "Approved hospital monthly budget",
    "cadence": "Monthly",
    "primarySource": "Finance ERP / management accounts",
    "collaborators": "Billing & Revenue Lead; Business Development Lead",
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
    },
    "assignmentId": "hospital-dho:hospital-net-revenue-vs-approved-budget",
    "roleId": "hospital-dho",
    "sourceRow": 30,
    "definitionFamilies": [
      "Net revenue"
    ]
  },
  {
    "id": "RKM-026",
    "personaId": "hospital-dho",
    "role": "Hospital DHO",
    "level": "Hospital leadership",
    "reportsTo": "Regional COO",
    "keyDeliverable": "Facility financial performance",
    "label": "Hospital EBITDA vs approved budget",
    "definition": "Finance-approved hospital EBITDA compared with approved budget for the period.",
    "weight": 0.12,
    "targetBasis": "Approved hospital monthly budget",
    "cadence": "Monthly",
    "primarySource": "Finance ERP / management accounts",
    "collaborators": "Regional COO; Group CFO",
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
    },
    "assignmentId": "hospital-dho:hospital-ebitda-vs-approved-budget",
    "roleId": "hospital-dho",
    "sourceRow": 31,
    "definitionFamilies": [
      "EBITDA"
    ]
  },
  {
    "id": "RKM-027",
    "personaId": "hospital-dho",
    "role": "Hospital DHO",
    "level": "Hospital leadership",
    "reportsTo": "Regional COO",
    "keyDeliverable": "Capacity and operations",
    "label": "Capacity utilisation and patient throughput",
    "definition": "Service-line utilisation against approved capacity and completed patient throughput versus plan, using consistent local definitions.",
    "weight": 0.12,
    "targetBasis": "Hospital capacity and volume plan",
    "cadence": "Monthly",
    "primarySource": "HIS / scheduling / equipment logs",
    "collaborators": "Service Heads",
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
    },
    "assignmentId": "hospital-dho:capacity-utilisation-and-patient-throughput",
    "roleId": "hospital-dho",
    "sourceRow": 32,
    "definitionFamilies": [
      "Capacity utilisation"
    ]
  },
  {
    "id": "RKM-028",
    "personaId": "hospital-dho",
    "role": "Hospital DHO",
    "level": "Hospital leadership",
    "reportsTo": "Regional COO",
    "keyDeliverable": "Growth and referrals",
    "label": "Referral conversion and new service revenue",
    "definition": "Eligible referrals completing the intended service divided by eligible referrals, plus net revenue from approved new services.",
    "weight": 0.1,
    "targetBasis": "Hospital growth plan",
    "cadence": "Monthly",
    "primarySource": "HIS / CRM / finance",
    "collaborators": "Business Development Lead; Clinical Leads",
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
    },
    "assignmentId": "hospital-dho:referral-conversion-and-new-service-revenue",
    "roleId": "hospital-dho",
    "sourceRow": 33,
    "definitionFamilies": [
      "Referral conversion"
    ]
  },
  {
    "id": "RKM-029",
    "personaId": "hospital-dho",
    "role": "Hospital DHO",
    "level": "Hospital leadership",
    "reportsTo": "Regional COO",
    "keyDeliverable": "Patient experience",
    "label": "Patient experience and complaint CAPA closure",
    "definition": "Approved non-clinical patient-experience score and complaints or adverse feedback actions closed by due date.",
    "weight": 0.1,
    "targetBasis": "Annual patient-experience plan",
    "cadence": "Monthly",
    "primarySource": "Feedback platform / complaint register",
    "collaborators": "Facility team; Regional COO",
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
    },
    "assignmentId": "hospital-dho:patient-experience-and-complaint-capa-closure",
    "roleId": "hospital-dho",
    "sourceRow": 34,
    "definitionFamilies": [
      "Patient experience"
    ]
  },
  {
    "id": "RKM-030",
    "personaId": "hospital-dho",
    "role": "Hospital DHO",
    "level": "Hospital leadership",
    "reportsTo": "Regional COO",
    "keyDeliverable": "Cash conversion",
    "label": "Collections, DSO and unbilled revenue",
    "definition": "Cash collections versus plan, debtor days and completed services not yet billed, using group-approved definitions.",
    "weight": 0.12,
    "targetBasis": "Hospital cash and collections plan",
    "cadence": "Monthly",
    "primarySource": "Billing system / finance ERP",
    "collaborators": "Billing & Revenue Lead",
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
    },
    "assignmentId": "hospital-dho:collections-dso-and-unbilled-revenue",
    "roleId": "hospital-dho",
    "sourceRow": 35,
    "definitionFamilies": [
      "Collections"
    ]
  },
  {
    "id": "RKM-031",
    "personaId": "hospital-dho",
    "role": "Hospital DHO",
    "level": "Hospital leadership",
    "reportsTo": "Regional COO",
    "keyDeliverable": "Revenue-cycle quality",
    "label": "Claim first-pass acceptance and rejection value",
    "definition": "Claims accepted at first submission divided by submitted claims, plus rejected or denied claim value divided by submitted value.",
    "weight": 0.1,
    "targetBasis": "Approved revenue-cycle targets",
    "cadence": "Monthly",
    "primarySource": "Billing / payer portals",
    "collaborators": "Billing & Revenue Lead",
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
    },
    "assignmentId": "hospital-dho:claim-first-pass-acceptance-and-rejection-value",
    "roleId": "hospital-dho",
    "sourceRow": 36,
    "definitionFamilies": [
      "First-pass claim acceptance",
      "Denied or rejected claim value"
    ]
  },
  {
    "id": "RKM-032",
    "personaId": "hospital-dho",
    "role": "Hospital DHO",
    "level": "Hospital leadership",
    "reportsTo": "Regional COO",
    "keyDeliverable": "People effectiveness",
    "label": "People productivity, engagement and critical attrition",
    "definition": "Approved output-per-FTE measures by function, engagement score and attrition among designated critical roles.",
    "weight": 0.1,
    "targetBasis": "Hospital people plan",
    "cadence": "Monthly",
    "primarySource": "HRIS / HIS / roster data",
    "collaborators": "People Executive",
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
    },
    "assignmentId": "hospital-dho:people-productivity-engagement-and-critical-attrition",
    "roleId": "hospital-dho",
    "sourceRow": 37,
    "definitionFamilies": [
      "Engagement"
    ]
  },
  {
    "id": "RKM-033",
    "personaId": "hospital-dho",
    "role": "Hospital DHO",
    "level": "Hospital leadership",
    "reportsTo": "Regional COO",
    "keyDeliverable": "Operational readiness",
    "label": "Facility readiness, licensure and safety actions",
    "definition": "Critical operational, safety, licensure and facility actions closed by due date; report exceptions separately.",
    "weight": 0.09,
    "targetBasis": "Hospital compliance and maintenance plan",
    "cadence": "Monthly",
    "primarySource": "Facilities / compliance tracker",
    "collaborators": "Facilities; Legal Head",
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
    },
    "assignmentId": "hospital-dho:facility-readiness-licensure-and-safety-actions",
    "roleId": "hospital-dho",
    "sourceRow": 38,
    "definitionFamilies": [
      "Legal and compliance closure"
    ]
  },
  {
    "id": "RKM-034",
    "personaId": "people-executive",
    "role": "People Executive",
    "level": "Hospital functional leadership",
    "reportsTo": "Hospital DHO",
    "keyDeliverable": "Staffing readiness",
    "label": "Approved position fill rate and time to fill",
    "definition": "Approved positions filled divided by approved positions, plus median or approved time-to-fill for critical vacancies.",
    "weight": 0.15,
    "targetBasis": "Approved workforce plan",
    "cadence": "Monthly",
    "primarySource": "HRIS / recruitment tracker",
    "collaborators": "Hospital DHO; HR Head",
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
    },
    "assignmentId": "people-executive:approved-position-fill-rate-and-time-to-fill",
    "roleId": "people-executive",
    "sourceRow": 39,
    "definitionFamilies": [
      "Critical-role attrition"
    ]
  },
  {
    "id": "RKM-035",
    "personaId": "people-executive",
    "role": "People Executive",
    "level": "Hospital functional leadership",
    "reportsTo": "Hospital DHO",
    "keyDeliverable": "Workforce productivity",
    "label": "Roster adherence and labour productivity",
    "definition": "Rostered staffing delivered versus approved roster, and approved output-per-paid-FTE measures by function.",
    "weight": 0.15,
    "targetBasis": "Approved staffing and productivity plan",
    "cadence": "Monthly",
    "primarySource": "HRIS / roster / HIS",
    "collaborators": "Hospital DHO",
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
    },
    "assignmentId": "people-executive:roster-adherence-and-labour-productivity",
    "roleId": "people-executive",
    "sourceRow": 40,
    "definitionFamilies": [
      "Workforce productivity"
    ]
  },
  {
    "id": "RKM-036",
    "personaId": "people-executive",
    "role": "People Executive",
    "level": "Hospital functional leadership",
    "reportsTo": "Hospital DHO",
    "keyDeliverable": "Retention",
    "label": "Critical-role attrition",
    "definition": "Voluntary and total attrition among designated critical roles compared with the approved retention plan.",
    "weight": 0.15,
    "targetBasis": "Approved people plan",
    "cadence": "Monthly",
    "primarySource": "HRIS",
    "collaborators": "Hospital DHO; HR Head",
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
    },
    "assignmentId": "people-executive:critical-role-attrition",
    "roleId": "people-executive",
    "sourceRow": 41,
    "definitionFamilies": [
      "Critical-role attrition"
    ]
  },
  {
    "id": "RKM-037",
    "personaId": "people-executive",
    "role": "People Executive",
    "level": "Hospital functional leadership",
    "reportsTo": "Hospital DHO",
    "keyDeliverable": "Employee experience",
    "label": "Engagement score and action closure",
    "definition": "Approved engagement survey score and action-plan items closed by due date.",
    "weight": 0.15,
    "targetBasis": "Annual engagement plan",
    "cadence": "Monthly",
    "primarySource": "Engagement survey / HR action tracker",
    "collaborators": "Hospital DHO",
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
    },
    "assignmentId": "people-executive:engagement-score-and-action-closure",
    "roleId": "people-executive",
    "sourceRow": 42,
    "definitionFamilies": [
      "Engagement"
    ]
  },
  {
    "id": "RKM-038",
    "personaId": "people-executive",
    "role": "People Executive",
    "level": "Hospital functional leadership",
    "reportsTo": "Hospital DHO",
    "keyDeliverable": "Performance management",
    "label": "Performance review and talent-matrix completion",
    "definition": "Eligible employees with completed performance review and current talent assessment divided by eligible employees.",
    "weight": 0.1,
    "targetBasis": "Group performance calendar",
    "cadence": "Monthly",
    "primarySource": "HRIS",
    "collaborators": "HR Head",
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
    },
    "assignmentId": "people-executive:performance-review-and-talent-matrix-completion",
    "roleId": "people-executive",
    "sourceRow": 43,
    "definitionFamilies": [
      "Mandatory learning / credentialing"
    ]
  },
  {
    "id": "RKM-039",
    "personaId": "people-executive",
    "role": "People Executive",
    "level": "Hospital functional leadership",
    "reportsTo": "Hospital DHO",
    "keyDeliverable": "Compliance and capability",
    "label": "Mandatory training and credentialing completion",
    "definition": "Required employees with completed mandatory learning and current role credentials divided by required employees.",
    "weight": 0.15,
    "targetBasis": "Approved training and credentialing plan",
    "cadence": "Monthly",
    "primarySource": "LMS / HRIS / medical affairs",
    "collaborators": "Clinical Medical Director; Hospital DHO",
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
    },
    "assignmentId": "people-executive:mandatory-training-and-credentialing-completion",
    "roleId": "people-executive",
    "sourceRow": 44,
    "definitionFamilies": [
      "Mandatory learning / credentialing"
    ]
  },
  {
    "id": "RKM-040",
    "personaId": "people-executive",
    "role": "People Executive",
    "level": "Hospital functional leadership",
    "reportsTo": "Hospital DHO",
    "keyDeliverable": "Employment compliance",
    "label": "HR and statutory actions closed on time",
    "definition": "Required HR, employee-relations and statutory actions closed by due date divided by actions due.",
    "weight": 0.1,
    "targetBasis": "HR compliance calendar",
    "cadence": "Monthly",
    "primarySource": "HR compliance tracker",
    "collaborators": "HR Head; Legal Head",
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
    },
    "assignmentId": "people-executive:hr-and-statutory-actions-closed-on-time",
    "roleId": "people-executive",
    "sourceRow": 45,
    "definitionFamilies": [
      "Legal and compliance closure"
    ]
  },
  {
    "id": "RKM-041",
    "personaId": "people-executive",
    "role": "People Executive",
    "level": "Hospital functional leadership",
    "reportsTo": "Hospital DHO",
    "keyDeliverable": "Cost discipline",
    "label": "Manpower cost vs plan",
    "definition": "Approved manpower cost for the facility compared with budget, with vacancy and overtime context.",
    "weight": 0.05,
    "targetBasis": "Approved manpower budget",
    "cadence": "Monthly",
    "primarySource": "Payroll / finance ERP",
    "collaborators": "Hospital DHO; Group CFO",
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
    },
    "assignmentId": "people-executive:manpower-cost-vs-plan",
    "roleId": "people-executive",
    "sourceRow": 46,
    "definitionFamilies": [
      "Workforce productivity"
    ]
  },
  {
    "id": "RKM-042",
    "personaId": "business-development-lead",
    "role": "Business Development Lead",
    "level": "Hospital functional leadership",
    "reportsTo": "Hospital DHO",
    "keyDeliverable": "New demand generation",
    "label": "New business revenue vs plan",
    "definition": "Finance-approved revenue attributable to approved business-development channels or campaigns versus plan.",
    "weight": 0.2,
    "targetBasis": "Hospital growth plan",
    "cadence": "Monthly",
    "primarySource": "CRM / HIS / finance",
    "collaborators": "Hospital DHO",
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
    },
    "assignmentId": "bd-lead:new-business-revenue-vs-plan",
    "roleId": "bd-lead",
    "sourceRow": 47,
    "definitionFamilies": [
      "New business revenue"
    ]
  },
  {
    "id": "RKM-043",
    "personaId": "business-development-lead",
    "role": "Business Development Lead",
    "level": "Hospital functional leadership",
    "reportsTo": "Hospital DHO",
    "keyDeliverable": "Pipeline health",
    "label": "Qualified pipeline coverage",
    "definition": "Qualified, documented revenue pipeline compared with the approved future-period pipeline requirement.",
    "weight": 0.1,
    "targetBasis": "Approved pipeline coverage requirement",
    "cadence": "Monthly",
    "primarySource": "CRM",
    "collaborators": "Hospital DHO",
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
    },
    "assignmentId": "bd-lead:qualified-pipeline-coverage",
    "roleId": "bd-lead",
    "sourceRow": 48,
    "definitionFamilies": [
      "Qualified pipeline"
    ]
  },
  {
    "id": "RKM-044",
    "personaId": "business-development-lead",
    "role": "Business Development Lead",
    "level": "Hospital functional leadership",
    "reportsTo": "Hospital DHO",
    "keyDeliverable": "Conversion",
    "label": "Lead-to-revenue conversion",
    "definition": "Qualified leads that generate a completed billable service or contract divided by qualified leads, using CRM attribution rules.",
    "weight": 0.15,
    "targetBasis": "Hospital conversion plan",
    "cadence": "Monthly",
    "primarySource": "CRM / HIS",
    "collaborators": "Hospital DHO; Billing & Revenue Lead",
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
    },
    "assignmentId": "bd-lead:lead-to-revenue-conversion",
    "roleId": "bd-lead",
    "sourceRow": 49,
    "definitionFamilies": [
      "New business revenue",
      "Qualified pipeline"
    ]
  },
  {
    "id": "RKM-045",
    "personaId": "business-development-lead",
    "role": "Business Development Lead",
    "level": "Hospital functional leadership",
    "reportsTo": "Hospital DHO",
    "keyDeliverable": "Referrer ecosystem",
    "label": "Active referrer network and referral revenue",
    "definition": "Active referrers meeting the approved activity criterion and finance-approved revenue from their referrals.",
    "weight": 0.15,
    "targetBasis": "Referrer network plan",
    "cadence": "Monthly",
    "primarySource": "CRM / HIS / finance",
    "collaborators": "Clinical Leads; Hospital DHO",
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
    },
    "assignmentId": "bd-lead:active-referrer-network-and-referral-revenue",
    "roleId": "bd-lead",
    "sourceRow": 50,
    "definitionFamilies": [
      "Referral conversion",
      "New business revenue"
    ]
  },
  {
    "id": "RKM-046",
    "personaId": "business-development-lead",
    "role": "Business Development Lead",
    "level": "Hospital functional leadership",
    "reportsTo": "Hospital DHO",
    "keyDeliverable": "COE and service development",
    "label": "New-service and COE lead conversion",
    "definition": "Qualified leads for approved new services or COEs that convert to completed service or revenue.",
    "weight": 0.15,
    "targetBasis": "COE and service-line growth plan",
    "cadence": "Monthly",
    "primarySource": "CRM / HIS",
    "collaborators": "CoE Lead; Clinical Medical Director",
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
    },
    "assignmentId": "bd-lead:new-service-and-coe-lead-conversion",
    "roleId": "bd-lead",
    "sourceRow": 51,
    "definitionFamilies": [
      "Qualified pipeline",
      "COE contribution"
    ]
  },
  {
    "id": "RKM-047",
    "personaId": "business-development-lead",
    "role": "Business Development Lead",
    "level": "Hospital functional leadership",
    "reportsTo": "Hospital DHO",
    "keyDeliverable": "Corporate channel support",
    "label": "Corporate opportunities handed over and accepted",
    "definition": "Qualified corporate opportunities formally accepted by the Corporate Revenue & Insurance team divided by qualified handovers.",
    "weight": 0.1,
    "targetBasis": "Corporate opportunity plan",
    "cadence": "Monthly",
    "primarySource": "CRM",
    "collaborators": "Corporate Revenue & Insurance Lead",
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
    },
    "assignmentId": "bd-lead:corporate-opportunities-handed-over-and-accepted",
    "roleId": "bd-lead",
    "sourceRow": 52,
    "definitionFamilies": [
      "Qualified pipeline"
    ]
  },
  {
    "id": "RKM-048",
    "personaId": "business-development-lead",
    "role": "Business Development Lead",
    "level": "Hospital functional leadership",
    "reportsTo": "Hospital DHO",
    "keyDeliverable": "Forecast discipline",
    "label": "CRM completeness and forecast accuracy",
    "definition": "Required CRM fields complete for active opportunities and forecast compared with realised attributed revenue.",
    "weight": 0.05,
    "targetBasis": "CRM data-quality standard",
    "cadence": "Monthly",
    "primarySource": "CRM / analytics",
    "collaborators": "Head of Analytics & Digital Transformation",
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
    },
    "assignmentId": "bd-lead:crm-completeness-and-forecast-accuracy",
    "roleId": "bd-lead",
    "sourceRow": 53,
    "definitionFamilies": [
      "Forecast accuracy"
    ]
  },
  {
    "id": "RKM-049",
    "personaId": "business-development-lead",
    "role": "Business Development Lead",
    "level": "Hospital functional leadership",
    "reportsTo": "Hospital DHO",
    "keyDeliverable": "Channel effectiveness",
    "label": "Acquisition economics vs plan",
    "definition": "Approved acquisition cost and attributable new revenue compared with channel plan; use finance-approved attribution.",
    "weight": 0.1,
    "targetBasis": "Approved channel plan",
    "cadence": "Monthly",
    "primarySource": "CRM / finance",
    "collaborators": "Hospital DHO; Group CFO",
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
    },
    "assignmentId": "bd-lead:acquisition-economics-vs-plan",
    "roleId": "bd-lead",
    "sourceRow": 54,
    "definitionFamilies": [
      "New business revenue"
    ]
  },
  {
    "id": "RKM-050",
    "personaId": "billing-revenue-lead",
    "role": "Billing & Revenue Lead",
    "level": "Hospital functional leadership",
    "reportsTo": "Hospital DHO",
    "keyDeliverable": "Clean billing",
    "label": "Claim first-pass acceptance rate",
    "definition": "Claims accepted without resubmission divided by claims submitted in the period.",
    "weight": 0.15,
    "targetBasis": "Approved revenue-cycle target",
    "cadence": "Monthly",
    "primarySource": "Billing system / payer portals",
    "collaborators": "Hospital DHO; Clinical documentation owners",
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
    },
    "assignmentId": "billing-lead:claim-first-pass-acceptance-rate",
    "roleId": "billing-lead",
    "sourceRow": 55,
    "definitionFamilies": [
      "First-pass claim acceptance"
    ]
  },
  {
    "id": "RKM-051",
    "personaId": "billing-revenue-lead",
    "role": "Billing & Revenue Lead",
    "level": "Hospital functional leadership",
    "reportsTo": "Hospital DHO",
    "keyDeliverable": "Timely submission",
    "label": "Claim submission turnaround time",
    "definition": "Median or approved percentile days from discharge or service completion to complete claim submission.",
    "weight": 0.1,
    "targetBasis": "Approved revenue-cycle target",
    "cadence": "Monthly",
    "primarySource": "Billing system / HIS",
    "collaborators": "Clinical documentation owners",
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
    },
    "assignmentId": "billing-lead:claim-submission-turnaround-time",
    "roleId": "billing-lead",
    "sourceRow": 56,
    "definitionFamilies": [
      "First-pass claim acceptance"
    ]
  },
  {
    "id": "RKM-052",
    "personaId": "billing-revenue-lead",
    "role": "Billing & Revenue Lead",
    "level": "Hospital functional leadership",
    "reportsTo": "Hospital DHO",
    "keyDeliverable": "Denial reduction",
    "label": "Rejected or denied claim value",
    "definition": "Rejected or denied claim value divided by submitted claim value, reported by payer and root cause.",
    "weight": 0.15,
    "targetBasis": "Approved denial-reduction plan",
    "cadence": "Monthly",
    "primarySource": "Billing system / payer portals",
    "collaborators": "Hospital DHO; Corporate Revenue & Insurance Lead",
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
    },
    "assignmentId": "billing-lead:rejected-or-denied-claim-value",
    "roleId": "billing-lead",
    "sourceRow": 57,
    "definitionFamilies": [
      "Denied or rejected claim value"
    ]
  },
  {
    "id": "RKM-053",
    "personaId": "billing-revenue-lead",
    "role": "Billing & Revenue Lead",
    "level": "Hospital functional leadership",
    "reportsTo": "Hospital DHO",
    "keyDeliverable": "Cash collection",
    "label": "Cash collections vs monthly plan",
    "definition": "Cash posted and reconciled in the period compared with approved monthly collection plan.",
    "weight": 0.15,
    "targetBasis": "Approved cash collections plan",
    "cadence": "Monthly",
    "primarySource": "Billing system / finance ERP",
    "collaborators": "Hospital DHO; Group CFO",
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
    },
    "assignmentId": "billing-lead:cash-collections-vs-monthly-plan",
    "roleId": "billing-lead",
    "sourceRow": 58,
    "definitionFamilies": [
      "Collections"
    ]
  },
  {
    "id": "RKM-054",
    "personaId": "billing-revenue-lead",
    "role": "Billing & Revenue Lead",
    "level": "Hospital functional leadership",
    "reportsTo": "Hospital DHO",
    "keyDeliverable": "Receivables control",
    "label": "DSO and aged receivables",
    "definition": "Debtor days using the group-approved calculation, with receivables beyond the approved ageing threshold separately reported.",
    "weight": 0.15,
    "targetBasis": "Approved DSO and ageing plan",
    "cadence": "Monthly",
    "primarySource": "Finance ERP / billing system",
    "collaborators": "Hospital DHO; Group CFO",
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
    },
    "assignmentId": "billing-lead:dso-and-aged-receivables",
    "roleId": "billing-lead",
    "sourceRow": 59,
    "definitionFamilies": [
      "DSO"
    ]
  },
  {
    "id": "RKM-055",
    "personaId": "billing-revenue-lead",
    "role": "Billing & Revenue Lead",
    "level": "Hospital functional leadership",
    "reportsTo": "Hospital DHO",
    "keyDeliverable": "Revenue completeness",
    "label": "Unbilled revenue and cash-posting reconciliation",
    "definition": "Completed services not billed and unreconciled cash items, reported with age and action owner.",
    "weight": 0.15,
    "targetBasis": "Approved revenue-integrity target",
    "cadence": "Monthly",
    "primarySource": "HIS / billing system / finance ERP",
    "collaborators": "Hospital DHO",
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
    },
    "assignmentId": "billing-lead:unbilled-revenue-and-cash-posting-reconciliation",
    "roleId": "billing-lead",
    "sourceRow": 60,
    "definitionFamilies": [
      "Unbilled revenue"
    ]
  },
  {
    "id": "RKM-056",
    "personaId": "billing-revenue-lead",
    "role": "Billing & Revenue Lead",
    "level": "Hospital functional leadership",
    "reportsTo": "Hospital DHO",
    "keyDeliverable": "Payer discipline",
    "label": "Payer reconciliation and documentation completeness",
    "definition": "Payer accounts reconciled to schedule and submitted claims meeting required documentation standards.",
    "weight": 0.1,
    "targetBasis": "Payer reconciliation calendar",
    "cadence": "Monthly",
    "primarySource": "Billing system / payer portals",
    "collaborators": "Corporate Revenue & Insurance Lead",
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
    },
    "assignmentId": "billing-lead:payer-reconciliation-and-documentation-completeness",
    "roleId": "billing-lead",
    "sourceRow": 61,
    "definitionFamilies": [
      "Unbilled revenue"
    ]
  },
  {
    "id": "RKM-057",
    "personaId": "billing-revenue-lead",
    "role": "Billing & Revenue Lead",
    "level": "Hospital functional leadership",
    "reportsTo": "Hospital DHO",
    "keyDeliverable": "Leakage prevention",
    "label": "Revenue leakage and avoidable credit notes",
    "definition": "Finance-approved avoidable revenue leakage and credit-note value compared with approved target and root-cause actions.",
    "weight": 0.05,
    "targetBasis": "Approved revenue-integrity target",
    "cadence": "Monthly",
    "primarySource": "Finance ERP / billing audit",
    "collaborators": "Group CFO; Hospital DHO",
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
    },
    "assignmentId": "billing-lead:revenue-leakage-and-avoidable-credit-notes",
    "roleId": "billing-lead",
    "sourceRow": 62,
    "definitionFamilies": [
      "Unbilled revenue"
    ]
  },
  {
    "id": "RKM-058",
    "personaId": "coe-lead",
    "role": "COE Lead",
    "level": "Clinical growth",
    "reportsTo": "Chief / Group Clinical Medical Director",
    "keyDeliverable": "COE financial performance",
    "label": "COE net revenue vs plan",
    "definition": "Finance-approved revenue from the COE compared with its approved plan.",
    "weight": 0.2,
    "targetBasis": "Approved COE business plan",
    "cadence": "Monthly",
    "primarySource": "Finance ERP / HIS",
    "collaborators": "Group CFO; Regional COOs",
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
    },
    "assignmentId": "coe-lead:coe-net-revenue-vs-plan",
    "roleId": "coe-lead",
    "sourceRow": 63,
    "definitionFamilies": [
      "Net revenue"
    ]
  },
  {
    "id": "RKM-059",
    "personaId": "coe-lead",
    "role": "COE Lead",
    "level": "Clinical growth",
    "reportsTo": "Chief / Group Clinical Medical Director",
    "keyDeliverable": "COE financial performance",
    "label": "COE contribution margin or EBITDA vs plan",
    "definition": "Finance-approved contribution margin or EBITDA for the COE compared with approved plan.",
    "weight": 0.15,
    "targetBasis": "Approved COE business plan",
    "cadence": "Monthly",
    "primarySource": "Finance ERP / management accounts",
    "collaborators": "Group CFO",
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
    },
    "assignmentId": "coe-lead:coe-contribution-margin-or-ebitda-vs-plan",
    "roleId": "coe-lead",
    "sourceRow": 64,
    "definitionFamilies": [
      "EBITDA"
    ]
  },
  {
    "id": "RKM-060",
    "personaId": "coe-lead",
    "role": "COE Lead",
    "level": "Clinical growth",
    "reportsTo": "Chief / Group Clinical Medical Director",
    "keyDeliverable": "Capacity and throughput",
    "label": "COE capacity utilisation and case volume",
    "definition": "Approved COE capacity utilised and completed case volume compared with plan, using service-specific denominators.",
    "weight": 0.1,
    "targetBasis": "COE capacity and volume plan",
    "cadence": "Monthly",
    "primarySource": "HIS / scheduling",
    "collaborators": "Regional COOs; DHOs",
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
    },
    "assignmentId": "coe-lead:coe-capacity-utilisation-and-case-volume",
    "roleId": "coe-lead",
    "sourceRow": 65,
    "definitionFamilies": [
      "Capacity utilisation"
    ]
  },
  {
    "id": "RKM-061",
    "personaId": "coe-lead",
    "role": "COE Lead",
    "level": "Clinical growth",
    "reportsTo": "Chief / Group Clinical Medical Director",
    "keyDeliverable": "Referral continuity",
    "label": "COE referral conversion",
    "definition": "Eligible referrals that complete the intended COE consultation, procedure or care plan divided by eligible referrals.",
    "weight": 0.15,
    "targetBasis": "COE referral plan",
    "cadence": "Monthly",
    "primarySource": "HIS / referral tracker",
    "collaborators": "Business Development Leads; DHOs",
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
    },
    "assignmentId": "coe-lead:coe-referral-conversion",
    "roleId": "coe-lead",
    "sourceRow": 66,
    "definitionFamilies": [
      "Referral conversion"
    ]
  },
  {
    "id": "RKM-062",
    "personaId": "coe-lead",
    "role": "COE Lead",
    "level": "Clinical growth",
    "reportsTo": "Chief / Group Clinical Medical Director",
    "keyDeliverable": "Clinical excellence",
    "label": "COE outcomes and protocol compliance",
    "definition": "COE clinical outcomes and protocol compliance, using the approved service-line scorecard and risk adjustment where applicable.",
    "weight": 0.15,
    "targetBasis": "Approved COE clinical-quality plan",
    "cadence": "Monthly",
    "primarySource": "Quality system / HIS / clinical audit",
    "collaborators": "Clinical Medical Director",
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
    },
    "assignmentId": "coe-lead:coe-outcomes-and-protocol-compliance",
    "roleId": "coe-lead",
    "sourceRow": 67,
    "definitionFamilies": [
      "Protocol compliance"
    ]
  },
  {
    "id": "RKM-063",
    "personaId": "coe-lead",
    "role": "COE Lead",
    "level": "Clinical growth",
    "reportsTo": "Chief / Group Clinical Medical Director",
    "keyDeliverable": "Patient-centred care",
    "label": "COE patient experience score",
    "definition": "Approved patient-experience score for the COE, reported with response rate and key corrective actions.",
    "weight": 0.1,
    "targetBasis": "COE patient-experience plan",
    "cadence": "Monthly",
    "primarySource": "Patient feedback platform",
    "collaborators": "DHOs; Regional COOs",
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
    },
    "assignmentId": "coe-lead:coe-patient-experience-score",
    "roleId": "coe-lead",
    "sourceRow": 68,
    "definitionFamilies": [
      "Patient experience"
    ]
  },
  {
    "id": "RKM-064",
    "personaId": "coe-lead",
    "role": "COE Lead",
    "level": "Clinical growth",
    "reportsTo": "Chief / Group Clinical Medical Director",
    "keyDeliverable": "Innovation and expansion",
    "label": "Approved COE programme milestones",
    "definition": "Approved programme, technology or geographic expansion milestones completed on time and within approved business case.",
    "weight": 0.1,
    "targetBasis": "Approved COE roadmap",
    "cadence": "Monthly",
    "primarySource": "COE roadmap / finance",
    "collaborators": "Clinical Medical Director; Regional COOs",
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
    },
    "assignmentId": "coe-lead:approved-coe-programme-milestones",
    "roleId": "coe-lead",
    "sourceRow": 69,
    "definitionFamilies": [
      "COE contribution"
    ]
  },
  {
    "id": "RKM-065",
    "personaId": "coe-lead",
    "role": "COE Lead",
    "level": "Clinical growth",
    "reportsTo": "Chief / Group Clinical Medical Director",
    "keyDeliverable": "Medical capability",
    "label": "COE medical-team capability and engagement",
    "definition": "Required competency milestones achieved and approved medical-team engagement measure for the COE.",
    "weight": 0.05,
    "targetBasis": "COE workforce plan",
    "cadence": "Monthly",
    "primarySource": "Medical affairs / HRIS",
    "collaborators": "HR Head; People Executives",
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
    },
    "assignmentId": "coe-lead:coe-medical-team-capability-and-engagement",
    "roleId": "coe-lead",
    "sourceRow": 70,
    "definitionFamilies": [
      "Engagement"
    ]
  },
  {
    "id": "RKM-066",
    "personaId": "corporate-revenue-insurance-lead",
    "role": "Corporate Revenue & Insurance Lead",
    "level": "Commercial growth",
    "reportsTo": "Chief / Group Clinical Medical Director",
    "keyDeliverable": "Corporate and insurance growth",
    "label": "Corporate and insurer net revenue and margin vs plan",
    "definition": "Finance-approved net revenue and margin from corporate and insurer accounts compared with plan.",
    "weight": 0.2,
    "targetBasis": "Approved corporate and insurer plan",
    "cadence": "Monthly",
    "primarySource": "Finance ERP / contract register",
    "collaborators": "Group CFO; Regional COOs",
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
    },
    "assignmentId": "corporate-revenue-lead:corporate-and-insurer-net-revenue-and-margin-vs-plan",
    "roleId": "corporate-revenue-lead",
    "sourceRow": 71,
    "definitionFamilies": [
      "Net revenue"
    ]
  },
  {
    "id": "RKM-067",
    "personaId": "corporate-revenue-insurance-lead",
    "role": "Corporate Revenue & Insurance Lead",
    "level": "Commercial growth",
    "reportsTo": "Chief / Group Clinical Medical Director",
    "keyDeliverable": "Account portfolio",
    "label": "Active contracted accounts vs plan",
    "definition": "Accounts with active, compliant agreements and expected revenue activity compared with plan.",
    "weight": 0.15,
    "targetBasis": "Approved account-acquisition plan",
    "cadence": "Monthly",
    "primarySource": "Contract register / CRM",
    "collaborators": "Legal Head; Business Development Leads",
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
    },
    "assignmentId": "corporate-revenue-lead:active-contracted-accounts-vs-plan",
    "roleId": "corporate-revenue-lead",
    "sourceRow": 72,
    "definitionFamilies": [
      "Contract utilisation"
    ]
  },
  {
    "id": "RKM-068",
    "personaId": "corporate-revenue-insurance-lead",
    "role": "Corporate Revenue & Insurance Lead",
    "level": "Commercial growth",
    "reportsTo": "Chief / Group Clinical Medical Director",
    "keyDeliverable": "New tie-ups",
    "label": "New corporate and insurer tie-up conversion",
    "definition": "Qualified corporate or insurer opportunities converted to signed, approved agreements divided by qualified opportunities.",
    "weight": 0.15,
    "targetBasis": "Approved new tie-up plan",
    "cadence": "Monthly",
    "primarySource": "CRM / contract register",
    "collaborators": "Legal Head; Clinical Medical Director",
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
    },
    "assignmentId": "corporate-revenue-lead:new-corporate-and-insurer-tie-up-conversion",
    "roleId": "corporate-revenue-lead",
    "sourceRow": 73,
    "definitionFamilies": [
      "Qualified pipeline"
    ]
  },
  {
    "id": "RKM-069",
    "personaId": "corporate-revenue-insurance-lead",
    "role": "Corporate Revenue & Insurance Lead",
    "level": "Commercial growth",
    "reportsTo": "Chief / Group Clinical Medical Director",
    "keyDeliverable": "Retention",
    "label": "Contract renewal and account retention rate",
    "definition": "Eligible accounts renewed by due date divided by eligible accounts due for renewal, with lost revenue reported.",
    "weight": 0.1,
    "targetBasis": "Annual account-retention plan",
    "cadence": "Monthly",
    "primarySource": "Contract register / CRM",
    "collaborators": "Legal Head; Group CFO",
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
    },
    "assignmentId": "corporate-revenue-lead:contract-renewal-and-account-retention-rate",
    "roleId": "corporate-revenue-lead",
    "sourceRow": 74,
    "definitionFamilies": [
      "Contract utilisation"
    ]
  },
  {
    "id": "RKM-070",
    "personaId": "corporate-revenue-insurance-lead",
    "role": "Corporate Revenue & Insurance Lead",
    "level": "Commercial growth",
    "reportsTo": "Chief / Group Clinical Medical Director",
    "keyDeliverable": "Account activation",
    "label": "Contract utilisation and revenue per account",
    "definition": "Actual use of agreed services and revenue per active account compared with account plan.",
    "weight": 0.1,
    "targetBasis": "Approved account plans",
    "cadence": "Monthly",
    "primarySource": "HIS / finance ERP / CRM",
    "collaborators": "Regional COOs; DHOs",
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
    },
    "assignmentId": "corporate-revenue-lead:contract-utilisation-and-revenue-per-account",
    "roleId": "corporate-revenue-lead",
    "sourceRow": 75,
    "definitionFamilies": [
      "Contract utilisation"
    ]
  },
  {
    "id": "RKM-071",
    "personaId": "corporate-revenue-insurance-lead",
    "role": "Corporate Revenue & Insurance Lead",
    "level": "Commercial growth",
    "reportsTo": "Chief / Group Clinical Medical Director",
    "keyDeliverable": "Commercial discipline",
    "label": "Commercial term yield",
    "definition": "Net realised rates and approved commercial terms compared with contracted rate cards and approved margin floors.",
    "weight": 0.1,
    "targetBasis": "Approved pricing and margin guardrails",
    "cadence": "Monthly",
    "primarySource": "Contract register / finance",
    "collaborators": "Group CFO; Legal Head",
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
    },
    "assignmentId": "corporate-revenue-lead:commercial-term-yield",
    "roleId": "corporate-revenue-lead",
    "sourceRow": 76,
    "definitionFamilies": [
      "Contract utilisation"
    ]
  },
  {
    "id": "RKM-072",
    "personaId": "corporate-revenue-insurance-lead",
    "role": "Corporate Revenue & Insurance Lead",
    "level": "Commercial growth",
    "reportsTo": "Chief / Group Clinical Medical Director",
    "keyDeliverable": "Payer issue resolution",
    "label": "Payer issue closure",
    "definition": "Payer or corporate billing issues resolved within agreed service levels, with root causes tracked.",
    "weight": 0.1,
    "targetBasis": "Approved payer-service standard",
    "cadence": "Monthly",
    "primarySource": "Billing system / issue tracker",
    "collaborators": "Billing & Revenue Leads",
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
    },
    "assignmentId": "corporate-revenue-lead:payer-issue-closure",
    "roleId": "corporate-revenue-lead",
    "sourceRow": 77,
    "definitionFamilies": [
      "Denied or rejected claim value"
    ]
  },
  {
    "id": "RKM-073",
    "personaId": "corporate-revenue-insurance-lead",
    "role": "Corporate Revenue & Insurance Lead",
    "level": "Commercial growth",
    "reportsTo": "Chief / Group Clinical Medical Director",
    "keyDeliverable": "Commercial predictability",
    "label": "Pipeline forecast accuracy and CRM completeness",
    "definition": "Forecast compared with realised contracted revenue and completeness of required CRM fields for active accounts.",
    "weight": 0.1,
    "targetBasis": "CRM data-quality and forecast standard",
    "cadence": "Monthly",
    "primarySource": "CRM / analytics",
    "collaborators": "Head of Analytics & Digital Transformation",
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
    },
    "assignmentId": "corporate-revenue-lead:pipeline-forecast-accuracy-and-crm-completeness",
    "roleId": "corporate-revenue-lead",
    "sourceRow": 78,
    "definitionFamilies": [
      "Forecast accuracy"
    ]
  },
  {
    "id": "RKM-074",
    "personaId": "group-cfo",
    "role": "Group CFO",
    "level": "Group support",
    "reportsTo": "Chairman",
    "keyDeliverable": "Profitability",
    "label": "Group EBITDA vs approved budget",
    "definition": "Finance-approved group EBITDA compared with approved budget, with region and hospital drivers reconciled.",
    "weight": 0.2,
    "targetBasis": "Board-approved EBITDA plan",
    "cadence": "Monthly",
    "primarySource": "Finance ERP / management accounts",
    "collaborators": "Chairman; Regional COOs",
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
    },
    "assignmentId": "group-cfo:group-ebitda-vs-approved-budget",
    "roleId": "group-cfo",
    "sourceRow": 79,
    "definitionFamilies": [
      "EBITDA"
    ]
  },
  {
    "id": "RKM-075",
    "personaId": "group-cfo",
    "role": "Group CFO",
    "level": "Group support",
    "reportsTo": "Chairman",
    "keyDeliverable": "Liquidity",
    "label": "Cash flow, liquidity and working capital vs plan",
    "definition": "Operating cash flow, liquidity headroom and working-capital position compared with approved cash plan.",
    "weight": 0.15,
    "targetBasis": "Board-approved cash-flow plan",
    "cadence": "Monthly",
    "primarySource": "Treasury / finance ERP",
    "collaborators": "Billing & Revenue Leads",
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
    },
    "assignmentId": "group-cfo:cash-flow-liquidity-and-working-capital-vs-plan",
    "roleId": "group-cfo",
    "sourceRow": 80,
    "definitionFamilies": [
      "Operating cash flow"
    ]
  },
  {
    "id": "RKM-076",
    "personaId": "group-cfo",
    "role": "Group CFO",
    "level": "Group support",
    "reportsTo": "Chairman",
    "keyDeliverable": "Cash conversion",
    "label": "Group collections and DSO vs plan",
    "definition": "Group cash collections versus plan and debtor days using the group-approved calculation.",
    "weight": 0.15,
    "targetBasis": "Approved collections and DSO plan",
    "cadence": "Monthly",
    "primarySource": "Billing system / finance ERP",
    "collaborators": "Billing & Revenue Leads; Regional COOs",
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
    },
    "assignmentId": "group-cfo:group-collections-and-dso-vs-plan",
    "roleId": "group-cfo",
    "sourceRow": 81,
    "definitionFamilies": [
      "Collections"
    ]
  },
  {
    "id": "RKM-077",
    "personaId": "group-cfo",
    "role": "Group CFO",
    "level": "Group support",
    "reportsTo": "Chairman",
    "keyDeliverable": "Planning discipline",
    "label": "Forecast and budget quality",
    "definition": "Timely forecast submission and approved forecast accuracy for revenue, EBITDA, cash and major cost drivers.",
    "weight": 0.1,
    "targetBasis": "Finance planning calendar and accuracy standard",
    "cadence": "Monthly",
    "primarySource": "FP&A models / finance ERP",
    "collaborators": "Head of Analytics & Digital Transformation",
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
    },
    "assignmentId": "group-cfo:forecast-and-budget-quality",
    "roleId": "group-cfo",
    "sourceRow": 82,
    "definitionFamilies": [
      "Forecast accuracy"
    ]
  },
  {
    "id": "RKM-078",
    "personaId": "group-cfo",
    "role": "Group CFO",
    "level": "Group support",
    "reportsTo": "Chairman",
    "keyDeliverable": "Cost improvement",
    "label": "Controllable cost improvement vs plan",
    "definition": "Finance-validated controllable cost improvement and cost-per-service trend compared with plan, preserving quality and availability.",
    "weight": 0.15,
    "targetBasis": "Approved cost-improvement plan",
    "cadence": "Monthly",
    "primarySource": "Finance ERP / procurement / HIS",
    "collaborators": "Procurement Head; Regional COOs",
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
    },
    "assignmentId": "group-cfo:controllable-cost-improvement-vs-plan",
    "roleId": "group-cfo",
    "sourceRow": 83,
    "definitionFamilies": [
      "Procurement savings"
    ]
  },
  {
    "id": "RKM-079",
    "personaId": "group-cfo",
    "role": "Group CFO",
    "level": "Group support",
    "reportsTo": "Chairman",
    "keyDeliverable": "Financial control",
    "label": "Financial controls and leakage actions closed",
    "definition": "Material control gaps, reconciliations and leakage actions closed by due date, with residual risk reported.",
    "weight": 0.1,
    "targetBasis": "Finance control plan",
    "cadence": "Monthly",
    "primarySource": "Finance controls / internal audit",
    "collaborators": "Billing & Revenue Leads; Legal Head",
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
    },
    "assignmentId": "group-cfo:financial-controls-and-leakage-actions-closed",
    "roleId": "group-cfo",
    "sourceRow": 84,
    "definitionFamilies": [
      "Legal and compliance closure"
    ]
  },
  {
    "id": "RKM-080",
    "personaId": "group-cfo",
    "role": "Group CFO",
    "level": "Group support",
    "reportsTo": "Chairman",
    "keyDeliverable": "Compliance",
    "label": "Finance compliance and audit-action closure",
    "definition": "Finance statutory and audit actions completed by due date divided by actions due.",
    "weight": 0.15,
    "targetBasis": "Finance compliance calendar",
    "cadence": "Monthly",
    "primarySource": "Finance compliance / audit tracker",
    "collaborators": "Legal Head",
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
    },
    "assignmentId": "group-cfo:finance-compliance-and-audit-action-closure",
    "roleId": "group-cfo",
    "sourceRow": 85,
    "definitionFamilies": [
      "Legal and compliance closure"
    ]
  },
  {
    "id": "RKM-081",
    "personaId": "procurement-head",
    "role": "Procurement Head",
    "level": "Group support",
    "reportsTo": "Chairman",
    "keyDeliverable": "Cost performance",
    "label": "Finance-validated procurement savings vs plan",
    "definition": "Finance-validated savings from negotiated purchasing versus approved baseline, compared with plan.",
    "weight": 0.2,
    "targetBasis": "Approved procurement savings plan",
    "cadence": "Monthly",
    "primarySource": "Procurement system / finance ERP",
    "collaborators": "Group CFO; Regional COOs",
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
    },
    "assignmentId": "procurement-head:finance-validated-procurement-savings-vs-plan",
    "roleId": "procurement-head",
    "sourceRow": 86,
    "definitionFamilies": [
      "Procurement savings"
    ]
  },
  {
    "id": "RKM-082",
    "personaId": "procurement-head",
    "role": "Procurement Head",
    "level": "Group support",
    "reportsTo": "Chairman",
    "keyDeliverable": "Buying compliance",
    "label": "Contract and purchase-order compliance",
    "definition": "Spend placed through approved contracts and purchase orders divided by addressable spend.",
    "weight": 0.1,
    "targetBasis": "Approved procurement compliance standard",
    "cadence": "Monthly",
    "primarySource": "Procurement system / finance ERP",
    "collaborators": "Group CFO",
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
    },
    "assignmentId": "procurement-head:contract-and-purchase-order-compliance",
    "roleId": "procurement-head",
    "sourceRow": 87,
    "definitionFamilies": [
      "Legal and compliance closure"
    ]
  },
  {
    "id": "RKM-083",
    "personaId": "procurement-head",
    "role": "Procurement Head",
    "level": "Group support",
    "reportsTo": "Chairman",
    "keyDeliverable": "Supply continuity",
    "label": "Critical consumable stockouts and service disruption",
    "definition": "Critical stockout events and related service disruption, reported by item and root cause; no universal threshold is assumed.",
    "weight": 0.15,
    "targetBasis": "Approved critical inventory plan",
    "cadence": "Monthly",
    "primarySource": "Inventory system / incident register",
    "collaborators": "DHOs; Clinical Medical Director",
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
    },
    "assignmentId": "procurement-head:critical-consumable-stockouts-and-service-disruption",
    "roleId": "procurement-head",
    "sourceRow": 88,
    "definitionFamilies": [
      "Inventory days / obsolete stock"
    ]
  },
  {
    "id": "RKM-084",
    "personaId": "procurement-head",
    "role": "Procurement Head",
    "level": "Group support",
    "reportsTo": "Chairman",
    "keyDeliverable": "Inventory discipline",
    "label": "Inventory days and obsolete stock",
    "definition": "Inventory days and obsolete or expiring stock value measured using the group-approved inventory policy.",
    "weight": 0.15,
    "targetBasis": "Approved inventory plan",
    "cadence": "Monthly",
    "primarySource": "Inventory system / finance ERP",
    "collaborators": "Group CFO; DHOs",
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
    },
    "assignmentId": "procurement-head:inventory-days-and-obsolete-stock",
    "roleId": "procurement-head",
    "sourceRow": 89,
    "definitionFamilies": [
      "Inventory days / obsolete stock"
    ]
  },
  {
    "id": "RKM-085",
    "personaId": "procurement-head",
    "role": "Procurement Head",
    "level": "Group support",
    "reportsTo": "Chairman",
    "keyDeliverable": "Service responsiveness",
    "label": "Purchase request to purchase-order turnaround",
    "definition": "Median or approved percentile time from complete approved request to issued purchase order.",
    "weight": 0.1,
    "targetBasis": "Approved procurement service level",
    "cadence": "Monthly",
    "primarySource": "Procurement system",
    "collaborators": "DHOs",
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
    },
    "assignmentId": "procurement-head:purchase-request-to-purchase-order-turnaround",
    "roleId": "procurement-head",
    "sourceRow": 90,
    "definitionFamilies": [
      "Procurement savings"
    ]
  },
  {
    "id": "RKM-086",
    "personaId": "procurement-head",
    "role": "Procurement Head",
    "level": "Group support",
    "reportsTo": "Chairman",
    "keyDeliverable": "Vendor performance",
    "label": "Supplier quality and service-level performance",
    "definition": "Supplier delivery, quality and service performance against approved service levels.",
    "weight": 0.1,
    "targetBasis": "Approved vendor scorecard",
    "cadence": "Monthly",
    "primarySource": "Procurement system / user feedback",
    "collaborators": "DHOs; Clinical Leads",
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
    },
    "assignmentId": "procurement-head:supplier-quality-and-service-level-performance",
    "roleId": "procurement-head",
    "sourceRow": 91,
    "definitionFamilies": [
      "Procurement savings"
    ]
  },
  {
    "id": "RKM-087",
    "personaId": "procurement-head",
    "role": "Procurement Head",
    "level": "Group support",
    "reportsTo": "Chairman",
    "keyDeliverable": "Price discipline",
    "label": "Rate-card adherence and maverick spend",
    "definition": "Spend at approved prices and outside approved buying channels, reported with remediation actions.",
    "weight": 0.1,
    "targetBasis": "Approved rate-card and compliance standard",
    "cadence": "Monthly",
    "primarySource": "Procurement system / finance ERP",
    "collaborators": "Group CFO",
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
    },
    "assignmentId": "procurement-head:rate-card-adherence-and-maverick-spend",
    "roleId": "procurement-head",
    "sourceRow": 92,
    "definitionFamilies": [
      "Procurement savings"
    ]
  },
  {
    "id": "RKM-088",
    "personaId": "procurement-head",
    "role": "Procurement Head",
    "level": "Group support",
    "reportsTo": "Chairman",
    "keyDeliverable": "Resilience",
    "label": "Supplier risk and continuity actions closed",
    "definition": "High-risk supplier continuity actions closed by due date divided by actions due.",
    "weight": 0.1,
    "targetBasis": "Approved supplier-risk plan",
    "cadence": "Monthly",
    "primarySource": "Supplier risk register",
    "collaborators": "Legal Head; DHOs",
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
    },
    "assignmentId": "procurement-head:supplier-risk-and-continuity-actions-closed",
    "roleId": "procurement-head",
    "sourceRow": 93,
    "definitionFamilies": [
      "Inventory days / obsolete stock"
    ]
  },
  {
    "id": "RKM-089",
    "personaId": "hr-head",
    "role": "HR Head",
    "level": "Group support",
    "reportsTo": "Chairman",
    "keyDeliverable": "Workforce economics",
    "label": "Group workforce cost and productivity vs plan",
    "definition": "Approved workforce cost and output-per-FTE measures compared with plan, reported by function and facility.",
    "weight": 0.15,
    "targetBasis": "Approved workforce and productivity plan",
    "cadence": "Monthly",
    "primarySource": "HRIS / payroll / HIS / finance",
    "collaborators": "Group CFO; Regional COOs",
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
    },
    "assignmentId": "hr-head:group-workforce-cost-and-productivity-vs-plan",
    "roleId": "hr-head",
    "sourceRow": 94,
    "definitionFamilies": [
      "Workforce productivity"
    ]
  },
  {
    "id": "RKM-090",
    "personaId": "hr-head",
    "role": "HR Head",
    "level": "Group support",
    "reportsTo": "Chairman",
    "keyDeliverable": "Critical talent",
    "label": "Critical-role staffing and time to hire",
    "definition": "Critical roles filled divided by approved critical roles, plus time-to-fill for critical vacancies.",
    "weight": 0.15,
    "targetBasis": "Approved workforce plan",
    "cadence": "Monthly",
    "primarySource": "HRIS / recruitment tracker",
    "collaborators": "People Executives; DHOs",
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
    },
    "assignmentId": "hr-head:critical-role-staffing-and-time-to-hire",
    "roleId": "hr-head",
    "sourceRow": 95,
    "definitionFamilies": [
      "Critical-role attrition"
    ]
  },
  {
    "id": "RKM-091",
    "personaId": "hr-head",
    "role": "HR Head",
    "level": "Group support",
    "reportsTo": "Chairman",
    "keyDeliverable": "Retention",
    "label": "Group and critical-role attrition",
    "definition": "Voluntary and total attrition, including designated critical roles, compared with approved retention plan.",
    "weight": 0.15,
    "targetBasis": "Approved retention plan",
    "cadence": "Monthly",
    "primarySource": "HRIS",
    "collaborators": "People Executives; Regional COOs",
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
    },
    "assignmentId": "hr-head:group-and-critical-role-attrition",
    "roleId": "hr-head",
    "sourceRow": 96,
    "definitionFamilies": [
      "Critical-role attrition"
    ]
  },
  {
    "id": "RKM-092",
    "personaId": "hr-head",
    "role": "HR Head",
    "level": "Group support",
    "reportsTo": "Chairman",
    "keyDeliverable": "Employee experience",
    "label": "Group engagement score and action closure",
    "definition": "Approved group engagement score and action-plan completion by due date.",
    "weight": 0.15,
    "targetBasis": "Annual engagement plan",
    "cadence": "Monthly",
    "primarySource": "Engagement survey / HR tracker",
    "collaborators": "People Executives; Regional COOs",
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
    },
    "assignmentId": "hr-head:group-engagement-score-and-action-closure",
    "roleId": "hr-head",
    "sourceRow": 97,
    "definitionFamilies": [
      "Engagement"
    ]
  },
  {
    "id": "RKM-093",
    "personaId": "hr-head",
    "role": "HR Head",
    "level": "Group support",
    "reportsTo": "Chairman",
    "keyDeliverable": "Capability and succession",
    "label": "Mandatory learning, capability and succession coverage",
    "definition": "Required workforce meeting learning or capability requirements and critical roles with approved succession coverage.",
    "weight": 0.15,
    "targetBasis": "Approved capability and succession plan",
    "cadence": "Monthly",
    "primarySource": "LMS / HRIS / medical affairs",
    "collaborators": "Clinical Medical Director",
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
    },
    "assignmentId": "hr-head:mandatory-learning-capability-and-succession-coverage",
    "roleId": "hr-head",
    "sourceRow": 98,
    "definitionFamilies": [
      "Mandatory learning / credentialing"
    ]
  },
  {
    "id": "RKM-094",
    "personaId": "hr-head",
    "role": "HR Head",
    "level": "Group support",
    "reportsTo": "Chairman",
    "keyDeliverable": "Performance culture",
    "label": "Performance-management and talent-review completion",
    "definition": "Eligible workforce with completed performance review and current talent review divided by eligible workforce.",
    "weight": 0.1,
    "targetBasis": "Group performance calendar",
    "cadence": "Monthly",
    "primarySource": "HRIS",
    "collaborators": "People Executives",
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
    },
    "assignmentId": "hr-head:performance-management-and-talent-review-completion",
    "roleId": "hr-head",
    "sourceRow": 99,
    "definitionFamilies": [
      "Mandatory learning / credentialing"
    ]
  },
  {
    "id": "RKM-095",
    "personaId": "hr-head",
    "role": "HR Head",
    "level": "Group support",
    "reportsTo": "Chairman",
    "keyDeliverable": "Employment governance",
    "label": "Employment compliance and grievance closure",
    "definition": "Employment compliance actions and grievances closed to approved service levels, with material exceptions escalated.",
    "weight": 0.15,
    "targetBasis": "HR compliance calendar",
    "cadence": "Monthly",
    "primarySource": "HR compliance tracker",
    "collaborators": "Legal Head",
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
    },
    "assignmentId": "hr-head:employment-compliance-and-grievance-closure",
    "roleId": "hr-head",
    "sourceRow": 100,
    "definitionFamilies": [
      "Legal and compliance closure"
    ]
  },
  {
    "id": "RKM-096",
    "personaId": "legal-head",
    "role": "Legal Head",
    "level": "Group support",
    "reportsTo": "Chairman",
    "keyDeliverable": "Commercial enablement",
    "label": "Contract turnaround time",
    "definition": "Median or approved percentile time to complete standard and non-standard contracts, segmented by risk category.",
    "weight": 0.15,
    "targetBasis": "Approved legal service levels",
    "cadence": "Monthly",
    "primarySource": "Contract lifecycle system",
    "collaborators": "Corporate Revenue & Insurance Lead; Procurement Head",
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
    },
    "assignmentId": "legal-head:contract-turnaround-time",
    "roleId": "legal-head",
    "sourceRow": 101,
    "definitionFamilies": [
      "Legal and compliance closure"
    ]
  },
  {
    "id": "RKM-097",
    "personaId": "legal-head",
    "role": "Legal Head",
    "level": "Group support",
    "reportsTo": "Chairman",
    "keyDeliverable": "Risk management",
    "label": "High-risk contract review and approval compliance",
    "definition": "High-risk agreements receiving required review and approval before execution divided by high-risk agreements executed.",
    "weight": 0.15,
    "targetBasis": "Approved contract approval policy",
    "cadence": "Monthly",
    "primarySource": "Contract register",
    "collaborators": "Corporate Revenue & Insurance Lead; Procurement Head",
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
    },
    "assignmentId": "legal-head:high-risk-contract-review-and-approval-compliance",
    "roleId": "legal-head",
    "sourceRow": 102,
    "definitionFamilies": [
      "Legal and compliance closure"
    ]
  },
  {
    "id": "RKM-098",
    "personaId": "legal-head",
    "role": "Legal Head",
    "level": "Group support",
    "reportsTo": "Chairman",
    "keyDeliverable": "Regulatory compliance",
    "label": "License, filing and regulatory-calendar compliance",
    "definition": "Required filings, licences and registrations completed or renewed by due date divided by items due.",
    "weight": 0.2,
    "targetBasis": "Approved regulatory calendar",
    "cadence": "Monthly",
    "primarySource": "Legal compliance register",
    "collaborators": "DHOs; HR Head",
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
    },
    "assignmentId": "legal-head:license-filing-and-regulatory-calendar-compliance",
    "roleId": "legal-head",
    "sourceRow": 103,
    "definitionFamilies": [
      "Legal and compliance closure"
    ]
  },
  {
    "id": "RKM-099",
    "personaId": "legal-head",
    "role": "Legal Head",
    "level": "Group support",
    "reportsTo": "Chairman",
    "keyDeliverable": "Dispute management",
    "label": "Material litigation and dispute action milestones",
    "definition": "Material matters with current strategy, owner and action milestones completed by due date; report exposure separately.",
    "weight": 0.15,
    "targetBasis": "Approved legal risk plan",
    "cadence": "Monthly",
    "primarySource": "Legal matter tracker",
    "collaborators": "Group CFO; Chairman",
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
    },
    "assignmentId": "legal-head:material-litigation-and-dispute-action-milestones",
    "roleId": "legal-head",
    "sourceRow": 104,
    "definitionFamilies": [
      "Legal and compliance closure"
    ]
  },
  {
    "id": "RKM-100",
    "personaId": "legal-head",
    "role": "Legal Head",
    "level": "Group support",
    "reportsTo": "Chairman",
    "keyDeliverable": "Revenue protection",
    "label": "Commercial and payer dispute support turnaround",
    "definition": "Commercial or payer disputes supported within agreed service levels, with recovery or avoidance value reported where validated.",
    "weight": 0.1,
    "targetBasis": "Approved legal service levels",
    "cadence": "Monthly",
    "primarySource": "Legal matter tracker / billing tracker",
    "collaborators": "Billing & Revenue Leads; Corporate Revenue & Insurance Lead",
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
    },
    "assignmentId": "legal-head:commercial-and-payer-dispute-support-turnaround",
    "roleId": "legal-head",
    "sourceRow": 105,
    "definitionFamilies": [
      "Legal and compliance closure"
    ]
  },
  {
    "id": "RKM-101",
    "personaId": "legal-head",
    "role": "Legal Head",
    "level": "Group support",
    "reportsTo": "Chairman",
    "keyDeliverable": "Policy governance",
    "label": "Policy refresh and required legal training completion",
    "definition": "Policies due for review refreshed and required legal or compliance learning completed by required employees.",
    "weight": 0.1,
    "targetBasis": "Policy calendar and training plan",
    "cadence": "Monthly",
    "primarySource": "Policy register / LMS",
    "collaborators": "HR Head",
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
    },
    "assignmentId": "legal-head:policy-refresh-and-required-legal-training-completion",
    "roleId": "legal-head",
    "sourceRow": 106,
    "definitionFamilies": [
      "Legal and compliance closure"
    ]
  },
  {
    "id": "RKM-102",
    "personaId": "legal-head",
    "role": "Legal Head",
    "level": "Group support",
    "reportsTo": "Chairman",
    "keyDeliverable": "Assurance",
    "label": "Governance and audit legal actions closed",
    "definition": "Legal, governance and audit actions closed by due date divided by actions due, with critical exceptions escalated.",
    "weight": 0.15,
    "targetBasis": "Governance action plan",
    "cadence": "Monthly",
    "primarySource": "Governance tracker / audit tracker",
    "collaborators": "Chairman; Group CFO",
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
    },
    "assignmentId": "legal-head:governance-and-audit-legal-actions-closed",
    "roleId": "legal-head",
    "sourceRow": 107,
    "definitionFamilies": [
      "Legal and compliance closure"
    ]
  },
  {
    "id": "RKM-103",
    "personaId": "head-of-analytics-digital-transformation",
    "role": "Head of Analytics & Digital Transformation",
    "level": "Group support",
    "reportsTo": "Chairman",
    "keyDeliverable": "Reliable decision support",
    "label": "KPI dashboard availability and refresh on time",
    "definition": "Critical approved dashboards available and refreshed to the agreed timetable divided by dashboards due.",
    "weight": 0.15,
    "targetBasis": "Approved reporting calendar and service level",
    "cadence": "Monthly",
    "primarySource": "BI platform / data operations log",
    "collaborators": "All executive owners",
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
    },
    "assignmentId": "analytics-head:kpi-dashboard-availability-and-refresh-on-time",
    "roleId": "analytics-head",
    "sourceRow": 108,
    "definitionFamilies": [
      "KPI data quality"
    ]
  },
  {
    "id": "RKM-104",
    "personaId": "head-of-analytics-digital-transformation",
    "role": "Head of Analytics & Digital Transformation",
    "level": "Group support",
    "reportsTo": "Chairman",
    "keyDeliverable": "Trusted data",
    "label": "KPI data quality and reconciliation",
    "definition": "Critical KPI data meeting defined completeness, consistency and finance or source-system reconciliation checks.",
    "weight": 0.2,
    "targetBasis": "Approved data-quality standards",
    "cadence": "Monthly",
    "primarySource": "Data-quality controls / finance reconciliation",
    "collaborators": "Group CFO; Billing & Revenue Leads",
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
    },
    "assignmentId": "analytics-head:kpi-data-quality-and-reconciliation",
    "roleId": "analytics-head",
    "sourceRow": 109,
    "definitionFamilies": [
      "KPI data quality"
    ]
  },
  {
    "id": "RKM-105",
    "personaId": "head-of-analytics-digital-transformation",
    "role": "Head of Analytics & Digital Transformation",
    "level": "Group support",
    "reportsTo": "Chairman",
    "keyDeliverable": "Timely management information",
    "label": "Monthly KPI pack delivered to calendar",
    "definition": "Monthly management KPI pack delivered complete and accurate by the agreed date divided by packs due.",
    "weight": 0.15,
    "targetBasis": "Group reporting calendar",
    "cadence": "Monthly",
    "primarySource": "BI platform / reporting calendar",
    "collaborators": "Chairman; Group CFO",
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
    },
    "assignmentId": "analytics-head:monthly-kpi-pack-delivered-to-calendar",
    "roleId": "analytics-head",
    "sourceRow": 110,
    "definitionFamilies": [
      "KPI data quality"
    ]
  },
  {
    "id": "RKM-106",
    "personaId": "head-of-analytics-digital-transformation",
    "role": "Head of Analytics & Digital Transformation",
    "level": "Group support",
    "reportsTo": "Chairman",
    "keyDeliverable": "Adoption",
    "label": "Priority dashboard adoption and report rationalisation",
    "definition": "Target users actively using priority dashboards and retirement of duplicate manual reports against plan.",
    "weight": 0.1,
    "targetBasis": "Approved analytics adoption plan",
    "cadence": "Monthly",
    "primarySource": "BI usage logs / report inventory",
    "collaborators": "All executive owners",
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
    },
    "assignmentId": "analytics-head:priority-dashboard-adoption-and-report-rationalisation",
    "roleId": "analytics-head",
    "sourceRow": 111,
    "definitionFamilies": [
      "KPI data quality"
    ]
  },
  {
    "id": "RKM-107",
    "personaId": "head-of-analytics-digital-transformation",
    "role": "Head of Analytics & Digital Transformation",
    "level": "Group support",
    "reportsTo": "Chairman",
    "keyDeliverable": "Forecast support",
    "label": "Revenue, collections and cash forecast accuracy",
    "definition": "Approved forecast accuracy measure comparing forecast with actual revenue, collections and cash over the agreed horizon.",
    "weight": 0.15,
    "targetBasis": "Finance planning accuracy standard",
    "cadence": "Monthly",
    "primarySource": "BI platform / finance ERP",
    "collaborators": "Group CFO; Regional COOs",
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
    },
    "assignmentId": "analytics-head:revenue-collections-and-cash-forecast-accuracy",
    "roleId": "analytics-head",
    "sourceRow": 112,
    "definitionFamilies": [
      "Collections"
    ]
  },
  {
    "id": "RKM-108",
    "personaId": "head-of-analytics-digital-transformation",
    "role": "Head of Analytics & Digital Transformation",
    "level": "Group support",
    "reportsTo": "Chairman",
    "keyDeliverable": "Actionable insight",
    "label": "Approved insight actions closed",
    "definition": "Prioritised data-led actions accepted by owners and closed by due date divided by actions due.",
    "weight": 0.1,
    "targetBasis": "Approved insight-action plan",
    "cadence": "Monthly",
    "primarySource": "Analytics action tracker",
    "collaborators": "Regional COOs; DHOs",
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
    },
    "assignmentId": "analytics-head:approved-insight-actions-closed",
    "roleId": "analytics-head",
    "sourceRow": 113,
    "definitionFamilies": [
      "KPI data quality"
    ]
  },
  {
    "id": "RKM-109",
    "personaId": "head-of-analytics-digital-transformation",
    "role": "Head of Analytics & Digital Transformation",
    "level": "Group support",
    "reportsTo": "Chairman",
    "keyDeliverable": "Digital value",
    "label": "Digital roadmap and benefit realisation",
    "definition": "Approved digital milestones delivered and finance-validated benefits realised versus business case.",
    "weight": 0.15,
    "targetBasis": "Approved digital roadmap and business cases",
    "cadence": "Monthly",
    "primarySource": "Project portfolio / finance",
    "collaborators": "Chairman; Group CFO",
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
    },
    "assignmentId": "analytics-head:digital-roadmap-and-benefit-realisation",
    "roleId": "analytics-head",
    "sourceRow": 114,
    "definitionFamilies": [
      "Forecast accuracy"
    ]
  }
];
