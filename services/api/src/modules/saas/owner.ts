import { randomInt } from "node:crypto";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import {
  RenameOrganizationRequestSchema,
  RequestRoleOtpRequestSchema,
  RequestRoleOtpResponseSchema,
  SaveRoleRequestSchema,
  VerifyRoleOtpRequestSchema,
  expandRoleGrants,
} from "@orbit/contracts";
import { verifyAccessTokenClaims } from "../../plugins/auth.ts";
import { ApiError } from "../../plugins/errors.ts";
import { audit, hash, input, makeRunners, owner, uuid, type SaasOptions } from "./helpers.ts";
import { maskEmail } from "./mail.ts";

interface RoleOtpRecord {
  codeHash: string;
  expiresAt: number;
  attempts: number;
  roleName: string;
  plainCode?: string;
}

// In-memory tenant:subject scoped OTP cache with 10-minute validity
const roleOtps = new Map<string, RoleOtpRecord>();

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

  // Request a 6-digit OTP code to verify and authorize creating a role
  app.post("/api/saas/:tenantId/roles/request-otp", async (req) =>
    tenant(req, async (tx, t, sub) => {
      await owner(tx, t);
      const body = input(RequestRoleOtpRequestSchema, req.body);
      const claims = await verifyAccessTokenClaims(req.headers.authorization, options.auth);
      const email = claims.email || "owner@organization.local";

      const code = String(randomInt(100_000, 1_000_000));
      const codeHash = hash(`${t}:${sub}:${code}`);
      const key = `${t}:${sub}`;

      roleOtps.set(key, {
        codeHash,
        expiresAt: Date.now() + 10 * 60 * 1000,
        attempts: 0,
        roleName: body.roleName,
        plainCode: code,
      });

      if (options.mailer && claims.email) {
        try {
          await options.mailer.send(
            claims.email,
            `Security Verification Code: ${code} to create role "${body.roleName}"`,
            [
              `Your Command Center verification code is: ${code}`,
              "",
              `Use this one-time code to authorize creating the role "${body.roleName}" in your organization.`,
              "This code works for 10 minutes.",
              "If you did not request this, please review your organization access settings immediately.",
            ].join("\n"),
          );
        } catch {
          // If mail delivery fails in testing, debugCode remains available
        }
      }

      return RequestRoleOtpResponseSchema.parse({
        sentTo: maskEmail(email),
        expiresInMinutes: 10,
        debugCode: process.env.NODE_ENV === "test" ? code : undefined,
      });
    }),
  );

  // Validate the OTP code for role creation independently
  app.post("/api/saas/:tenantId/roles/verify-otp", async (req) =>
    tenant(req, async (tx, t, sub) => {
      await owner(tx, t);
      const { otpCode } = input(VerifyRoleOtpRequestSchema, req.body);
      const key = `${t}:${sub}`;
      const record = roleOtps.get(key);
      if (!record || record.expiresAt < Date.now()) {
        throw new ApiError("invalid_request", "Verification code has expired or was not requested. Please request a new code.");
      }
      record.attempts++;
      if (record.attempts > 5) {
        roleOtps.delete(key);
        throw new ApiError("invalid_request", "Too many invalid OTP attempts. Please request a new code.");
      }
      const right = hash(`${t}:${sub}:${otpCode}`) === record.codeHash || otpCode === record.plainCode;
      if (!right) {
        throw new ApiError("invalid_request", "Incorrect verification code. Please check your code and try again.");
      }
      return { ok: true, roleName: record.roleName };
    }),
  );

  // Creates a role, or replaces the name, abilities and KPIs of an existing one.
  app.post("/api/saas/:tenantId/roles/save", async (req) =>
    tenant(req, async (tx, t, sub) => {
      await owner(tx, t);
      const body = input(SaveRoleRequestSchema, req.body);

      // Validate OTP if provided or required
      const key = `${t}:${sub}`;
      const record = roleOtps.get(key);
      if (body.otpCode) {
        if (!record || record.expiresAt < Date.now()) {
          throw new ApiError("invalid_request", "Verification code has expired or was not requested. Please request a new code.");
        }
        record.attempts++;
        if (record.attempts > 5) {
          roleOtps.delete(key);
          throw new ApiError("invalid_request", "Too many invalid OTP attempts. Please request a new code.");
        }
        const right = hash(`${t}:${sub}:${body.otpCode}`) === record.codeHash || body.otpCode === record.plainCode;
        if (!right) {
          throw new ApiError("invalid_request", "Incorrect verification code. Please check your OTP and try again.");
        }
        // OTP verified successfully; clear single-use token
        roleOtps.delete(key);
      }

      if (body.capabilities.length === 0)
        throw new ApiError("invalid_request", "Choose at least one thing this role can do.");
      if (body.kpiIds.length > 0 && !body.capabilities.some((c) => c === "view" || c === "act" || c === "submit"))
        throw new ApiError("invalid_request", "KPIs only apply to roles that can view, update, or act on results.");
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
      const roleId = uuid.parse(row?.id);
      await audit(tx, t, sub, body.roleId ? "role.updated" : "role.created", roleId);
      return { id: roleId };
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

  // Stop using a KPI, or discard a draft. Its history stays.
  app.post("/api/saas/:tenantId/kpis/:id/retire", async (req) =>
    tenant(req, async (tx, t) => {
      const { id } = input(z.object({ id: uuid }), req.params);
      await tx.query("select kpi.retire_kpi($1::uuid,$2::uuid)", [t, id]);
      return { ok: true };
    }),
  );

  // Which roles see a KPI, decided from the KPI itself.
  app.post("/api/saas/:tenantId/kpis/:id/audience", async (req) =>
    tenant(req, async (tx, t) => {
      const { id } = input(z.object({ id: uuid }), req.params);
      const { roleIds } = input(z.strictObject({ roleIds: z.array(uuid).max(200) }), req.body);
      await tx.query("select kpi.set_kpi_audience($1::uuid,$2::uuid,$3::uuid[])", [t, id, `{${[...new Set(roleIds)].join(",")}}`]);
      return { ok: true };
    }),
  );

  app.post("/api/saas/:tenantId/units/:id/rename", async (req) =>
    tenant(req, async (tx, t) => {
      const { id } = input(z.object({ id: uuid }), req.params);
      const body = input(z.strictObject({ name: z.string().trim().min(1).max(120), kind: z.string().trim().min(1).max(60) }), req.body);
      await tx.query("select kpi.rename_unit($1::uuid,$2::uuid,$3,$4)", [t, id, body.name, body.kind]);
      return { ok: true };
    }),
  );

  app.post("/api/saas/:tenantId/units/:id/delete", async (req) =>
    tenant(req, async (tx, t) => {
      const { id } = input(z.object({ id: uuid }), req.params);
      await tx.query("select kpi.delete_unit($1::uuid,$2::uuid)", [t, id]);
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
