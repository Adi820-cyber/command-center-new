import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { AddLoginsRequestSchema, InviteMembersResponseSchema } from "@orbit/contracts";
import { ApiError } from "../../plugins/errors.ts";
import { input, inSubject, makeRunners, uuid, type SaasOptions } from "./helpers.ts";
import { prepareLogins } from "./logins.ts";
import { temporaryPassword } from "./auth-admin.ts";

/**
 * The identity API: an organization's owner creates logins for the people they add.
 *
 * It exists as its own process because creating a login needs Supabase's secret
 * key, which must never sit in the customer API. This process holds the key and a
 * database login that can do two things only: ask whether someone owns an
 * organization, and add people to it. It cannot read the organization's data.
 */
export async function registerIdentityRoutes(app: FastifyInstance, options: SaasOptions): Promise<void> {
  const { subject } = makeRunners(options);

  app.post("/api/identity/organizations/:tenantId/people", async (req) => {
    const { tenantId } = input(z.object({ tenantId: uuid }), req.params);
    const body = input(AddLoginsRequestSchema, req.body);
    if (!options.authAdmin) throw new ApiError("unavailable", "Creating logins is not set up on this deployment.");
    const sub = await subject(req);
    const as = "kpi_identity_app" as const;

    // 1. Prove the caller owns this organization BEFORE anything is created. Creating
    //    a login uses the secret key, so nobody else may cause it to be used.
    await inSubject(
      options.identityDatabase,
      sub,
      async (tx) => {
        const [row] = await tx.query("select kpi.is_owner($1::uuid) as allowed", [tenantId]);
        if (row?.allowed !== true) throw new ApiError("forbidden", "Only the organization's owner can add people.");
      },
      as,
    );

    // 2. Create the logins, then the memberships in one step. If that step fails the
    //    logins just created are removed, so nothing is left behind.
    const prepared = await prepareLogins(
      body.members.map((m) => ({ email: m.email, roleKeys: [], roleIds: m.roleIds })),
      options.authAdmin,
    );
    try {
      await inSubject(
        options.identityDatabase,
        sub,
        async (tx) => {
          await tx.query("select kpi.add_people_as_owner($1::uuid,$2::text::jsonb)", [tenantId, prepared.json]);
        },
        as,
      );
      return InviteMembersResponseSchema.parse({ mode: "logins", members: prepared.people });
    } catch (error) {
      await prepared.undo();
      throw error;
    }
  });

  // A new temporary password for someone who forgot theirs. Only for a person who
  // belongs to this organization alone; the database checks that, and the owner,
  // before the key is used.
  app.post("/api/identity/organizations/:tenantId/members/:memberId/reset-password", async (req) => {
    const { tenantId, memberId } = input(z.object({ tenantId: uuid, memberId: uuid }), req.params);
    if (!options.authAdmin) throw new ApiError("unavailable", "Resetting passwords is not set up on this deployment.");
    const sub = await subject(req);
    const login = await inSubject(
      options.identityDatabase,
      sub,
      async (tx) => {
        const [row] = await tx.query("select kpi.prepare_password_reset($1::uuid,$2::uuid) as subject", [tenantId, memberId]);
        return uuid.parse(row?.subject);
      },
      "kpi_identity_app",
    );
    const password = temporaryPassword();
    await options.authAdmin.resetPassword(login, password);
    return { temporaryPassword: password };
  });
}
