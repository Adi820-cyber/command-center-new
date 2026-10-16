import type { DomainSource } from "../types.ts";

export const operations: DomainSource = {
  domain: "operations",
  title: "Operations",
  industries: ["*"],
  sources: [
    "https://www.cleverence.com/articles/for-business/productivity-metrics-manufacturing-4827/",
    "https://fourweekmba.com/kpis-for-manufacturing/",
  ],
  measures: `
orders_delivered | Orders delivered | count | Customer orders delivered or completed.
orders_on_time | Orders delivered on time | count | Orders delivered by the promised date.
planned_hours | Planned production hours | hours | Hours scheduled for production or service.
downtime_hours | Unplanned downtime | hours | Hours lost to breakdowns and stoppages.
capacity_units | Available capacity | units | Units the operation could have produced.
output_units | Units produced | units | Units actually produced or processed.
defective_units | Defective units | units | Units that failed inspection.
rework_units | Units needing rework | units | Units fixed after a first failed inspection.
labor_hours | Labor hours worked | hours | Direct labor hours spent on production.
jobs_completed | Jobs completed | count | Jobs, projects or work orders finished.
jobs_on_schedule | Jobs completed on schedule | count | Jobs finished by their due date.
backlog_jobs | Jobs in backlog | count | Jobs waiting to start at period end.
cycle_time_hours_total | Total cycle time | hours | Sum of hours from start to finish across jobs.
maintenance_cost | Maintenance cost | currency | Cost of maintaining equipment and facilities.
planned_maintenance_hours | Planned maintenance hours | hours | Maintenance done on schedule.
total_maintenance_hours | Total maintenance hours | hours | All maintenance hours, planned and reactive.
energy_kwh | Energy used | kwh | Electricity consumed in the period.
service_requests | Service requests received | count | Requests for service or repair.
service_requests_completed | Service requests completed | count | Requests finished.
service_within_target | Service requests completed on target | count | Requests finished inside the target time.
`,
  kpis: `
OPS-001 | On-time delivery rate | pct(orders_on_time, orders_delivered) | higher | Orders delivered by the promised date.
OPS-002 | Orders delivered | orders_delivered | higher | Customer orders delivered or completed.
OPS-003 | Capacity utilisation | pct(output_units, capacity_units) | higher | Output compared with available capacity.
OPS-004 | Capacity gap | capacity_units - output_units | lower | Unused capacity in units.
OPS-005 | Units produced | output_units | higher | Units produced or processed.
OPS-006 | Output growth vs previous period | pct(output_units - output_units@prev, output_units@prev) | higher | Change in output against the previous period.
OPS-007 | Throughput per labor hour | output_units / labor_hours | higher | Units produced for each labor hour.
OPS-008 | Output per employee | output_units / headcount_end | higher | Units produced for each employee.
OPS-009 | Defect rate | pct(defective_units, output_units) | lower | Units that failed inspection.
OPS-010 | Rework rate | pct(rework_units, output_units) | lower | Units needing rework.
OPS-011 | First-time-right rate | pct(output_units - defective_units - rework_units, output_units) | higher | Units right the first time.
OPS-012 | Downtime ratio | pct(downtime_hours, planned_hours) | lower | Planned hours lost to stoppages.
OPS-013 | Unplanned downtime hours | downtime_hours | lower | Hours lost to breakdowns and stoppages.
OPS-014 | Cost per unit | cogs / output_units | lower | Direct cost of each unit produced.
OPS-015 | Maintenance cost ratio | pct(maintenance_cost, revenue) | lower | Maintenance cost as a share of revenue.
OPS-016 | Planned maintenance share | pct(planned_maintenance_hours, total_maintenance_hours) | higher | Maintenance done on schedule rather than reactively.
OPS-017 | Schedule adherence | pct(jobs_on_schedule, jobs_completed) | higher | Jobs finished by their due date.
OPS-018 | Jobs completed | jobs_completed | higher | Jobs, projects or work orders finished.
OPS-019 | Average cycle time | cycle_time_hours_total / jobs_completed | lower | Average hours from start to finish of a job.
OPS-020 | Backlog | backlog_jobs | lower | Jobs waiting to start at period end.
OPS-021 | Backlog in days | backlog_jobs / jobs_completed * period_days | lower | Days of work waiting at the current completion pace.
OPS-022 | Energy used per unit | energy_kwh / output_units | lower | Electricity used for each unit produced.
OPS-023 | Service completion rate | pct(service_requests_completed, service_requests) | higher | Service requests finished.
OPS-024 | Service level | pct(service_within_target, service_requests_completed) | higher | Requests finished inside the target time.
OPS-025 | Revenue per unit produced | revenue / output_units | higher | Revenue earned for each unit produced.
`,
};
