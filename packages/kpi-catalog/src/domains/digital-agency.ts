import type { DomainSource } from "../types.ts";

// A digital marketing or creative agency: retainers and projects for clients,
// one unit per client under the agency. KPIs marked `top` are measured for the
// whole agency only (their inputs are reported at the top unit).
// Ratios add up numerators and denominators across clients, then divide.

const industries = ["digital_marketing"];
const sources = [
  "https://agencyanalytics.com/blog/agency-metrics-kpis-profitability-growth",
  "https://www.netsuite.com/portal/resource/articles/erp/marketing-agency-kpis.shtml",
  "https://whatagraph.com/blog/articles/agency-metrics-kpis",
  "https://predictableprofits.com/10-kpis-for-agency-success/",
];

export const agencyFinance: DomainSource = {
  domain: "agency_finance",
  title: "Agency revenue and profitability",
  industries,
  sources,
  measures: `
revenue_target | Monthly revenue target | currency | Revenue the agency aims to invoice in the month, set before the month starts. | no-rollup
delivery_team_cost | Team cost on client work | currency | Hours logged on the client times each person's cost per hour.
vendor_cost | Freelancer and vendor cost | currency | Freelancer and vendor bills for the period (video, paid ads, web and similar).
largest_client_revenue | Largest client's revenue | currency | Revenue from the single biggest client in the period. | no-rollup
`,
  kpis: `
AGY-001 | Revenue vs monthly target | pct(revenue, revenue_target) | higher | Net revenue invoiced (retainer and project, excluding GST) as a share of the monthly revenue target. | top
AGY-002 | Agency gross margin | pct(revenue - payroll_cost - vendor_cost, revenue) | higher | Revenue left after the whole team's payroll and freelancer and vendor bills. | top
AGY-008 | Revenue concentration | pct(largest_client_revenue, revenue) | lower | The biggest client's share of revenue. Lower means less dependence on one client. | top
AGY-009 | Net revenue | revenue | higher | Fees invoiced in the period (retainer and project), excluding GST.
AGY-013 | Client gross margin | pct(revenue - delivery_team_cost - vendor_cost, revenue) | higher | Client revenue left after the team's hours on the client (at cost) and the client's freelancer and vendor bills.
AGY-034 | Freelancer and vendor cost ratio | pct(vendor_cost, revenue) | lower | Freelancer and vendor bills as a share of revenue.
`,
};

export const agencyClients: DomainSource = {
  domain: "agency_clients",
  title: "Clients and retention",
  industries,
  sources,
  measures: `
active_clients | Active clients | count | Clients with a live retainer or open project on the last day of the period.
clients_at_start | Clients active at period start | count | Clients with a live retainer or open project on the first day of the period.
clients_retained | Clients retained | count | Clients active at the start of the period who are still active at the end.
existing_client_revenue | Revenue from existing clients | currency | This period's revenue from clients that were active at the start of the period.
existing_client_prior_revenue | Same clients' revenue last period | currency | The previous period's revenue from those same clients.
retainers_at_risk | Retainers at risk | count | Retainers with notice given, renewal due within 30 days and unconfirmed, or the advance unpaid more than 7 days after its due date.
`,
  kpis: `
AGY-003 | Active clients | active_clients | higher | Clients with a live retainer or open project on the last day of the period. | top
AGY-010 | Client retention | pct(clients_retained, clients_at_start) | higher | Clients active at the start of the period who are still active at the end.
AGY-011 | Net revenue retention | pct(existing_client_revenue, existing_client_prior_revenue) | higher | This period's revenue from existing clients against the same clients' revenue last period.
AGY-012 | Upsell and cross-sell revenue | upsell_revenue | higher | Monthly fee added from new services or bigger scope sold to existing clients. | top
AGY-014 | Retainers at risk | retainers_at_risk | lower | Retainers with notice given, an unconfirmed renewal due within 30 days, or an overdue advance.
`,
};

export const agencyGrowth: DomainSource = {
  domain: "agency_growth",
  title: "Growth and pipeline",
  industries,
  sources,
  measures: `
weighted_pipeline | Weighted pipeline | currency | Open prospects' expected monthly fee times the stage probability, at period end. | no-rollup
revenue_to_book | Revenue still to book | currency | Monthly revenue target minus retainer revenue already contracted, at period end. | no-rollup
`,
  kpis: `
AGY-004 | New clients onboarded | new_customers | higher | Clients whose first invoice falls in the period. | top
AGY-005 | Pipeline coverage | weighted_pipeline / revenue_to_book | higher | Weighted value of open prospects against the revenue still to book this month. | top
AGY-006 | Proposal win rate | pct(deals_won, deals_won + deals_lost) | higher | Proposals won as a share of proposals decided (won or lost) in the period. | top
AGY-007 | New leads | leads_generated | higher | New enquiries logged in the pipeline (website, social, referral). | top
`,
};

export const agencyDelivery: DomainSource = {
  domain: "agency_delivery",
  title: "Delivery",
  industries,
  sources,
  measures: `
deliverables_due | Deliverables due | count | Deliverables whose due date falls in the period.
deliverables_on_time | Deliverables on time | count | Deliverables due in the period that were first submitted on or before the due date.
deliverables_scoped | Deliverables scoped | count | Deliverables promised in retainers for the period.
deliverables_approved | Deliverables approved | count | Deliverables the client approved in the period.
deliverables_submitted | Deliverables submitted | count | Deliverables first submitted to the client in the period.
turnaround_days | Turnaround working days | days | Working days from brief received to first submission, added up across deliverables submitted.
`,
  kpis: `
AGY-020 | On-time delivery | pct(deliverables_on_time, deliverables_due) | higher | Deliverables first submitted on or before the due date, out of those due in the period.
AGY-021 | Retainer fulfilment | pct(deliverables_approved, deliverables_scoped) | higher | Deliverables approved against those scoped in the retainer for the period.
AGY-030 | Average turnaround time | turnaround_days / deliverables_submitted | lower | Average working days from brief received to first submission.
`,
};

export const agencyQuality: DomainSource = {
  domain: "agency_quality",
  title: "Quality and client outcomes",
  industries,
  sources,
  measures: `
first_time_approvals | Approved first time | count | Deliverables approved with no revision rounds.
revision_rounds | Revision rounds | rounds | Revision rounds across deliverables approved in the period.
clients_with_goal | Clients with a monthly goal | count | Clients that agreed a monthly goal metric (reach, engagement, followers, views or cost per lead).
clients_goal_met | Clients that met their goal | count | Clients whose monthly goal metric was reached.
csat_points | Satisfaction rating total | points | Sum of the 1 to 5 ratings given by clients' main contacts.
`,
  kpis: `
AGY-022 | First-time approval rate | pct(first_time_approvals, deliverables_approved) | higher | Deliverables approved with no revision rounds, out of those approved.
AGY-023 | Average revision rounds | revision_rounds / deliverables_approved | lower | Revision rounds per approved deliverable.
AGY-024 | Client goal attainment | pct(clients_goal_met, clients_with_goal) | higher | Clients that met their agreed monthly goal, out of clients with a goal.
AGY-025 | Client satisfaction | csat_points / csat_responses | higher | Average 1 to 5 rating from each client's main contact.
`,
};

export const agencyOperations: DomainSource = {
  domain: "agency_operations",
  title: "Agency operations and cash",
  industries,
  sources,
  measures: `
onboarding_days | Onboarding working days | days | Working days from contract signed to first deliverable approved, for clients onboarded in the period.
clients_onboarded | Clients onboarded | count | Clients whose onboarding finished in the period.
client_hours | Hours on client work | hours | Hours the delivery team logged to client work. | no-rollup
retainer_hours | Hours spent on retainers | hours | Hours logged on retainer work in the period.
scoped_hours | Hours scoped in retainers | hours | Hours the retainers allow for the period.
retainer_invoices | Retainer invoices raised | count | Advance invoices raised for retainers in the period.
retainer_invoices_on_time | Retainer invoices paid on time | count | Retainer invoices paid by their due date.
`,
  kpis: `
AGY-031 | Client onboarding time | onboarding_days / clients_onboarded | lower | Average working days from contract signed to first deliverable approved.
AGY-032 | Team utilisation | pct(client_hours, available_hours) | higher | Hours logged to client work as a share of the delivery team's available hours. | top
AGY-033 | Over-servicing | pct(retainer_hours - scoped_hours, scoped_hours) | lower | Hours spent on retainers beyond the hours scoped, as a share of the hours scoped.
AGY-035 | Advance collected on time | pct(retainer_invoices_on_time, retainer_invoices) | higher | Retainer invoices paid by their due date, out of those raised.
`,
};

export const agencyClientResults: DomainSource = {
  domain: "agency_client_results",
  title: "Client results (social media)",
  industries,
  sources,
  measures: `
video_views | Video views | count | Video and reel views across the client's channels.
followers_start | Followers at period start | count | Social media followers on the first day of the period.
paid_leads | Leads from paid campaigns | count | Leads generated by the client's paid advertising.
`,
  kpis: `
AGY-050 | Reach | social_reach | higher | Accounts reached across the client's channels.
AGY-051 | Engagement rate | pct(social_engagements, social_reach) | higher | Likes, comments, shares and saves as a share of reach.
AGY-052 | Views | video_views | higher | Video and reel views across the client's channels.
AGY-053 | Follower growth | pct(followers - followers_start, followers_start) | higher | Change in followers over the period, against followers at the start.
AGY-054 | Cost per lead | advertising_spend / paid_leads | lower | Paid advertising spend for each lead from paid campaigns.
`,
};

export const digitalAgency: readonly DomainSource[] = [
  agencyFinance,
  agencyClients,
  agencyGrowth,
  agencyDelivery,
  agencyQuality,
  agencyOperations,
  agencyClientResults,
];
