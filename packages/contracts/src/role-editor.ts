import { z } from "zod";
import { CapabilitySchema, type Capability } from "./saas.ts";

/**
 * What an owner chooses when they create or edit a role, and how that maps to the
 * permission rows the database keeps.
 *
 * The owner picks: a name, what the role may do, which part of the organization
 * (a unit and everything beneath it, or all of it), and which KPIs it can see
 * and update (or all of them). The database stores that as one row per
 * capability, and one per KPI for view, act and submit.
 */
export const SaveRoleRequestSchema = z.strictObject({
  /** Leave out to create a new role. */
  roleId: z.uuid().optional(),
  name: z.string().trim().min(1).max(120),
  capabilities: z.array(CapabilitySchema).max(5),
  /** The unit the role works in, with everything beneath it. Null is the whole organization. */
  scopeUnitId: z.uuid().nullable(),
  /** KPIs for view, act and submit. Empty means every KPI in scope. */
  kpiIds: z.array(z.uuid()).max(1000),
});
export type SaveRoleRequest = z.infer<typeof SaveRoleRequestSchema>;

export const RenameOrganizationRequestSchema = z.strictObject({
  name: z.string().trim().min(1).max(120),
});

export interface RoleGrant {
  capability: Capability;
  unitId: string | null;
  kpiId: string | null;
}

/** The permission rows for a role, without duplicates. */
export function expandRoleGrants(request: Pick<SaveRoleRequest, "capabilities" | "scopeUnitId" | "kpiIds">): RoleGrant[] {
  const seen = new Set<string>();
  const out: RoleGrant[] = [];
  const add = (grant: RoleGrant) => {
    const key = `${grant.capability}|${grant.unitId ?? ""}|${grant.kpiId ?? ""}`;
    if (seen.has(key)) return;
    seen.add(key);
    out.push(grant);
  };
  const kpiIds = [...new Set(request.kpiIds)];
  for (const capability of new Set(request.capabilities)) {
    if (capability === "configure") {
      // Defining units and KPIs is organization-wide, never limited to a unit or a KPI.
      add({ capability, unitId: null, kpiId: null });
    } else if (capability === "view" || capability === "act" || capability === "submit") {
      if (kpiIds.length === 0) add({ capability, unitId: request.scopeUnitId, kpiId: null });
      else for (const kpiId of kpiIds) add({ capability, unitId: request.scopeUnitId, kpiId });
    } else {
      // Approval applies to a whole unit. Submission is handled above because
      // a contributor must only update inputs used by their assigned KPIs.
      add({ capability, unitId: request.scopeUnitId, kpiId: null });
    }
  }
  return out;
}

export interface RoleDraft {
  capabilities: Capability[];
  scopeUnitId: string | null;
  /** True when the role sees every KPI in its scope. */
  allKpis: boolean;
  kpiIds: string[];
  /**
   * True when the stored permissions cannot be shown with these controls (for
   * example two different scopes, or different KPIs for view and act). The owner
   * can still see and delete such a role, and saving it replaces it with the
   * simpler form.
   */
  custom: boolean;
}

const ORDER: Capability[] = ["view", "act", "submit", "approve", "configure"];

/** The editor's view of a role's stored permissions. */
export function roleDraftFromGrants(grants: readonly RoleGrant[]): RoleDraft {
  const capabilities = ORDER.filter((c) => grants.some((g) => g.capability === c));

  let custom = false;
  const scoped = grants.filter((g) => g.capability !== "configure");
  const scopes = new Set(scoped.map((g) => g.unitId));
  if (scopes.size > 1) custom = true;
  const scopeUnitId = scopes.size === 1 ? ([...scopes][0] ?? null) : null;

  const profile = (capability: "view" | "act" | "submit") => {
    const rows = grants.filter((g) => g.capability === capability);
    if (rows.length === 0) return undefined;
    const all = rows.some((g) => g.kpiId === null);
    const ids = rows.flatMap((g) => (g.kpiId === null ? [] : [g.kpiId]));
    // A grant for every KPI next to grants for single KPIs is not something the editor can show.
    if (all && ids.length > 0) custom = true;
    return { all, ids: new Set(ids) };
  };
  const profiles = (["view", "act", "submit"] as const)
    .map((capability) => ({ capability, profile: profile(capability) }))
    .filter((entry): entry is { capability: "view" | "act" | "submit"; profile: { all: boolean; ids: Set<string> } } => Boolean(entry.profile));
  let allKpis = true;
  let kpiIds: string[] = [];
  if (profiles.length > 0) {
    // Prefer a restricted profile as the editor's single KPI selection. Older
    // templates sometimes stored `act` as all-KPIs beside restricted `view`;
    // that legacy shape is equivalent because acting requires visibility.
    const baseline = profiles.find((entry) => !entry.profile.all) ?? profiles[0]!;
    allKpis = baseline.profile.all;
    kpiIds = [...baseline.profile.ids];
    for (const entry of profiles) {
      const same = entry.profile.all === baseline.profile.all
        && entry.profile.ids.size === baseline.profile.ids.size
        && [...entry.profile.ids].every((id) => baseline.profile.ids.has(id));
      const legacyActAll = entry.capability === "act" && entry.profile.all && entry.profile.ids.size === 0 && !baseline.profile.all;
      if (!same && !legacyActAll) custom = true;
    }
  }
  return { capabilities, scopeUnitId, allKpis, kpiIds: allKpis ? [] : kpiIds, custom };
}
