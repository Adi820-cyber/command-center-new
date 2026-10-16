import type { DomainSource } from "../types.ts";

export const saas: DomainSource = {
  domain: "saas",
  title: "Software and subscriptions",
  industries: ["saas", "it_services"],
  sources: [
    "https://www.forentrepreneurs.com/pt-br/saas-metrics-2-definitions",
    "https://york.ie/blog/saas-metrics-and-terminology/",
    "https://www.getmonetizely.com/articles/saas-pricing-metrics-101-arr-mrr-ltv-churn-amp-other-key-kpis-explained",
  ],
  measures: `
mrr_start | Monthly recurring revenue at start | currency | Recurring revenue per month at the start of the period.
mrr_new | New MRR | currency | Recurring revenue from new customers.
mrr_expansion | Expansion MRR | currency | Extra recurring revenue from existing customers.
mrr_contraction | Contraction MRR | currency | Recurring revenue lost to downgrades.
mrr_churned | Churned MRR | currency | Recurring revenue lost to cancellations.
paying_customers_start | Paying customers at start | count | Paying accounts at the start of the period.
paying_customers_new | New paying customers | count | Accounts that started paying.
paying_customers_churned | Churned paying customers | count | Accounts that cancelled.
trials_started | Trials started | count | Free trials begun.
trials_converted | Trials converted | count | Trials that became paying.
signups | Signups | count | New accounts created.
activated_users | Activated users | count | Signups that reached the key first action.
dau | Daily active users | count | Average users active each day.
mau | Monthly active users | count | Users active in the month.
renewals_due | Renewals due | count | Contracts reaching renewal in the period.
renewals_won | Renewals won | count | Contracts that renewed.
`,
  kpis: `
SAS-001 | Monthly recurring revenue | mrr_start + mrr_new + mrr_expansion - mrr_contraction - mrr_churned | higher | Recurring revenue per month at the end of the period.
SAS-002 | Annual recurring revenue | (mrr_start + mrr_new + mrr_expansion - mrr_contraction - mrr_churned) * 12 | higher | Recurring revenue annualised.
SAS-003 | Net new MRR | mrr_new + mrr_expansion - mrr_contraction - mrr_churned | higher | Net change in monthly recurring revenue.
SAS-004 | MRR growth | pct(mrr_new + mrr_expansion - mrr_contraction - mrr_churned, mrr_start) | higher | Change in monthly recurring revenue over the period.
SAS-005 | Customer churn rate | pct(paying_customers_churned, paying_customers_start) | lower | Accounts that cancelled.
SAS-006 | Gross MRR churn rate | pct(mrr_churned + mrr_contraction, mrr_start) | lower | Recurring revenue lost to cancellations and downgrades.
SAS-007 | Gross revenue retention | pct(mrr_start - mrr_contraction - mrr_churned, mrr_start) | higher | Starting revenue kept, excluding expansion.
SAS-008 | Net revenue retention | pct(mrr_start + mrr_expansion - mrr_contraction - mrr_churned, mrr_start) | higher | Starting revenue kept, including expansion.
SAS-009 | Expansion rate | pct(mrr_expansion, mrr_start) | higher | Extra revenue from existing customers.
SAS-010 | Average revenue per account | (mrr_start + mrr_new + mrr_expansion - mrr_contraction - mrr_churned) / (paying_customers_start + paying_customers_new - paying_customers_churned) | higher | Monthly recurring revenue for each paying account.
SAS-011 | Customer lifetime value | ((mrr_start + mrr_new + mrr_expansion - mrr_contraction - mrr_churned) / (paying_customers_start + paying_customers_new - paying_customers_churned)) * ((revenue - cogs) / revenue) / (paying_customers_churned / paying_customers_start) | higher | Gross profit an account is expected to bring over its life.
SAS-012 | Lifetime value to acquisition cost | (((mrr_start + mrr_new + mrr_expansion - mrr_contraction - mrr_churned) / (paying_customers_start + paying_customers_new - paying_customers_churned)) * ((revenue - cogs) / revenue) / (paying_customers_churned / paying_customers_start)) / (sales_and_marketing_spend / new_customers) | higher | Lifetime value for every unit spent to win an account.
SAS-013 | Acquisition cost payback in months | (sales_and_marketing_spend / new_customers) / (((mrr_start + mrr_new + mrr_expansion - mrr_contraction - mrr_churned) / (paying_customers_start + paying_customers_new - paying_customers_churned)) * ((revenue - cogs) / revenue)) | lower | Months of gross profit needed to repay acquisition cost.
SAS-014 | SaaS quick ratio | (mrr_new + mrr_expansion) / (mrr_contraction + mrr_churned) | higher | Revenue gained for every unit lost.
SAS-015 | Trial conversion rate | pct(trials_converted, trials_started) | higher | Trials that became paying.
SAS-016 | Signup activation rate | pct(activated_users, signups) | higher | Signups that reached the key first action.
SAS-017 | User stickiness | pct(dau, mau) | higher | Share of monthly users active on an average day.
SAS-018 | Renewal rate | pct(renewals_won, renewals_due) | higher | Contracts that renewed.
SAS-019 | New paying customers | paying_customers_new | higher | Accounts that started paying.
SAS-020 | Net logo growth | pct(paying_customers_new - paying_customers_churned, paying_customers_start) | higher | Change in paying accounts over the period.
SAS-021 | Rule of 40 | pct(revenue - revenue@prev, revenue@prev) + pct(ebitda, revenue) | higher | Revenue growth plus EBITDA margin.
SAS-022 | Support cost per paying account | support_cost / (paying_customers_start + paying_customers_new - paying_customers_churned) | lower | Support cost for each paying account.
SAS-023 | New MRR | mrr_new | higher | Recurring revenue from new customers.
SAS-024 | Churned MRR | mrr_churned | lower | Recurring revenue lost to cancellations.
SAS-025 | Daily active users | dau | higher | Average users active each day.
SAS-026 | Monthly active users | mau | higher | Users active in the month.
`,
};
