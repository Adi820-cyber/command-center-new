import type { DomainSource } from "../types.ts";

export const itEngineering: DomainSource = {
  domain: "it_engineering",
  title: "IT and engineering",
  industries: ["*"],
  sources: [
    "https://www.site24x7.com/learn/dora-metrics-devops-guide.html",
    "https://codefresh.io/learn/software-deployment/dora-metrics-4-key-metrics-for-improving-devops-performance",
    "https://docs-vsm.leanix.net/docs/dora-metrics-via-events-api",
  ],
  measures: `
deployments | Production deployments | count | Releases to production.
failed_deployments | Failed deployments | count | Deployments that needed a rollback or hotfix.
change_lead_hours_total | Total change lead time | hours | Sum of hours from code commit to production across deployments.
incidents | Incidents | count | Service incidents in the period.
incident_recovery_hours_total | Total incident recovery time | hours | Sum of hours from incident start to restored service.
scheduled_uptime_hours | Scheduled service hours | hours | Hours the service was meant to be available.
downtime_service_hours | Service downtime | hours | Hours the service was unavailable.
sla_obligations | Service commitments measured | count | Service-level commitments measured in the period.
sla_breaches | Service commitments breached | count | Service-level commitments that were missed.
active_users | Active users | count | Distinct users of the product or system.
security_incidents | Security incidents | count | Confirmed security incidents.
patches_required | Patches required | count | Security patches due in the period.
patches_applied_on_time | Patches applied on time | count | Patches applied inside the deadline.
vulnerabilities_found | Vulnerabilities found | count | Security vulnerabilities identified.
vulnerabilities_closed | Vulnerabilities closed | count | Vulnerabilities fixed.
bugs_found_internal | Bugs found before release | count | Defects caught by the team.
bugs_found_production | Bugs found in production | count | Defects reported after release.
story_points_committed | Story points committed | count | Work the team committed to for the period.
story_points_completed | Story points completed | count | Work the team finished.
pr_review_hours_total | Total pull request review time | hours | Sum of hours from request to merge across pull requests.
pull_requests | Pull requests merged | count | Code changes merged.
cloud_cost | Cloud infrastructure cost | currency | Cost of cloud hosting and services.
it_cost | IT cost | currency | Total IT spending.
it_tickets | IT service tickets | count | Internal IT help requests.
it_tickets_resolved | IT tickets resolved | count | Internal IT requests resolved.
test_cases_run | Test cases run | count | Automated and manual tests executed.
test_cases_passed | Test cases passed | count | Tests that passed.
backups_scheduled | Backups scheduled | count | Backups that were due.
backups_successful | Backups succeeded | count | Backups that completed successfully.
licences_purchased | Software licences purchased | count | Licences paid for.
licences_used | Software licences in use | count | Licences actually assigned and used.
`,
  kpis: `
ITE-001 | Deployment frequency | deployments / period_days | higher | Production deployments per day.
ITE-002 | Production deployments | deployments | higher | Releases to production.
ITE-003 | Change failure rate | pct(failed_deployments, deployments) | lower | Deployments that needed a rollback or hotfix.
ITE-004 | Lead time for changes | change_lead_hours_total / deployments | lower | Average hours from commit to production.
ITE-005 | Mean time to recover | incident_recovery_hours_total / incidents | lower | Average hours to restore service after an incident.
ITE-006 | Incidents | incidents | lower | Service incidents in the period.
ITE-007 | Incidents per 1,000 users | incidents / active_users * 1000 | lower | Service incidents relative to the user base.
ITE-008 | Service availability | pct(scheduled_uptime_hours - downtime_service_hours, scheduled_uptime_hours) | higher | Share of scheduled time the service was up.
ITE-009 | Service downtime | downtime_service_hours | lower | Hours the service was unavailable.
ITE-010 | Service commitment breach rate | pct(sla_breaches, sla_obligations) | lower | Service-level commitments that were missed.
ITE-011 | Security incidents | security_incidents | lower | Confirmed security incidents.
ITE-012 | Patch compliance | pct(patches_applied_on_time, patches_required) | higher | Patches applied inside the deadline.
ITE-013 | Vulnerability closure rate | pct(vulnerabilities_closed, vulnerabilities_found) | higher | Vulnerabilities fixed.
ITE-014 | Defect escape rate | pct(bugs_found_production, bugs_found_internal + bugs_found_production) | lower | Defects that reached customers.
ITE-015 | Sprint commitment accuracy | pct(story_points_completed, story_points_committed) | higher | Committed work that was finished.
ITE-016 | Velocity | story_points_completed | higher | Work finished in the period.
ITE-017 | Pull request review time | pr_review_hours_total / pull_requests | lower | Average hours a pull request waits to merge.
ITE-018 | Pull requests merged | pull_requests | higher | Code changes merged.
ITE-019 | Cloud cost per active user | cloud_cost / active_users | lower | Cloud cost for each active user.
ITE-020 | Cloud cost ratio | pct(cloud_cost, revenue) | lower | Cloud cost as a share of revenue.
ITE-021 | IT cost ratio | pct(it_cost, revenue) | lower | IT spending as a share of revenue.
ITE-022 | IT cost per employee | it_cost / headcount_end | lower | IT spending for each employee.
ITE-023 | IT ticket resolution rate | pct(it_tickets_resolved, it_tickets) | higher | Internal IT requests resolved.
ITE-024 | Test pass rate | pct(test_cases_passed, test_cases_run) | higher | Tests that passed.
ITE-025 | Backup success rate | pct(backups_successful, backups_scheduled) | higher | Backups that completed.
ITE-026 | Licence utilisation | pct(licences_used, licences_purchased) | higher | Purchased licences that are in use.
ITE-027 | Active users | active_users | higher | Distinct users of the product or system.
ITE-028 | Cloud infrastructure cost | cloud_cost | lower | Cost of cloud hosting and services.
ITE-029 | Active user growth vs previous period | pct(active_users - active_users@prev, active_users@prev) | higher | Change in active users against the previous period.
`,
};
