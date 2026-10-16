import type { DomainSource } from "../types.ts";

export const banking: DomainSource = {
  domain: "banking",
  title: "Banking and lending",
  industries: ["banking", "lending"],
  sources: [
    "https://www.clearpointstrategy.com/blog/bank-kpis",
    "https://leandatapoint.com/blog/top-10-banking-kpis",
    "https://www.brytsoftware.com/key-consumer-lending-kpis/",
    "https://entomo.co/blog/checklist-for-important-kpis-to-track-in-banking-companies/",
  ],
  measures: `
interest_income | Interest income | currency | Interest earned on loans and investments.
average_earning_assets | Average earning assets | currency | Average balance of assets that earn interest.
average_interest_bearing_liabilities | Average interest-bearing liabilities | currency | Average balance of deposits and borrowings that cost interest.
gross_loans | Gross loans outstanding | currency | Loans outstanding before provisions.
npl_amount | Non-performing loans | currency | Loans past due beyond the regulatory limit.
loan_loss_provisions | Loan loss provisions held | currency | Reserves held against loan losses.
operating_income_bank | Total operating income | currency | Net interest income plus fee income.
operating_cost_bank | Operating costs | currency | Staff, premises and other running costs.
tier1_capital | Tier 1 capital | currency | Core regulatory capital.
tier2_capital | Tier 2 capital | currency | Supplementary regulatory capital.
risk_weighted_assets | Risk-weighted assets | currency | Assets weighted by credit, market and operational risk.
total_deposits | Total deposits | currency | Customer deposits at period end.
casa_deposits | Current and savings deposits | currency | Low-cost deposits at period end.
loan_disbursements | Loans disbursed | currency | New loans paid out in the period.
loans_overdue_30 | Loans overdue by more than 30 days | currency | Balance of loans overdue by 30 days or more.
collections_due | Collections due | currency | Repayments due in the period.
collections_received | Collections received | currency | Repayments received in the period.
loans_written_off | Loans written off | currency | Loans removed from the books as uncollectable.
provision_expense | Provision expense | currency | Charge for expected credit losses in the period.
fee_income | Fee and commission income | currency | Income from fees and commissions.
accounts_opened | New accounts opened | count | Customer accounts opened.
onboarding_hours_total | Total onboarding time | hours | Sum of hours from application to active account.
digital_transactions | Digital transactions | count | Transactions made through digital channels.
transactions_total | Total transactions | count | All customer transactions.
fraud_losses | Fraud losses | currency | Money lost to fraud.
`,
  kpis: `
BNK-001 | Net interest margin | pct(interest_income - interest_expense, average_earning_assets) | higher | Interest earned less interest paid, relative to earning assets.
BNK-002 | Gross non-performing loan ratio | pct(npl_amount, gross_loans) | lower | Loans past due beyond the regulatory limit.
BNK-003 | Net non-performing loan ratio | pct(npl_amount - loan_loss_provisions, gross_loans - loan_loss_provisions) | lower | Bad loans after provisions.
BNK-004 | Provision coverage ratio | pct(loan_loss_provisions, npl_amount) | higher | Bad loans covered by provisions.
BNK-005 | Cost-to-income ratio | pct(operating_cost_bank, operating_income_bank) | lower | Operating cost for every 100 of income.
BNK-006 | Capital adequacy ratio | pct(tier1_capital + tier2_capital, risk_weighted_assets) | higher | Regulatory capital relative to risk-weighted assets.
BNK-007 | Tier 1 capital ratio | pct(tier1_capital, risk_weighted_assets) | higher | Core capital relative to risk-weighted assets.
BNK-008 | Loan to deposit ratio | pct(gross_loans, total_deposits) | neutral | Deposits that have been lent out.
BNK-009 | Current and savings deposit ratio | pct(casa_deposits, total_deposits) | higher | Low-cost deposits as a share of all deposits.
BNK-010 | Yield on loans | pct(interest_income, gross_loans) | higher | Interest income relative to loans outstanding.
BNK-011 | Cost of funds | pct(interest_expense, average_interest_bearing_liabilities) | lower | Interest paid relative to deposits and borrowings.
BNK-012 | Loan growth vs previous period | pct(gross_loans - gross_loans@prev, gross_loans@prev) | higher | Change in loans outstanding against the previous period.
BNK-013 | Deposit growth vs previous period | pct(total_deposits - total_deposits@prev, total_deposits@prev) | higher | Change in deposits against the previous period.
BNK-014 | Loans disbursed | loan_disbursements | higher | New loans paid out.
BNK-015 | Portfolio at risk over 30 days | pct(loans_overdue_30, gross_loans) | lower | Loans overdue by 30 days or more.
BNK-016 | Collection efficiency | pct(collections_received, collections_due) | higher | Repayments received compared with those due.
BNK-017 | Write-off ratio | pct(loans_written_off, gross_loans) | lower | Loans written off as a share of the book.
BNK-018 | Credit cost | pct(provision_expense, gross_loans) | lower | Credit loss charge relative to loans.
BNK-019 | Fee income share | pct(fee_income, operating_income_bank) | neutral | Income that came from fees.
BNK-020 | Digital transaction share | pct(digital_transactions, transactions_total) | higher | Transactions made digitally.
BNK-021 | Average onboarding time | onboarding_hours_total / accounts_opened | lower | Average hours to open an account.
BNK-022 | New accounts opened | accounts_opened | higher | Customer accounts opened.
BNK-023 | Fraud loss per transaction | fraud_losses / transactions_total | lower | Money lost to fraud for each transaction.
BNK-024 | Gross loans outstanding | gross_loans | higher | Loans outstanding before provisions.
BNK-025 | Total deposits | total_deposits | higher | Customer deposits at period end.
BNK-026 | Net interest income | interest_income - interest_expense | higher | Interest earned less interest paid.
`,
};
