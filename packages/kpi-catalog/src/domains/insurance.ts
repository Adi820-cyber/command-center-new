import type { DomainSource } from "../types.ts";

export const insurance: DomainSource = {
  domain: "insurance",
  title: "Insurance",
  industries: ["insurance"],
  sources: [
    "https://www.curacel.co/post/insurance-operations-kpis-what-to-measure",
    "https://telecrm.in/blog/insurance-kpi-metrics/",
    "https://www.klipfolio.com/kpis/insurance",
  ],
  measures: `
earned_premium | Earned premium | currency | Premium earned for the cover provided in the period.
gross_written_premium | Gross written premium | currency | Premium written in the period.
incurred_losses | Incurred losses | currency | Claims paid plus change in claim reserves.
loss_adjustment_expenses | Loss adjustment expenses | currency | Cost of investigating and settling claims.
insurance_operating_expenses | Insurance operating expenses | currency | Underwriting and administration expenses.
commission_paid | Commission paid | currency | Commission paid to agents and brokers.
policies_in_force_start | Policies in force at start | count | Active policies at the start of the period.
policies_lapsed | Policies lapsed | count | Policies that lapsed in the period.
policies_due_renewal | Policies due for renewal | count | Policies reaching renewal.
policies_renewed | Policies renewed | count | Policies that renewed.
claims_reported | Claims reported | count | Claims notified to the insurer.
claims_settled | Claims settled | count | Claims paid or closed with payment.
claims_rejected | Claims rejected | count | Claims declined.
claims_settlement_days_total | Total days to settle claims | days | Sum of days from notification to settlement.
claim_amount_paid | Claim amount paid | currency | Money paid out on settled claims.
fraudulent_claims_detected | Fraudulent claims detected | count | Claims identified as fraudulent.
premium_due_13m | Premium due at 13 months | currency | Premium due on policies reaching their 13th month.
premium_renewed_13m | Premium paid at 13 months | currency | Premium actually paid at the 13th month.
`,
  kpis: `
INS-001 | Loss ratio | pct(incurred_losses + loss_adjustment_expenses, earned_premium) | lower | Claims cost as a share of earned premium.
INS-002 | Expense ratio | pct(insurance_operating_expenses, earned_premium) | lower | Operating expense as a share of earned premium.
INS-003 | Combined ratio | pct(incurred_losses + loss_adjustment_expenses + insurance_operating_expenses, earned_premium) | lower | Loss and expense ratios together; below 100 means underwriting profit.
INS-004 | Underwriting profit | earned_premium - incurred_losses - loss_adjustment_expenses - insurance_operating_expenses | higher | Premium left after claims and expenses.
INS-005 | Claims settlement ratio | pct(claims_settled, claims_reported) | higher | Reported claims that were settled.
INS-006 | Claim rejection rate | pct(claims_rejected, claims_reported) | lower | Reported claims that were declined.
INS-007 | Average claim settlement time | claims_settlement_days_total / claims_settled | lower | Average days from notification to settlement.
INS-008 | Average claim cost | claim_amount_paid / claims_settled | neutral | Average amount paid on a settled claim.
INS-009 | Fraud detection rate | pct(fraudulent_claims_detected, claims_reported) | neutral | Reported claims found to be fraudulent.
INS-010 | Renewal rate | pct(policies_renewed, policies_due_renewal) | higher | Policies that renewed.
INS-011 | Policy lapse ratio | pct(policies_lapsed, policies_in_force_start) | lower | Policies that lapsed.
INS-012 | 13-month persistency | pct(premium_renewed_13m, premium_due_13m) | higher | Premium still being paid at the 13th month.
INS-013 | Premium growth vs previous period | pct(gross_written_premium - gross_written_premium@prev, gross_written_premium@prev) | higher | Change in written premium against the previous period.
INS-014 | Commission ratio | pct(commission_paid, gross_written_premium) | lower | Commission as a share of written premium.
INS-015 | Gross written premium | gross_written_premium | higher | Premium written in the period.
INS-016 | Earned premium | earned_premium | higher | Premium earned for the cover provided.
INS-017 | Premium per policy | gross_written_premium / policies_in_force_start | neutral | Written premium for each policy in force.
INS-018 | Claims reported | claims_reported | neutral | Claims notified to the insurer.
`,
};
