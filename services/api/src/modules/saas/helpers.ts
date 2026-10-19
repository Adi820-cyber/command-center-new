import { createHash } from "node:crypto";
import type { FastifyRequest } from "fastify";
import { z } from "zod";
import type { Capability } from "@orbit/contracts";
import type { Database, Tx } from "../../db/client.ts";
import { verifyAccessToken, type AuthOptions } from "../../plugins/auth.ts";
import { ApiError } from "../../plugins/errors.ts";
import type { ModelProvider } from "../ask/narrator.ts";
import type { AuthAdmin } from "./auth-admin.ts";

export interface SaasOptions {
  auth: AuthOptions;
  database?: Database;
  controlDatabase?: Database;
  /** Creates logins for the people an operator adds. Present only on the control API. */
  authAdmin?: AuthAdmin;
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
  role: "kpi_app" | "kpi_control_app" = "kpi_app",
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
    if (code === "42501")
      throw new ApiError(
        "forbidden",
        "This operation is not permitted. Check approval and membership rules.",
      );
    const message = e instanceof Error ? e.message : "";
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
export function makeRunners(options: SaasOptions) {
  const subject = (req: FastifyRequest) =>
    verifyAccessToken(req.headers.authorization, options.auth);

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
      if (membership?.allowed !== true)
        throw new ApiError(
          "forbidden",
          "You do not belong to this organization.",
        );
      if (lock)
        await tx.query("select pg_advisory_xact_lock(hashtextextended($1,0))", [
          tenantId,
        ]);
      return fn(tx, tenantId, sub);
    });
  }

  return { subject, tenant };
}
