import { z } from "zod";
import {
  DecimalSchema,
  FormulaSchema,
  MeasureKeySchema,
} from "./formula.ts";

// Compatibility shapes for archived workbook previews. New tenants use UUID roles below.
export const IndustryTypeSchema = z.string().trim().min(1).max(80);
export const WorkspaceModuleIdSchema = z.enum([
  "brief",
  "inbox",
  "explorer",
  "actions",
  "ask",
  "audit",
  "operations",
  "revenue",
  "surveillance",
]);
export const HierarchyLabelsSchema = z.strictObject({
  group: z.string(),
  region: z.string(),
  facility: z.string(),
  coe: z.string(),
});
export const DynamicRoleProfileSchema = z.strictObject({
  title: z.string(),
  eyebrow: z.string(),
  description: z.string(),
});
export type DynamicRoleProfile = z.infer<typeof DynamicRoleProfileSchema>;

export const CapabilitySchema = z.enum([
  "configure",
  "submit",
  "approve",
  "view",
  "act",
]);
export type Capability = z.infer<typeof CapabilitySchema>;
export const SaasPeriodSchema = z
  .strictObject({ start: z.iso.date(), end: z.iso.date() })
  .refine((p) => p.start <= p.end, "Period end precedes start");
export const NewKpiSchema = z.strictObject({
  key: MeasureKeySchema,
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().min(1).max(2000),
  unit: z.string().trim().min(1).max(32),
  formula: FormulaSchema,
  direction: z.enum(["higher", "lower", "neutral"]),
  target: DecimalSchema.nullable(),
});
export type NewKpi = z.infer<typeof NewKpiSchema>;
export const NewMeasureSchema = z.strictObject({
  key: MeasureKeySchema,
  name: z.string().trim().min(1).max(120),
  unit: z.string().trim().min(1).max(32),
});
export const InputBatchSchema = z
  .strictObject({
    idempotencyKey: z.uuid(),
    unitId: z.uuid(),
    period: SaasPeriodSchema,
    origin: z.enum(["manual", "import", "synthetic"]),
    rows: z
      .array(
        z.strictObject({ measure: MeasureKeySchema, value: DecimalSchema }),
      )
      .min(1)
      .max(500),
  })
  .refine(
    (b) => new Set(b.rows.map((r) => r.measure)).size === b.rows.length,
    "Duplicate measures in a batch",
  );
export type InputBatch = z.infer<typeof InputBatchSchema>;
export const NewUnitSchema = z.strictObject({
  name: z.string().trim().min(1).max(120),
  kind: z.string().trim().min(1).max(60),
  parentId: z.uuid().nullable(),
});
export const NewRoleSchema = z.strictObject({
  name: z.string().trim().min(1).max(120),
  grants: z
    .array(
      z.strictObject({
        capability: CapabilitySchema,
        unitId: z.uuid().nullable(),
        kpiId: z.uuid().nullable(),
      }),
    )
    .max(100),
});
export const InviteSchema = z.strictObject({
  email: z.email(),
  roleIds: z.array(z.uuid()).min(1).max(100),
});
export const NewActionSchema = z.strictObject({
  title: z.string().trim().min(1).max(200),
  resultId: z.uuid(),
  assigneeId: z.uuid(),
  dueDate: z.iso.date(),
});
export const ActionTransitionSchema = z.strictObject({
  state: z.enum(["open", "in_progress", "done"]),
  expectedVersion: z.number().int().positive(),
});
export const CalculationValueSchema = z.discriminatedUnion("status", [
  z.strictObject({ status: z.literal("available"), value: z.string() }),
  z.strictObject({
    status: z.literal("missing"),
    measures: z.array(z.string().regex(/^[a-z][a-z0-9_]{0,63}(?:@(?:previous|year_ago))?$/)),
  }),
  z.strictObject({
    status: z.literal("not_applicable"),
    reason: z.literal("zero_denominator"),
  }),
]);
export type CalculationValue = z.infer<typeof CalculationValueSchema>;
export const ORGANIZATION_STATUSES = ["pending", "active", "suspended", "deleted"] as const;
export const OrganizationStatusSchema = z.enum(ORGANIZATION_STATUSES);
export type OrganizationStatus = z.infer<typeof OrganizationStatusSchema>;
export const TenantSummarySchema = z.strictObject({
  id: z.uuid(),
  name: z.string(),
  owner: z.boolean(),
  /** Only an active organization can be worked in. */
  status: OrganizationStatusSchema.default("active"),
});
export const TenantListSchema = z.array(TenantSummarySchema);
export const MeasureSchema = NewMeasureSchema.extend({
  description: z.string(),
  /** Whether a parent unit may be calculated by adding up its children. */
  rollsUp: z.boolean(),
});
export const KpiDefinitionSchema = NewKpiSchema.extend({
  id: z.uuid(),
  version: z.number().int().positive(),
  state: z.enum(["draft", "active", "retired"]),
  /** Catalog domain, such as finance or healthcare. Null for a KPI written from scratch. */
  domain: z.string().nullable(),
  /** The catalog entry this KPI was copied from, for example FIN-003. */
  catalogId: z.string().nullable(),
  /** Dashboard order from the template; lower comes first. */
  sortOrder: z.number().int(),
});
export const WorkspaceSchema = z.strictObject({
  organization: TenantSummarySchema,
  subject: z.uuid(),
  /** The signed-in person's own standing in this organization. */
  me: z
    .strictObject({
      owner: z.boolean(),
      roles: z.array(z.strictObject({ id: z.uuid(), name: z.string() })),
    })
    .default({ owner: false, roles: [] }),
  units: z.array(NewUnitSchema.extend({ id: z.uuid() })),
  measures: z.array(MeasureSchema),
  /** Measure keys this caller may submit for at least one authorized unit/KPI tuple. */
  submissionMeasureKeys: z.array(MeasureKeySchema).optional(),
  kpis: z.array(KpiDefinitionSchema),
  roles: z.array(
    NewRoleSchema.extend({ id: z.uuid(), templateKey: z.string().nullable() }),
  ),
  members: z.array(
    z.strictObject({
      id: z.uuid(),
      subject: z.uuid(),
      displayName:z.string(),
      owner: z.boolean(),
      active: z.boolean(),
      /** Shown to the organization's owner only. */
      email: z.string().nullable().default(null),
      /** The roles this member holds. Shown to the owner only. */
      roleIds: z.array(z.uuid()).default([]),
    }),
  ),
  batches: z.array(
    z.strictObject({
      id: z.uuid(),
      unitId: z.uuid(),
      start: z.string(),
      end: z.string(),
      status: z.enum(["submitted", "approved", "rejected"]),
      origin: z.string(),
    }),
  ),
  results: z.array(
    z.strictObject({
      id: z.uuid(),
      kpiId: z.uuid(),
      unitId: z.uuid(),
      start: z.string(),
      end: z.string(),
      value: CalculationValueSchema,
      origin: z.array(z.string()),
      computedAt: z.string(),
      target: DecimalSchema.nullable(),
      direction: z.enum(["higher", "lower", "neutral"]),
      onTarget: z.boolean().nullable(),
      inputIds: z.array(z.uuid()),
    }),
  ),
  actions: z.array(
    z.strictObject({
      id: z.uuid(),
      title: z.string(),
      resultId: z.uuid(),
      assigneeId: z.uuid(),
      dueDate: z.string(),
      state: z.enum(["open", "in_progress", "done"]),
      version: z.number().int().positive(),
    }),
  ),
});
export type SaasWorkspace = z.infer<typeof WorkspaceSchema>;
export const MutationResponseSchema = z.object({
  ok: z.boolean().optional(),
  id: z.uuid().optional(),
  token: z.string().optional(),
  runId: z.uuid().optional(),
  calculated: z.number().optional(),
  replayed: z.boolean().optional(),
  operator: z.boolean().optional(),
});
export const BatchDetailSchema = z.strictObject({
  id: z.uuid(),
  status: z.enum(["submitted", "approved", "rejected"]),
  submittedBy: z.uuid(),
  rows: z.array(
    z.strictObject({ measure: MeasureKeySchema, value: DecimalSchema }),
  ),
});
export const AuditResponseSchema = z.array(
  z.strictObject({
    id: z.uuid(),
    event: z.string(),
    resourceId: z.uuid().nullable(),
    subject: z.uuid(),
    createdAt: z.string(),
  }),
);
export const SetupProposalSchema = z.strictObject({
  title: z.string().trim().min(1).max(120),
  measures: z.array(NewMeasureSchema).max(100),
  kpis: z.array(NewKpiSchema).max(30),
  roles: z
    .array(
      z.strictObject({
        name: z.string().trim().min(1).max(120),
        capabilities: z.array(CapabilitySchema).max(5),
      }),
    )
    .max(30),
});
export const ProposalListSchema = z.array(
  z.strictObject({
    id: z.uuid(),
    state: z.enum(["pending", "accepted", "rejected"]),
    configuration: SetupProposalSchema,
  }),
);
export const ControlOrganizationSchema = z.object({
  id: z.string(),
  name: z.string(),
  industry: z.string().nullish().transform((v) => v || "General"),
  plan: z.string().nullish().transform((v) => v || "Pilot"),
  subscriptionStatus: z
    .enum(["trial", "active", "past_due", "cancelled"])
    .or(z.string())
    .nullish()
    .transform((v) => (v === "trial" || v === "active" || v === "past_due" || v === "cancelled" ? v : "active")),
  templateId: z.string().nullish().transform((v) => v ?? null),
  status: OrganizationStatusSchema.or(z.string()).nullish().transform((v) => (v === "active" || v === "suspended" || v === "deleted" || v === "pending" ? v : "active")),
  statusChangedAt: z.string().nullish().transform((v) => v || new Date().toISOString()),
  purgeAfter: z.string().nullish().transform((v) => v ?? null),
  ownerEmail: z.string().nullish().transform((v) => v ?? null),
  ownerName: z.string().nullish().transform((v) => v || "Organization owner"),
  ownerEmailVerifiedAt: z.string().nullish().transform((v) => v ?? null),
  credentialStatus: z
    .enum(["pending_reset", "verified"])
    .or(z.string())
    .nullish()
    .transform((v) => (v === "pending_reset" || v === "verified" ? v : "verified")),
  userCount: z.coerce.number().int().nonnegative().nullish().transform((v) => v ?? 1),
  roleCount: z.coerce.number().int().nonnegative().nullish().transform((v) => v ?? 0),
});
export const ControlOrganizationListSchema = z.array(ControlOrganizationSchema);
export const SettingsSchema = z.strictObject({
  allowSelfApproval: z.boolean(),
});
export const PeriodLockSchema = z.strictObject({
  unitId: z.uuid(),
  period: SaasPeriodSchema,
});

export const ResultSchema = WorkspaceSchema.shape.results.element;
export type SaasResult = z.infer<typeof ResultSchema>;
