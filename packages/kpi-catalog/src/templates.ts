import type { CatalogTemplate, TemplateRole } from "./types.ts";

/** `k("HLT", 1, 2, 4)` gives `["HLT-001", "HLT-002", "HLT-004"]`. */
const k = (prefix: string, ...numbers: number[]): string[] =>
  numbers.map((n) => `${prefix}-${String(n).padStart(3, "0")}`);

// Core sets shared by every industry.
const FIN = k("FIN", 1, 3, 6, 8, 10, 12, 16, 19, 30, 31, 34, 35, 36, 38, 43);
const HR = k("HR", 1, 2, 3, 8, 9, 10, 13, 15, 17, 21, 28, 33);
const SAL = k("SAL", 1, 3, 4, 6, 7, 8, 12, 14, 16, 18, 22);
const MKT = k("MKT", 1, 2, 3, 8, 9, 14, 25, 26, 29, 30);
const OPS = k("OPS", 1, 3, 9, 11, 12, 17, 19, 25);
const SCM = k("SCM", 1, 2, 5, 6, 7, 11, 17, 23);
const ITE = k("ITE", 1, 3, 5, 8, 12, 14, 15);
const QSF = k("QSF", 1, 6, 7, 8, 10, 12);

interface Spec {
  id: string;
  name: string;
  industry: string;
  description: string;
  /** What the owner or chief executive sees first. */
  executive: string[];
  operations: string[];
  commercial: string[];
  /** Branch, store, plant or department manager. */
  unit: string[];
  /** Replaces the generic finance set. */
  finance?: string[];
  people?: string[];
  /** Extra specialist role, for example a medical director. */
  specialist?: { key: string; name: string; description: string; kpis: string[] };
}

const unique = (ids: string[]) => [...new Set(ids)];

function roles(spec: Spec): TemplateRole[] {
  const out: TemplateRole[] = [
    {
      key: "executive",
      name: "Executive (CEO / Owner view)",
      description: "The whole business on one page: growth, profit, customers and operations.",
      capabilities: ["act"],
      kpis: unique(spec.executive),
    },
    {
      key: "operations",
      name: "Operations head (COO)",
      description: "Day-to-day delivery, quality and efficiency.",
      capabilities: ["act"],
      kpis: unique(spec.operations),
    },
    {
      key: "finance",
      name: "Finance head (CFO)",
      description: "Profitability, cash, budgets and working capital.",
      capabilities: ["act"],
      kpis: unique(spec.finance ?? FIN),
    },
    {
      key: "commercial",
      name: "Commercial head (sales and growth)",
      description: "Revenue, customers and growth.",
      capabilities: ["act"],
      kpis: unique(spec.commercial),
    },
    {
      key: "people",
      name: "People head (HR)",
      description: "Hiring, retention, absence and training.",
      capabilities: ["act"],
      kpis: unique(spec.people ?? HR),
    },
    {
      key: "unit_manager",
      name: "Unit manager (branch, site or department)",
      description: "The numbers for one unit, with the actions that matter there.",
      capabilities: ["act"],
      kpis: unique(spec.unit),
    },
  ];
  if (spec.specialist)
    out.push({
      key: spec.specialist.key,
      name: spec.specialist.name,
      description: spec.specialist.description,
      capabilities: ["act"],
      kpis: unique(spec.specialist.kpis),
    });
  out.push(
    {
      key: "data_contributor",
      name: "Data contributor",
      description: "Uploads the monthly figures. Does not see results.",
      capabilities: ["submit"],
      kpis: [],
    },
    {
      key: "data_reviewer",
      name: "Data reviewer (approver)",
      description: "Checks and approves submitted figures, which publishes the results.",
      capabilities: ["approve"],
      kpis: unique([...spec.executive, ...spec.operations]),
    },
  );
  return out;
}

const SPECS: Spec[] = [
  {
    id: "healthcare-hospital",
    name: "Hospital or multi-specialty clinic",
    industry: "healthcare",
    description: "Beds, admissions, outpatient flow, theatre use, patient experience and revenue cycle.",
    executive: [...k("HLT", 1, 2, 4, 19, 27, 29, 30), ...k("FIN", 1, 6, 10, 31)],
    operations: k("HLT", 1, 2, 3, 5, 10, 11, 12, 13, 14, 16, 17, 18, 23, 24, 25),
    commercial: [...k("HLT", 8, 22, 26, 27, 29, 30, 31, 32, 33, 34), ...k("FIN", 16, 43)],
    unit: k("HLT", 1, 2, 10, 12, 13, 19, 28, 35, 36),
    specialist: {
      key: "medical_director",
      name: "Medical director (clinical quality)",
      description: "Patient safety, outcomes and clinical quality.",
      kpis: k("HLT", 4, 5, 14, 17, 18, 23, 25, 11),
    },
  },
  {
    id: "diagnostics-lab",
    name: "Diagnostic laboratory chain",
    industry: "diagnostics",
    description: "Test volumes, turnaround, rejection, home collection and reagent cost.",
    executive: [...k("LAB", 1, 2, 5, 9, 11), ...k("FIN", 1, 3, 6, 10)],
    operations: k("LAB", 2, 3, 4, 5, 6, 7, 12, 13),
    commercial: [...k("LAB", 1, 8, 9, 14), ...MKT.slice(0, 5)],
    unit: k("LAB", 1, 2, 3, 5, 7, 10, 13),
    specialist: {
      key: "quality_head",
      name: "Quality head",
      description: "Laboratory quality control and accuracy.",
      kpis: [...k("LAB", 3, 4, 6, 12), ...QSF],
    },
  },
  {
    id: "retail-chain",
    name: "Retail store chain",
    industry: "retail",
    description: "Footfall, conversion, basket, stock health, shrinkage and store productivity.",
    executive: [...k("RTL", 3, 5, 9, 12, 17, 14), ...k("FIN", 1, 3, 6, 10)],
    operations: [...k("RTL", 1, 14, 15, 16, 20), ...k("SCM", 5, 6, 7, 11)],
    commercial: [...k("RTL", 3, 4, 5, 8, 18, 19, 22, 23), ...k("MKT", 1, 2, 25, 26)],
    unit: k("RTL", 3, 4, 5, 6, 9, 11, 14, 16, 20),
  },
  {
    id: "ecommerce-store",
    name: "E-commerce business",
    industry: "ecommerce",
    description: "Traffic, conversion, cart abandonment, acquisition cost, returns and repeat purchase.",
    executive: [...k("MKT", 24, 25, 26, 1, 3), ...k("RTL", 3, 19), ...k("FIN", 1, 3, 10)],
    operations: [...k("SCM", 1, 2, 19, 20, 17), ...k("CUS", 5, 6, 11, 12)],
    commercial: [...k("MKT", 1, 3, 5, 9, 24, 25, 26, 28, 31), ...k("RTL", 3, 4, 23)],
    unit: [...k("MKT", 24, 25), ...k("SCM", 1, 19, 20), ...k("CUS", 12)],
  },
  {
    id: "manufacturing-plant",
    name: "Manufacturing plant",
    industry: "manufacturing",
    description: "OEE, yield, scrap, downtime, schedule attainment, supplier quality and safety.",
    executive: [...k("MFG", 1, 6, 13), ...k("OPS", 1), ...k("FIN", 1, 3, 6, 10), ...k("QSF", 1)],
    operations: [...k("MFG", 1, 2, 3, 4, 5, 6, 8, 9, 10, 12, 13, 16), ...OPS.slice(0, 4)],
    commercial: [...k("SAL", 1, 4, 14, 16, 22), ...k("OPS", 1), ...k("MFG", 14, 15)],
    unit: k("MFG", 1, 2, 4, 5, 6, 8, 13, 17, 18, 21),
    specialist: {
      key: "quality_safety_head",
      name: "Quality and safety head",
      description: "Product quality, supplier quality and workplace safety.",
      kpis: [...k("MFG", 4, 5, 6, 14, 15), ...QSF, ...k("SCM", 12)],
    },
  },
  {
    id: "saas-company",
    name: "Software (SaaS) company",
    industry: "saas",
    description: "Recurring revenue, retention, unit economics, activation and engineering delivery.",
    executive: [...k("SAS", 1, 2, 4, 8, 5, 12, 21), ...k("FIN", 3, 6)],
    operations: [...ITE, ...k("CUS", 6, 7, 11, 12, 14)],
    commercial: [...k("SAS", 3, 9, 10, 13, 14, 15, 16, 17, 18, 19, 20), ...k("MKT", 1, 8, 9)],
    unit: [...k("SAS", 5, 15, 16, 17), ...k("CUS", 6, 7, 11, 12), ...k("ITE", 3, 5, 8)],
    specialist: {
      key: "engineering_head",
      name: "Engineering head (CTO)",
      description: "Delivery speed, reliability and cloud cost.",
      kpis: [...ITE, ...k("ITE", 19, 20)],
    },
  },
  {
    id: "it-services",
    name: "IT services company",
    industry: "it_services",
    description: "Utilisation, realisation, project margin, on-time delivery and attrition.",
    executive: [...k("PRO", 1, 2, 4, 22, 23, 12), ...k("FIN", 1, 3, 6, 10), ...k("HR", 2)],
    operations: [...k("PRO", 1, 21, 22, 23, 24, 25), ...k("ITE", 8, 10)],
    commercial: [...k("PRO", 12, 18, 19), ...SAL.slice(0, 6), ...k("MKT", 29, 30)],
    unit: [...k("PRO", 1, 5, 21, 22, 23, 24, 25), ...k("HR", 2, 13, 17)],
  },
  {
    id: "professional-services",
    name: "Law, accounting or consulting firm",
    industry: "professional_services",
    description: "Utilisation, realisation, lockup, write-offs and profit per partner.",
    executive: [...k("PRO", 1, 4, 9, 13, 12, 11), ...k("FIN", 1, 6, 10)],
    operations: k("PRO", 1, 2, 3, 7, 8, 10, 20, 21, 24, 25),
    commercial: [...k("PRO", 5, 6, 12, 16, 18, 19, 26, 27), ...k("SAL", 11)],
    unit: k("PRO", 1, 2, 3, 5, 7, 8, 10, 15, 25, 26),
  },
  {
    id: "banking-lending",
    name: "Bank or NBFC",
    industry: "banking",
    description: "Margins, asset quality, capital, collections, deposits and digital adoption.",
    executive: k("BNK", 1, 2, 5, 6, 12, 13, 16, 18, 26),
    operations: k("BNK", 2, 15, 16, 17, 20, 21, 22, 23),
    commercial: k("BNK", 8, 9, 10, 12, 13, 14, 19, 22, 24, 25),
    unit: k("BNK", 14, 15, 16, 20, 21, 22),
    specialist: {
      key: "risk_head",
      name: "Chief risk officer",
      description: "Asset quality, capital and credit cost.",
      kpis: k("BNK", 2, 3, 4, 6, 7, 15, 17, 18, 23),
    },
  },
  {
    id: "insurance-company",
    name: "Insurance company or broker",
    industry: "insurance",
    description: "Loss and combined ratios, claims experience, persistency and growth.",
    executive: k("INS", 1, 2, 3, 4, 10, 12, 13),
    operations: k("INS", 5, 6, 7, 8, 9, 18),
    commercial: k("INS", 10, 11, 12, 13, 14, 15, 16, 17),
    unit: k("INS", 5, 7, 10, 11, 15),
  },
  {
    id: "hotel-hospitality",
    name: "Hotel or resort",
    industry: "hospitality",
    description: "Occupancy, ADR, RevPAR, GOPPAR, food cost, guest satisfaction and channel mix.",
    executive: k("HOS", 1, 2, 3, 4, 6, 11, 19),
    operations: k("HOS", 1, 9, 10, 11, 12, 13, 17),
    commercial: k("HOS", 2, 3, 12, 14, 15, 16, 18, 21),
    unit: k("HOS", 1, 2, 3, 9, 11, 17, 19, 20),
  },
  {
    id: "school-college",
    name: "School, college or university",
    industry: "education",
    description: "Enrolment, retention, results, placement, fees and cost per student.",
    executive: k("EDU", 4, 5, 11, 12, 19, 2, 23),
    operations: k("EDU", 1, 14, 15, 16, 17, 22),
    commercial: k("EDU", 8, 9, 10, 11, 12, 13, 23),
    unit: k("EDU", 1, 4, 14, 15, 16, 19, 23),
  },
  {
    id: "logistics-fleet",
    name: "Logistics or fleet operator",
    industry: "logistics",
    description: "On-time delivery, fleet utilisation, fuel and cost per kilometre, safety.",
    executive: [...k("LOG", 1, 4, 9, 10, 19), ...k("FIN", 1, 6, 10)],
    operations: k("LOG", 1, 2, 3, 4, 5, 6, 7, 15, 16, 17, 18),
    commercial: k("LOG", 1, 10, 19, 20, 21),
    unit: k("LOG", 1, 2, 4, 6, 8, 12, 13, 14),
  },
  {
    id: "real-estate-developer",
    name: "Property owner or developer",
    industry: "real_estate",
    description: "Occupancy, rent collection, net operating income, sales absorption and tenant retention.",
    executive: k("RES", 1, 3, 4, 7, 8, 12, 21),
    operations: k("RES", 1, 7, 8, 9, 11),
    commercial: k("RES", 1, 8, 10, 12, 13, 21),
    unit: k("RES", 1, 3, 7, 9, 11),
  },
  {
    id: "construction-contractor",
    name: "Construction contractor",
    industry: "construction",
    description: "Cost and schedule performance, rework, change orders and safety.",
    executive: [...k("RES", 14, 15, 16, 17, 19, 20), ...k("FIN", 1, 6, 10)],
    operations: [...k("RES", 14, 15, 16, 17, 18, 19, 20), ...QSF],
    commercial: [...k("RES", 19, 20), ...k("SAL", 1, 4, 6)],
    unit: [...k("RES", 16, 17, 18, 20), ...k("QSF", 1, 2, 5)],
  },
  {
    id: "telecom-isp",
    name: "Telecom or internet service provider",
    industry: "telecom",
    description: "Subscribers, churn, ARPU, network quality and acquisition cost.",
    executive: [...k("TEL", 1, 2, 3, 7), ...k("FIN", 1, 6, 10)],
    operations: [...k("TEL", 5), ...k("ITE", 8, 9, 10), ...k("CUS", 6, 7, 11)],
    commercial: k("TEL", 1, 2, 3, 4, 6, 7),
    unit: [...k("TEL", 2, 5), ...k("CUS", 5, 6, 11, 12)],
  },
  {
    id: "nonprofit",
    name: "Non-profit organisation",
    industry: "nonprofit",
    description: "Donations, donor retention, programme spend and reach.",
    executive: k("NGO", 1, 3, 4, 8, 9),
    operations: k("NGO", 1, 4, 7, 8),
    commercial: k("NGO", 2, 3, 5, 9),
    unit: k("NGO", 4, 7, 8),
    finance: [...k("NGO", 1, 6), ...k("FIN", 15, 12, 36)],
  },
  {
    id: "energy-utility",
    name: "Energy generator or utility",
    industry: "energy",
    description: "Plant load, network loss, collection efficiency and reliability.",
    executive: [...k("ENR", 1, 2, 4, 5), ...k("FIN", 1, 6)],
    operations: k("ENR", 1, 2, 3, 5, 6, 7),
    commercial: k("ENR", 3, 4),
    unit: k("ENR", 2, 4, 5, 6),
  },
  {
    id: "agri-business",
    name: "Agri-business or farm",
    industry: "agriculture",
    description: "Yield, loss, cost and revenue per acre.",
    executive: [...k("AGR", 1, 2, 3, 4), ...k("FIN", 1, 3)],
    operations: k("AGR", 1, 2, 3),
    commercial: k("AGR", 4, 5),
    unit: k("AGR", 1, 2, 3, 4),
  },
  {
    id: "general-business",
    name: "General business (any industry)",
    industry: "general",
    description: "A balanced starting point: finance, sales, customers, people and operations.",
    executive: [...k("FIN", 1, 3, 6, 10, 30), ...k("SAL", 3, 4), ...k("CUS", 12, 28), ...k("HR", 2)],
    operations: [...OPS, ...SCM.slice(0, 4), ...QSF.slice(0, 3)],
    commercial: [...SAL, ...MKT],
    unit: [...k("SAL", 4, 22), ...k("OPS", 1, 9), ...k("CUS", 5, 12), ...k("HR", 13)],
  },
];

export const TEMPLATES: readonly CatalogTemplate[] = SPECS.map((spec) => ({
  id: spec.id,
  name: spec.name,
  industry: spec.industry,
  description: spec.description,
  roles: roles(spec),
}));
