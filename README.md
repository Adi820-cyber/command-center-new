# Command Center

**Command Center** is a multi-tenant, role-scoped healthcare leadership decision workspace and hospital operations platform (built on the Orbit full-stack architecture and the 14-role, 109-KPI Command Center catalog `RKM-001` to `RKM-109`). It helps healthcare leaders move from **See → Understand → Act** through a morning brief, priority inbox, KPI explorer, governed Ask assistant, evidence cards, hospital operations ERP, revenue tracking, outbreak watch, and persisted internal actions.

## Architecture Highlights

- **One Login (`Supabase Auth`)**: Proves identity and issues asymmetric JWTs.
- **One API (`services/api` — Fastify 5 + Zod 4 Contracts)**: Verifies JWTs via JWKS, resolves the caller's `organization_id`, `role_id`, and `scopes` from `org_memberships`, checks entitlements, and sets per-transaction RLS claims (`SET LOCAL orbit.membership`).
- **One Shared Database (`Supabase Postgres + pgvector`)**:
  - Multi-tenant tables (`organizations`, `regions`, `facilities`, `coes`, `org_memberships`, `org_roles`, `org_kpi_definitions`, `org_role_kpi_assignments`, `kpi_observations`, `exceptions`, `actions`, `audit_events`) scoped by `organization_id` with forced Row-Level Security (`ENABLE` + `FORCE ROW LEVEL SECURITY`).
  - Full 109-KPI Command Center catalog (`RKM-001` to `RKM-109`) across 14 leadership roles, 29 definition families, and 10 domains (`packages/kpi-framework`), plus `data/snapshots/real-kpis.json` (3,804 real/proxy aggregate rows across 35 KPIs).
- **Calculation & Import Jobs (`packages/data-gen`, `tools/forecast`, `services/simulator`)**: Only privileged jobs write `kpi_observations` (`live`, `proxy`, `illustrative`, `sample`) and outbreak forecasts.
- **Dual Web Surfaces (`apps/web` — React 19 + React Router 7 + Vite 8)**: Serves both the **Command Center Leadership Workspace** and the **Hospital Operations ERP** (`VITE_APP_SURFACE=erp`).

## Monorepo Layout

| Path | Purpose |
|---|---|
| `apps/web` | Command Center leadership web app and Hospital Operations ERP (`VITE_APP_SURFACE`) |
| `services/api` | Fastify 5 backend API with JWKS auth, scope/entitlement enforcement, and Postgres RLS |
| `services/simulator` | Live hospital simulator driving operational activity through the API |
| `packages/contracts` | Shared Zod 4 schemas and TypeScript types (`@orbit/contracts`) |
| `packages/kpi-framework` | Generated 14-role, 109-KPI (`RKM-001`–`RKM-109`), 10-domain Command Center catalog (`@orbit/kpi-framework`) |
| `packages/data-gen` | Deterministic KPI & ERP seed generator and reference dataset loader (`@orbit/data-gen`) |
| `packages/ui-kit` | Command Center design tokens, `CommandCenterBrand`, and chart primitives (`@orbit/ui-kit`) |
| `supabase/migrations` | 25 Postgres migrations with forced Row-Level Security and multi-tenant SaaS KPI tables |
| `data/snapshots` | Manifests and `real-kpis.json` (3,804 delivered real/proxy KPI rows) |
| `tools/forecast` | Python 3.12 XGBoost (`count:poisson`) outbreak forecasting job |
