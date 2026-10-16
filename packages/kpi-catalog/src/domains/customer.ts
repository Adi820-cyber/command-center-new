import type { DomainSource } from "../types.ts";

export const customer: DomainSource = {
  domain: "customer",
  title: "Customer support and success",
  industries: ["*"],
  sources: [
    "https://www.askly.me/en/blog/customer-service-kpis",
    "https://www.intercom.com/learning-center/customer-service-metrics",
    "https://knots.io/blog/a-concise-guide-to-measure-customer-service-performance/",
  ],
  measures: `
tickets_received | Tickets received | count | Support tickets opened by customers.
tickets_resolved | Tickets resolved | count | Support tickets closed as resolved.
tickets_open_end | Open tickets at period end | count | Tickets still unresolved at period end.
first_response_minutes_total | Total first-response time | minutes | Sum of minutes to the first human reply across tickets.
resolution_hours_total | Total time to resolve | hours | Sum of hours from opening to resolution across tickets.
tickets_resolved_first_contact | Tickets resolved on first contact | count | Tickets solved without a follow-up.
tickets_reopened | Tickets reopened | count | Resolved tickets that customers reopened.
tickets_escalated | Tickets escalated | count | Tickets passed to a higher support tier.
tickets_within_sla | Tickets resolved within SLA | count | Tickets resolved inside the promised time.
csat_responses | Satisfaction survey responses | count | Customers who answered the satisfaction survey.
csat_satisfied | Satisfied responses | count | Responses scoring 4 or 5 out of 5.
nps_responses | Net promoter survey responses | count | Customers who answered the recommend question.
nps_promoters | Promoters | count | Customers scoring 9 or 10.
nps_detractors | Detractors | count | Customers scoring 0 to 6.
calls_received | Calls received | count | Inbound customer calls.
calls_abandoned | Calls abandoned | count | Calls the customer ended before an agent answered.
calls_answered_within_target | Calls answered within target | count | Calls answered inside the target time.
agent_handle_minutes_total | Total agent handling time | minutes | Sum of minutes agents spent on calls.
support_agents | Support agents | count | Full-time-equivalent support staff.
agent_available_hours | Agent available hours | hours | Hours agents were available to take work.
agent_busy_hours | Agent busy hours | hours | Hours agents spent handling work.
self_service_resolved | Issues solved by self-service | count | Customers who solved a problem from help articles or bots.
support_cost | Customer support cost | currency | Total cost of the support function.
customers_start | Customers at start of period | count | Customers on the first day of the period.
customers_lost | Customers lost | count | Customers who stopped buying in the period.
complaints_received | Complaints received | count | Formal customer complaints.
complaints_resolved | Complaints resolved | count | Complaints closed to the customer's satisfaction.
`,
  kpis: `
CUS-001 | Tickets received | tickets_received | neutral | Support tickets opened by customers.
CUS-002 | Tickets resolved | tickets_resolved | higher | Support tickets closed as resolved.
CUS-003 | Open ticket backlog | tickets_open_end | lower | Tickets still unresolved at period end.
CUS-004 | Backlog ratio | pct(tickets_open_end, tickets_received) | lower | Open tickets compared with tickets received.
CUS-005 | Resolution rate | pct(tickets_resolved, tickets_received) | higher | Tickets resolved compared with tickets received.
CUS-006 | Average first response time | first_response_minutes_total / tickets_received | lower | Average minutes before a customer gets a first reply.
CUS-007 | Average resolution time | resolution_hours_total / tickets_resolved | lower | Average hours to resolve a ticket.
CUS-008 | First contact resolution rate | pct(tickets_resolved_first_contact, tickets_resolved) | higher | Tickets solved without a follow-up.
CUS-009 | Ticket reopen rate | pct(tickets_reopened, tickets_resolved) | lower | Resolved tickets that customers reopened.
CUS-010 | Escalation rate | pct(tickets_escalated, tickets_received) | lower | Tickets passed to a higher support tier.
CUS-011 | SLA attainment | pct(tickets_within_sla, tickets_resolved) | higher | Tickets resolved inside the promised time.
CUS-012 | Customer satisfaction score | pct(csat_satisfied, csat_responses) | higher | Survey responses that were satisfied.
CUS-013 | Survey response rate | pct(csat_responses, tickets_resolved) | higher | Resolved tickets that got a survey answer.
CUS-014 | Net promoter score | pct(nps_promoters - nps_detractors, nps_responses) | higher | Promoters minus detractors, as a percentage of responses.
CUS-015 | Promoter share | pct(nps_promoters, nps_responses) | higher | Respondents who would recommend you.
CUS-016 | Detractor share | pct(nps_detractors, nps_responses) | lower | Respondents unlikely to recommend you.
CUS-017 | Call abandonment rate | pct(calls_abandoned, calls_received) | lower | Calls dropped before an agent answered.
CUS-018 | Call service level | pct(calls_answered_within_target, calls_received) | higher | Calls answered inside the target time.
CUS-019 | Average call handling time | agent_handle_minutes_total / (calls_received - calls_abandoned) | neutral | Average minutes agents spend on each answered call.
CUS-020 | Agent occupancy | pct(agent_busy_hours, agent_available_hours) | neutral | Share of available hours agents spent on work.
CUS-021 | Tickets resolved per agent | tickets_resolved / support_agents | higher | Tickets closed by each support agent.
CUS-022 | Cost per ticket | support_cost / tickets_resolved | lower | Support cost for each ticket resolved.
CUS-023 | Self-service resolution rate | pct(self_service_resolved, tickets_received + self_service_resolved) | higher | Issues solved without contacting an agent.
CUS-024 | Support cost ratio | pct(support_cost, revenue) | lower | Support cost as a share of revenue.
CUS-025 | Complaints per customer | complaints_received / customers_active | lower | Complaints for each active customer.
CUS-026 | Complaint resolution rate | pct(complaints_resolved, complaints_received) | higher | Complaints resolved.
CUS-027 | Customer churn rate | pct(customers_lost, customers_start) | lower | Customers lost as a share of those at the start.
CUS-028 | Customer retention rate | pct(customers_start - customers_lost, customers_start) | higher | Customers kept from the start of the period.
CUS-029 | Net customer growth | pct(customers_active - customers_start, customers_start) | higher | Change in customers over the period.
CUS-030 | Customers per support agent | customers_active / support_agents | neutral | Active customers for each support agent.
CUS-031 | Tickets per customer | tickets_received / customers_active | lower | Tickets raised by each active customer.
CUS-032 | Customers lost | customers_lost | lower | Customers who stopped buying.
`,
};
