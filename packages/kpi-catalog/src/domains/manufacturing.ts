import type { DomainSource } from "../types.ts";

export const manufacturing: DomainSource = {
  domain: "manufacturing",
  title: "Manufacturing",
  industries: ["manufacturing"],
  sources: [
    "https://www.cleverence.com/articles/for-business/what-is-kpi-in-manufacturing-5792/",
    "https://oxmaint.com/industries/steel-plant/quality-kpi-explained-for-oee",
    "https://fourweekmba.com/kpis-for-manufacturing/",
  ],
  measures: `
planned_production_minutes | Planned production time | minutes | Minutes scheduled for production.
downtime_minutes | Downtime | minutes | Minutes lost to breakdowns, changeovers and stoppages.
ideal_output_units | Ideal output | units | Units that could be made at rated speed during run time.
total_units_produced | Total units produced | units | All units made, good and bad.
good_units | Good units | units | Units that met quality requirements.
first_pass_units | Units passing first time | units | Units that passed inspection without rework.
units_started | Units started | units | Units put into production.
scrap_units | Scrapped units | units | Units thrown away.
units_planned | Units planned | units | Units the production plan called for.
customer_returns_units | Units returned by customers | units | Units sent back for quality reasons.
equipment_failures | Equipment failures | count | Breakdowns in the period.
running_hours | Equipment running hours | hours | Hours equipment was running.
repair_hours_total | Total repair time | hours | Hours spent repairing breakdowns.
changeovers | Changeovers | count | Switches between products.
changeover_minutes_total | Total changeover time | minutes | Minutes spent on changeovers.
material_input_kg | Material input | kg | Raw material put into production.
material_output_kg | Good material output | kg | Material that ended up in good product.
wip_units | Work in progress | units | Units part-made at period end.
`,
  kpis: `
MFG-001 | Overall equipment effectiveness | pct(good_units, ideal_output_units) * ((planned_production_minutes - downtime_minutes) / planned_production_minutes) | higher | Availability, performance and quality combined.
MFG-002 | Availability | pct(planned_production_minutes - downtime_minutes, planned_production_minutes) | higher | Planned time that equipment was running.
MFG-003 | Performance | pct(total_units_produced, ideal_output_units) | higher | Output compared with rated speed.
MFG-004 | Quality rate | pct(good_units, total_units_produced) | higher | Units that were good.
MFG-005 | First pass yield | pct(first_pass_units, units_started) | higher | Units right the first time.
MFG-006 | Scrap rate | pct(scrap_units, total_units_produced) | lower | Units thrown away.
MFG-007 | Material yield | pct(material_output_kg, material_input_kg) | higher | Material that ended up in good product.
MFG-008 | Downtime ratio | pct(downtime_minutes, planned_production_minutes) | lower | Planned time lost to downtime.
MFG-009 | Mean time between failures | running_hours / equipment_failures | higher | Average running hours between breakdowns.
MFG-010 | Mean time to repair | repair_hours_total / equipment_failures | lower | Average hours to repair a breakdown.
MFG-011 | Equipment failures | equipment_failures | lower | Breakdowns in the period.
MFG-012 | Average changeover time | changeover_minutes_total / changeovers | lower | Average minutes to switch products.
MFG-013 | Production plan attainment | pct(total_units_produced, units_planned) | higher | Units made compared with the plan.
MFG-014 | Customer return rate | pct(customer_returns_units, units_shipped) | lower | Shipped units sent back.
MFG-015 | Customer defects per million units | customer_returns_units * 1000000 / units_shipped | lower | Returned units for every million shipped.
MFG-016 | Work in progress days | wip_units / total_units_produced * period_days | lower | Days of output tied up in part-made units.
MFG-017 | Good units | good_units | higher | Units that met quality requirements.
MFG-018 | Total units produced | total_units_produced | higher | All units made.
MFG-019 | Scrapped units | scrap_units | lower | Units thrown away.
MFG-020 | Units shipped | units_shipped | higher | Units sent to customers.
MFG-021 | Good units per labor hour | good_units / labor_hours | higher | Good output for each direct labor hour.
MFG-022 | Material cost per good unit | cogs / good_units | lower | Direct cost of each good unit.
`,
};
