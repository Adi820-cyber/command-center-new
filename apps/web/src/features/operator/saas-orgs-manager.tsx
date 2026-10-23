import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  ControlOrganizationListSchema,
  MutationResponseSchema,
  PurgeOrganizationResponseSchema,
  ProvisionResponseSchema,
  TemplateListSchema,
  type TemplateSummary,
} from "@orbit/contracts";
import { request } from "../saas/client";
import { AccessPanel, type IssuedSet } from "../saas/access-panel";

export type ControlOrganization = ReturnType<typeof ControlOrganizationListSchema.parse>[number];

interface SaaSOrganizationsManagerProps {
  /** If provided, called when the user wants to switch into that client organization's workspace */
  onSelectWorkspace?: (tenantId: string) => void;
  /** Active tenant ID if viewing from within the SaaS shell */
  currentTenantId?: string;
  /** Header title, default "SaaS Organizations & Clients" */
  title?: string;
  /** Header description */
  description?: string;
}

export interface IndustryMeta {
  category: string;
  industryDisplay: string;
  icon: string;
  sampleKpis: string[];
}

export const INDUSTRY_SECTOR_CATEGORIES = [
  "Healthcare & Life Sciences",
  "Retail & Consumer Commerce",
  "Technology & Software",
  "Financial Services & Banking",
  "Manufacturing & Industrial",
  "Hospitality & Education",
  "Supply Chain & Infrastructure",
  "Energy, Utilities & Telecom",
  "Professional & Creative Services",
  "Corporate & Cross-Industry",
] as const;

export const INDUSTRY_CATALOGUE_META: Record<string, IndustryMeta> = {
  "healthcare-hospital": {
    category: "Healthcare & Life Sciences",
    industryDisplay: "Healthcare (Hospitals & Clinics)",
    icon: "🏥",
    sampleKpis: [
      "Bed Occupancy Rate",
      "Average Length of Stay (ALOS)",
      "OT Utilization Rate",
      "Patient Satisfaction Index",
      "Inpatient Revenue per Bed",
      "Readmission Rate within 30 Days",
    ],
  },
  "diagnostics-lab": {
    category: "Healthcare & Life Sciences",
    industryDisplay: "Diagnostics & Pathology Labs",
    icon: "🔬",
    sampleKpis: [
      "Test Processing Volume",
      "Sample Turnaround Time (TAT)",
      "Sample Rejection Rate",
      "Reagent Cost per Test",
      "Internal QC Accuracy Rate",
      "Home Collection Percentage",
    ],
  },
  "retail-chain": {
    category: "Retail & Consumer Commerce",
    industryDisplay: "Retail Store Chains & Supermarkets",
    icon: "🛒",
    sampleKpis: [
      "Footfall & Store Traffic",
      "Sales Conversion Rate",
      "Average Basket Value",
      "Inventory Shrinkage %",
      "Gross Margin Return on Investment (GMROI)",
      "Sales per Square Foot",
    ],
  },
  "ecommerce-store": {
    category: "Retail & Consumer Commerce",
    industryDisplay: "E-Commerce & D2C Brands",
    icon: "🛍️",
    sampleKpis: [
      "Cart Abandonment Rate",
      "Checkout Conversion Rate",
      "Customer Acquisition Cost (CAC)",
      "Return to Origin (RTO) Rate",
      "Repeat Purchase Rate",
      "Average Order Value (AOV)",
    ],
  },
  "manufacturing-plant": {
    category: "Manufacturing & Industrial",
    industryDisplay: "Manufacturing Plants & Assembly",
    icon: "🏭",
    sampleKpis: [
      "Overall Equipment Effectiveness (OEE)",
      "First Pass Production Yield",
      "Scrap & Defect Rate",
      "Unplanned Machine Downtime",
      "Production Schedule Attainment",
      "Plant Safety Incident Rate",
    ],
  },
  "saas-company": {
    category: "Technology & Software",
    industryDisplay: "Software & Cloud SaaS",
    icon: "💻",
    sampleKpis: [
      "Monthly Recurring Revenue (MRR)",
      "Net Revenue Retention (NRR)",
      "Annualized Churn Rate",
      "CAC Payback Months",
      "Customer Lifetime Value (LTV:CAC)",
      "Cloud Infrastructure Uptime SLA",
    ],
  },
  "it-services": {
    category: "Technology & Software",
    industryDisplay: "IT Services & Software Consulting",
    icon: "🖥️",
    sampleKpis: [
      "Billable Resource Utilization",
      "Billing Realization Rate",
      "Project Gross Margin",
      "On-Time Milestone Delivery",
      "Tech Talent Retention Rate",
      "Revenue per Billable Consultant",
    ],
  },
  "professional-services": {
    category: "Professional & Creative Services",
    industryDisplay: "Law, Accounting & Audit Firms",
    icon: "⚖️",
    sampleKpis: [
      "Partner & Fee-Earner Utilization",
      "Lockup Days (WIP + Debtors)",
      "Unbilled Work In Progress (WIP)",
      "Realization Rate",
      "Profit per Equity Partner (PEP)",
      "Engagement Write-Off Ratio",
    ],
  },
  "digital-marketing-agency": {
    category: "Professional & Creative Services",
    industryDisplay: "Digital Marketing & Creative Agencies",
    icon: "📢",
    sampleKpis: [
      "Client Retainer MRR",
      "Client Retention Rate",
      "Agency Gross Profit Margin",
      "Billable Staff Utilization",
      "Client Campaign ROAS",
      "Over-Servicing Percentage",
    ],
  },
  "banking-lending": {
    category: "Financial Services & Banking",
    industryDisplay: "Banking, NBFC & Fintech Lending",
    icon: "🏦",
    sampleKpis: [
      "Net Interest Margin (NIM)",
      "Gross NPA (Non-Performing Assets)",
      "Loan Collection Efficiency",
      "Cost of Borrowed Funds",
      "Capital Adequacy Ratio (CRAR)",
      "Disbursement Target Achievement",
    ],
  },
  "insurance-company": {
    category: "Financial Services & Banking",
    industryDisplay: "Insurance Carriers & Brokerages",
    icon: "🛡️",
    sampleKpis: [
      "Gross Written Premium (GWP)",
      "Claims Loss Ratio",
      "Combined Operating Ratio",
      "13th Month Policy Persistency",
      "Claims Settlement Turnaround Time",
      "Underwriting Margin",
    ],
  },
  "hotel-hospitality": {
    category: "Hospitality & Education",
    industryDisplay: "Hotels, Resorts & Hospitality",
    icon: "🏨",
    sampleKpis: [
      "Room Occupancy Rate",
      "Average Daily Rate (ADR)",
      "Revenue Per Available Room (RevPAR)",
      "Gross Operating Profit (GOPPAR)",
      "F&B Food Cost Percentage",
      "Guest Satisfaction Score",
    ],
  },
  "school-college": {
    category: "Hospitality & Education",
    industryDisplay: "Schools, Colleges & Universities",
    icon: "🎓",
    sampleKpis: [
      "Student Enrollment Yield",
      "Student Retention Rate",
      "Fee Collection Efficiency",
      "Faculty-Student Ratio",
      "Academic Pass & Placement Rate",
      "Operating Cost per Student",
    ],
  },
  "logistics-fleet": {
    category: "Supply Chain & Infrastructure",
    industryDisplay: "Logistics, Freight & Fleet Operators",
    icon: "🚚",
    sampleKpis: [
      "On-Time In-Full (OTIF) Delivery",
      "Fleet Asset Utilization",
      "Fuel Cost per Tonne-Kilometer",
      "Vehicle Turnaround Time (TAT)",
      "Cargo Damage Rate",
      "Empty Miles Percentage",
    ],
  },
  "real-estate-developer": {
    category: "Supply Chain & Infrastructure",
    industryDisplay: "Real Estate Developers & Property Asset Managers",
    icon: "🏢",
    sampleKpis: [
      "Sales Booking Velocity",
      "Milestone Collection Efficiency",
      "Construction Cost Variance",
      "Leased Property Occupancy",
      "Net Rental Yield",
      "Tenant Retention Rate",
    ],
  },
  "construction-contractor": {
    category: "Supply Chain & Infrastructure",
    industryDisplay: "Construction Contractors & EPC Infrastructure",
    icon: "🏗️",
    sampleKpis: [
      "Schedule Performance Index (SPI)",
      "Cost Performance Index (CPI)",
      "Rework Cost Percentage",
      "Heavy Equipment Downtime",
      "Lost Time Injury Frequency Rate (LTIFR)",
      "Milestone Completion Ratio",
    ],
  },
  "telecom-isp": {
    category: "Energy, Utilities & Telecom",
    industryDisplay: "Telecommunications & Internet Service Providers",
    icon: "📡",
    sampleKpis: [
      "Active Subscriber Base",
      "Average Revenue Per User (ARPU)",
      "Network Core Uptime SLA",
      "Subscriber Churn Rate",
      "Fiber Rollout Speed",
      "Customer Resolution Time (MTTR)",
    ],
  },
  "energy-utility": {
    category: "Energy, Utilities & Telecom",
    industryDisplay: "Energy, Solar & Power Utilities",
    icon: "⚡",
    sampleKpis: [
      "Plant Load Factor (PLF)",
      "Transmission & Distribution Loss %",
      "Power Generation Cost per kWh",
      "Grid Availability Percentage",
      "Billing & Tariff Collection Rate",
      "Unplanned Outage Hours",
    ],
  },
  "agri-business": {
    category: "Energy, Utilities & Telecom",
    industryDisplay: "Agri-Business, Farming & Dairy",
    icon: "🌾",
    sampleKpis: [
      "Crop Yield per Hectare",
      "Post-Harvest Spoilage Rate",
      "Cold Chain Temperature Compliance",
      "Daily Milk Yield per Cow",
      "Fertilizer & Feed Cost Ratio",
      "Harvest Revenue Realization",
    ],
  },
  "nonprofit": {
    category: "Corporate & Cross-Industry",
    industryDisplay: "Non-Profit & Charitable Foundations",
    icon: "🤝",
    sampleKpis: [
      "Total Donation Contributions",
      "Donor Retention Rate",
      "Program Spend to Total Expense Ratio",
      "Direct Beneficiaries Reached",
      "Fundraising Cost Efficiency",
      "Grant Utilization Timeline",
    ],
  },
  "general-business": {
    category: "Corporate & Cross-Industry",
    industryDisplay: "General Corporate & Enterprise (Cross-Industry)",
    icon: "🌐",
    sampleKpis: [
      "Revenue Growth Rate YoY",
      "EBITDA Operating Margin",
      "Operating Cash Flow",
      "Customer Net Promoter Score (NPS)",
      "Employee Productivity Index",
      "Working Capital Cycle Days",
    ],
  },
};

export function getIndustryIcon(industry: string = ""): string {
  const norm = industry.toLowerCase();
  if (norm.includes("health") || norm.includes("clinic") || norm.includes("hospital")) return "🏥";
  if (norm.includes("diagnostic") || norm.includes("lab") || norm.includes("pathology")) return "🔬";
  if (norm.includes("retail") || norm.includes("store") || norm.includes("supermarket")) return "🛒";
  if (norm.includes("ecom") || norm.includes("commerce") || norm.includes("d2c")) return "🛍️";
  if (norm.includes("manufactur") || norm.includes("plant") || norm.includes("factory")) return "🏭";
  if (norm.includes("saas") || norm.includes("software") || norm.includes("cloud")) return "💻";
  if (norm.includes("it service") || norm.includes("tech consulting")) return "🖥️";
  if (norm.includes("law") || norm.includes("accounting") || norm.includes("professional") || norm.includes("consult")) return "⚖️";
  if (norm.includes("bank") || norm.includes("nbfc") || norm.includes("fintech") || norm.includes("lending")) return "🏦";
  if (norm.includes("insurance")) return "🛡️";
  if (norm.includes("hotel") || norm.includes("resort") || norm.includes("hospitality")) return "🏨";
  if (norm.includes("school") || norm.includes("college") || norm.includes("education") || norm.includes("university")) return "🎓";
  if (norm.includes("logistic") || norm.includes("fleet") || norm.includes("cargo") || norm.includes("transport")) return "🚚";
  if (norm.includes("real estate") || norm.includes("property")) return "🏢";
  if (norm.includes("construct") || norm.includes("infrastructure") || norm.includes("epc")) return "🏗️";
  if (norm.includes("telecom") || norm.includes("isp") || norm.includes("network")) return "📡";
  if (norm.includes("energy") || norm.includes("utility") || norm.includes("power") || norm.includes("solar")) return "⚡";
  if (norm.includes("agri") || norm.includes("farm") || norm.includes("dairy")) return "🌾";
  if (norm.includes("nonprofit") || norm.includes("charity") || norm.includes("ngo")) return "🤝";
  if (norm.includes("digital marketing") || norm.includes("agency") || norm.includes("creative")) return "📢";
  return "🏢";
}

/**
 * Built-in catalogue of all 21 industry templates with predefined KPIs.
 * Used for instant dropdown population even before or alongside API response.
 */
export const PREDEFINED_INDUSTRY_TEMPLATES: TemplateSummary[] = [
  {
    id: "healthcare-hospital",
    name: "Hospital or Multi-Specialty Clinic",
    industry: "Healthcare",
    description: "Beds, admissions, outpatient flow, theatre utilization, patient experience, clinical safety and revenue cycle.",
    kpiCount: 35,
    roles: [
      { key: "executive", name: "Executive (CEO / Owner view)", description: "The whole hospital on one page", capabilities: ["act"], kpiCount: 12 },
      { key: "operations", name: "Operations Head (COO)", description: "Day-to-day delivery, admissions, OT usage", capabilities: ["act"], kpiCount: 15 },
      { key: "medical_director", name: "Medical Director", description: "Patient safety, outcomes and clinical quality", capabilities: ["act"], kpiCount: 9 },
      { key: "finance", name: "Finance Head (CFO)", description: "Hospital profitability, cash, collections", capabilities: ["act"], kpiCount: 10 },
      { key: "commercial", name: "Commercial & Marketing", description: "Patient acquisition and revenue", capabilities: ["act"], kpiCount: 11 },
    ],
  },
  {
    id: "diagnostics-lab",
    name: "Diagnostic Laboratory Chain",
    industry: "Diagnostics & Pathology",
    description: "Test volumes, sample turnaround time (TAT), rejection rates, home collection, reagent cost and QC accuracy.",
    kpiCount: 26,
    roles: [
      { key: "executive", name: "Executive (CEO / Owner)", description: "Lab business overview", capabilities: ["act"], kpiCount: 10 },
      { key: "operations", name: "Lab Operations Head", description: "Turnaround time and sample processing", capabilities: ["act"], kpiCount: 12 },
      { key: "quality_head", name: "Quality & QC Head", description: "Quality control and test accuracy", capabilities: ["act"], kpiCount: 8 },
    ],
  },
  {
    id: "retail-chain",
    name: "Retail Store Chain / Supermarkets",
    industry: "Retail",
    description: "Footfall, sales conversion, average basket value, inventory shrinkage, GMROI and store productivity.",
    kpiCount: 28,
    roles: [
      { key: "executive", name: "Executive (CEO / Retail Head)", description: "Sales, basket size, margin across stores", capabilities: ["act"], kpiCount: 11 },
      { key: "operations", name: "Store Operations Head", description: "Stock health, shrinkage, floor efficiency", capabilities: ["act"], kpiCount: 10 },
      { key: "commercial", name: "Merchandising & Sales", description: "Campaigns and sales targets", capabilities: ["act"], kpiCount: 12 },
    ],
  },
  {
    id: "ecommerce-store",
    name: "E-Commerce & D2C Business",
    industry: "E-Commerce",
    description: "Traffic, checkout conversion, cart abandonment, customer acquisition cost (CAC), return-to-origin (RTO) and repeat orders.",
    kpiCount: 25,
    roles: [
      { key: "executive", name: "E-Commerce Founder / CEO", description: "Revenue, CAC, LTV and margin", capabilities: ["act"], kpiCount: 9 },
      { key: "operations", name: "Fulfillment & Supply Chain", description: "Delivery time, dispatch rate, returns", capabilities: ["act"], kpiCount: 10 },
      { key: "commercial", name: "Growth & Digital Marketing", description: "Traffic, ROAS, conversions", capabilities: ["act"], kpiCount: 11 },
    ],
  },
  {
    id: "manufacturing-plant",
    name: "Manufacturing & Industrial Plant",
    industry: "Manufacturing",
    description: "Overall equipment effectiveness (OEE), scrap rate, production yield, downtime, schedule attainment and plant safety.",
    kpiCount: 32,
    roles: [
      { key: "executive", name: "Plant Director / CEO", description: "Plant output, profitability and quality", capabilities: ["act"], kpiCount: 11 },
      { key: "operations", name: "Production & Plant Manager", description: "OEE, line speeds, shift yields", capabilities: ["act"], kpiCount: 14 },
      { key: "quality_safety", name: "Quality & Safety Head", description: "Scrap, defect ppm, incident rate", capabilities: ["act"], kpiCount: 9 },
    ],
  },
  {
    id: "saas-company",
    name: "Software & SaaS Company",
    industry: "Software & SaaS",
    description: "Monthly recurring revenue (MRR), net revenue retention (NRR), churn rate, CAC payback, LTV, and engineering uptime.",
    kpiCount: 30,
    roles: [
      { key: "executive", name: "SaaS Founder / CEO", description: "ARR, churn, burn multiple, growth", capabilities: ["act"], kpiCount: 10 },
      { key: "commercial", name: "CRO / Head of Sales", description: "Pipeline, bookings, quota attainment", capabilities: ["act"], kpiCount: 12 },
      { key: "engineering_head", name: "CTO / Engineering Head", description: "Uptime, sprint velocity, cloud costs", capabilities: ["act"], kpiCount: 8 },
    ],
  },
  {
    id: "it-services",
    name: "IT Services & Consulting Firm",
    industry: "IT Services",
    description: "Billable employee utilization, billing realization, project margins, on-time delivery and tech talent attrition.",
    kpiCount: 26,
    roles: [
      { key: "executive", name: "Managing Partner / CEO", description: "Revenue per employee, utilization, margin", capabilities: ["act"], kpiCount: 9 },
      { key: "operations", name: "Delivery Head", description: "Project milestone delivery, bench size", capabilities: ["act"], kpiCount: 11 },
      { key: "people", name: "HR & Talent Head", description: "Tech hiring, attrition, retention", capabilities: ["act"], kpiCount: 8 },
    ],
  },
  {
    id: "professional-services",
    name: "Law, Accounting or Consulting Firm",
    industry: "Professional Services",
    description: "Partner utilization, billing lockup, unbilled WIP, write-offs, realization and profit per partner.",
    kpiCount: 28,
    roles: [
      { key: "executive", name: "Senior Partner / Managing Director", description: "Firm financial health and lockup", capabilities: ["act"], kpiCount: 10 },
      { key: "operations", name: "Practice Manager", description: "Case/audit WIP, billable hours", capabilities: ["act"], kpiCount: 12 },
    ],
  },
  {
    id: "digital-marketing-agency",
    name: "Digital Marketing & Creative Agency",
    industry: "Digital Marketing",
    description: "Retainer & project clients: revenue, gross margin, client retention, pipeline, on-time delivery, utilization and campaign ROAS.",
    kpiCount: 28,
    roles: [
      { key: "ceo", name: "CEO (Agency Growth)", description: "Revenue against target, margin, pipeline", capabilities: ["act", "approve"], kpiCount: 14 },
      { key: "cto", name: "Client Success / Ops Head", description: "Retention, upsell, client health", capabilities: ["act", "approve"], kpiCount: 12 },
      { key: "account_manager", name: "Account Manager (Delivery)", description: "On-time delivery, client satisfaction", capabilities: ["act", "submit"], kpiCount: 10 },
    ],
  },
  {
    id: "banking-lending",
    name: "Bank, NBFC or Fintech Lending",
    industry: "Banking & Financial Services",
    description: "Net interest margin (NIM), gross NPA, collection efficiency, cost of funds, capital adequacy (CRAR) and loan book growth.",
    kpiCount: 30,
    roles: [
      { key: "executive", name: "Executive Committee / CEO", description: "AUM, NIM, NPAs and capital adequacy", capabilities: ["act"], kpiCount: 11 },
      { key: "risk_head", name: "Chief Risk Officer", description: "Credit cost, delinquent buckets, PAR", capabilities: ["act"], kpiCount: 10 },
      { key: "commercial", name: "Branch & Lending Head", description: "Disbursements, deposit mobilization", capabilities: ["act"], kpiCount: 11 },
    ],
  },
  {
    id: "insurance-company",
    name: "Insurance Company or Brokerage",
    industry: "Insurance",
    description: "Gross written premium (GWP), claims loss ratio, combined ratio, policy persistency and underwriting margin.",
    kpiCount: 22,
    roles: [
      { key: "executive", name: "CEO / Managing Director", description: "GWP, combined ratio and solvency", capabilities: ["act"], kpiCount: 8 },
      { key: "operations", name: "Claims & Underwriting Head", description: "Settlement ratio, loss ratio, turnaround", capabilities: ["act"], kpiCount: 10 },
    ],
  },
  {
    id: "hotel-hospitality",
    name: "Hotel, Resort or Hospitality Chain",
    industry: "Hospitality & Tourism",
    description: "Occupancy rate, average daily rate (ADR), RevPAR, GOPPAR, F&B food cost ratio and guest satisfaction index.",
    kpiCount: 26,
    roles: [
      { key: "executive", name: "General Manager / Owner", description: "RevPAR, GOPPAR, total revenue", capabilities: ["act"], kpiCount: 9 },
      { key: "operations", name: "Hotel Operations Head", description: "Housekeeping, F&B cost, check-in flow", capabilities: ["act"], kpiCount: 11 },
    ],
  },
  {
    id: "school-college",
    name: "School, College or University",
    industry: "Education",
    description: "Student enrollment, retention rate, fee collection efficiency, faculty-student ratio, academic outcomes and placement rate.",
    kpiCount: 24,
    roles: [
      { key: "executive", name: "Principal / Dean / Chancellor", description: "Academic performance and institutional health", capabilities: ["act"], kpiCount: 9 },
      { key: "operations", name: "Academic & Campus Operations", description: "Attendance, syllabus completion, labs", capabilities: ["act"], kpiCount: 10 },
    ],
  },
  {
    id: "logistics-fleet",
    name: "Logistics, Cargo or Fleet Operator",
    industry: "Logistics & Supply Chain",
    description: "On-time in-full (OTIF), fleet asset utilization, fuel cost per km, vehicle turnaround and cargo damage rate.",
    kpiCount: 25,
    roles: [
      { key: "executive", name: "Logistics Director / COO", description: "Fleet uptime, OTIF delivery, margin", capabilities: ["act"], kpiCount: 9 },
      { key: "operations", name: "Fleet & Depot Manager", description: "Vehicle maintenance, driver efficiency, routes", capabilities: ["act"], kpiCount: 12 },
    ],
  },
  {
    id: "real-estate-developer",
    name: "Real Estate Developer / Property Owner",
    industry: "Real Estate",
    description: "Sales booking velocity, collection vs milestone, construction cost variance, rental occupancy and rental yield.",
    kpiCount: 22,
    roles: [
      { key: "executive", name: "Developer / Asset Head", description: "Sales absorption, IRR, rental yields", capabilities: ["act"], kpiCount: 8 },
      { key: "operations", name: "Project Delivery Head", description: "Construction milestones, cost variance", capabilities: ["act"], kpiCount: 9 },
    ],
  },
  {
    id: "construction-contractor",
    name: "Construction Contractor / EPC",
    industry: "Construction & Infrastructure",
    description: "Schedule performance index (SPI), cost performance index (CPI), rework cost, safety incident rate and equipment uptime.",
    kpiCount: 24,
    roles: [
      { key: "executive", name: "Managing Contractor", description: "Project profitability and portfolio progress", capabilities: ["act"], kpiCount: 9 },
      { key: "operations", name: "Site Project Manager", description: "Milestone completion, labor productivity", capabilities: ["act"], kpiCount: 10 },
    ],
  },
  {
    id: "telecom-isp",
    name: "Telecom or Internet Service Provider (ISP)",
    industry: "Telecommunications",
    description: "Active subscriber base, average revenue per user (ARPU), network uptime, customer churn and fiber rollout speed.",
    kpiCount: 20,
    roles: [
      { key: "executive", name: "CEO / Telecom Head", description: "Subscribers, ARPU, EBITDA margin", capabilities: ["act"], kpiCount: 8 },
      { key: "operations", name: "Network Operations (NOC) Head", description: "Tower uptime, latency, bandwidth capacity", capabilities: ["act"], kpiCount: 9 },
    ],
  },
  {
    id: "energy-utility",
    name: "Energy, Solar or Power Utility",
    industry: "Energy & Utilities",
    description: "Plant load factor (PLF), transmission loss %, power generation cost per unit, collection efficiency and grid availability.",
    kpiCount: 20,
    roles: [
      { key: "executive", name: "Energy Director", description: "PLF, power revenue, generation costs", capabilities: ["act"], kpiCount: 8 },
      { key: "operations", name: "Grid & Station Operations", description: "Output MWh, outage hours, maintenance", capabilities: ["act"], kpiCount: 9 },
    ],
  },
  {
    id: "agri-business",
    name: "Agri-Business, Farming or Dairy",
    industry: "Agriculture & Dairy",
    description: "Crop/milk yield per hectare, post-harvest losses, cold-chain temperature compliance, processing efficiency and input costs.",
    kpiCount: 18,
    roles: [
      { key: "executive", name: "Farm / Agri Enterprise Head", description: "Total yield, revenue per acre, margins", capabilities: ["act"], kpiCount: 7 },
      { key: "operations", name: "Farm Operations Manager", description: "Fertilizer/feed usage, harvest volume", capabilities: ["act"], kpiCount: 8 },
    ],
  },
  {
    id: "nonprofit",
    name: "Non-Profit & Charitable Foundation",
    industry: "Non-Profit & NGO",
    description: "Donations, donor retention, program spend ratio, direct beneficiary reach and fundraising cost efficiency.",
    kpiCount: 18,
    roles: [
      { key: "executive", name: "Executive Director / Board", description: "Mission reach, donor trust, spend ratio", capabilities: ["act"], kpiCount: 7 },
      { key: "operations", name: "Program Delivery Head", description: "Beneficiary outcomes, project execution", capabilities: ["act"], kpiCount: 8 },
    ],
  },
  {
    id: "general-business",
    name: "General Corporate & Business (Cross-Industry)",
    industry: "General Business",
    description: "Balanced executive metrics: revenue growth, EBITDA, working capital, customer retention (NPS), employee productivity and quality.",
    kpiCount: 30,
    roles: [
      { key: "executive", name: "Executive (CEO / Owner view)", description: "The whole business on one page", capabilities: ["act"], kpiCount: 11 },
      { key: "operations", name: "Operations Head (COO)", description: "Delivery, efficiency and quality", capabilities: ["act"], kpiCount: 11 },
      { key: "finance", name: "Finance Head (CFO)", description: "Profitability, cash and margins", capabilities: ["act"], kpiCount: 10 },
      { key: "commercial", name: "Commercial & Sales Head", description: "Revenue and customers", capabilities: ["act"], kpiCount: 10 },
    ],
  },
];

export function SaaSOrganizationsManager({
  onSelectWorkspace,
  currentTenantId,
  title = "SaaS Organizations & Clients",
  description = "Manage all client organizations subscribed to your platform. Control lifecycle access (stop / suspend, activate), monitor staff counts, and onboard new organizations with predefined industry KPIs.",
}: SaaSOrganizationsManagerProps) {
  const [organizations, setOrganizations] = useState<ControlOrganization[]>([]);
  const [templates, setTemplates] = useState<TemplateSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "suspended" | "pending" | "deleted">("all");
  const [industryFilter, setIndustryFilter] = useState("all");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState("healthcare-hospital");
  const [customIndustry, setCustomIndustry] = useState("");
  const [issued, setIssued] = useState<IssuedSet>();
  const [confirming, setConfirming] = useState<{ id: string; kind: "delete" | "erase"; typed: string }>();

  // Track current timestamp for 30-day purge allowance check
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const canErase = (purgeAfter: string | null) => purgeAfter !== null && new Date(purgeAfter).getTime() <= now;

  async function loadData() {
    setLoading(true);
    try {
      const [orgRows, tmplRows] = await Promise.all([
        request("/api/control/organizations", ControlOrganizationListSchema),
        request("/api/control/templates", TemplateListSchema).catch(() => [] as TemplateSummary[]),
      ]);
      setOrganizations(orgRows);
      setTemplates(tmplRows);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Failed to load organizations from control service.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  // Merge loaded templates with catalogue fallbacks to guarantee all 21 industry options
  const availableTemplates = useMemo(() => {
    const map = new Map<string, TemplateSummary>();
    for (const t of PREDEFINED_INDUSTRY_TEMPLATES) map.set(t.id, t);
    for (const t of templates) map.set(t.id, t);
    return Array.from(map.values());
  }, [templates]);

  const byId = useMemo(() => {
    const map = new Map<string, TemplateSummary>();
    for (const t of availableTemplates) map.set(t.id, t);
    return map;
  }, [availableTemplates]);

  const selectedTemplate = useMemo(() => {
    return byId.get(selectedTemplateId);
  }, [byId, selectedTemplateId]);

  const selectedMeta = useMemo(() => {
    if (!selectedTemplate) return undefined;
    return INDUSTRY_CATALOGUE_META[selectedTemplate.id];
  }, [selectedTemplate]);

  // Telemetry metrics
  const stats = useMemo(() => {
    const total = organizations.length;
    const active = organizations.filter((o) => o.status === "active").length;
    const suspended = organizations.filter((o) => o.status === "suspended").length;
    const pending = organizations.filter((o) => o.status === "pending").length;
    const deleted = organizations.filter((o) => o.status === "deleted").length;
    const totalUsers = organizations.reduce((acc, o) => acc + (o.userCount || 0), 0);
    return { total, active, suspended, pending, deleted, totalUsers };
  }, [organizations]);

  // Extract distinct industries across current organizations for the filter dropdown
  const uniqueIndustries = useMemo(() => {
    const counts = new Map<string, number>();
    for (const org of organizations) {
      if (org.industry) {
        counts.set(org.industry, (counts.get(org.industry) || 0) + 1);
      }
    }
    return Array.from(counts.entries())
      .map(([name, count]) => ({
        name,
        count,
        icon: getIndustryIcon(name),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [organizations]);

  // Filtered organizations
  const filteredOrgs = useMemo(() => {
    const q = search.trim().toLowerCase();
    return organizations.filter((o) => {
      if (statusFilter !== "all" && o.status !== statusFilter) return false;
      if (industryFilter !== "all" && o.industry.toLowerCase() !== industryFilter.toLowerCase()) return false;
      if (!q) return true;
      const haystack = `${o.name} ${o.industry} ${o.plan} ${o.ownerName ?? ""} ${o.ownerEmail ?? ""}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [organizations, search, statusFilter, industryFilter]);

  async function refresh() {
    try {
      const rows = await request("/api/control/organizations", ControlOrganizationListSchema);
      setOrganizations(rows);
    } catch {
      // handled elsewhere
    }
  }

  /**
   * Stop / Suspend an organization:
   * Prevents customer users from logging in or querying APIs.
   */
  async function suspendOrganization(org: ControlOrganization) {
    if (!window.confirm(`Are you sure you want to STOP / SUSPEND “${org.name}”?\n\nAll users of this organization will immediately lose access until you activate it again.`)) {
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      await request(`/api/control/organizations/${org.id}/status`, MutationResponseSchema, {
        status: "suspended",
      });
      await refresh();
      setMessage(`Organization “${org.name}” has been STOPPED / SUSPENDED. Client access is now blocked.`);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Failed to suspend organization.");
    } finally {
      setBusy(false);
    }
  }

  /**
   * Start / Activate an organization:
   * Restores normal operations and allows customer logins.
   */
  async function activateOrganization(org: ControlOrganization) {
    setBusy(true);
    setMessage("");
    try {
      await request(`/api/control/organizations/${org.id}/status`, MutationResponseSchema, {
        status: "active",
      });
      await refresh();
      setMessage(`Organization “${org.name}” is now ACTIVE and running. Clients can sign in normally.`);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Failed to activate organization.");
    } finally {
      setBusy(false);
    }
  }

  /**
   * Soft-delete organization (requires exact name confirmation, grants 30-day recovery window)
   */
  async function deleteOrganization(org: ControlOrganization, confirmName: string) {
    setBusy(true);
    setMessage("");
    try {
      await request(`/api/control/organizations/${org.id}/status`, MutationResponseSchema, {
        status: "deleted",
        confirmName,
      });
      await refresh();
      setMessage(`Organization “${org.name}” was deleted. It will be permanently purgable in 30 days.`);
      setConfirming(undefined);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Failed to delete organization.");
    } finally {
      setBusy(false);
    }
  }

  async function erase(org: ControlOrganization, confirmName: string) {
    setBusy(true);
    setMessage("");
    try {
      const result = await request(`/api/control/organizations/${org.id}/purge`, PurgeOrganizationResponseSchema, { confirmName });
      await refresh();
      setMessage(
        `“${org.name}” was permanently erased with ${result.removedLogins} login${result.removedLogins === 1 ? "" : "s"} removed.`,
      );
      setConfirming(undefined);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Failed to permanently erase organization.");
    } finally {
      setBusy(false);
    }
  }

  async function createOrganization(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const field = (name: string) => {
      const val = data.get(name);
      return typeof val === "string" ? val.trim() : "";
    };

    const chosenTemplate = availableTemplates.find((t) => t.id === selectedTemplateId);
    const chosenMeta = chosenTemplate ? INDUSTRY_CATALOGUE_META[chosenTemplate.id] : undefined;
    const finalIndustry = selectedTemplateId === "custom"
      ? (customIndustry.trim() || "General Business")
      : (chosenMeta?.industryDisplay || chosenTemplate?.industry || "General Business");
    const finalTemplateId = selectedTemplateId === "custom" ? undefined : (chosenTemplate?.id || selectedTemplateId || undefined);

    setBusy(true);
    setIssued(undefined);
    setMessage("");
    try {
      const result = await request("/api/control/organizations", ProvisionResponseSchema, {
        name: field("name"),
        industry: finalIndustry,
        plan: field("plan") || "Pilot",
        ownerName: field("ownerName"),
        ownerEmail: field("email"),
        subscriptionStatus: "active",
        templateId: finalTemplateId,
        ownerEmailVerified: true,
        activate: data.get("activate") === "on",
        members: [],
      });
      setIssued({
        title: `Organization “${field("name")}” Initialized (${finalIndustry})`,
        mode: result.mode,
        people: [result.owner],
      });
      setMessage(
        `Organization “${field("name")}” has been added with ${chosenTemplate?.kpiCount ?? 0} predefined KPIs! Initial credentials or invite link are displayed below.`,
      );
      form.reset();
      setShowCreateForm(false);
      await refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Unable to create organization.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* ── Top Header & Actions ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h2 style={{ margin: "0 0 6px", fontSize: 22, fontWeight: 700, color: "#0f172a" }}>
            {title}
          </h2>
          <p className="muted" style={{ margin: 0, fontSize: 14, maxWidth: 680 }}>
            {description}
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            type="button"
            className="secondary"
            onClick={() => void loadData()}
            disabled={loading || busy}
            title="Refresh organizations list from backend"
          >
            {loading ? "Refreshing…" : "↻ Refresh"}
          </button>
          {!showCreateForm && (
            <button
              type="button"
              onClick={() => setShowCreateForm(true)}
              style={{ fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}
            >
              <span>＋</span>
              <span>Add New Organization</span>
            </button>
          )}
        </div>
      </div>

      {message && <output className="saas-message">{message}</output>}

      {/* ── Issued Credentials Modal / Notice ── */}
      {issued && (
        <section className="saas-card" style={{ border: "2px solid #3b82f6", background: "#f8fafc" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <h3 style={{ margin: 0, color: "#1e40af" }}>Client Credentials Generated</h3>
            <button type="button" className="secondary" onClick={() => setIssued(undefined)}>
              ✕ Dismiss
            </button>
          </div>
          <p style={{ margin: "0 0 12px", fontSize: 13, color: "#334155" }}>
            Share these initial access credentials securely with the organization owner.
          </p>
          <AccessPanel set={issued} />
        </section>
      )}

      {/* ── High-Level SaaS Fleet Telemetry ── */}
      <div
        className="saas-stats"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 12,
        }}
      >
        <div className="saas-card" style={{ padding: "16px 20px" }}>
          <span className="muted" style={{ fontSize: 12, textTransform: "uppercase", fontWeight: 700 }}>
            Total Organizations
          </span>
          <strong style={{ fontSize: 28, display: "block", marginTop: 4, color: "#0f172a" }}>
            {stats.total}
          </strong>
          <small className="muted" style={{ fontSize: 12 }}>All provisioned tenants</small>
        </div>

        <div className="saas-card" style={{ padding: "16px 20px" }}>
          <span className="muted" style={{ fontSize: 12, textTransform: "uppercase", fontWeight: 700 }}>
            Active Subscribers
          </span>
          <strong style={{ fontSize: 28, display: "block", marginTop: 4, color: "#16a34a" }}>
            {stats.active}
          </strong>
          <small className="muted" style={{ fontSize: 12 }}>Normal operational access</small>
        </div>

        <div className="saas-card" style={{ padding: "16px 20px" }}>
          <span className="muted" style={{ fontSize: 12, textTransform: "uppercase", fontWeight: 700 }}>
            Suspended / Stopped
          </span>
          <strong style={{ fontSize: 28, display: "block", marginTop: 4, color: "#dc2626" }}>
            {stats.suspended}
          </strong>
          <small className="muted" style={{ fontSize: 12 }}>Access blocked by operator</small>
        </div>

        <div className="saas-card" style={{ padding: "16px 20px" }}>
          <span className="muted" style={{ fontSize: 12, textTransform: "uppercase", fontWeight: 700 }}>
            Pending Setup
          </span>
          <strong style={{ fontSize: 28, display: "block", marginTop: 4, color: "#ca8a04" }}>
            {stats.pending}
          </strong>
          <small className="muted" style={{ fontSize: 12 }}>Awaiting owner activation</small>
        </div>

        <div className="saas-card" style={{ padding: "16px 20px" }}>
          <span className="muted" style={{ fontSize: 12, textTransform: "uppercase", fontWeight: 700 }}>
            Cross-Tenant Users
          </span>
          <strong style={{ fontSize: 28, display: "block", marginTop: 4, color: "#2563eb" }}>
            {stats.totalUsers}
          </strong>
          <small className="muted" style={{ fontSize: 12 }}>Total staff across all orgs</small>
        </div>
      </div>

      {/* ── Provision New Organization Drawer / Form ── */}
      {showCreateForm && (
        <section
          className="saas-card"
          style={{
            border: "2px solid #2563eb",
            background: "#ffffff",
            boxShadow: "0 10px 25px -5px rgba(37, 99, 235, 0.15)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div>
              <h3 style={{ margin: "0 0 4px", fontSize: 18, color: "#1e3a8a", display: "flex", alignItems: "center", gap: 8 }}>
                <span>🏢</span>
                <span>Add New Client Organization</span>
              </h3>
              <p className="muted" style={{ margin: 0, fontSize: 13 }}>
                Provision a new client tenant organization with ready-made industry KPIs and preconfigured leadership roles.
              </p>
            </div>
            <button type="button" className="secondary" onClick={() => setShowCreateForm(false)}>
              ✕ Cancel
            </button>
          </div>

          <form onSubmit={(e) => void createOrganization(e)} style={{ marginTop: 16 }}>
            <div className="console-grid">
              <label>
                Organization name *
                <input name="name" required maxLength={120} placeholder="e.g. City Care Hospital, Apex Retail" />
              </label>

              {/* ── Industry Dropdown with Predefined KPIs ── */}
              <label>
                Industry (Predefined KPIs Included) *
                <select
                  value={selectedTemplateId}
                  onChange={(e) => setSelectedTemplateId(e.target.value)}
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    padding: "9px 12px",
                    borderColor: "#2563eb",
                    borderRadius: 8,
                    background: "#ffffff",
                    boxShadow: "0 1px 2px rgba(37,99,235,0.06)",
                  }}
                  required
                >
                  <option value="" disabled>-- Choose an Industry with Predefined KPIs --</option>
                  {INDUSTRY_SECTOR_CATEGORIES.map((cat) => {
                    const catTemplates = availableTemplates.filter((t) => {
                      const meta = INDUSTRY_CATALOGUE_META[t.id];
                      return (meta?.category || "Corporate & Cross-Industry") === cat;
                    });
                    if (catTemplates.length === 0) return null;
                    return (
                      <optgroup key={cat} label={`── ${cat} ──`}>
                        {catTemplates.map((t) => {
                          const meta = INDUSTRY_CATALOGUE_META[t.id];
                          const icon = meta?.icon || getIndustryIcon(t.industry);
                          const indDisplay = meta?.industryDisplay || t.industry;
                          return (
                            <option key={t.id} value={t.id}>
                              {icon} {indDisplay}: {t.name} ({t.kpiCount} Predefined KPIs)
                            </option>
                          );
                        })}
                      </optgroup>
                    );
                  })}
                  <optgroup label="── Custom Industry ──">
                    <option value="custom">⚙️ Other / Custom Industry (Build custom KPIs from scratch)</option>
                  </optgroup>
                </select>
              </label>

              {selectedTemplateId === "custom" && (
                <label>
                  Custom Industry Name *
                  <input
                    type="text"
                    required
                    maxLength={120}
                    placeholder="e.g. Media Production, Space Tech, Biotechnology…"
                    value={customIndustry}
                    onChange={(e) => setCustomIndustry(e.target.value)}
                  />
                </label>
              )}

              <label>
                Subscription Plan *
                <input name="plan" required maxLength={80} defaultValue="Enterprise Pilot" placeholder="e.g. Standard, Growth, Enterprise" />
              </label>
              <label>
                Owner / Primary Admin Name *
                <input name="ownerName" required maxLength={120} placeholder="e.g. Dr. Rajesh Kumar" />
              </label>
              <label>
                Owner Sign-In Email *
                <input name="email" type="email" required placeholder="owner@clientorg.com" />
              </label>
            </div>

            {/* ── Predefined KPI Details & Sample Showcase Box ── */}
            {selectedTemplate && selectedTemplateId !== "custom" && (
              <div
                style={{
                  background: "linear-gradient(180deg, #f0f7ff 0%, #ffffff 100%)",
                  border: "1.5px solid #93c5fd",
                  borderRadius: 12,
                  padding: "16px 20px",
                  marginTop: 16,
                  boxShadow: "0 2px 8px rgba(37, 99, 235, 0.08)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10, marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 24 }}>{selectedMeta?.icon || getIndustryIcon(selectedTemplate.industry)}</span>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: "#2563eb", letterSpacing: "0.5px" }}>
                        {selectedMeta?.industryDisplay || selectedTemplate.industry}
                      </div>
                      <strong style={{ fontSize: 16, color: "#0f172a" }}>{selectedTemplate.name}</strong>
                    </div>
                  </div>
                  <span className="saas-badge good" style={{ fontWeight: 800, fontSize: 12, padding: "4px 12px", borderRadius: 9999 }}>
                    ⚡ {selectedTemplate.kpiCount} Predefined KPIs Ready
                  </span>
                </div>

                <p style={{ margin: "4px 0 12px", fontSize: 13, color: "#334155", lineHeight: 1.5 }}>
                  {selectedTemplate.description}
                </p>

                {/* Predefined KPIs Pills */}
                {selectedMeta?.sampleKpis && selectedMeta.sampleKpis.length > 0 && (
                  <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid #dbeafe" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#1e40af", marginBottom: 6 }}>
                      Predefined KPIs Included in this Industry Package:
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {selectedMeta.sampleKpis.map((kpiName) => (
                        <span
                          key={kpiName}
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            background: "#ffffff",
                            color: "#1e3a8a",
                            border: "1px solid #bfdbfe",
                            borderRadius: 6,
                            padding: "3px 8px",
                            boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          <span style={{ color: "#10b981", fontSize: 11 }}>✓</span> {kpiName}
                        </span>
                      ))}
                      {selectedTemplate.kpiCount > selectedMeta.sampleKpis.length && (
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            background: "#e0e7ff",
                            color: "#3730a3",
                            borderRadius: 6,
                            padding: "3px 8px",
                          }}
                        >
                          +{selectedTemplate.kpiCount - selectedMeta.sampleKpis.length} more predefined KPIs
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Preconfigured Roles */}
                {selectedTemplate.roles && selectedTemplate.roles.length > 0 && (
                  <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid #dbeafe" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#1e40af", marginBottom: 6 }}>
                      Preconfigured Staff Leadership Roles:
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {selectedTemplate.roles.map((r) => (
                        <span
                          key={r.key}
                          style={{
                            fontSize: 11,
                            background: "#f8fafc",
                            color: "#334155",
                            border: "1px solid #cbd5e1",
                            borderRadius: 6,
                            padding: "2px 8px",
                          }}
                          title={r.description}
                        >
                          👤 {r.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ marginTop: 12, fontSize: 11, color: "#0369a1", display: "flex", alignItems: "center", gap: 6 }}>
                  <span>ℹ️</span>
                  <span>
                    When provisioned, these {selectedTemplate.kpiCount} predefined KPIs, calculation formulas, and staff role access will be configured automatically for this organization.
                  </span>
                </div>
              </div>
            )}

            <div className="console-checks" style={{ margin: "16px 0 20px" }}>
              <label className="check-line" style={{ display: "flex", gap: 10, alignItems: "flex-start", cursor: "pointer" }}>
                <input type="checkbox" name="verified" defaultChecked required style={{ marginTop: 3 }} />
                <span style={{ fontSize: 13 }}>
                  <strong>Verified Client Identity:</strong> I verify that this email address belongs to the designated organization owner.
                </span>
              </label>
              <label className="check-line" style={{ display: "flex", gap: 10, alignItems: "flex-start", cursor: "pointer", marginTop: 8 }}>
                <input type="checkbox" name="activate" defaultChecked style={{ marginTop: 3 }} />
                <span style={{ fontSize: 13 }}>
                  <strong>Activate Immediately:</strong> Untick to keep as pending setup (cannot log in until you activate it).
                </span>
              </label>
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <button type="submit" disabled={busy} style={{ fontWeight: 700 }}>
                {busy ? "Provisioning Organization…" : "Create & Provision Organization"}
              </button>
              <button type="button" className="secondary" onClick={() => setShowCreateForm(false)}>
                Cancel
              </button>
            </div>
          </form>
        </section>
      )}

      {/* ── Search, Filters & Organizations Directory ── */}
      <section className="saas-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
          {/* Status Tabs */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {[
              { key: "all", label: "All Organizations", count: stats.total },
              { key: "active", label: "Active", count: stats.active },
              { key: "suspended", label: "Stopped / Suspended", count: stats.suspended },
              { key: "pending", label: "Pending", count: stats.pending },
              ...(stats.deleted > 0 ? [{ key: "deleted", label: "Deleted", count: stats.deleted }] : []),
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={statusFilter === tab.key ? "" : "secondary"}
                style={{
                  borderRadius: 9999,
                  padding: "5px 12px",
                  fontSize: 13,
                  fontWeight: statusFilter === tab.key ? 700 : 500,
                  background: statusFilter === tab.key ? "#2563eb" : undefined,
                  color: statusFilter === tab.key ? "#ffffff" : undefined,
                }}
                onClick={() => setStatusFilter(tab.key as typeof statusFilter)}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>

          {/* Right Toolbar: Industry Filter & Search */}
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            {/* Industry Filter Dropdown */}
            <select
              aria-label="Filter by Industry"
              value={industryFilter}
              onChange={(e) => setIndustryFilter(e.target.value)}
              style={{
                fontSize: 13,
                padding: "7px 12px",
                borderRadius: 8,
                borderColor: industryFilter !== "all" ? "#2563eb" : "#cbd5e1",
                background: industryFilter !== "all" ? "#eff6ff" : "#ffffff",
                color: industryFilter !== "all" ? "#1e40af" : "#1e293b",
                fontWeight: industryFilter !== "all" ? 700 : 400,
              }}
            >
              <option value="all">🏢 All Industries ({organizations.length})</option>
              {uniqueIndustries.map((ind) => (
                <option key={ind.name} value={ind.name}>
                  {ind.icon} {ind.name} ({ind.count})
                </option>
              ))}
            </select>

            {/* Instant Search Input */}
            <div style={{ width: 260, maxWidth: "100%" }}>
              <input
                type="search"
                aria-label="Search organizations"
                placeholder="Search by name, industry, owner…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: "100%", fontSize: 13, padding: "7px 12px" }}
              />
            </div>
          </div>
        </div>

        {/* Filter Indicator / Reset */}
        {(statusFilter !== "all" || industryFilter !== "all" || search) && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, fontSize: 12, color: "#475569" }}>
            <span>Filtered results: <strong>{filteredOrgs.length}</strong> of {organizations.length} organizations</span>
            {industryFilter !== "all" && (
              <span
                style={{
                  background: "#eff6ff",
                  color: "#1d4ed8",
                  padding: "2px 8px",
                  borderRadius: 9999,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
                onClick={() => setIndustryFilter("all")}
                title="Clear industry filter"
              >
                Industry: {industryFilter} ✕
              </span>
            )}
            {statusFilter !== "all" && (
              <span
                style={{
                  background: "#f1f5f9",
                  color: "#334155",
                  padding: "2px 8px",
                  borderRadius: 9999,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
                onClick={() => setStatusFilter("all")}
                title="Clear status filter"
              >
                Status: {statusFilter} ✕
              </span>
            )}
            <button
              type="button"
              className="secondary"
              style={{ fontSize: 11, padding: "2px 8px" }}
              onClick={() => {
                setStatusFilter("all");
                setIndustryFilter("all");
                setSearch("");
              }}
            >
              Reset All Filters
            </button>
          </div>
        )}

        {loading ? (
          <p className="muted" style={{ padding: "20px 0", textAlign: "center" }}>
            Loading organizations…
          </p>
        ) : filteredOrgs.length === 0 ? (
          <div style={{ padding: "40px 20px", textAlign: "center" }}>
            <p className="muted" style={{ margin: "0 0 12px", fontSize: 15 }}>
              {search || statusFilter !== "all" || industryFilter !== "all"
                ? "No organizations match your current search or filters."
                : "No client organizations have been onboarded yet."}
            </p>
            {!showCreateForm && (
              <button type="button" onClick={() => setShowCreateForm(true)}>
                ＋ Add First Organization
              </button>
            )}
          </div>
        ) : (
          <div className="saas-table-wrap">
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left" }}>Organization & Plan</th>
                  <th style={{ textAlign: "left" }}>Lifecycle Status</th>
                  <th style={{ textAlign: "left" }}>Owner & Access</th>
                  <th style={{ textAlign: "left" }}>Scale / Headcount</th>
                  <th style={{ textAlign: "left" }}>Industry & Predefined KPIs</th>
                  <th style={{ textAlign: "right" }}>SaaS Operations</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrgs.map((org) => {
                  const tmpl = org.templateId ? byId.get(org.templateId) : undefined;
                  const meta = org.templateId ? INDUSTRY_CATALOGUE_META[org.templateId] : undefined;
                  const isCurrent = currentTenantId === org.id;

                  return (
                    <tr
                      key={org.id}
                      style={{
                        background: isCurrent ? "rgba(37, 99, 235, 0.04)" : undefined,
                        borderBottom: "1px solid var(--line, #e2e8f0)",
                      }}
                    >
                      {/* Name & Plan */}
                      <td style={{ verticalAlign: "middle", padding: "14px 10px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <strong style={{ fontSize: 14, color: "#0f172a" }}>{org.name}</strong>
                          {isCurrent && (
                            <span className="saas-badge good" style={{ fontSize: 10, padding: "1px 6px" }}>
                              Current Workspace
                            </span>
                          )}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                          <span
                            className="saas-badge"
                            style={{
                              fontSize: 11,
                              background: "#eff6ff",
                              color: "#1e40af",
                              borderColor: "#bfdbfe",
                              padding: "1px 7px",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                            }}
                          >
                            <span>{getIndustryIcon(org.industry)}</span>
                            <span>{org.industry}</span>
                          </span>
                          <span className="muted">·</span>
                          <span style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>{org.plan}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td style={{ verticalAlign: "middle", padding: "14px 10px" }}>
                        {org.status === "active" && (
                          <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                            <span className="saas-badge good" style={{ fontWeight: 700 }}>
                              ● Active
                            </span>
                          </div>
                        )}
                        {org.status === "suspended" && (
                          <div>
                            <span className="saas-badge attention" style={{ fontWeight: 700, background: "#fee2e2", color: "#991b1b" }}>
                              ⏹ Stopped / Suspended
                            </span>
                            <small className="muted" style={{ display: "block", fontSize: 11, marginTop: 3 }}>
                              Client access paused
                            </small>
                          </div>
                        )}
                        {org.status === "pending" && (
                          <div>
                            <span className="saas-badge attention" style={{ fontWeight: 700, background: "#fef9c3", color: "#854d0e" }}>
                              ⏳ Pending Setup
                            </span>
                            <small className="muted" style={{ display: "block", fontSize: 11, marginTop: 3 }}>
                              Awaiting first sign-in
                            </small>
                          </div>
                        )}
                        {org.status === "deleted" && (
                          <div>
                            <span className="saas-badge" style={{ fontWeight: 700, background: "#f1f5f9", color: "#64748b" }}>
                              🗑 Deleted
                            </span>
                            {org.purgeAfter && (
                              <small className="muted" style={{ display: "block", fontSize: 11, marginTop: 3 }}>
                                Purge after {new Date(org.purgeAfter).toLocaleDateString()}
                              </small>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Owner & Credential */}
                      <td style={{ verticalAlign: "middle", padding: "14px 10px" }}>
                        <strong style={{ fontSize: 13, display: "block" }}>{org.ownerName ?? "Owner"}</strong>
                        <span className="muted" style={{ fontSize: 12, display: "block" }}>{org.ownerEmail ?? "—"}</span>
                        <div style={{ marginTop: 4 }}>
                          <span className={`saas-badge ${org.credentialStatus === "verified" ? "good" : "attention"}`} style={{ fontSize: 10, padding: "2px 6px" }}>
                            {org.credentialStatus === "verified" ? "Password Active" : "Temporary Login"}
                          </span>
                        </div>
                      </td>

                      {/* Headcount */}
                      <td style={{ verticalAlign: "middle", padding: "14px 10px" }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>
                          {org.userCount} {org.userCount === 1 ? "user" : "users"}
                        </span>
                        <small className="muted" style={{ display: "block", fontSize: 11 }}>
                          {org.roleCount} {org.roleCount === 1 ? "role" : "roles"}
                        </small>
                      </td>

                      {/* Predefined Template */}
                      <td style={{ verticalAlign: "middle", padding: "14px 10px", fontSize: 12 }}>
                        {tmpl ? (
                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                              <span>{meta?.icon || getIndustryIcon(org.industry)}</span>
                              <strong style={{ color: "#1e40af" }}>{tmpl.name}</strong>
                            </div>
                            <small className="muted" style={{ display: "block", marginTop: 2 }}>
                              ⚡ {tmpl.kpiCount} KPIs preconfigured
                            </small>
                          </div>
                        ) : org.templateId ? (
                          <span>{org.templateId}</span>
                        ) : (
                          <span className="muted">Custom setup</span>
                        )}
                      </td>

                      {/* Operations / Actions */}
                      <td style={{ verticalAlign: "middle", padding: "14px 10px", textAlign: "right" }}>
                        <div style={{ display: "flex", gap: 6, justifyContent: "flex-end", flexWrap: "wrap" }}>
                          {/* Workspace transition */}
                          {onSelectWorkspace && org.status !== "deleted" && (
                            <button
                              type="button"
                              className="secondary"
                              style={{ fontSize: 12, padding: "4px 8px" }}
                              onClick={() => onSelectWorkspace(org.id)}
                              title="Open this tenant's KPI workspace directly"
                            >
                              Open Workspace →
                            </button>
                          )}

                          {/* STOP / SUSPEND ACTION */}
                          {org.status === "active" && (
                            <button
                              type="button"
                              style={{
                                fontSize: 12,
                                padding: "4px 8px",
                                background: "#fee2e2",
                                color: "#991b1b",
                                border: "1px solid #fca5a5",
                                fontWeight: 600,
                              }}
                              disabled={busy}
                              onClick={() => void suspendOrganization(org)}
                              title="Stop this organization's access immediately"
                            >
                              ⏹ Stop / Suspend
                            </button>
                          )}

                          {/* START / ACTIVATE ACTION */}
                          {(org.status === "suspended" || org.status === "pending") && (
                            <button
                              type="button"
                              style={{
                                fontSize: 12,
                                padding: "4px 8px",
                                background: "#dcfce7",
                                color: "#166534",
                                border: "1px solid #86efac",
                                fontWeight: 600,
                              }}
                              disabled={busy}
                              onClick={() => void activateOrganization(org)}
                              title="Activate or restart this organization's access"
                            >
                              ▶ Start / Activate
                            </button>
                          )}

                          {/* RESTORE ACTION (if deleted) */}
                          {org.status === "deleted" && (
                            <button
                              type="button"
                              className="secondary"
                              style={{ fontSize: 12, padding: "4px 8px" }}
                              disabled={busy}
                              onClick={() => void activateOrganization(org)}
                              title="Restore deleted organization"
                            >
                              ↺ Restore
                            </button>
                          )}

                          {/* DELETE OR ERASE */}
                          {org.status !== "deleted" ? (
                            <button
                              type="button"
                              className="secondary"
                              style={{ fontSize: 12, padding: "4px 8px", color: "#b91c1c" }}
                              disabled={busy}
                              onClick={() => setConfirming({ id: org.id, kind: "delete", typed: "" })}
                            >
                              Delete
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="secondary"
                              style={{
                                fontSize: 12,
                                padding: "4px 8px",
                                color: canErase(org.purgeAfter) ? "#b91c1c" : "#94a3b8",
                              }}
                              disabled={busy || !canErase(org.purgeAfter)}
                              title={
                                canErase(org.purgeAfter)
                                  ? "Erase forever (removes database records completely)"
                                  : "Retention period active (30 days)"
                              }
                              onClick={() => setConfirming({ id: org.id, kind: "erase", typed: "" })}
                            >
                              Erase
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── Confirmation Modal (Exact Name Typing required) ── */}
      {confirming && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(2px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: 16,
          }}
          onClick={() => setConfirming(undefined)}
        >
          <div
            className="saas-card"
            style={{ maxWidth: 480, width: "100%", background: "#ffffff", padding: 24, borderRadius: 12 }}
            onClick={(e) => e.stopPropagation()}
          >
            {(() => {
              const target = organizations.find((o) => o.id === confirming.id);
              if (!target) return null;
              const isDelete = confirming.kind === "delete";
              const matches = confirming.typed === target.name;

              return (
                <div>
                  <h3 style={{ margin: "0 0 10px", color: "#b91c1c" }}>
                    {isDelete ? `Delete “${target.name}”?` : `Permanently Erase “${target.name}”?`}
                  </h3>
                  <p style={{ fontSize: 13, color: "#475569", lineHeight: 1.5, margin: "0 0 16px" }}>
                    {isDelete
                      ? "The organization will be deactivated immediately and moved to the deleted queue. Staff will lose access. You can restore it anytime within the 30-day retention window."
                      : "This will permanently delete all organization records, KPIs, calculation history, and staff logins. This action CANNOT be undone."}
                  </p>
                  <label style={{ display: "block", fontSize: 13, marginBottom: 14 }}>
                    To confirm, please type <strong>{target.name}</strong> below:
                    <input
                      type="text"
                      autoFocus
                      value={confirming.typed}
                      onChange={(e) => setConfirming({ ...confirming, typed: e.target.value })}
                      placeholder="Type the exact organization name"
                      style={{ marginTop: 6, width: "100%", padding: "8px 12px" }}
                    />
                  </label>
                  <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                    <button type="button" className="secondary" onClick={() => setConfirming(undefined)}>
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={!matches || busy}
                      style={{
                        background: matches ? "#dc2626" : "#fca5a5",
                        color: "#ffffff",
                        fontWeight: 700,
                      }}
                      onClick={() => {
                        if (isDelete) {
                          void deleteOrganization(target, confirming.typed);
                        } else {
                          void erase(target, confirming.typed);
                        }
                      }}
                    >
                      {busy ? "Processing…" : isDelete ? "Confirm Delete" : "Permanently Erase"}
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
