import type { DomainSource } from "../types.ts";

export const sales: DomainSource = {
  domain: "sales",
  title: "Sales",
  industries: ["*"],
  sources: [
    "https://www.forentrepreneurs.com/pt-br/saas-metrics-2-definitions",
    "https://amasty.com/blog/ecommerce-kpis/",
    "https://www.promodo.com/blog/kpis-in-ecommerce",
  ],
  measures: `
pipeline_value | Open pipeline value | currency | Value of open opportunities at period end.
quota | Sales quota | currency | Bookings target set for the period.
bookings | Bookings | currency | Value of deals closed and won in the period.
deals_won | Deals won | count | Deals closed and won.
deals_lost | Deals lost | count | Deals closed and lost.
opportunities_created | Opportunities created | count | New sales opportunities opened.
leads_generated | Leads generated | count | New leads captured from all sources.
leads_contacted | Leads contacted | count | Leads a salesperson reached out to.
qualified_leads | Qualified leads | count | Leads that met the qualification criteria.
proposals_sent | Proposals sent | count | Quotes or proposals issued to prospects.
sales_cycle_days_total | Total days to close won deals | days | Sum of days from first contact to close for deals won.
sales_reps | Sales representatives | count | Quota-carrying salespeople.
discount_given | Discounts given | currency | Value discounted from list price.
gross_list_value | Value at list price | currency | Value of sales before discounts.
forecast_revenue | Forecast revenue | currency | Revenue forecast for the period.
new_customer_revenue | Revenue from new customers | currency | Revenue from customers won in the period.
existing_customer_revenue | Revenue from existing customers | currency | Revenue from customers won earlier.
upsell_revenue | Upsell and cross-sell revenue | currency | Extra revenue from selling more to existing customers.
orders | Orders | count | Customer orders received.
customers_active | Active customers | count | Customers who bought or were served in the period.
top_customers_revenue | Revenue from the ten largest customers | currency | Revenue from the ten biggest customers.
meetings_held | Customer meetings held | count | Meetings or demos held with prospects.
calls_made | Sales calls made | count | Outbound calls by the sales team.
`,
  kpis: `
SAL-001 | Win rate | pct(deals_won, deals_won + deals_lost) | higher | Share of closed deals that were won.
SAL-002 | Loss rate | pct(deals_lost, deals_won + deals_lost) | lower | Share of closed deals that were lost.
SAL-003 | Pipeline coverage | pipeline_value / quota | higher | Pipeline value for every unit of quota.
SAL-004 | Quota attainment | pct(bookings, quota) | higher | Bookings as a share of quota.
SAL-005 | Quota gap | quota - bookings | lower | Bookings still needed to reach quota.
SAL-006 | Average deal size | bookings / deals_won | higher | Average value of a won deal.
SAL-007 | Average sales cycle | sales_cycle_days_total / deals_won | lower | Average days from first contact to close.
SAL-008 | Lead to opportunity rate | pct(opportunities_created, leads_generated) | higher | Leads that became opportunities.
SAL-009 | Lead qualification rate | pct(qualified_leads, leads_generated) | higher | Leads that met the qualification criteria.
SAL-010 | Lead contact rate | pct(leads_contacted, leads_generated) | higher | Leads that a salesperson reached.
SAL-011 | Proposal win rate | pct(deals_won, proposals_sent) | higher | Proposals that turned into won deals.
SAL-012 | Revenue per sales rep | revenue / sales_reps | higher | Revenue for each salesperson.
SAL-013 | Bookings per sales rep | bookings / sales_reps | higher | Bookings for each salesperson.
SAL-014 | Discount rate | pct(discount_given, gross_list_value) | lower | Share of list price given away.
SAL-015 | Average discount per order | discount_given / orders | lower | Discount given on each order.
SAL-016 | Forecast accuracy | pct(forecast_revenue - abs(revenue - forecast_revenue), forecast_revenue) | higher | How close revenue came to the forecast.
SAL-017 | Revenue variance to forecast | pct(revenue - forecast_revenue, forecast_revenue) | higher | Revenue above or below forecast.
SAL-018 | New customer revenue share | pct(new_customer_revenue, revenue) | higher | Revenue that came from newly won customers.
SAL-019 | Existing customer revenue share | pct(existing_customer_revenue, revenue) | neutral | Revenue that came from earlier customers.
SAL-020 | Upsell revenue share | pct(upsell_revenue, revenue) | higher | Revenue from selling more to existing customers.
SAL-021 | Customer concentration | pct(top_customers_revenue, revenue) | lower | Revenue dependence on the ten largest customers.
SAL-022 | Average order value | revenue / orders | higher | Average revenue per order.
SAL-023 | Orders per customer | orders / customers_active | higher | Average orders placed by each customer.
SAL-024 | Revenue per customer | revenue / customers_active | higher | Average revenue from each customer.
SAL-025 | Bookings | bookings | higher | Value of deals closed and won.
SAL-026 | Bookings growth vs previous period | pct(bookings - bookings@prev, bookings@prev) | higher | Change in bookings against the previous period.
SAL-027 | Pipeline value | pipeline_value | higher | Value of open opportunities.
SAL-028 | Pipeline growth vs previous period | pct(pipeline_value - pipeline_value@prev, pipeline_value@prev) | higher | Change in open pipeline against the previous period.
SAL-029 | Deals won | deals_won | higher | Deals closed and won.
SAL-030 | Meetings per sales rep | meetings_held / sales_reps | higher | Customer meetings held by each salesperson.
SAL-031 | Calls per sales rep | calls_made / sales_reps | higher | Outbound calls made by each salesperson.
SAL-032 | Call to meeting rate | pct(meetings_held, calls_made) | higher | Calls that led to a meeting.
SAL-033 | Proposals per sales rep | proposals_sent / sales_reps | higher | Proposals issued by each salesperson.
SAL-034 | Opportunities per sales rep | opportunities_created / sales_reps | higher | Opportunities opened by each salesperson.
SAL-035 | Order growth vs previous period | pct(orders - orders@prev, orders@prev) | higher | Change in orders against the previous period.
SAL-036 | Customer growth vs previous period | pct(customers_active - customers_active@prev, customers_active@prev) | higher | Change in active customers against the previous period.
`,
};
