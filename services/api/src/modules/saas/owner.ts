import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { RenameOrganizationRequestSchema, SaveRoleRequestSchema, expandRoleGrants } from "@orbit/contracts";
import { ApiError } from "../../plugins/errors.ts";
import { audit, input, makeRunners, owner, uuid, type SaasOptions } from "./helpers.ts";

/**
 * What an organization's owner does to run their own organization: rename it,
 * change roles and the KPIs each role sees, and give a revoked person their
 * access back. Every route checks ownership in the database as well, so a
 * member who is not the owner is refused even if this layer were bypassed.
 */
export async function registerOwnerRoutes(app: FastifyInstance, options: SaasOptions): Promise<void> {
  const { tenant } = makeRunners(options);

  app.post("/api/saas/:tenantId/organization", async (req) =>
    tenant(req, async (tx, t) => {
      const { name } = input(RenameOrganizationRequestSchema, req.body);
      await tx.query("select kpi.rename_organization($1::uuid,$2)", [t, name]);
      return { ok: true };
    }),
  );

  // Creates a role, or replaces the name, abilities and KPIs of an existing one.
  app.post("/api/saas/:tenantId/roles/save", async (req) =>
    tenant(req, async (tx, t) => {
      await owner(tx, t);
      const body = input(SaveRoleRequestSchema, req.body);
      if (body.capabilities.length === 0)
        throw new ApiError("invalid_request", "Choose at least one thing this role can do.");
      if (body.kpiIds.length > 0 && !body.capabilities.some((c) => c === "view" || c === "act"))
        throw new ApiError("invalid_request", "KPIs only apply to roles that can view or act on results.");
      // Only active KPIs of this organization can be chosen.
      if (body.kpiIds.length > 0) {
        const rows = await tx.query("select id from kpi.definitions where tenant_id=$1 and state='active' and id = any($2::uuid[])", [
          t,
          `{${[...new Set(body.kpiIds)].join(",")}}`,
        ]);
        if (rows.length !== new Set(body.kpiIds).size)
          throw new ApiError("invalid_request", "One of the chosen KPIs is not active in this organization.");
      }
      if (body.scopeUnitId) {
        const unit = await tx.query("select 1 from kpi.units where tenant_id=$1 and id=$2", [t, body.scopeUnitId]);
        if (!unit.length) throw new ApiError("invalid_request", "That unit is not in this organization.");
      }
      const [row] = await tx.query("select kpi.save_role($1::uuid,$2::uuid,$3,$4::text::jsonb) as id", [
        t,
        body.roleId ?? null,
        body.name,
        JSON.stringify(expandRoleGrants(body)),
      ]);
      return { id: uuid.parse(row?.id) };
    }),
  );

  app.post("/api/saas/:tenantId/roles/:id/delete", async (req) =>
    tenant(req, async (tx, t) => {
      const { id } = input(z.object({ id: uuid }), req.params);
      await owner(tx, t);
      await tx.query("select kpi.delete_role($1::uuid,$2::uuid)", [t, id]);
      return { ok: true };
    }),
  );

  // Gives back access to someone whose access was revoked. Roles they held are kept.
  app.post("/api/saas/:tenantId/members/:id/restore", async (req) =>
    tenant(req, async (tx, t, sub) => {
      await owner(tx, t);
      const { id } = input(z.object({ id: uuid }), req.params);
      const rows = await tx.query("update kpi.memberships set active=true where tenant_id=$1 and id=$2 and not owner returning id", [t, id]);
      if (!rows.length) throw new ApiError("not_found", "That member cannot be restored here.");
      await audit(tx, t, sub, "member.restored", id);
      return { ok: true };
    }),
  );
}
