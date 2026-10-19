import { createHash } from "node:crypto";
import type { FastifyRequest } from "fastify";
import { z } from "zod";
import type { Capability } from "@orbit/contracts";
import type { Database, Tx } from "../../db/client.ts";
import { verifyAccessToken, type AuthOptions } from "../../plugins/auth.ts";
import { ApiError } from "../../plugins/errors.ts";
import type { ModelProvider } from "../ask/narrator.ts";
import type { AuthAdmin } from "./auth-admin.ts";
import type { Mailer } from "./mail.ts";

export interface SaasOptions {
  auth: AuthOptions;
  database?: Database;
  controlDatabase?: Database;
  /** The identity API's own database login. Present only on that process. */
  identityDatabase?: Database;
  /** Creates logins for the people an operator adds. Present only on the control API. */
  authAdmin?: AuthAdmin;
  /** Sends emailed codes. Present only on the identity API. */
  mailer?: Mailer;
  /** Refuse data to anyone whose temporary password is not yet replaced. */
  enforcePasswordChange?: boolean;
  /** Models that may reword an Ask answer. Empty keeps Ask fully deterministic. */
  askProviders?: readonly ModelProvider[];
}

export const hash = (text: string) => createHash("sha256").update(text).digest("hex");
export const uuid = z.uuid();
export function input<S extends z.ZodType>(schema: S, value: unknown): z.infer<S> {
  const result = schema.safeParse(value);
  if (!result.success)
    throw new ApiError(
      "invalid_request",
      result.error.issues[0]?.message ?? "Invalid request.",
    );
  return result.data;
}
export async function audit(
  tx: Tx,
  tenant: string,
  subject: string,
  event: string,
  resource: string | null = null,
) {
  await tx.query(
    "insert into kpi.audit(tenant_id,subject,event,resource_id) values($1,$2,$3,$4)",
    [tenant, subject, event, resource],
  );
}
export async function permit(
  tx: Tx,
  tenant: string,
  capability: Capability,
  unit: string | null = null,
  kpi: string | null = null,
) {
  const [row] = await tx.query("select kpi.allowed($1,$2,$3,$4) as allowed", [
    tenant,
    capability,
    unit,
    kpi,
  ]);
  if (row?.allowed !== true)
    throw new ApiError(
      "forbidden",
      "Your account does not have permission for this operation.",
    );
}
/**
 * Activates a draft KPI: the active version with the same key retires, the draft
 * becomes active. Owner only. Used by "Approve & activate" and "Add & activate".
 */
export async function activateDraft(tx: Tx, tenant: string, id: string, subject: string) {
  await owner(tx, tenant);
  const [draft] = await tx.query("select key from kpi.definitions where tenant_id=$1 and id=$2 and state='draft'", [tenant, id]);
  if (!draft) throw new ApiError("conflict", "Only a draft KPI can be activated.");
  await tx.query("update kpi.definitions set state='retired' where tenant_id=$1 and key=$2 and state='active'", [tenant, String(draft.key)]);
  await tx.query("update kpi.definitions set state='active',approved_by=$3 where tenant_id=$1 and id=$2", [tenant, id, subject]);
  await audit(tx, tenant, subject, "kpi.activated", id);
}

export async function owner(tx: Tx, tenant: string) {
  const [row] = await tx.query("select kpi.is_owner($1) as allowed", [tenant]);
  if (row?.allowed !== true)
    throw new ApiError(
      "forbidden",
      "An organization owner must approve this change.",
    );
}
export async function inSubject<T>(
  db: Database | undefined,
  subject: string,
  fn: (tx: Tx) => Promise<T>,
  role: "kpi_app" | "kpi_control_app" | "kpi_identity_app" = "kpi_app",
): Promise<T> {
  if (!db)
    throw new ApiError("unavailable", "The KPI database is not configured.");
  try {
    return await db.transaction(async (tx) => {
      // Switch from the connection login to one deliberately narrow SQL role
      // inside the transaction. The role names are a closed union, never input.
      await tx.query(`set local role ${role}`);
      await tx.query("select set_config('kpi.subject',$1,true)", [subject]);
      await tx.query("select set_config('statement_timeout','10000',true)");
      return fn(tx);
    });
  } catch (e) {
    if (e instanceof ApiError) throw e;
    const code =
      typeof e === "object" && e !== null && "code" in e ? e.code : undefined;
    const message = e instanceof Error ? e.message : "";
    // Refusals whose wording is our own and safe to show as it is.
    if (code === "42501" && /Invitation forbidden/.test(message))
      throw new ApiError("forbidden", "You are signed in with a platform operator account, which cannot join an organization. Sign out, then sign in as the invited person.");
    if (code === "42501" && /Invitation unavailable/.test(message))
      throw new ApiError("forbidden", "This invitation is not for the account you are signed in with, or it was already used or has expired.");
    if (code === "22023" && /(belongs to a platform operator account|operator account cannot join)/.test(message))
      throw new ApiError("invalid_request", "That email belongs to a platform operator account. Use a separate email for the organization's owner and members.");
    if (code === "42501")
      throw new ApiError(
        "forbidden",
        "This operation is not permitted. Check approval and membership rules.",
      );
    const constraint =
      typeof e === "object" && e !== null && "constraint_name" in e ? String(e.constraint_name) : "";
    if (code === "23505" && constraint === "roles_tenant_id_name_key")
      throw new ApiError("conflict", "A role with that name already exists.");
    if (code === "23505" && /already in the organization or already invited/.test(message))
      throw new ApiError("conflict", "That person is already in the organization or already invited.");
    if (code === "23505")
      throw new ApiError(
        "conflict",
        "This item already exists, has been decided, or its period is locked.",
      );
    if (code === "55000")
      throw new ApiError("conflict", message || "That is not possible in the organization's current state.");
    if (code === "23503" && /Role is in use/.test(message))
      throw new ApiError("conflict", "That role is still held by someone, or offered in a pending invitation. Move them to another role first.");
    if (code === "22023")
      throw new ApiError(
        "invalid_request",
        "The request is not valid for this organization.",
      );
    if (code === "23503" || code === "23514")
      throw new ApiError(
        "invalid_request",
        "A referenced item is invalid for this organization.",
      );
    // Log the kind of failure only. Messages and detail fields can contain customer values.
    console.error("saas operation failed", {
      error: e instanceof Error ? e.name : typeof e,
      code: typeof code === "string" ? code : undefined,
    });
    // Never forward SQL errors: detail fields can contain customer values.
    throw new ApiError(
      "unavailable",
      "The operation could not complete. No partial changes were saved.",
    );
  }
}


/** The two wrappers every route uses: who is calling, and a transaction as them inside one organisation. */
const INACTIVE_MESSAGE: Record<string, string> = {
  pending: "This organization has not been activated yet. Your service provider will activate it.",
  suspended: "This organization is suspended. Contact your service provider.",
  deleted: "This organization has been removed.",
};

export function makeRunners(options: SaasOptions) {
  const subject = (req: FastifyRequest) =>
    verifyAccessToken(req.headers.authorization, options.auth, { refusePendingPasswordChange: options.enforcePasswordChange === true });

  /**
   * Runs `fn` in one transaction as the caller, inside the organisation named
   * in the URL. Writes are serialised per organisation so approvals and
   * configuration changes never interleave. A POST that only reads (Ask) passes
   * `lock: false`.
   */
  async function tenant<T>(
    req: FastifyRequest,
    fn: (tx: Tx, tenantId: string, sub: string) => Promise<T>,
    lock: boolean = req.method !== "GET",
  ) {
    const sub = await subject(req);
    const { tenantId } = input(z.object({ tenantId: uuid }), req.params);
    return inSubject(options.database, sub, async (tx) => {
      const [membership] = await tx.query(
        "select kpi.is_member($1) as allowed",
        [tenantId],
      );
      if (membership?.allowed !== true) {
        // Someone who belongs to an organization that is not active gets the reason.
        const [mine] = await tx.query("select status from kpi.my_organizations() where id=$1", [tenantId]);
        const status = typeof mine?.status === "string" ? mine.status : "";
        throw new ApiError("forbidden", INACTIVE_MESSAGE[status] ?? "You do not belong to this organization.");
      }
      if (lock)
        await tx.query("select pg_advisory_xact_lock(hashtextextended($1,0))", [
          tenantId,
        ]);
      return fn(tx, tenantId, sub);
    });
  }

  /** Runs `fn` as a platform operator, through the control database login. */
  const control = async <T>(req: FastifyRequest, fn: (tx: Tx) => Promise<T>) =>
    inSubject(
      options.controlDatabase,
      await subject(req),
      async (tx) => {
        const [row] = await tx.query("select kpi_control.is_operator() as allowed");
        if (row?.allowed !== true) throw new ApiError("forbidden", "A platform operator account is required.");
        return fn(tx);
      },
      "kpi_control_app",
    );

  /**
   * Proves the caller is a signed-in platform operator, and does nothing else.
   * Anything that uses Supabase's secret key calls this first: otherwise anyone
   * could make this API act and only be turned away afterwards.
   */
  const requireOperator = (req: FastifyRequest) => control(req, async () => undefined);

  return { subject, tenant, control, requireOperator };
}
