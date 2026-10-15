import { z } from 'zod';

/**
 * The 14 canonical starter role types (PRD §4).
 *
 * Slugs mirror the `apps/web/src/roles/*` folders and are verified against the
 * generated `@orbit/kpi-framework` role list by `roles.test.ts`, so the two
 * cannot drift.
 */
export const ROLE_IDS = [
  'chairman',
  'clinical-director',
  'regional-coo',
  'hospital-dho',
  'people-executive',
  'bd-lead',
  'billing-lead',
  'coe-lead',
  'corporate-revenue-lead',
  'group-cfo',
  'procurement-head',
  'hr-head',
  'legal-head',
  'analytics-head',
] as const;

export const CanonicalRoleIdSchema = z.enum(ROLE_IDS);
export type CanonicalRoleId = z.infer<typeof CanonicalRoleIdSchema>;

/**
 * Custom tenant-defined role slug (prefixed by industry or `custom:`, e.g.
 * `law:managing-partner`, `ca:audit-partner`, `it:delivery-head`,
 * `custom:branch-manager`). Allows any organization to define 3, 7, or N roles
 * without accepting unprefixed reserved strings like `admin` or `super-admin`.
 */
export const CustomRoleIdSchema = z
  .string()
  .regex(/^(law|ca|it|retail|manufacturing|custom):[a-z0-9]+(-[a-z0-9]+)*$/);
export type CustomRoleId = z.infer<typeof CustomRoleIdSchema>;

export const RoleIdSchema = z.union([CanonicalRoleIdSchema, CustomRoleIdSchema]);
export type RoleId = z.infer<typeof RoleIdSchema>;

/**
 * Operator roles:
 * - `admin` / `hospital`: Hospital Operations ERP roles (ADR 0016).
 * - `platform-operator`: Zero-knowledge Control Plane developer/operator role
 *   that provisions organizations, hierarchies, custom roles, KPI formulas, and
 *   users, with zero access to tenant Data Plane observations.
 */
export const OPERATOR_ROLE_IDS = ['admin', 'hospital', 'platform-operator'] as const;

export const OperatorRoleIdSchema = z.enum(OPERATOR_ROLE_IDS);
export type OperatorRoleId = z.infer<typeof OperatorRoleIdSchema>;
