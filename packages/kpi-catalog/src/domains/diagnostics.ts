import type { DomainSource } from "../types.ts";

export const diagnostics: DomainSource = {
  domain: "diagnostics",
  title: "Diagnostic laboratories",
  industries: ["diagnostics", "healthcare"],
  sources: [
    "https://www.someka.net/blog/healthcare-kpis",
    "https://www.datapine.com/kpi-examples-and-templates/healthcare",
  ],
  measures: `
tests_performed | Tests performed | count | Laboratory tests completed.
tests_reported_on_time | Reports delivered on time | count | Reports released within the promised time.
samples_received | Samples received | count | Samples received by the laboratory.
samples_rejected | Samples rejected | count | Samples refused for quality or labelling.
tests_repeated | Tests repeated | count | Tests that had to be run again.
tat_minutes_total | Total test turnaround time | minutes | Sum of minutes from sample receipt to report across tests.
critical_results | Critical results | count | Results that need urgent communication.
critical_results_on_time | Critical results communicated on time | count | Critical results passed on inside the target time.
home_collections | Home sample collections | count | Samples collected at the patient's home.
home_collections_on_time | Home collections on time | count | Home collections done in the booked slot.
reagent_cost | Reagent and consumable cost | currency | Cost of reagents and consumables.
qc_runs | Quality control runs | count | Quality control checks performed.
qc_runs_passed | Quality control runs passed | count | Quality control checks within limits.
`,
  kpis: `
LAB-001 | Tests performed | tests_performed | higher | Laboratory tests completed.
LAB-002 | Report on-time rate | pct(tests_reported_on_time, tests_performed) | higher | Reports released within the promised time.
LAB-003 | Sample rejection rate | pct(samples_rejected, samples_received) | lower | Samples refused for quality or labelling.
LAB-004 | Repeat test rate | pct(tests_repeated, tests_performed) | lower | Tests that had to be run again.
LAB-005 | Average turnaround time | tat_minutes_total / tests_performed | lower | Average minutes from sample receipt to report.
LAB-006 | Critical result timeliness | pct(critical_results_on_time, critical_results) | higher | Critical results communicated inside the target time.
LAB-007 | Home collection on-time rate | pct(home_collections_on_time, home_collections) | higher | Home collections done in the booked slot.
LAB-008 | Home collection share | pct(home_collections, samples_received) | neutral | Samples that came from home collection.
LAB-009 | Revenue per test | revenue / tests_performed | higher | Revenue earned for each test.
LAB-010 | Reagent cost per test | reagent_cost / tests_performed | lower | Reagent and consumable cost for each test.
LAB-011 | Reagent cost ratio | pct(reagent_cost, revenue) | lower | Reagent cost as a share of revenue.
LAB-012 | Quality control pass rate | pct(qc_runs_passed, qc_runs) | higher | Quality control checks within limits.
LAB-013 | Samples per day | samples_received / period_days | higher | Average samples received each day.
LAB-014 | Test volume growth vs previous period | pct(tests_performed - tests_performed@prev, tests_performed@prev) | higher | Change in tests against the previous period.
`,
};
