import type { SaasWorkspace } from "@orbit/contracts";

type Me = SaasWorkspace["me"];

/** "Owner", or the person's role names, or a plain statement that they have none. */
export function roleLabel(me: Me | undefined): string {
  if (!me) return "";
  if (me.owner) return "Owner";
  if (me.roles.length === 0) return "No role yet";
  return me.roles.map((r) => r.name).join(" · ");
}

/** A short role name for headings: drops a trailing explanation such as "(CFO)". */
export function shortRole(name: string): string {
  return name.replace(/\s*\(.*\)\s*$/, "").trim();
}

/** What the dashboard says about whose view this is. */
export function viewingAs(me: Me | undefined): string {
  if (!me) return "";
  if (me.owner) return "Viewing as the owner: every KPI in the organization.";
  if (me.roles.length === 0) return "You have no role yet, so there is nothing to show. Ask your owner to give you one.";
  return `Viewing as ${me.roles.map((r) => shortRole(r.name)).join(" and ")}.`;
}

/** The letter shown in the avatar: the first letter of the name or email. */
export function initialOf(text: string | undefined): string {
  const first = (text ?? "").trim().charAt(0);
  return first ? first.toUpperCase() : "?";
}
