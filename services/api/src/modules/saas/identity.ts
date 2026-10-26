import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { randomInt } from "node:crypto";
import {
  AddLoginsRequestSchema,
  ChangeOwnPasswordRequestSchema,
  InviteMembersResponseSchema,
  PasswordCodeResponseSchema,
  ResetPasswordRequestSchema,
  SendInviteMailRequestSchema,
  SendInviteMailResponseSchema,
} from "@orbit/contracts";
import { verifyAccessTokenClaims } from "../../plugins/auth.ts";
import { ApiError } from "../../plugins/errors.ts";
import { hash, input, inSubject, makeRunners, uuid, type SaasOptions } from "./helpers.ts";
import { maskEmail } from "./mail.ts";
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
      body.members.map((m) => ({ displayName: m.displayName, email: m.email, roleKeys: [], roleIds: m.roleIds, password: m.password })),
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
    const body = req.body ? input(ResetPasswordRequestSchema.optional(), req.body) : undefined;
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
    const password = body?.password?.trim() || temporaryPassword();
    await options.authAdmin.resetPassword(login, password, false);
    return { temporaryPassword: password };
  });

  // --- Changing your own password, with a code sent to your email -------------
  //
  // Anyone signed in may use these for their own account, including someone who
  // still has a temporary password: this is how they replace it. The code is
  // stored only as a hash, tied to the person.
  const codeHash = (subject: string, code: string) => hash(`${subject}:${code}`);

  app.post("/api/identity/me/password-code", async (req) => {
    const me = await verifyAccessTokenClaims(req.headers.authorization, options.auth);
    if (!me.email) throw new ApiError("invalid_request", "Your account has no email address.");
    if (!options.mailer) {
      return PasswordCodeResponseSchema.parse({ sentTo: maskEmail(me.email), expiresInMinutes: 10 });
    }
    const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
    await inSubject(
      options.identityDatabase,
      me.sub,
      async (tx) => {
        await tx.query("select kpi.issue_email_code($1)", [codeHash(me.sub, code)]);
      },
      "kpi_identity_app",
    );
    try {
      await options.mailer.send(
        me.email,
        `Your Command Center code: ${code}`,
        [
          `Your code is ${code}.`,
          "",
          "Use it to change your Command Center password. It works for 10 minutes.",
          "If you did not ask for it, ignore this email: your password stays as it is.",
        ].join("\n"),
      );
    } catch {
      throw new ApiError("unavailable", "The email could not be sent. Try again in a minute.");
    }
    return PasswordCodeResponseSchema.parse({ sentTo: maskEmail(me.email), expiresInMinutes: 10 });
  });

  app.post("/api/identity/me/password", async (req) => {
    if (!options.authAdmin) throw new ApiError("unavailable", "Changing passwords is not set up on this deployment.");
    const me = await verifyAccessTokenClaims(req.headers.authorization, options.auth);
    const body = input(ChangeOwnPasswordRequestSchema, req.body);
    if (me.email && body.password.trim().toLowerCase() === me.email.toLowerCase())
      throw new ApiError("invalid_request", "Your password cannot be your email address.");
    const code = body.code?.trim();
    if (options.mailer && code) {
      // The result is committed before anything is refused, so a wrong code always counts as an attempt.
      const right = await inSubject(
        options.identityDatabase,
        me.sub,
        async (tx) => {
          const [row] = await tx.query("select kpi.use_email_code($1) as ok", [codeHash(me.sub, code)]);
          return row?.ok === true;
        },
        "kpi_identity_app",
      );
      if (!right) throw new ApiError("invalid_request", "That code is not right. Check the latest email and try again.");
    }
    await options.authAdmin.setOwnPassword(me.sub, body.password);
    await inSubject(
      options.identityDatabase,
      me.sub,
      async (tx) => {
        await tx.query("select kpi.mark_owner_credentials_verified()");
      },
      "kpi_identity_app",
    );
    return { ok: true };
  });

  app.post("/api/identity/organizations/:tenantId/invitations/send-mail", async (req) => {
    const { tenantId } = input(z.object({ tenantId: uuid }), req.params);
    const body = input(SendInviteMailRequestSchema, req.body);
    const sub = await subject(req);

    await inSubject(
      options.identityDatabase,
      sub,
      async (tx) => {
        const [row] = await tx.query("select kpi.is_owner($1::uuid) as allowed", [tenantId]);
        if (row?.allowed !== true) throw new ApiError("forbidden", "Only the organization's owner can invite members.");
      },
      "kpi_identity_app",
    );

    const host = req.headers.origin || "https://cmd-web-dun.vercel.app";
    const inviteUrl = `${host}/invite?email=${encodeURIComponent(body.email)}#${body.token}`;

    if (options.mailer) {
      const rolesDesc = body.roleNames.length ? ` for role(s): ${body.roleNames.join(", ")}` : "";
      try {
        await options.mailer.send(
          body.email,
          "Invitation to join Command Center & Set Your Password",
          [
            "Hello,",
            "",
            `You have been invited to join Command Center${rolesDesc}.`,
            "",
            "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
            "YOUR LOGIN CREDENTIALS",
            "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
            `Login ID / Username: ${body.email}`,
            "",
            "Your email address is your permanent Login ID. To set your account password and access your workspace, please click the secure link below:",
            inviteUrl,
            "",
            "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
            "HOW TO ACCESS YOUR ACCOUNT:",
            `1. Open the secure link: ${inviteUrl}`,
            `2. Your Login ID (${body.email}) will be verified.`,
            "3. Choose and confirm your new password.",
            "4. You will immediately access your role-authorized workspace.",
            "",
            "This invitation link is private and single-use.",
            "",
            "Command Center Platform",
          ].join("\n"),
        );
      } catch (err) {
        console.error("Failed to deliver invite email via identity options.mailer", err);
      }
    }

    return SendInviteMailResponseSchema.parse({ sent: true, sentTo: maskEmail(body.email) });
  });
}

