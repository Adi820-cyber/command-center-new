import type { DomainSource } from "../types.ts";

export const qualitySafety: DomainSource = {
  domain: "quality_safety",
  title: "Quality, safety and compliance",
  industries: ["*"],
  sources: [
    "https://www.cleverence.com/articles/for-business/what-is-kpi-in-manufacturing-5792/",
    "https://oxmaint.com/industries/steel-plant/quality-kpi-explained-for-oee",
  ],
  measures: `
recordable_incidents | Recordable injuries | count | Work injuries that must be recorded.
hours_worked | Hours worked by all employees | hours | Total hours worked across the workforce.
lost_time_injuries | Lost-time injuries | count | Injuries that kept someone from work.
near_misses_reported | Near misses reported | count | Close calls reported by staff.
audit_findings_raised | Audit findings raised | count | Findings from internal and external audits.
audit_findings_closed_on_time | Audit findings closed on time | count | Findings closed by their deadline.
compliance_training_assigned | Compliance trainings assigned | count | Compliance courses assigned to staff.
compliance_training_completed | Compliance trainings completed | count | Compliance courses completed on time.
corrective_actions_due | Corrective actions due | count | Corrective and preventive actions due in the period.
corrective_actions_closed_on_time | Corrective actions closed on time | count | Actions closed by their deadline.
documents_controlled | Controlled documents | count | Policies and procedures under document control.
documents_overdue_review | Documents overdue for review | count | Controlled documents past their review date.
inspections_conducted | Inspections conducted | count | Quality or safety inspections carried out.
inspections_passed | Inspections passed | count | Inspections passed first time.
nonconformances | Non-conformances raised | count | Departures from a requirement found.
waste_total_kg | Waste generated | kg | Total waste produced.
waste_recycled_kg | Waste recycled | kg | Waste diverted to recycling.
emissions_tonnes | Emissions | tonnes | Greenhouse-gas emissions in tonnes of CO2 equivalent.
`,
  kpis: `
QSF-001 | Total recordable incident rate | recordable_incidents * 200000 / hours_worked | lower | Recordable injuries per 200,000 hours worked.
QSF-002 | Lost-time injury frequency rate | lost_time_injuries * 1000000 / hours_worked | lower | Lost-time injuries per million hours worked.
QSF-003 | Lost-time injuries | lost_time_injuries | lower | Injuries that kept someone from work.
QSF-004 | Near misses reported | near_misses_reported | higher | Close calls reported by staff; reporting more is healthy.
QSF-005 | Near misses per 200,000 hours | near_misses_reported * 200000 / hours_worked | higher | Near-miss reporting relative to hours worked.
QSF-006 | Audit finding closure rate | pct(audit_findings_closed_on_time, audit_findings_raised) | higher | Audit findings closed by their deadline.
QSF-007 | Compliance training completion | pct(compliance_training_completed, compliance_training_assigned) | higher | Compliance courses completed on time.
QSF-008 | Corrective action on-time closure | pct(corrective_actions_closed_on_time, corrective_actions_due) | higher | Corrective actions closed by their deadline.
QSF-009 | Overdue document ratio | pct(documents_overdue_review, documents_controlled) | lower | Controlled documents past their review date.
QSF-010 | Inspection pass rate | pct(inspections_passed, inspections_conducted) | higher | Inspections passed first time.
QSF-011 | Non-conformances per inspection | nonconformances / inspections_conducted | lower | Departures from a requirement found per inspection.
QSF-012 | Waste recycling rate | pct(waste_recycled_kg, waste_total_kg) | higher | Waste diverted to recycling.
QSF-013 | Emissions per unit produced | emissions_tonnes / output_units | lower | Tonnes of emissions for each unit produced.
QSF-014 | Emissions per unit of revenue | emissions_tonnes / revenue | lower | Tonnes of emissions for each unit of revenue.
QSF-015 | Customer complaints per 1,000 orders | complaints_received / orders_delivered * 1000 | lower | Complaints relative to orders delivered.
QSF-016 | Open audit findings | audit_findings_raised - audit_findings_closed_on_time | lower | Findings not closed by their deadline.
`,
};
