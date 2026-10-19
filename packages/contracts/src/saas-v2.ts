import { z } from "zod";
import { DecimalSchema } from "./formula.ts";
import { CapabilitySchema } from "./saas.ts";

// ---------------------------------------------------------------------------
// KPI catalog and templates
// ---------------------------------------------------------------------------

export const CatalogKpiSchema = z.strictObject({
  id: z.string().regex(/^[A-Z]{2,4}-\d{3}$/),
  name: z.string(),
  description: z.string(),
  domain: z.string(),
  industries: z.array(z.string()),
  formulaText: z.string(),
  unit: z.string(),
  direction: z.enum(["higher", "lower", "neutral"]),
  measures: z.array(z.string()),
  needsHistory: z.boolean(),
  sources: z.array(z.string()),
});
export type CatalogKpi = z.infer<typeof CatalogKpiSchema>;
export const CatalogListSchema = z.array(CatalogKpiSchema);

export const CatalogMeasureSchema = z.strictObject({
  key: z.string(),
  name: z.string(),
  unit: z.string(),
  description: z.string(),
  rollsUp: z.boolean(),
  domain: z.string(),
});
export const CatalogResponseSchema = z.strictObject({
  kpis: CatalogListSchema,
  measures: z.array(CatalogMeasureSchema),
});
export type CatalogResponse = z.infer<typeof CatalogResponseSchema>;

export const TemplateRoleSummarySchema = z.strictObject({
  key: z.string(),
  name: z.string(),
  description: z.string(),
  capabilities: z.array(CapabilitySchema),
  kpiCount: z.number().int(),
});
export const TemplateSummarySchema = z.strictObject({
  id: z.string(),
  name: z.string(),
  industry: z.string(),
  description: z.string(),
  kpiCount: z.number().int(),
  roles: z.array(TemplateRoleSummarySchema),
});
export type TemplateSummary = z.infer<typeof TemplateSummarySchema>;
export const TemplateListSchema = z.array(TemplateSummarySchema);

// ---------------------------------------------------------------------------
// Provisioning
// ---------------------------------------------------------------------------

export const ProvisionMemberSchema = z.strictObject({
  email: z.email(),
  roleKeys: z
    .array(z.string().regex(/^[a-z][a-z0-9_]{0,40}$/))
    .min(1)
    .max(10),
});
export const ProvisionRequestSchema = z.strictObject({
  name: z.string().trim().min(1).max(120),
  ownerEmail: z.email(),
  /** A template id, or leave out for an empty organisation. */
  templateId: z.string().min(1).max(80).optional(),
  members: z.array(ProvisionMemberSchema).max(500).default([]),
});
export type ProvisionRequest = z.infer<typeof ProvisionRequestSchema>;
/** One person the operator added. Exactly one of the two secrets is present. */
export const ProvisionedPersonSchema = z.strictObject({
  email: z.string(),
  roleKeys: z.array(z.string()),
  /** The login was created for them; they must change this at first sign-in. Shown once. */
  temporaryPassword: z.string().optional(),
  /** They already had an account, so they open this one-time link instead. */
  token: z.string().optional(),
});
export const ProvisionResponseSchema = z.strictObject({
  id: z.uuid(),
  /** `logins`: people have a temporary password. `invitations`: people open a link. */
  mode: z.enum(["logins", "invitations"]),
  /** The owner. In `invitations` mode this is the owner's link. */
  owner: ProvisionedPersonSchema,
  members: z.array(ProvisionedPersonSchema),
});
export type ProvisionResponse = z.infer<typeof ProvisionResponseSchema>;

export const InviteMembersRequestSchema = z.strictObject({
  members: z.array(ProvisionMemberSchema).min(1).max(500),
});
export const InviteMembersResponseSchema = z.strictObject({
  mode: ProvisionResponseSchema.shape.mode,
  members: ProvisionResponseSchema.shape.members,
});

// ---------------------------------------------------------------------------
// Ask
// ---------------------------------------------------------------------------

export const WorkspaceAskRequestSchema = z.strictObject({
  question: z.string().trim().min(2).max(500),
});
export const WorkspaceAskFactSchema = z.strictObject({
  label: z.string(),
  value: z.string(),
  /** Whether the figure is good, bad or neither, for colouring. */
  tone: z.enum(["good", "bad", "neutral"]),
});
export const WorkspaceAskResponseSchema = z.strictObject({
  answer: z.string(),
  /** `facts` is built directly from the caller's data. `ai` is the same answer reworded. */
  mode: z.enum(["facts", "ai"]),
  topic: z.string(),
  facts: z.array(WorkspaceAskFactSchema).max(30),
  /** Results the answer is based on, so the caller can open the evidence. */
  resultIds: z.array(z.uuid()).max(30),
  suggestions: z.array(z.string()).max(6),
});
export type WorkspaceAskResponse = z.infer<typeof WorkspaceAskResponseSchema>;

// ---------------------------------------------------------------------------
// Targets
// ---------------------------------------------------------------------------

/** Changes the target of a KPI. Null removes the target. */
export const SetTargetRequestSchema = z.strictObject({
  target: DecimalSchema.nullable(),
});
