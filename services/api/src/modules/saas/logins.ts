import { randomBytes } from "node:crypto";
import { ApiError } from "../../plugins/errors.ts";
import { temporaryPassword, type AuthAdmin } from "./auth-admin.ts";
import { hash } from "./helpers.ts";

export interface Person {
  email: string;
  /** Template role keys (the operator's way). */
  roleKeys: string[];
  /** Role ids (the owner's way). */
  roleIds?: string[];
  owner?: boolean;
}

/** What goes back to the operator for one person, once. */
export interface ProvisionedPerson {
  email: string;
  roleKeys: string[];
  temporaryPassword?: string;
  token?: string;
}

export interface PreparedLogins {
  /** The JSON handed to the database functions. */
  json: string;
  /** In the same order as the people given. */
  people: ProvisionedPerson[];
  /** Removes the logins created here. Call it if the database step fails. */
  undo(): Promise<void>;
}

/** Throws if an email appears twice (ignoring case), naming it. */
/** The roles for one person, in the form the database expects: ids or template keys, never both. */
const rolesOf = (person: Person) => (person.roleIds ? { roleIds: person.roleIds } : { roleKeys: person.roleKeys });

export function assertDistinct(people: readonly Pick<Person, "email">[]): void {
  const seen = new Set<string>();
  for (const { email } of people) {
    const key = email.trim().toLowerCase();
    if (seen.has(key)) throw new ApiError("invalid_request", `${email} is listed more than once.`);
    seen.add(key);
  }
}

/**
 * Creates a login for each person, then describes them for the database.
 *
 * Someone who already has an account cannot be given a new password silently,
 * so they get a one-time invitation link instead; the operator is told which.
 * If any login cannot be created, the ones already made are removed and the
 * whole step fails with nothing left behind.
 */
export async function prepareLogins(people: readonly Person[], admin: AuthAdmin): Promise<PreparedLogins> {
  assertDistinct(people);
  const created: string[] = [];
  const undo = async () => {
    await Promise.all(created.splice(0).map((id) => admin.deleteUser(id)));
  };
  const entries: Record<string, unknown>[] = [];
  const shown: ProvisionedPerson[] = [];
  try {
    for (const person of people) {
      const email = person.email.trim();
      const password = temporaryPassword();
      const result = await admin.createUser(email, password);
      if (result.status === "created") {
        created.push(result.id);
        entries.push({ email, owner: person.owner === true, ...rolesOf(person), subject: result.id });
        shown.push({ email, roleKeys: person.roleIds ?? person.roleKeys, temporaryPassword: password });
      } else {
        const token = randomBytes(32).toString("hex");
        entries.push({ email, owner: person.owner === true, ...rolesOf(person), tokenHash: hash(token) });
        shown.push({ email, roleKeys: person.roleIds ?? person.roleKeys, token });
      }
    }
  } catch (error) {
    await undo();
    throw new ApiError(
      "unavailable",
      error instanceof Error ? error.message : "The logins could not be created. Nothing was saved.",
    );
  }
  return { json: JSON.stringify(entries), people: shown, undo };
}
