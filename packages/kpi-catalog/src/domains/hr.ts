import type { DomainSource } from "../types.ts";

export const hr: DomainSource = {
  domain: "hr",
  title: "People and HR",
  industries: ["*"],
  sources: [
    "https://mihcm.com/resources/blog/key-hr-metrics-and-formulas-and-why-they-matter/",
    "https://hyring.com/free-hr-toolkit/hr-glossary/hr-metrics",
    "https://www.happeo.com/blog/hr-metrics",
  ],
  measures: `
headcount_start | Headcount at start | count | Employees on the first day of the period.
headcount_end | Headcount at end | count | Employees on the last day of the period.
employees_fte | Full-time equivalent employees | count | Headcount converted to full-time equivalents.
separations | Employees who left | count | All exits in the period, voluntary or not.
voluntary_separations | Voluntary resignations | count | Employees who chose to leave.
new_hires | New hires | count | People who joined in the period.
new_hire_exits | New hires who left within a year | count | Joiners who left inside their first year.
open_positions | Open positions | count | Approved roles not yet filled at period end.
positions_total | Approved positions | count | All approved roles, filled and open.
days_to_hire_total | Total days to hire | days | Sum of days from job posting to offer across hires.
recruiting_cost | Recruiting cost | currency | Agency fees, job boards, tools and recruiter time.
offers_made | Offers made | count | Job offers extended.
offers_accepted | Offers accepted | count | Job offers accepted.
applications_received | Applications received | count | Candidate applications received.
absent_days | Absent days | days | Working days lost to unplanned absence.
working_days_available | Scheduled working days | days | Total working days employees were scheduled.
overtime_hours | Overtime hours | hours | Hours worked beyond the regular schedule.
regular_hours | Regular hours worked | hours | Hours worked inside the regular schedule.
training_hours | Training hours | hours | Hours of training delivered to employees.
training_cost | Training cost | currency | Cost of training programmes.
employees_trained | Employees trained | count | Employees who completed at least one training.
female_employees | Female employees | count | Female employees at period end.
promotions | Internal promotions | count | Employees promoted in the period.
managers | People managers | count | Employees who manage others.
tenure_years_total | Total tenure | years | Sum of years of service across all employees.
grievances_raised | Grievances raised | count | Formal employee grievances.
grievances_resolved | Grievances resolved | count | Grievances resolved in the period.
performance_reviews_due | Performance reviews due | count | Reviews scheduled for the period.
performance_reviews_done | Performance reviews completed | count | Reviews completed on schedule.
`,
  kpis: `
HR-001 | Headcount | headcount_end | neutral | Employees at the end of the period.
HR-002 | Attrition rate | pct(separations, (headcount_start + headcount_end) / 2) | lower | Exits as a share of average headcount.
HR-003 | Voluntary attrition rate | pct(voluntary_separations, (headcount_start + headcount_end) / 2) | lower | Resignations as a share of average headcount.
HR-004 | New hire attrition rate | pct(new_hire_exits, new_hires) | lower | Joiners who left within their first year.
HR-005 | Retention rate | pct(headcount_start - separations, headcount_start) | higher | Employees at the start who are still here.
HR-006 | Hiring rate | pct(new_hires, headcount_start) | neutral | New hires as a share of starting headcount.
HR-007 | Headcount growth | pct(headcount_end - headcount_start, headcount_start) | neutral | Change in headcount over the period.
HR-008 | Vacancy rate | pct(open_positions, positions_total) | lower | Approved roles that are still unfilled.
HR-009 | Average time to hire | days_to_hire_total / new_hires | lower | Average days from job posting to offer.
HR-010 | Cost per hire | recruiting_cost / new_hires | lower | Recruiting cost for each hire.
HR-011 | Offer acceptance rate | pct(offers_accepted, offers_made) | higher | Job offers that were accepted.
HR-012 | Applications per hire | applications_received / new_hires | neutral | Applications needed to make each hire.
HR-013 | Absenteeism rate | pct(absent_days, working_days_available) | lower | Scheduled days lost to unplanned absence.
HR-014 | Absent days per employee | absent_days / headcount_end | lower | Average unplanned absence days per employee.
HR-015 | Overtime ratio | pct(overtime_hours, regular_hours) | lower | Overtime as a share of regular hours.
HR-016 | Overtime hours per employee | overtime_hours / headcount_end | lower | Average overtime hours per employee.
HR-017 | Training hours per employee | training_hours / headcount_end | higher | Average training hours per employee.
HR-018 | Training cost per employee | training_cost / headcount_end | neutral | Average training spend per employee.
HR-019 | Training coverage | pct(employees_trained, headcount_end) | higher | Employees who completed training.
HR-020 | Training investment ratio | pct(training_cost, payroll_cost) | neutral | Training spend as a share of payroll.
HR-021 | Revenue per employee | revenue / headcount_end | higher | Revenue for each employee.
HR-022 | Revenue per full-time equivalent | revenue / employees_fte | higher | Revenue for each full-time equivalent.
HR-023 | Profit per employee | net_profit / headcount_end | higher | Net profit for each employee.
HR-024 | Payroll cost per employee | payroll_cost / headcount_end | neutral | Average employee cost.
HR-025 | Revenue per hour worked | revenue / regular_hours | higher | Revenue for each regular hour worked.
HR-026 | Recruiting cost ratio | pct(recruiting_cost, payroll_cost) | lower | Recruiting cost as a share of payroll.
HR-027 | Female representation | pct(female_employees, headcount_end) | neutral | Female employees as a share of headcount.
HR-028 | Internal promotion rate | pct(promotions, headcount_end) | higher | Employees promoted in the period.
HR-029 | Span of control | (headcount_end - managers) / managers | neutral | Employees for each people manager.
HR-030 | Average tenure | tenure_years_total / headcount_end | higher | Average years of service.
HR-031 | Grievance resolution rate | pct(grievances_resolved, grievances_raised) | higher | Grievances resolved in the period.
HR-032 | Grievances per 100 employees | pct(grievances_raised, headcount_end) | lower | Grievances raised for every 100 employees.
HR-033 | Performance review completion | pct(performance_reviews_done, performance_reviews_due) | higher | Reviews completed on schedule.
HR-034 | Separations | separations | lower | Employees who left in the period.
HR-035 | New hires | new_hires | neutral | People who joined in the period.
`,
};
