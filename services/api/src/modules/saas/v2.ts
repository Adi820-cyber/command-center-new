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
  StartFromTemplateRequestSchema,
  TemplateListSchema,
  WorkspaceAskRequestSchema,
  WorkspaceAskResponseSchema,
} from "@orbit/contracts";
import type { Tx } from "../../db/client.ts";
import { narrate } from "../ask/narrator.ts";
import { ApiError } from "../../plugins/errors.ts";
import { answerQuestion } from "./ask.ts";
import { activateDraft, hash, input, inSubject, makeRunners, uuid, type SaasOptions } from "./helpers.ts";
import { assertDistinct, prepareLogins } from "./logins.ts";
import { loadWorkspace } from "./workspace.ts";
import { answerOperatorQuestion, loadControlOrganizations } from "./operator-ask.ts";
import { embeddingProvider, generateEmbedding } from "../chatbot/embedder.ts";

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
/** Every industry template with its roles, as reference data. */
async function listTemplates(tx: Tx) {
  return TemplateListSchema.parse(
    await tx.query(`
      select t.id, t.name, t.industry, t.description,
        (select count(distinct x.kpi_id) from kpi_catalog.template_role_kpis x where x.template_id=t.id)::int as "kpiCount",
        coalesce((select jsonb_agg(jsonb_build_object(
            'key', r.role_key, 'name', r.name, 'description', r.description, 'capabilities', r.capabilities,
            'kpiCount', (select count(*) from kpi_catalog.template_role_kpis x where x.template_id=r.template_id and x.role_key=r.role_key)
          ) order by r.position) from kpi_catalog.template_roles r where r.template_id=t.id), '[]'::jsonb) as roles
      from kpi_catalog.templates t order by t.name`),
  );
}

export async function registerV2Routes(app: FastifyInstance, options: SaasOptions): Promise<void> {
  const { subject, tenant, control, requireOperator } = makeRunners(options);
  // The KPI catalog is reference data, the same for everyone who is signed in.
  app.get("/api/saas/catalog", async (req) =>
    inSubject(options.database, await subject(req), async (tx) => {
      const rawKpis = await tx.query(
        'select id,name,description,domain,industries,formula_text as "formulaText",unit,direction,measures,needs_history as "needsHistory",sources from kpi_catalog.kpis order by domain,id',
      );
      const kpis = rawKpis.map((k: any) => ({
        ...k,
        industries: typeof k.industries === 'string' ? JSON.parse(k.industries) : (k.industries ?? []),
        measures: typeof k.measures === 'string' ? JSON.parse(k.measures) : (k.measures ?? []),
        sources: typeof k.sources === 'string' ? JSON.parse(k.sources) : (k.sources ?? []),
        needsHistory: k.needsHistory === true || k.needsHistory === 1 || k.needsHistory === '1',
      }));
      const rawMeasures = await tx.query(
        'select key,name,unit,description,rolls_up as "rollsUp",domain from kpi_catalog.measures order by key',
      );
      const measures = rawMeasures.map((m: any) => ({
        key: String(m.key),
        name: String(m.name),
        unit: String(m.unit),
        description: String(m.description ?? ''),
        rollsUp: m.rollsUp === true || m.rollsUp === 1 || m.rollsUp === '1',
        domain: String(m.domain ?? ''),
      }));
      return CatalogResponseSchema.parse({ kpis, measures });
    }),
  );

  // Industry templates, for an owner choosing a starting point.
  app.get("/api/saas/templates", async (req) => inSubject(options.database, await subject(req), listTemplates));

  // The owner starts an empty organisation from a template: its KPIs, roles and
  // what each role sees. Only while it has no KPIs and no roles yet.
  app.post("/api/saas/:tenantId/template", async (req) =>
    tenant(req, async (tx, t) => {
      const { templateId } = input(StartFromTemplateRequestSchema, req.body);
      await tx.query("select kpi.start_from_template($1::uuid,$2)", [t, templateId]);
      return { ok: true };
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

  // Ask: answered only from what the caller's own role can read, powered by pgvector hybrid search.
  app.post("/api/saas/:tenantId/ask", async (req) => {
    const { question } = input(WorkspaceAskRequestSchema, req.body);

    const embProvider = options.askProviders ? embeddingProvider(options.askProviders) : undefined;
    let queryVec: number[] | null = null;
    if (embProvider) {
      try {
        queryVec = await generateEmbedding(question, { provider: embProvider });
      } catch {
        queryVec = null;
      }
    }
    const vecStr = queryVec && queryVec.length === 1024 ? `[${queryVec.join(",")}]` : null;

    const result = await tenant(
      req,
      async (tx, t, sub) => {
        // Ensure knowledge chunks exist
        const [cnt] = (await tx.query(
          "select count(*)::int as c from kpi.knowledge_chunks where tenant_id = $1::uuid",
          [t],
        )) as unknown as { c: number }[];
        if (!cnt || cnt.c === 0) {
          try {
            await tx.query("select kpi.refresh_tenant_knowledge($1::uuid)", [t]);
          } catch {
            // Ignore if refresh cannot run
          }
        }

        // Determine active role badge
        const [ownerRow] = (await tx.query(
          "select kpi.is_owner($1::uuid) as is_owner",
          [t],
        )) as unknown as { is_owner: boolean }[];
        let roleBadge = "Member Scoped View";
        if (ownerRow?.is_owner) {
          roleBadge = "Organization Owner (Full Access)";
        } else {
          const myRoles = (await tx.query(
            "select name from kpi.my_roles($1::uuid)",
            [t],
          )) as unknown as { name: string }[];
          if (myRoles.length > 0) {
            roleBadge = `${myRoles.map((r) => r.name).join(", ")} View`;
          }
        }

        // Query role-scoped knowledge chunks via security-invoking search function
        interface KnowledgeRow {
          id: string;
          title: string;
          content: string;
          category: string;
          domain: string;
          source: string;
          similarity: number;
          matched_by: string;
          kpi_id: string | null;
          unit_id: string | null;
        }
        let knowledgeMatches: KnowledgeRow[] = [];
        try {
          if (vecStr) {
            knowledgeMatches = (await tx.query(
              "select id, title, content, category, domain, source, similarity, matched_by, kpi_id, unit_id from kpi.search_knowledge($1::uuid, $2, $3::public.vector, 5, 0.15)",
              [t, question, vecStr],
            )) as unknown as KnowledgeRow[];
          } else {
            knowledgeMatches = (await tx.query(
              "select id, title, content, category, domain, source, similarity, matched_by, kpi_id, unit_id from kpi.search_knowledge($1::uuid, $2, null, 5, 0.15)",
              [t, question],
            )) as unknown as KnowledgeRow[];
          }
        } catch {
          // If search query fails, gracefully fallback
          knowledgeMatches = [];
        }

        // Calculate deterministic facts from workspace
        const workspace = await loadWorkspace(tx, t, sub);
        const facts = answerQuestion(question, workspace, new Date().toISOString().slice(0, 10));

        const sources = knowledgeMatches.map((m) => ({
          title: m.title,
          category: m.category,
          matchedBy: m.matched_by || (queryVec ? "vector" : "text"),
          similarity: typeof m.similarity === "number" ? Math.round(m.similarity * 100) / 100 : undefined,
        }));

        const searchEngine: "pgvector_hybrid" | "pgvector" | "fts" | "deterministic" =
          queryVec && knowledgeMatches.some((m) => m.matched_by === "hybrid" || m.matched_by === "vector")
            ? "pgvector_hybrid"
            : knowledgeMatches.length > 0
              ? "fts"
              : "deterministic";

        let answer = facts.answer;
        const augmentedFacts = [...facts.facts];

        // If unknown or no data, but vector knowledge found relevant role-authorized chunks
        if (facts.topic === "unknown" && knowledgeMatches.length > 0) {
          const top = knowledgeMatches[0]!;
          answer = `Based on your authorized ${roleBadge}: ${top.content}`;
          for (const m of knowledgeMatches.slice(0, 3)) {
            if (!augmentedFacts.some((f) => f.label === m.title)) {
              augmentedFacts.push({
                label: m.title,
                value: m.category === "kpi_definition" ? m.domain : m.content.slice(0, 80) + "…",
                tone: "neutral",
              });
            }
          }
        }

        return {
          facts: {
            ...facts,
            answer,
            facts: augmentedFacts.slice(0, 30),
            roleBadge,
            sources,
            searchEngine,
          },
          knowledgeMatches,
        };
      },
      false,
    );

    let answer = result.facts.answer;
    let mode: "facts" | "ai" = "facts";
    if (options.askProviders?.length && !PLAIN_TOPICS.has(result.facts.topic)) {
      // The model only rewords. It may not add a number that is not already in the answer or its facts.
      const knowledgeContext = result.knowledgeMatches.map((m) => `${m.title}: ${m.content}`).join(" ");
      const source = [
        result.facts.answer,
        ...result.facts.facts.map((f) => `${f.label} ${f.value}`),
        knowledgeContext,
      ].join(" ");

      const outcome = await narrate(result.facts.answer, { providers: options.askProviders }, source);
      if (outcome.status === "narrated") {
        answer = outcome.answer;
        mode = "ai";
      }
    }

    return WorkspaceAskResponseSchema.parse({ ...result.facts, answer, mode });
  });

  // --- Operator ---------------------------------------------------------------

  app.get("/api/control/templates", async (req) => control(req, listTemplates));

  // The operator assistant receives only the control-plane organization list.
  // It cannot query a workspace or any customer KPI table.
  app.post("/api/control/ask", async (req) => {
    const { question } = input(WorkspaceAskRequestSchema, req.body);
    return control(req, async (tx) => answerOperatorQuestion(question, await loadControlOrganizations(tx)));
  });

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
        [{ displayName: body.ownerName, email: body.ownerEmail, roleKeys: [], owner: true }, ...body.members],
        options.authAdmin,
      );
      try {
        const id = await control(req, async (tx) => {
          const [row] = await tx.query("select kpi_control.provision_with_people($1,$2,$3::text::jsonb) as id", [
            body.name,
            body.templateId ?? null,
            prepared.json,
          ]);
          try {
            await tx.query("savepoint before_creation");
            await tx.query("select kpi_control.record_creation($1::uuid,$2,$3,$4)", [uuid.parse(row?.id), body.activate, body.ownerEmail, body.ownerEmailVerified]);
          } catch {
            await tx.query("rollback to before_creation");
          }
          try {
            await tx.query("savepoint before_profile");
            await tx.query("select kpi_control.record_profile($1::uuid,$2,$3,$4,$5)", [
              uuid.parse(row?.id),
              body.industry,
              body.plan,
              body.ownerName,
              body.subscriptionStatus,
            ]);
          } catch {
            await tx.query("rollback to before_profile");
          }
          return row?.id;
        });
        if (options.mailer && prepared.people[0]?.temporaryPassword) {
          try {
            await options.mailer.send(
              body.ownerEmail,
              `Your Temporary Sign-In Credentials for ${body.name}`,
              [
                `Hello ${body.ownerName},`,
                "",
                `Your organization "${body.name}" has been created on Command Center.`,
                "",
                "Your Temporary Sign-In Credentials:",
                `• Login ID (Email): ${body.ownerEmail}`,
                `• Role: Organization Administrator`,
                `• Temporary Password: ${prepared.people[0].temporaryPassword}`,
                "",
                "Important:",
                "When you sign in for the first time, you will be required to change your password by validating a 6-digit one-time verification code (OTP) sent to this email address.",
                "",
                "Command Center Security",
              ].join("\n"),
            );
          } catch (mailErr) {
            console.error("Failed to deliver temporary credentials email:", mailErr);
          }
        }
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
      try {
        await tx.query("savepoint before_creation");
        await tx.query("select kpi_control.record_creation($1::uuid,$2,$3,$4)", [uuid.parse(row?.id), body.activate, body.ownerEmail, body.ownerEmailVerified]);
      } catch {
        await tx.query("rollback to before_creation");
      }
      try {
        await tx.query("savepoint before_profile");
        await tx.query("select kpi_control.record_profile($1::uuid,$2,$3,$4,$5)", [
          uuid.parse(row?.id),
          body.industry,
          body.plan,
          body.ownerName,
          body.subscriptionStatus,
        ]);
      } catch {
        await tx.query("rollback to before_profile");
      }
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
