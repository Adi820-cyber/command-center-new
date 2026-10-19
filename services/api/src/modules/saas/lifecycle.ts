import type { FastifyInstance } from "fastify";
import { z } from "zod";
import {
  PurgeOrganizationRequestSchema,
  PurgeOrganizationResponseSchema,
  SetOrganizationStatusRequestSchema,
} from "@orbit/contracts";
import { ApiError } from "../../plugins/errors.ts";
import { input, makeRunners, uuid, type SaasOptions } from "./helpers.ts";

/**
 * The service provider's lifecycle actions on a business organization: activate,
 * suspend, delete, restore, and delete permanently. The database enforces which
 * moves are allowed and that only an operator may make them; the typed-name
 * confirmation for the destructive ones is checked here, against the name the
 * database holds.
 */
export async function registerLifecycleRoutes(app: FastifyInstance, options: SaasOptions): Promise<void> {
  const { control } = makeRunners(options);

  const nameOf = async (tx: Parameters<Parameters<typeof control>[1]>[0], t: string) => {
    const [row] = await tx.query("select name from kpi_control.list_organizations() where id=$1", [t]);
    if (typeof row?.name !== "string") throw new ApiError("not_found", "That organization does not exist.");
    return row.name;
  };
  const confirmed = (typed: string | undefined, actual: string) => {
    if (typed === undefined || typed.trim() !== actual)
      throw new ApiError("invalid_request", "Type the organization's exact name to confirm.");
  };

  // active / suspended, delete (with a typed name), and restore (deleted -> suspended).
  app.post("/api/control/organizations/:tenantId/status", async (req) => {
    const { tenantId } = input(z.object({ tenantId: uuid }), req.params);
    const body = input(SetOrganizationStatusRequestSchema, req.body);
    return control(req, async (tx) => {
      if (body.status === "deleted") confirmed(body.confirmName, await nameOf(tx, tenantId));
      await tx.query("select kpi_control.set_org_status($1::uuid,$2)", [tenantId, body.status]);
      return { ok: true };
    });
  });

  // Erases a deleted organization once its 30 days are over, then removes the logins
  // that belonged only to it.
  app.post("/api/control/organizations/:tenantId/purge", async (req) => {
    const { tenantId } = input(z.object({ tenantId: uuid }), req.params);
    const body = input(PurgeOrganizationRequestSchema, req.body);
    const orphans = await control(req, async (tx) => {
      confirmed(body.confirmName, await nameOf(tx, tenantId));
      const [row] = await tx.query("select kpi_control.purge_organization($1::uuid) as subjects", [tenantId]);
      return Array.isArray(row?.subjects) ? row.subjects.map(String) : [];
    });
    let removed = 0;
    if (options.authAdmin) {
      for (const id of orphans) {
        try {
          await options.authAdmin.deleteUser(id);
          removed++;
        } catch {
          // counted below
        }
      }
    }
    return PurgeOrganizationResponseSchema.parse({
      ok: true,
      removedLogins: removed,
      failedLogins: orphans.length - removed,
    });
  });
}
