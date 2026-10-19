/**
 * Turning "alice@x.com, coo; quality head" into people with role keys.
 *
 * An operator can paste a whole list, one person per line:
 *
 *   ceo@acme.com, executive
 *   anita@acme.com, operations; data reviewer
 *   entry1@acme.com	data_contributor
 *
 * Roles may be written as the key (`data_contributor`), the full name, or the
 * name without its brackets. Several roles are separated by `;` or `|`.
 */

export interface RoleOption {
  key: string;
  name: string;
}
export interface Person {
  email: string;
  roleKeys: string[];
}
export interface ParsedPeople {
  people: Person[];
  errors: string[];
}

const EMAIL = /^[^\s@,;|]+@[^\s@,;|]+\.[^\s@,;|]+$/;
const norm = (text: string) => text.toLowerCase().replace(/\([^)]*\)/g, "").replace(/[^a-z0-9]+/g, " ").trim();

/** Finds a role from what someone typed. */
export function matchRole(text: string, roles: readonly RoleOption[]): RoleOption | undefined {
  const wanted = norm(text);
  if (!wanted) return undefined;
  return (
    roles.find((r) => norm(r.key) === wanted) ??
    roles.find((r) => norm(r.name) === wanted) ??
    roles.find((r) => norm(r.name).startsWith(wanted) && wanted.length >= 3) ??
    undefined
  );
}

export function parsePeople(text: string, roles: readonly RoleOption[]): ParsedPeople {
  const people: Person[] = [];
  const errors: string[] = [];
  const seen = new Set<string>();
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  lines.forEach((line, index) => {
    const where = `Line ${index + 1}`;
    const [emailPart = "", ...rest] = line.split(/[,\t]/);
    const email = emailPart.trim();
    if (index === 0 && /^e-?mail$/i.test(email)) return; // a header row pasted from a spreadsheet
    if (!EMAIL.test(email)) {
      errors.push(`${where}: "${email}" is not an email address.`);
      return;
    }
    if (seen.has(email.toLowerCase())) {
      errors.push(`${where}: ${email} is listed more than once.`);
      return;
    }
    const wanted = rest.join(",").split(/[;|]/).map((s) => s.trim()).filter(Boolean);
    if (wanted.length === 0) {
      errors.push(`${where}: ${email} has no role. Add one after a comma.`);
      return;
    }
    const keys: string[] = [];
    for (const word of wanted) {
      const role = matchRole(word, roles);
      if (!role) {
        errors.push(`${where}: "${word}" is not a role in this template.`);
        continue;
      }
      if (!keys.includes(role.key)) keys.push(role.key);
    }
    if (keys.length === 0) return;
    seen.add(email.toLowerCase());
    people.push({ email, roleKeys: keys });
  });
  return { people, errors };
}

/** The reverse, for showing a list back to the operator. */
export function peopleText(people: readonly Person[], roles: readonly RoleOption[]): string {
  const names = new Map(roles.map((r) => [r.key, r.key]));
  return people.map((p) => `${p.email}, ${p.roleKeys.map((k) => names.get(k) ?? k).join("; ")}`).join("\n");
}

/** Links for the operator to send: `email,roles,link`. */
export function invitationCsv(
  members: readonly { email: string; roleKeys: readonly string[]; token: string }[],
  origin: string,
): string {
  const quote = (cell: string) => (/[",\n]/.test(cell) ? `"${cell.replaceAll('"', '""')}"` : cell);
  return (
    ["email,roles,invitation_link", ...members.map((m) => [m.email, m.roleKeys.join("; "), `${origin}/invite#${m.token}`].map(quote).join(","))].join("\r\n") +
    "\r\n"
  );
}

export { accessCsv, accessMessage, type PersonAccess } from "../saas/access";
