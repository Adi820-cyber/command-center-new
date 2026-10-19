import { randomBytes } from "node:crypto";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import {
  CatalogResponseSchema,
  InviteMembersRequestSchema,
  InviteMembersResponseSchema,
  ProvisionRequestSchema,
  ProvisionResponseSchema,
  SetTargetRequestSchema,
  TemplateListSchema,
  WorkspaceAskRequestSchema,
  WorkspaceAskResponseSchema,
} from "@orbit/contracts";
import { narrate } from "../ask/narrator.ts";
import { ApiError } from "../../plugins/errors.ts";
import { answerQuestion } from "./ask.ts";
import { activateDraft, hash, input, inSubject, makeRunners, uuid, type SaasOptions } from "./helpers.ts";
import { assertDistinct, prepareLogins } from "./logins.ts";
import { loadWorkspace } from "./workspace.ts";

const CATALOG_ID = z.string().regex(/^[A-Z]{2,4}-\d{3}$/);
const newToken = () => randomBytes(32).toString("hex");

interface Invitee {
  email: string;
  roleKeys: string[];
}
/** One fresh token per invitee. Only the hash is stored; the token goes back to the operator once. */
function withTokens(members: readonly Invitee[]) {
  assertDistinct(members);
  return members.map((member) => ({ ...member, token: newToken() }));
}
const invitationJson = (members: ReturnType<typeof withTokens>) =>
  JSON.stringify(members.map((m) => ({ email: m.email, roleKeys: m.roleKeys, tokenHash: hash(m.token) })));

/** Topics where the model adds nothing: there are no figures to reword. */
const PLAIN_TOPICS = new Set(["unknown", "no_access", "no_data"]);

/**
 * Catalog, templates, operator provisioning and Ask.
 *
 * Provisioning runs through the control database login. The database
 * functions return only ids, so the operator creates an organisation, its
 * owner and its members without ever being able to read their data.
 */
export async function registerV2Routes(app: FastifyInstance, options: SaasOptions): Promise<void> {
  const { subject, tenant, control, requireOperator } = makeRunners(options);
  // The KPI catalog is reference data, the same for everyone who is signed in.
  app.get("/api/saas/catalog", async (req) =>
    inSubject(options.database, await subject(req), async (tx) => {
      const kpis = await tx.query(
        'select id,name,description,domain,industries,formula_text as "formulaText",unit,direction,measures,needs_history as "needsHistory",sources from kpi_catalog.kpis order by domain,id',
      );
      const measures = await tx.query(
        'select key,name,unit,description,rolls_up as "rollsUp",domain from kpi_catalog.measures order by key',
      );
      return CatalogResponseSchema.parse({ kpis, measures });
    }),
  );

  // Copies a catalog KPI into the organisation as a draft the owner can activate.
  app.post("/api/saas/:tenantId/catalog/:catalogId/add", async (req) =>
    tenant(req, async (tx, t, sub) => {
      const { catalogId } = input(z.object({ catalogId: CATALOG_ID }), req.params);
      const { activate } = input(z.strictObject({ activate: z.boolean().default(false) }), req.body ?? {});
      const [row] = await tx.query("select kpi.add_catalog_kpi($1::uuid,$2) as id", [t, catalogId]);
      const id = uuid.parse(row?.id);
      // The owner approves KPIs, so they may add and activate in one step.
      if (activate) await activateDraft(tx, t, id, sub);
      return { id };
    }),
  );

  // Owner sets or clears a KPI target. The formula stays frozen; stored results follow.
  app.post("/api/saas/:tenantId/kpis/:id/target", async (req) =>
    tenant(req, async (tx, t) => {
      const { id } = input(z.object({ id: uuid }), req.params);
      const { target } = input(SetTargetRequestSchema, req.body);
      await tx.query("select kpi.set_target($1::uuid,$2::uuid,$3::numeric)", [t, id, target]);
      return { ok: true };
    }),
  );

  // Ask: answered only from what the caller's own role can read.
  app.post("/api/saas/:tenantId/ask", async (req) => {
    const { question } = input(WorkspaceAskRequestSchema, req.body);
    const facts = await tenant(
      req,
      async (tx, t, sub) => answerQuestion(question, await loadWorkspace(tx, t, sub), new Date().toISOString().slice(0, 10)),
      false,
    );
    let answer = facts.answer;
    let mode: "facts" | "ai" = "facts";
    if (options.askProviders?.length && !PLAIN_TOPICS.has(facts.topic)) {
      // The model only rewords. It may not add a number that is not already in the answer or its facts.
      const source = [facts.answer, ...facts.facts.map((f) => `${f.label} ${f.value}`)].join(" ");
      const outcome = await narrate(facts.answer, { providers: options.askProviders }, source);
      if (outcome.status === "narrated") {
        answer = outcome.answer;
        mode = "ai";
      }
    }
    return WorkspaceAskResponseSchema.parse({ ...facts, answer, mode });
  });

  // --- Operator ---------------------------------------------------------------

  app.get("/api/control/templates", async (req) =>
    control(req, async (tx) =>
      TemplateListSchema.parse(
        await tx.query(`
          select t.id, t.name, t.industry, t.description,
            (select count(distinct x.kpi_id) from kpi_catalog.template_role_kpis x where x.template_id=t.id)::int as "kpiCount",
            coalesce((select jsonb_agg(jsonb_build_object(
                'key', r.role_key, 'name', r.name, 'description', r.description, 'capabilities', r.capabilities,
                'kpiCount', (select count(*) from kpi_catalog.template_role_kpis x where x.template_id=r.template_id and x.role_key=r.role_key)
              ) order by r.position) from kpi_catalog.template_roles r where r.template_id=t.id), '[]'::jsonb) as roles
          from kpi_catalog.templates t order by t.name`),
      ),
    ),
  );

  // Creates an organisation: its owner, and optionally a template with members and roles.
  //
  // With the Supabase secret key configured (control API), every person gets a
  // login with a temporary password and is a member straight away. Without it,
  // each person gets a one-time invitation link instead.
  app.post("/api/control/organizations", async (req) => {
    const body = input(ProvisionRequestSchema, req.body);
    if (!body.templateId && body.members.length)
      throw new ApiError("invalid_request", "Choose a template to give members their roles.");
    if (body.members.some((m) => m.email.trim().toLowerCase() === body.ownerEmail.trim().toLowerCase()))
      throw new ApiError("invalid_request", "The owner is already listed; leave them out of the member list.");

    if (options.authAdmin) {
      await requireOperator(req);
      const prepared = await prepareLogins(
        [{ email: body.ownerEmail, roleKeys: [], owner: true }, ...body.members],
        options.authAdmin,
      );
      try {
        const id = await control(req, async (tx) => {
          const [row] = await tx.query("select kpi_control.provision_with_people($1,$2,$3::text::jsonb) as id", [
            body.name,
            body.templateId ?? null,
            prepared.json,
          ]);
          await tx.query("select kpi_control.record_creation($1::uuid,$2,$3,$4)", [uuid.parse(row?.id), body.activate, body.ownerEmail, body.ownerEmailVerified]);
          return row?.id;
        });
        return ProvisionResponseSchema.parse({
          id,
          mode: "logins",
          owner: prepared.people[0],
          members: prepared.people.slice(1),
        });
      } catch (error) {
        await prepared.undo();
        throw error;
      }
    }

    const members = withTokens(body.members);
    const ownerToken = newToken();
    return control(req, async (tx) => {
      const [row] = body.templateId
        ? await tx.query("select kpi_control.provision_with_template($1,$2,$3,$4,$5::text::jsonb) as id", [
            body.name,
            body.ownerEmail,
            hash(ownerToken),
            body.templateId,
            invitationJson(members),
          ])
        : await tx.query("select kpi_control.provision($1,$2,$3) as id", [body.name, body.ownerEmail, hash(ownerToken)]);
      await tx.query("select kpi_control.record_creation($1::uuid,$2,$3,$4)", [uuid.parse(row?.id), body.activate, body.ownerEmail, body.ownerEmailVerified]);
      return ProvisionResponseSchema.parse({
        id: row?.id,
        mode: "invitations",
        owner: { email: body.ownerEmail, roleKeys: [], token: ownerToken },
        members: members.map((m) => ({ email: m.email, roleKeys: m.roleKeys, token: m.token })),
      });
    });
  });

  // Adds more people, with roles, to an organisation the operator created.
  app.post("/api/control/organizations/:tenantId/members", async (req) => {
    const { tenantId } = input(z.object({ tenantId: uuid }), req.params);
    const body = input(InviteMembersRequestSchema, req.body);

    if (options.authAdmin) {
      await requireOperator(req);
      const prepared = await prepareLogins(body.members, options.authAdmin);
      try {
        await control(req, async (tx) => {
          await tx.query("select kpi_control.add_people_to($1::uuid,$2::text::jsonb)", [tenantId, prepared.json]);
        });
        return InviteMembersResponseSchema.parse({ mode: "logins", members: prepared.people });
      } catch (error) {
        await prepared.undo();
        throw error;
      }
    }

    const members = withTokens(body.members);
    return control(req, async (tx) => {
      await tx.query("select kpi_control.invite_members($1::uuid,$2::text::jsonb)", [tenantId, invitationJson(members)]);
      return InviteMembersResponseSchema.parse({
        mode: "invitations",
        members: members.map((m) => ({ email: m.email, roleKeys: m.roleKeys, token: m.token })),
      });
    });
  });
}
