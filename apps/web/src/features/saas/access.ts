/** One person's access, as handed to whoever created it: a temporary password, or an invitation link. */
export interface PersonAccess {
  email: string;
  roleKeys: readonly string[];
  temporaryPassword?: string;
  token?: string;
}

/** The text an operator can paste into a message to one person. */
export function accessMessage(person: PersonAccess, origin: string): string {
  if (person.temporaryPassword)
    return [
      "Your Command Center login",
      `Sign in at: ${origin}/login`,
      `Email: ${person.email}`,
      `Temporary password: ${person.temporaryPassword}`,
      "You will be asked to choose your own password the first time you sign in.",
    ].join("\n");
  return [
    "Your Command Center invitation",
    `Open this link while signed in as ${person.email}: ${origin}/invite#${person.token ?? ""}`,
    "It works once and expires in seven days.",
  ].join("\n");
}

/** Everything in one spreadsheet: who, roles, and how they get in. */
export function accessCsv(people: readonly PersonAccess[], origin: string): string {
  const quote = (cell: string) => (/[",\n]/.test(cell) ? `"${cell.replaceAll('"', '""')}"` : cell);
  const rows = people.map((p) =>
    [p.email, p.roleKeys.join("; "), `${origin}/login`, p.temporaryPassword ?? "", p.token ? `${origin}/invite#${p.token}` : ""].map(quote).join(","),
  );
  return ["email,roles,sign_in_address,temporary_password,invitation_link", ...rows].join("\r\n") + "\r\n";
}
