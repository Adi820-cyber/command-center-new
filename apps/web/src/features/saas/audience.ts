import type { SaasWorkspace } from "@orbit/contracts";

type Kpi = SaasWorkspace["kpis"][number];
type Role = SaasWorkspace["roles"][number];

export interface RoleView {
  roleId: string;
  name: string;
  /** The role sees this KPI. */
  sees: boolean;
  /** The role sees every KPI, so it cannot be taken off one. */
  everything: boolean;
}

/**
 * Which roles see a KPI. A grant names one version of a KPI but counts for every
 * version with the same key, the same rule the database applies.
 */
export function rolesSeeingKpi(kpi: Pick<Kpi, "key">, roles: readonly Role[], kpis: readonly Pick<Kpi, "id" | "key">[]): RoleView[] {
  const keyOf = new Map(kpis.map((k) => [k.id, k.key]));
  return roles.map((role) => {
    const views = role.grants.filter((g) => g.capability === "view");
    const everything = views.some((g) => g.kpiId === null);
    const sees = everything || views.some((g) => g.kpiId !== null && keyOf.get(g.kpiId) === kpi.key);
    return { roleId: role.id, name: role.name, sees, everything };
  });
}
