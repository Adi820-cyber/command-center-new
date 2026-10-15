# Implementation tasks — general KPI SaaS platform

Date: 15 October 2026
Status: working prototype delivered in source; remaining tasks below cover product decisions, hosted proof, security and release readiness
Companion and design authority for this plan: [architecture](saas-architecture.md)

## Product decision

Build a configurable KPI, evidence and action platform. Remove ERP from the product. Organizations choose their own users, business roles, hierarchy, KPIs and targets. Platform staff provision organizations and propose templates/layouts; customer members supply and approve data. Customer values must be inaccessible to platform operator accounts.

This is feasible, but the supplied ZIP was not a general SaaS KPI platform. This working copy now contains a local prototype of the generic tenant model, restricted customer/control API paths, a bounded arithmetic formula engine, manual/CSV input review, results, actions and a generic workspace. That code is not enough to claim production readiness: the hosted project, database grants, production RLS checks, durable calculations, file handling, lifecycle operations and recovery have not been proven.

## Implemented in this working copy

- Replaced the active product routes with a generic KPI workspace, invitation acceptance and operator console. The active API no longer registers the hospital ERP, surveillance or hospital KPI routes; legacy source and historical migrations remain for controlled review.
- Added a fresh-project migration with tenant-scoped organization data, custom roles, capability grants, measures, immutable KPI versions, input batches, approvals, results, actions, audit and setup proposals. RLS is forced and cross-tenant references are constrained.
- Added separate customer-data and control API modes. Each process accepts only its own database credential and switches transaction-local execution to the matching restricted database role. Operator API role has no ordinary query grant for customer values.
- Added an exact bounded formula engine and customer-facing KPI/input/approval/action screens. CSV currently uses text paste for aggregate values; private file staging is not implemented. Supported formulas and limits are documented in `architecture.md`.
- Verified the changed source locally with the existing workspace checks and a synthetic PGlite/API scenario set. These checks do not prove hosted Supabase behavior.

## Open before any real customer data

1. Create the requested fresh `gbtech` Supabase project in Mumbai. **Blocked at this step:** the organization is at its Free-plan limit of two active projects. No old project was paused, deleted or upgraded.
2. Apply only the SaaS migration to that empty project; create and validate the two restricted login roles; seed a reviewed platform operator subject; run live tenant-isolation and operator-denial tests.
3. Finish the product privacy, data retention, residency, recovery and deployment decisions. The control and KPI schemas currently share one Supabase Postgres database; provider-level inability to access plaintext is not delivered.
4. Build durable calculation jobs, private file/import staging, onboarding email, quotas, offboarding/export, backups and recovery before scaling beyond a controlled synthetic pilot.
5. Review legacy dataset provenance and license status; exclude unresolved assets from public/commercial distributions.

Checklist items below that describe a working source feature are still incomplete as release tasks when their hosted, operational or threat-model proof remains open.

These files specify work; creating them does not remove ERP or change the application. Execute tasks against a controlled development copy. Do not run destructive migration/cleanup steps against a live customer database merely because they appear in this checklist.

## Non-negotiable acceptance principles

- A three-user organization, a seven-role organization or n number of users and an organization with a new supported KPI can onboard without a code change.
- Users and roles are independent counts. Multiple users can share a role; one user can hold multiple scoped roles and memberships in multiple organizations.
- KPI definitions, assignments, targets, raw inputs and computed results are separate objects with clear ownership and versioning.
- Missing data is never zero, never fabricated, and never green/on-track.
- Customer approval governs activation of customer definitions, targets and data. Technical template approval is separate.
- Platform operators cannot self-enroll as customer members, impersonate a customer, read uploads or results, or obtain them through logs, exports or AI.
- The absolute claim “the provider cannot access plaintext” is a separate release gate; managed hosting alone does not satisfy it.
- Scope and tenant isolation apply to all APIs, workers, storage, exports, caches, searches, notifications and audit views.
- Historical results and decision evidence remain reproducible after corrections or definition changes.

## Milestone 0 — establish a trustworthy starting point

### T00 — agree product scope and privacy promise

- Priority: P0. Owner: product owner + architecture/security lead. Dependencies: none.
- [x] Product owner directed removal of ERP and a generic multi-organization KPI product, including customer-controlled roles/KPIs/data and ordinary platform-account denial of customer values. The implemented pilot scope is narrower than a universal KPI platform.
- [x] Record the bounded formula set and the explicitly unsupported aggregation/connector behavior in `architecture.md`.
- [x] Set the current claim to “platform operator application accounts do not have ordinary customer-data access.” Do not claim a managed provider can never access plaintext.
- [x] Control API only lists organization-registry names and can submit setup proposals; it has no normal read grants for customer KPI definitions, inputs, results or actions. Recheck this boundary in hosted tests.
- [ ] Record data residency, retention, recovery objectives and pilot size assumptions before selecting production hosting.
- Done when: a decision record contains the actual promise, threat model, deployment choice and excluded capabilities. An absolute privacy requirement cannot be closed by hiding a dashboard button or enabling RLS.

### T01 — restore build integrity and capture the baseline

- Priority: P0. Owner: full-stack developer. Dependencies: none; implementation scope follows T00.
- [x] Restore the missing SaaS contracts, routes and auth/operator views in the working copy. Implement the generic routes explicitly; no allow-all replacement was used.
- [x] Install locked dependencies using Node 22.23.3; run workspace typechecks, build, lint, existing tests and synthetic API/database checks. Record each hosted-only gap separately.
- [ ] Repeat a clean install and release checks in hosted CI with the exact deployment runtime; include actual Supabase integration checks after project creation.
- [ ] Triage the 193 nonfatal lint warnings. Keep comments on intentional sequential database writes, and resolve actionable warnings before requiring a warning-free CI gate.
- Done when: CI reproduces the local checks and the hosted database/auth matrix passes. Local build success alone is not release approval.

### T02 — audit included datasets and contradictory documentation

- Priority: P0 before external distribution. Owner: product/data owner + developer. Dependencies: none.
- [ ] Establish origin and distribution permission for `real-kpis.json` (176 live-labeled and 3,628 proxy-labeled rows) and the included Africare source workbook.
- [ ] Keep synthetic demo data clearly separated from customer data. Remove or replace unapproved source artifacts from future distributions; assess repository history separately if they were published.
- [ ] Replace stale current-status claims in the README, source-material policy, architecture and API documentation. Preserve old plans as dated historical documents.
- [ ] Describe prototype limitations honestly; source-file labels do not prove data is real, licensed, private or validated.
- Done when: every distributed dataset has an owner, provenance and permission record; demo disclosures match its verified contents.

## Milestone 1 — remove the hospital product dependency

### T03 — map ERP removal and historical-data retention

- Priority: P0. Owner: backend/data developer. Dependencies: T00, T01.
- [ ] Inventory ERP web routes/navigation, API modules, schemas, contracts, helpers, source toggles, seeders, scripts, workflows, environment variables and deployment resources.
- [ ] Trace leadership revenue, operations, knowledge and surveillance dependencies on `orbit_erp` tables/functions.
- [ ] For each affected KPI, specify replacement customer input measures or an explicit unavailable state. Identify action/evidence references that must survive.
- [ ] Produce a migration manifest naming retain/archive/remove decisions and rollback behavior. Customer records require export/retention handling before destructive cleanup.
- Done when: no downstream dependency is implicitly left reading a soon-to-be-removed ERP source.

### T04 — retire ERP routes and background writers

- Priority: P0. Owner: full-stack developer. Dependencies: T03.
- [ ] Remove hospital attendance, people, care, service billing and patient screens and APIs from the product.
- [ ] Disable/remove hospital simulator deployments and scheduled ticks. Retire hospital forecast/surveillance jobs and ERP-derived knowledge sync; revoke unused secrets after dependency review.
- [ ] Remove ERP-specific operator roles from the active product; replace platform setup identity with the control-plane identity in T07, not an ERP admin alias.
- [ ] Keep generic actions, approvals, audit, authentication helpers and reusable UI elements where appropriate.
- [ ] Retire unreachable code/contracts and update CI. Use forward migrations, not edits to applied SQL history. Defer destructive table drops until the approved retention/cutover plan allows them.
- Done when: no active route or job needs ERP; existing historical evidence remains accessible to its authorized owners. The forecast leakage finding becomes retired with the module; if forecasting is later reused, purge overlapping train/holdout target windows first.

## Milestone 2 — tenant and permission foundation

### T05 — implement generic organization and hierarchy schemas

- Priority: P0. Owner: database/backend developer. Dependencies: T00, T03.
- [ ] Add tenant settings, generic entities, configurable unit types, effective-dated hierarchy and tenant-owned roles with stable IDs.
- [ ] Remove active dependence on `group/region/facility/coe` enums and the fourteen-role/global-role foreign keys. Healthcare names become optional template data.
- [ ] Add composite same-tenant foreign keys, hierarchy cycle/depth rules, indexes and root-only flat organization support.
- [ ] Separate non-hierarchical dimensions from organization scope. Specify how reorganizations affect historical aggregation.
- [ ] Supply mappings from old organization/role/entity IDs to new IDs and migration reconciliation queries.
- Done when: flat, branch-based and team-based tenants can be configured without code, and cross-tenant parent/role references are rejected by the database.

### T06 — implement selected tenant, multiple roles and capability checks

- Priority: P0. Owner: backend/security developer. Dependencies: T05.
- [ ] Replace the current global single-active-membership assumption with membership listing and explicit verified tenant selection.
- [ ] Build role bindings and action/KPI/entity/breakdown permission tuples. Do not infer authority from titles or reporting seniority.
- [ ] Centralize deny-by-default checks in API and RLS. Add write checks as well as select policies; preserve parameterized SQL and transaction-local context.
- [ ] Prevent cross-product widening of grants from different roles. Separate aggregate visibility from contributor visibility.
- [ ] Implement permission revision/revocation behavior and tenant-qualified cache/query keys; clear old workspace state on tenant switch.
- Done when: one user can legitimately work in two tenants without ambiguous-membership failure; revocation denies subsequent requests; multiple-role scopes do not combine into unintended access.

### T07 — isolate platform provisioning from customer work

- Priority: P0. Owner: security/backend/platform developer. Dependencies: T00, T05, T06.
- [x] Create distinct control/data API paths and processes. Configuration rejects both database credentials in one process, uses separate `NOLOGIN` permission roles and switches role per transaction. Hosted login role provisioning is still open.
- [x] Let operators provision organization metadata and configuration proposals; a customer owner must approve proposals and activate KPI definitions.
- [x] Use a one-time invitation hash and verified Auth email to create the first owner; customer owners manage subsequent invitations. Email delivery is manual for now; no passwords or customer sessions are shown to operators.
- [ ] Require customer approval for access-affecting setup changes and formula/layout proposals. Prevent operators appointing themselves or another operator as data readers.
- [ ] Remove impersonation and raw-data support tooling; restrict logs, file viewers, exports, traces and observability accounts.
- [ ] If the selected promise is provider inability, deploy the data-handling UI, API, worker, DB, storage and keys in a customer-controlled boundary with customer-controlled releases and egress. That deployment does not exist.
- [ ] Validate hosted operator-denial behavior, role grants, exports, logs, traces and backup access. Local synthetic route tests do not prove the complete threat model.
- Done when: the hosted operator-denial tests pass and any stronger provider-inability promise is proven by the chosen customer-controlled threat model.

## Milestone 3 — real KPI definitions and input semantics

### T08 — establish generic contracts and tenant data model

- Priority: P0. Owner: contracts/backend/data developer. Dependencies: T05, T06.
- [ ] Add measure definitions, tenant KPI definitions/immutable versions, assignments, target versions, sources, inputs/revisions, calculation runs, results and lineage.
- [ ] Replace the generated-workbook lookup in `modules/shared.ts` and global entitlement query with tenant configuration repositories.
- [ ] Keep KPI identity independent of role assignment; support the same KPI in several roles without duplicate calculations.
- [ ] Replace `common.ts` illustrative-only provenance, quality and target approval contracts in sync with SQL and UI. The current migration accepting live/proxy/sample values is incompatible with those contracts.
- [ ] Support tenant timezone, fiscal/calendar periods and required daily/weekly/monthly/quarterly/yearly cadences. Store canonical boundaries consistently.
- [ ] Specify exact decimal representation, unit/currency handling, composite keys and input revision uniqueness.
- Done when: a valid real/manual input and approved target round-trip through DB/API/UI; demo data remains distinguishable; unsupported states fail explicitly.

### T09 — turn healthcare definitions into optional templates

- Priority: P1. Owner: product/data/full-stack developer. Dependencies: T08.
- [ ] Move fourteen-role/109-assignment material behind an optional healthcare template pack.
- [ ] Provide a blank organization and a small cross-industry starter set with documented required inputs and formulas.
- [ ] Copy templates into tenant-owned versioned definitions; preserve source attribution and license/approval decisions from T02.
- [ ] Propose updates rather than overwriting active customer versions. Keep customer-private KPIs private.
- Done when: a tenant can start empty; copying or changing one template does not change any other tenant's active KPI.

### T10 — build KPI request, definition and approval workflows

- Priority: P0. Owner: full-stack + product/data developer. Dependencies: T07–T09.
- [ ] Build a definition editor for business meaning, owner, units, inputs, scope, period, formula, target and missing-data policy.
- [ ] Support the six cases in architecture section 7: reuse, new supported formula, missing measure, unavailable source, unsupported primitive, externally calculated KPI.
- [ ] Add technical validation with synthetic examples and a customer-only real-input preview. Platform reviewers cannot view the latter.
- [ ] Implement immutable approved versions, proposed changes, effective dates, rejection reasons and separate target approval.
- [ ] Add “awaiting inputs,” “unsupported calculation,” and “definition needs review” states with an owner and next step.
- Done when: a customer adds a KPI absent from the catalog without a developer changing code, provided its calculation is supported. An unsupported request does not produce a guessed result.

### T11 — implement the safe calculation engine

- Priority: P0. Owner: backend/data engineer. Dependencies: T08, T10 contracts.
- [ ] Implement a typed allowlisted formula AST, unit/dimension checks, dependency graph and cycle rejection.
- [ ] Implement sum/count/ratio/weighted mean/min/max/as-of/difference/percentage-change semantics and explicit unsupported-function errors.
- [ ] Enforce time/entity aggregation rules, source precedence, currency policy, period alignment, rounding and missing/zero/partial behavior.
- [ ] Reject arbitrary code, queries, filesystem/network access, dynamic imports and unbounded computation.
- [ ] Version the engine and retain input revision IDs plus formula/target checksums with every result.
- Done when: hand-calculated golden examples agree, including the 90/100 + 1/10 rollup yielding 82.73%, zero denominators, snapshots across months, missing coverage and incompatible currencies. Repeating the same versioned input produces the same numeric result.

## Milestone 4 — customer-owned inputs and publication

### T12 — deliver forms and import staging

- Priority: P0. Owner: full-stack/data developer. Dependencies: T06, T08.
- [ ] Generate forms and CSV templates from approved measure schemas; support entity, period, value, unit/currency, dimensions and external source key.
- [ ] Implement tenant-private upload authorization/storage, file/size limits, retention and malicious-content handling.
- [ ] Add schema/ownership checks, row-level errors, mapping preview, duplicate detection and total reconciliation.
- [ ] Store drafts/staging separately from accepted inputs. Do not silently publish valid rows from an otherwise failed batch.
- [ ] Handle repeated imports idempotently; distinguish duplicate submission from a deliberate correction/replacement.
- Done when: a customer can import its own file without platform staff inspecting it; another tenant cannot guess its file URL, job ID or source record and read it.

### T13 — implement approvals, corrections and period locks

- Priority: P0. Owner: backend/full-stack developer. Dependencies: T12.
- [ ] Implement draft/submit/reject/approve states, reviewer reasons, ownership and immutable accepted revisions.
- [ ] Default to a different approver where staffing permits. If a small tenant permits self-approval, make it an explicit owner-approved policy and label it in audit.
- [ ] Add reporting-period locking/reopening, optimistic concurrency and customer-visible correction history.
- [ ] Restrict accepted input writes to authorized workflow/service paths; direct input edits cannot bypass approval.
- Done when: concurrent edits conflict safely, approved inputs cannot be overwritten, and an authorized correction creates a new traceable revision.

### T14 — add durable calculations and atomic publication

- Priority: P0. Owner: backend/platform developer. Dependencies: T11, T13.
- [ ] Commit input changes and outbox events atomically; implement durable jobs, leases, bounded retries and failed-job handling.
- [ ] Derive trusted tenant scope for jobs; do not execute user-supplied identity claims or query text.
- [ ] Recompute the affected dependency graph from a stable input snapshot. Enforce per-tenant work limits.
- [ ] Persist results and lineage, then atomically publish a coherent result set. Show progress/failure without mixing old and partial new results.
- [ ] Handle worker crashes, replay, duplicated delivery, superseding revisions and stale jobs. Add reconciliation for stranded outbox/jobs.
- Done when: duplicate jobs do not double-publish, a crash between computation and publication is recoverable, and previous evidence remains reproducible after corrections.

### T15 — add scoped ingestion API and selected connectors after the pilot

- Priority: P1. Owner: integration/backend developer. Dependencies: T12–T14; pilot manual/CSV path first.
- [ ] Expose a bounded, idempotent batch API with tenant/source/measure-scoped credentials and revocation.
- [ ] Store connector credentials in tenant data-plane secret storage; configure watermarks, retry, corrections/deletions, source precedence and reconciliation.
- [ ] Implement one actual connector justified by pilot customers before building a large connector catalog.
- [ ] Add source health and freshness; distinguish an empty successful source from a failed connector.
- Done when: replaying a batch does not duplicate data, a revoked token stops working, and a failed source cannot silently leave an apparently fresh KPI.

## Milestone 5 — generic customer experience

### T16 — build organization setup and role-driven dashboards

- Priority: P0. Owner: frontend/full-stack developer. Dependencies: T06–T10, T14.
- [ ] Implement customer invitation acceptance, organization switching, arbitrary role labels, role bindings, unit setup and customer settings.
- [ ] Render authorized assignments through generic KPI widgets and saved layouts; remove hospital-only copy and code branches.
- [ ] Show formula/version, unit, time period, target approval, provenance, freshness, completeness and authorized lineage in KPI details.
- [ ] Add useful empty states and a setup checklist: no definition, no source, awaiting inputs, awaiting approval, calculation failed, missing target.
- [ ] Check keyboard access, mobile layouts and large-table behavior. A role with no KPIs sees an explained empty state, not a crash.
- Done when: a newly configured role renders without new React code; switching tenants never flashes the previous tenant's values.

### T17 — generalize actions, alerts and audit

- Priority: P0. Owner: backend/frontend developer. Dependencies: T06, T14, T16.
- [ ] Bind actions to tenant members and immutable result evidence, not hospital role names or global framework assignment strings.
- [ ] Preserve explicit state transitions, idempotency, optimistic locking and atomic write/audit behavior.
- [ ] Add departure/reassignment handling and superseded-evidence notices.
- [ ] Evaluate approved thresholds only on eligible published data; deduplicate repeated alerts and define reopened-alert behavior after corrections.
- [ ] Notify authorized users with a secure link by default; keep values out of platform logs and notification previews.
- Done when: a result correction does not rewrite an existing action's evidence, missing inputs do not create false green status, and assignees cannot be chosen across tenants.

### T18 — decide AI scope explicitly

- Priority: P1. Owner: product/security/backend developer. Dependencies: T07, T14, T17.
- [ ] Disable existing ERP knowledge retrieval and customer-data LLM calls for the initial release.
- [ ] If later enabled, require tenant opt-in, approved processors/retention, authorized retrieval, tenant isolation, numeric fidelity checks and per-tenant rate/cost limits.
- [ ] Keep formulas, approvals and permissions deterministic. A model suggestion cannot activate configuration or fill missing inputs.
- Done when: the entire KPI-to-action workflow works without AI; no customer data leaves through a model provider without the selected privacy policy permitting it.

## Milestone 6 — release and operations

### T19 — make deployment and source state explicit

- Priority: P0. Owner: platform/backend developer. Dependencies: T04, T07, T14.
- [ ] Replace or validate the current independent `ORBIT_LIVE_SOURCES` switches with coherent documented service configuration. Fail startup/readiness for missing required dependencies.
- [ ] Provide separate control/data/worker environment examples and credential scopes. Remove obsolete ERP variables and the misleading preview-origin documentation.
- [ ] Add readiness checks for required migrations, queue/worker health and storage. Liveness alone must not imply the product can serve data.
- [ ] Keep secrets out of clients and logs; sanitize trace/error payloads and error-file access. Use short-lived tenant-qualified file/export URLs.
- Done when: a fresh deployment has a repeatable setup path and reports missing dependencies explicitly rather than presenting an unexplained universal 503.

### T20 — retention, recovery, quotas and tenant lifecycle

- Priority: P0 before production. Owner: platform/data/product owner. Dependencies: T07, T14, T19.
- [ ] Implement customer export and deletion/offboarding with policy for backups, audit retention, external connections and queued work.
- [ ] Define and demonstrate restore/recovery against the RPO/RTO agreed in T00; prevent a tenant restore from overwriting other tenants.
- [ ] Apply storage, input, calculation, export and request quotas. Add customer-visible plan limits and safe suspension/reactivation.
- [ ] Track source freshness, queue age and failures without business values. Assign incident ownership and maintain a recovery/runbook.
- [ ] Scope platform subscriptions independently of removed hospital billing; manual plan administration is acceptable for the pilot.
- Done when: operators can diagnose failed processing using sanitized telemetry; offboarding stops ingestion/jobs/access and a recovery drill succeeds within the agreed objectives.

### T21 — migrate and cut over safely

- Priority: P0. Owner: backend/data/platform developer. Dependencies: T04–T20 as applicable.
- [ ] Apply additive generic schemas and backfill mappings for retained organizations, memberships, entities, KPI versions, results and action evidence.
- [ ] Reconcile counts, calculation components and authorization scopes before cutover. Mark unsupported old observations explicitly rather than forcing them into invented new definitions.
- [ ] Rehearse in a disposable environment; document rollback, publication freeze/write handling and compatibility window.
- [ ] Retire old routes/readers after the new read path is validated. Archive/drop ERP storage only after the approved retention/export gate, with explicitly verified targets.
- Done when: retained data/evidence reconciles, rollback has been rehearsed, and no production scheduler writes to the retired model.

### T22 — prove flexibility and isolation before release

- Priority: P0. Owner: QA/security/data/full-stack developer. Dependencies: T01–T21 appropriate to selected release scope.
- [ ] Onboard a three-user flat agency, a seven-role retail tenant and a manufacturing tenant through normal interfaces using synthetic data.
- [ ] Create a previously absent supported KPI, a custom input measure, a custom role and a new hierarchy without source changes.
- [ ] Demonstrate supported features with manual and CSV inputs before optional connectors. Validate calculation fixtures independently of implementation.
- [ ] Exercise the release matrix below, including real database RLS, storage and worker integration checks.
- [ ] Run CI typecheck/build/lint/unit/integration/e2e gates with explicit reporting of skipped infrastructure tests. Secret/dependency scanning and production configuration review are part of release evidence.
- Done when: all P0 acceptance tests pass against the deployable candidate; no tenant-specific code was required, and customer privacy claims match the demonstrated threat model.

## Required release matrix

| Area | Positive case | Negative/failure case |
|---|---|---|
| Organization flexibility | 3 users, 7 roles, repeated role membership, empty role | Unknown role/hierarchy never escalates permission or crashes a dashboard |
| Multiple memberships | User selects each authorized organization | Forged tenant, revoked membership, stale session/cache and simultaneous tabs do not leak data |
| Scoped roles | Each complete permission tuple grants expected KPIs/entities | Grants from different roles cannot form an unintended cross-product |
| Platform privacy | Operator provisions and proposes synthetic configuration | Observations, uploads, exports, jobs, logs, evidence, invites and config-change tricks cannot expose values |
| Database/storage | Same-tenant relationships and authorized objects work | Cross-tenant FKs, guessed IDs/paths, RLS reads/writes and worker scope changes fail |
| Definition lifecycle | Customer-approved supported formula activates | Invalid units, cycles, unsupported code, cross-tenant references and unapproved versions fail |
| Calculation | Independent known totals/ratios/weights/snapshots match | Missing/zero/partial/currency/period errors remain distinct; ratios do not average incorrectly |
| Ingestion | Approved mapped batch publishes once | Duplicate, corrected, late, invalid and concurrent batches cannot overwrite or double-count silently |
| Worker reliability | Approved inputs eventually publish coherently | Crashes, retries and superseded jobs cannot partially publish or corrupt lineage |
| Historical evidence | Old actions resolve exact earlier results | Recalculation/version changes do not silently rewrite decisions |
| Operations | Export, deletion and restore follow customer policy | Queued jobs and stale credentials cannot continue after suspension/offboarding |

## Delivery order and realistic expectations

Start with T00–T02, map ERP removal, then complete the generic identity/configuration model. Build one full path from a new KPI definition to approved manual inputs, deterministic calculation, a dashboard and an action. Add CSV and prove isolation before broad connectors, AI or additional industry templates.

The core first release includes all P0 tasks relevant to the chosen deployment mode. T09's blank/starter templates are useful for onboarding; T15 connectors and T18 AI expansion can follow the pilot. Avoid allowing optional features to hide unfinished tenant isolation, calculations or recovery.

Do not promise “every business can use any KPI immediately.” Promise configurable supported KPIs, customer-controlled definitions and clear handling of unsupported needs. Obtain an effort estimate after the baseline build and one complete generic vertical slice; the archive alone does not support an honest fixed delivery date or cost.

Developer work should diminish after the platform is built: new tenant, role, unit, supported KPI, dashboard or input mapping becomes configuration. New calculation primitives, unusual source integrations, scale requirements and stronger deployment/privacy models remain engineering work.
