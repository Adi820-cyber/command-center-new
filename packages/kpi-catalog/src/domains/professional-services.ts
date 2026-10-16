import type { DomainSource } from "../types.ts";

export const professionalServices: DomainSource = {
  domain: "professional_services",
  title: "Professional services (law, accounting, consulting, IT services)",
  industries: ["professional_services", "it_services"],
  sources: [
    "https://www.attorneyatwork.com/law-firm-kpis-5-metrics-for-pricing-profit-predictability/",
    "https://clio.com/resources/legal-trends/benchmarks/",
    "https://caretlegal.com/?p=43368",
    "https://stephsbooks.com/blog/law-firm-financial-kpis",
  ],
  measures: `
billable_hours | Billable hours | hours | Hours charged to clients.
available_hours | Available hours | hours | Hours professionals could have worked.
worked_value | Value of time recorded | currency | Recorded time at standard rates.
billed_value | Value billed | currency | Amount invoiced to clients.
collected_value | Cash collected | currency | Cash received from clients.
wip_unbilled | Unbilled work in progress | currency | Recorded time not yet invoiced.
unpaid_invoices | Unpaid invoices | currency | Invoices issued but not yet paid.
time_written_off | Time written off | currency | Recorded time that will not be billed.
partners | Partners | count | Partners or principals.
fee_earners | Fee earners | count | Professionals who bill time, including partners.
matters_opened | Matters opened | count | New client matters, engagements or projects.
matters_closed | Matters closed | count | Matters finished in the period.
matters_profitable | Profitable matters closed | count | Closed matters that made a profit.
days_to_invoice_total | Total days from work to invoice | days | Sum of days between the work and its invoice.
bench_hours | Bench hours | hours | Hours of professionals not allocated to a client.
project_revenue | Project revenue | currency | Revenue from delivered projects.
project_cost | Project cost | currency | Direct cost of delivered projects.
projects_delivered | Projects delivered | count | Projects completed.
projects_delivered_on_time | Projects delivered on time | count | Projects completed by the agreed date.
rework_hours | Rework hours | hours | Hours spent fixing earlier work.
timesheets_due | Timesheets due | count | Timesheets expected.
timesheets_on_time | Timesheets submitted on time | count | Timesheets received by the deadline.
new_clients | New clients | count | Clients engaged for the first time.
`,
  kpis: `
PRO-001 | Utilisation rate | pct(billable_hours, available_hours) | higher | Available hours that were billed to clients.
PRO-002 | Billing realisation | pct(billed_value, worked_value) | higher | Recorded time that was invoiced.
PRO-003 | Collection realisation | pct(collected_value, billed_value) | higher | Invoiced amount that was paid.
PRO-004 | Overall realisation | pct(collected_value, worked_value) | higher | Recorded time that turned into cash.
PRO-005 | Effective billing rate | billed_value / billable_hours | higher | Amount invoiced for each billable hour.
PRO-006 | Average realised rate | collected_value / billable_hours | higher | Cash collected for each billable hour.
PRO-007 | Work-in-progress lockup days | wip_unbilled / revenue * period_days | lower | Days of revenue sitting unbilled.
PRO-008 | Debtor lockup days | unpaid_invoices / revenue * period_days | lower | Days of revenue sitting unpaid.
PRO-009 | Total lockup days | (wip_unbilled + unpaid_invoices) / revenue * period_days | lower | Days of revenue unbilled or unpaid.
PRO-010 | Write-off rate | pct(time_written_off, worked_value) | lower | Recorded time that will never be billed.
PRO-011 | Revenue per fee earner | revenue / fee_earners | higher | Revenue for each billing professional.
PRO-012 | Revenue per partner | revenue / partners | higher | Revenue for each partner.
PRO-013 | Profit per partner | net_profit / partners | higher | Net profit for each partner.
PRO-014 | Leverage ratio | (fee_earners - partners) / partners | neutral | Professionals for each partner.
PRO-015 | Matter profitability rate | pct(matters_profitable, matters_closed) | higher | Closed matters that made a profit.
PRO-016 | Matters opened | matters_opened | higher | New client matters.
PRO-017 | Matters closed | matters_closed | higher | Matters finished in the period.
PRO-018 | Repeat client rate | pct(repeat_customers, customers_active) | higher | Clients who came back.
PRO-019 | New clients | new_clients | higher | Clients engaged for the first time.
PRO-020 | Average days to invoice | days_to_invoice_total / invoices_issued | lower | Average days between work and invoice.
PRO-021 | Bench ratio | pct(bench_hours, available_hours) | lower | Available hours not allocated to a client.
PRO-022 | Project margin | pct(project_revenue - project_cost, project_revenue) | higher | Profit on delivered projects.
PRO-023 | On-time project delivery | pct(projects_delivered_on_time, projects_delivered) | higher | Projects completed by the agreed date.
PRO-024 | Rework ratio | pct(rework_hours, billable_hours) | lower | Hours spent fixing earlier work.
PRO-025 | Timesheet compliance | pct(timesheets_on_time, timesheets_due) | higher | Timesheets received by the deadline.
PRO-026 | Billable hours | billable_hours | higher | Hours charged to clients.
PRO-027 | Fees collected | collected_value | higher | Cash received from clients.
`,
};
