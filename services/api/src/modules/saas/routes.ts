import { randomBytes } from "node:crypto";
import type { FastifyInstance } from "fastify";
import { jwtVerify } from "jose";
import { z } from "zod";
import {
  SetupProposalSchema,
  ProposalListSchema,
  ControlOrganizationListSchema,
  SettingsSchema,
  PeriodLockSchema,
  ActionTransitionSchema,
  formulaUnit,
  InputBatchSchema,
  InviteSchema,
  NewActionSchema,
  NewKpiSchema,
  NewMeasureSchema,
  NewRoleSchema,
  NewUnitSchema,
  TenantListSchema,
  ResultSchema,
} from "@orbit/contracts";
import { ApiError } from "../../plugins/errors.ts";
import { measureKeys } from "./engine.ts";
import { recalculateAfterApproval } from "./calculation.ts";
import { audit, hash, input, inSubject, makeRunners, owner, permit, uuid, type SaasOptions } from "./helpers.ts";
import { loadWorkspace } from "./workspace.ts";
import { registerV2Routes } from "./v2.ts";
import { registerOwnerRoutes } from "./owner.ts";
import { registerLifecycleRoutes } from "./lifecycle.ts";
import { registerIdentityRoutes } from "./identity.ts";

export type { SaasOptions } from "./helpers.ts";

export async function registerSaasRoutes(
  app: FastifyInstance,
  options: SaasOptions,
): Promise<void> {
  const { subject, tenant } = makeRunners(options);
  app.get("/api/saas/organizations", async (req) =>
    inSubject(options.database, await subject(req), async (tx) =>
      TenantListSchema.parse(
        await tx.query(
          "select id,name,owner,status from kpi.my_organizations() order by name",
        ),
      ),
    ),
  );
  app.post("/api/saas/invitations/accept", async (req) => {
    const sub = await subject(req);
    const { token } = input(
      z.strictObject({ token: z.string().regex(/^[a-f0-9]{64}$/) }),
      req.body,
    );
    // Email comes only from a verified Supabase token, never from the request body.
    const { payload } = await jwtVerify(
      req.headers.authorization!.slice(7),
      options.auth.getKey,
      {
        issuer: options.auth.issuer,
        audience: options.auth.audience,
        algorithms: ["ES256", "RS256"],
      },
    );
    const email = input(z.email(), payload.email);
    return inSubject(options.database, sub, async (tx) => {
      const [row] = await tx.query(
        "select kpi.accept_invitation($1,$2) as id",
        [hash(token), email],
      );
      return { id: row?.id };
    });
  });
  app.get("/api/saas/:tenantId/workspace", async (req) =>
    tenant(req, async (tx, t, sub) => loadWorkspace(tx, t, sub)),
  );
  app.post("/api/saas/:tenantId/units", async (req) =>
    tenant(req, async (tx, t, sub) => {
      await permit(tx, t, "configure");
      const b = input(NewUnitSchema, req.body);
      const [row] = await tx.query(
        "insert into kpi.units(tenant_id,name,kind,parent_id) values($1,$2,$3,$4) returning id",
        [t, b.name, b.kind, b.parentId],
      );
      await audit(tx, t, sub, "unit.created");
      return row;
    }),
  );
  app.post("/api/saas/:tenantId/measures", async (req) =>
    tenant(req, async (tx, t, sub) => {
      await permit(tx, t, "configure");
      const b = input(NewMeasureSchema, req.body);
      await tx.query(
        "insert into kpi.measures(tenant_id,key,name,unit) values($1,$2,$3,$4)",
        [t, b.key, b.name, b.unit],
      );
      await audit(tx, t, sub, "measure.created");
      return { ok: true };
    }),
  );
  app.post("/api/saas/:tenantId/roles", async (req) =>
    tenant(req, async (tx, t, sub) => {
      await owner(tx, t);
      const b = input(NewRoleSchema, req.body);
      const [role] = await tx.query(
        "insert into kpi.roles(tenant_id,name) values($1,$2) returning id",
        [t, b.name],
      );
      const id = uuid.parse(role?.id);
      for (const g of b.grants)
        await tx.query(
          "insert into kpi.grants(tenant_id,role_id,capability,unit_id,kpi_id) values($1,$2,$3,$4,$5)",
          [t, id, g.capability, g.unitId, g.kpiId],
        );
      await audit(tx, t, sub, "role.created", id);
      return { id };
    }),
  );
  app.post("/api/saas/:tenantId/invitations", async (req) =>
    tenant(req, async (tx, t, sub) => {
      await owner(tx, t);
      const b = input(InviteSchema, req.body);
      for (const id of b.roleIds) {
        const rows = await tx.query(
          "select id from kpi.roles where tenant_id=$1 and id=$2",
          [t, id],
        );
        if (!rows.length)
          throw new ApiError(
            "invalid_request",
            "A role is not in this organization.",
          );
      }
      const token = randomBytes(32).toString("hex");
      await tx.query(
        "insert into kpi.invitations(tenant_id,email,token_hash,role_ids) values($1,$2,$3,$4::uuid[])",
        [t, b.email, hash(token), `{${b.roleIds.join(",")}}`],
      );
      await audit(tx, t, sub, "invitation.created");
      return { token };
    }),
  );
  app.post("/api/saas/:tenantId/members/:id/revoke", async (req) =>
    tenant(req, async (tx, t, sub) => {
      await owner(tx, t);
      const { id } = input(z.object({ id: uuid }), req.params);
      const rows = await tx.query(
        "update kpi.memberships set active=false where tenant_id=$1 and id=$2 and not owner returning id",
        [t, id],
      );
      if (!rows.length)
        throw new ApiError("not_found", "Member cannot be revoked here.");
      await audit(tx, t, sub, "member.revoked", id);
      return { ok: true };
    }),
  );
  app.post('/api/saas/:tenantId/members/:id/roles',async req=>tenant(req,async(tx,t,sub)=>{
    await owner(tx,t);const {id}=input(z.object({id:uuid}),req.params);
    const {roleIds}=input(z.strictObject({roleIds:z.array(uuid).max(100)}),req.body);
    const [member]=await tx.query('select id from kpi.memberships where tenant_id=$1 and id=$2 and active and not owner',[t,id]);
    if(!member)throw new ApiError('not_found','Active non-owner member not found.');
    await tx.query('delete from kpi.member_roles where tenant_id=$1 and member_id=$2',[t,id]);
    for(const roleId of new Set(roleIds))await tx.query('insert into kpi.member_roles(tenant_id,member_id,role_id) values($1,$2,$3)',[t,id,roleId]);
    await audit(tx,t,sub,'member.roles_changed',id);return {ok:true};
  }));
  app.post("/api/saas/:tenantId/kpis", async (req) =>
    tenant(req, async (tx, t, sub) => {
      await permit(tx, t, "configure");
      const b = input(NewKpiSchema, req.body);
      const available = await tx.query(
        "select key,unit from kpi.measures where tenant_id=$1",
        [t],
      );
      if (
        measureKeys(b.formula).some(
          (key) => !available.some((m) => m.key === key),
        )
      )
        throw new ApiError(
          "invalid_request",
          "Define each input measure before creating this KPI.",
        );
      try {
        if (
          formulaUnit(
            b.formula,
            new Map(available.map((m) => [String(m.key), String(m.unit)])),
          ) !== b.unit
        )
          throw new Error(
            "Result unit does not match the formula. Use the unit shown by the input calculation.",
          );
      } catch (e) {
        throw new ApiError(
          "invalid_request",
          e instanceof Error ? e.message : "Invalid units.",
        );
      }
      const [count] = await tx.query(
        "select count(*)::int as n from kpi.definitions where tenant_id=$1",
        [t],
      );
      if (Number(count?.n) >= 1000)
        throw new ApiError(
          "conflict",
          "An organization can hold up to 1000 KPI versions.",
        );
      const [row] = await tx.query(
        `insert into kpi.definitions(tenant_id,key,version,name,description,unit,formula,direction,target,created_by) select $1,$2,coalesce(max(version),0)+1,$3,$4,$5,$6::text::jsonb,$7,$8::numeric,$9 from kpi.definitions where tenant_id=$1 and key=$2 returning id`,
        [
          t,
          b.key,
          b.name,
          b.description,
          b.unit,
          JSON.stringify(b.formula),
          b.direction,
          b.target,
          sub,
        ],
      );
      await audit(tx, t, sub, "kpi.drafted");
      return row;
    }),
  );
  app.post("/api/saas/:tenantId/kpis/:id/activate", async (req) =>
    tenant(req, async (tx, t, sub) => {
      await owner(tx, t);
      const { id } = input(z.object({ id: uuid }), req.params);
      const [draft] = await tx.query(
        "select key from kpi.definitions where tenant_id=$1 and id=$2 and state='draft'",
        [t, id],
      );
      if (!draft)
        throw new ApiError("conflict", "Only a draft KPI can be activated.");
      await tx.query(
        "update kpi.definitions set state='retired' where tenant_id=$1 and key=$2 and state='active'",
        [t, String(draft.key)],
      );
      await tx.query(
        "update kpi.definitions set state='active',approved_by=$3 where tenant_id=$1 and id=$2",
        [t, id, sub],
      );
      await audit(tx, t, sub, "kpi.activated", id);
      return { ok: true };
    }),
  );
  app.post("/api/saas/:tenantId/batches", async (req) =>
    tenant(req, async (tx, t, sub) => {
      const b = input(InputBatchSchema, req.body);
      await permit(tx, t, "submit", b.unitId);
      const payloadHash = hash(
        JSON.stringify({
          ...b,
          rows: [...b.rows].sort((a, c) => a.measure.localeCompare(c.measure)),
        }),
      );
      const [existing] = await tx.query(
        "select id,payload_hash from kpi.batches where tenant_id=$1 and idempotency_key=$2",
        [t, b.idempotencyKey],
      );
      if (existing) {
        if (existing.payload_hash !== payloadHash)
          throw new ApiError(
            "conflict",
            "Idempotency key was already used for different data.",
          );
        return { id: existing.id, replayed: true };
      }
      const locked = await tx.query(
        "select 1 from kpi.period_locks where tenant_id=$1 and unit_id=$2 and period_start<=$4::date and period_end>=$3::date",
        [t, b.unitId, b.period.start, b.period.end],
      );
      if (locked.length)
        throw new ApiError("conflict", "This reporting period is locked.");
      const [row] = await tx.query(
        "insert into kpi.batches(tenant_id,unit_id,period_start,period_end,origin,submitted_by,idempotency_key,payload_hash) values($1,$2,$3,$4,$5,$6,$7,$8) returning id",
        [
          t,
          b.unitId,
          b.period.start,
          b.period.end,
          b.origin,
          sub,
          b.idempotencyKey,
          payloadHash,
        ],
      );
      const id = uuid.parse(row?.id);
      for (const r of b.rows)
        await tx.query(
          "insert into kpi.inputs(tenant_id,batch_id,measure,value) values($1,$2,$3,$4::numeric)",
          [t, id, r.measure, r.value],
        );
      await audit(tx, t, sub, "batch.submitted", id);
      return { id, replayed: false };
    }),
  );
  app.get("/api/saas/:tenantId/batches/:id", async (req) =>
    tenant(req, async (tx, t) => {
      const { id } = input(z.object({ id: uuid }), req.params);
      const [batch] = await tx.query(
        'select id,status,submitted_by as "submittedBy" from kpi.batches where tenant_id=$1 and id=$2',
        [t, id],
      );
      if (!batch) throw new ApiError("not_found", "Batch not found.");
      const rows = await tx.query(
        "select measure,value::text from kpi.inputs where tenant_id=$1 and batch_id=$2 order by measure",
        [t, id],
      );
      return { ...batch, rows };
    }),
  );
  app.post("/api/saas/:tenantId/batches/:id/approve", async (req) =>
    tenant(req, async (tx, t, sub) => {
      const { id } = input(z.object({ id: uuid }), req.params);
      await tx.query("select kpi.approve_batch($1,$2)", [t, id]);
      const [batch] = await tx.query(
        "select unit_id,period_start::text,period_end::text from kpi.batches where tenant_id=$1 and id=$2",
        [t, id],
      );
      const { calculated, units } = await recalculateAfterApproval(
        tx,
        t,
        uuid.parse(batch?.unit_id),
        {
          start: z.string().parse(batch?.period_start),
          end: z.string().parse(batch?.period_end),
        },
      );
      await audit(tx, t, sub, "batch.approved", id);
      return { calculated, units };
    }),
  );
  app.post("/api/saas/:tenantId/batches/:id/reject", async (req) =>
    tenant(req, async (tx, t, sub) => {
      const { id } = input(z.object({ id: uuid }), req.params);
      await tx.query("select kpi.reject_batch($1,$2)", [t, id]);
      await audit(tx, t, sub, "batch.rejected", id);
      return { ok: true };
    }),
  );
  app.post("/api/saas/:tenantId/actions", async (req) =>
    tenant(req, async (tx, t, sub) => {
      const b = input(NewActionSchema, req.body);
      const [r] = await tx.query(
        "select kpi_id,unit_id from kpi.results where tenant_id=$1 and id=$2",
        [t, b.resultId],
      );
      if (!r) throw new ApiError("not_found", "Result is not available.");
      await permit(tx, t, "act", String(r.unit_id), String(r.kpi_id));
      const [member] = await tx.query(
        "select id from kpi.memberships where tenant_id=$1 and id=$2 and active",
        [t, b.assigneeId],
      );
      if (!member)
        throw new ApiError(
          "invalid_request",
          "Assignee must be an active organization member.",
        );
      const [row] = await tx.query(
        "insert into kpi.actions(tenant_id,title,result_id,assignee_id,due_date,created_by) values($1,$2,$3,$4,$5,$6) returning id",
        [t, b.title, b.resultId, b.assigneeId, b.dueDate, sub],
      );
      await audit(tx, t, sub, "action.created");
      return row;
    }),
  );
  app.post("/api/saas/:tenantId/actions/:id/transition", async (req) =>
    tenant(req, async (tx, t, sub) => {
      const { id } = input(z.object({ id: uuid }), req.params);
      const b = input(ActionTransitionSchema, req.body);
      const rows = await tx.query(
        "update kpi.actions set state=$3,version=version+1 where tenant_id=$1 and id=$2 and version=$4 returning id",
        [t, id, b.state, b.expectedVersion],
      );
      if (!rows.length)
        throw new ApiError(
          "conflict",
          "Action changed or is not editable. Refresh and retry.",
        );
      await audit(tx, t, sub, `action.${b.state}`, id);
      return { ok: true };
    }),
  );
  app.get("/api/saas/:tenantId/audit", async (req) =>
    tenant(req, async (tx, t) => {
      await owner(tx, t);
      return tx.query(
        'select id,event,resource_id as "resourceId",subject,created_at::text as "createdAt" from kpi.audit where tenant_id=$1 order by created_at desc limit 200',
        [t],
      );
    }),
  );
  app.get('/api/saas/:tenantId/results/:id',async req=>tenant(req,async(tx,t)=>{
    const {id}=input(z.object({id:uuid}),req.params);
    const [row]=await tx.query(`select id,kpi_id as "kpiId",unit_id as "unitId",period_start::text as start,period_end::text as end,value,origin,computed_at::text as "computedAt",target::text,direction,on_target as "onTarget",input_ids as "inputIds" from kpi.results where tenant_id=$1 and id=$2`,[t,id]);
    if(!row)throw new ApiError('not_found','Evidence is not available in your scope.');return ResultSchema.parse(row);
  }));
  app.get("/api/control/me", async (req) =>
    inSubject(options.controlDatabase, await subject(req), async (tx) => {
      const [row] = await tx.query(
        "select kpi_control.is_operator() as allowed",
      );
      if (row?.allowed !== true)
        throw new ApiError(
          "forbidden",
          "A platform operator account is required.",
        );
      return { operator: true };
    }, "kpi_control_app"),
  );
  app.get("/api/saas/:tenantId/settings", async (req) =>
    tenant(req, async (tx, t) => {
      await owner(tx, t);
      const [row] = await tx.query(
        'select allow_self_approval as "allowSelfApproval" from kpi.organizations where id=$1',
        [t],
      );
      return SettingsSchema.parse(row);
    }),
  );
  app.post("/api/saas/:tenantId/settings", async (req) =>
    tenant(req, async (tx, t, sub) => {
      await owner(tx, t);
      const b = input(SettingsSchema, req.body);
      await tx.query(
        "update kpi.organizations set allow_self_approval=$2 where id=$1",
        [t, b.allowSelfApproval],
      );
      await audit(
        tx,
        t,
        sub,
        b.allowSelfApproval
          ? "self_approval.enabled"
          : "self_approval.disabled",
      );
      return { ok: true };
    }),
  );
  app.post("/api/saas/:tenantId/period-locks", async (req) =>
    tenant(req, async (tx, t, sub) => {
      await owner(tx, t);
      const b = input(PeriodLockSchema, req.body);
      await tx.query(
        "insert into kpi.period_locks(tenant_id,unit_id,period_start,period_end) values($1,$2,$3,$4)",
        [t, b.unitId, b.period.start, b.period.end],
      );
      await audit(tx, t, sub, "period.locked");
      return { ok: true };
    }),
  );
  app.get("/api/saas/:tenantId/proposals", async (req) =>
    tenant(req, async (tx, t) => {
      await owner(tx, t);
      return ProposalListSchema.parse(
        await tx.query(
          "select id,state,configuration from kpi.proposals where tenant_id=$1 order by created_at desc",
          [t],
        ),
      );
    }),
  );
  app.post("/api/saas/:tenantId/proposals/:id/accept", async (req) =>
    tenant(req, async (tx, t, sub) => {
      await owner(tx, t);
      const { id } = input(z.object({ id: uuid }), req.params);
      const [row] = await tx.query(
        "select configuration from kpi.proposals where tenant_id=$1 and id=$2 and state='pending'",
        [t, id],
      );
      if (!row) throw new ApiError("not_found", "Pending proposal not found.");
      const p = SetupProposalSchema.parse(row.configuration);
      const [existingCount] = await tx.query(
        "select count(*)::int as n from kpi.definitions where tenant_id=$1",
        [t],
      );
      if (Number(existingCount?.n) + p.kpis.length > 1000)
        throw new ApiError(
          "conflict",
          "An organization can hold up to 1000 KPI versions.",
        );
      // Proposals create drafts. Activation remains a separate customer review.
      for (const m of p.measures)
        await tx.query(
          "insert into kpi.measures(tenant_id,key,name,unit) values($1,$2,$3,$4)",
          [t, m.key, m.name, m.unit],
        );
      const units = await tx.query(
        "select key,unit from kpi.measures where tenant_id=$1",
        [t],
      );
      for (const k of p.kpis) {
        try {
          if (
            formulaUnit(
              k.formula,
              new Map(units.map((m) => [String(m.key), String(m.unit)])),
            ) !== k.unit
          )
            throw new Error("Invalid formula unit.");
        } catch {
          throw new ApiError(
            "invalid_request",
            "Proposal contains unknown measures or mismatched units.",
          );
        }
        await tx.query(
          `insert into kpi.definitions(tenant_id,key,version,name,description,unit,formula,direction,target,created_by) select $1,$2,coalesce(max(version),0)+1,$3,$4,$5,$6::text::jsonb,$7,$8::numeric,$9 from kpi.definitions where tenant_id=$1 and key=$2`,
          [
            t,
            k.key,
            k.name,
            k.description,
            k.unit,
            JSON.stringify(k.formula),
            k.direction,
            k.target,
            sub,
          ],
        );
      }
      for (const r of p.roles) {
        const [role] = await tx.query(
          "insert into kpi.roles(tenant_id,name) values($1,$2) returning id",
          [t, r.name],
        );
        for (const capability of r.capabilities)
          await tx.query(
            "insert into kpi.grants(tenant_id,role_id,capability) values($1,$2,$3)",
            [t, uuid.parse(role?.id), capability],
          );
      }
      await tx.query(
        "update kpi.proposals set state='accepted' where tenant_id=$1 and id=$2",
        [t, id],
      );
      await audit(tx, t, sub, "proposal.accepted", id);
      return { ok: true };
    }),
  );
  app.post("/api/saas/:tenantId/proposals/:id/reject", async (req) =>
    tenant(req, async (tx, t, sub) => {
      await owner(tx, t);
      const { id } = input(z.object({ id: uuid }), req.params);
      const rows = await tx.query(
        "update kpi.proposals set state='rejected' where tenant_id=$1 and id=$2 and state='pending' returning id",
        [t, id],
      );
      if (!rows.length)
        throw new ApiError("not_found", "Pending proposal not found.");
      await audit(tx, t, sub, "proposal.rejected", id);
      return { ok: true };
    }),
  );
  app.get("/api/control/organizations", async (req) =>
    inSubject(options.controlDatabase, await subject(req), async (tx) => {
      return ControlOrganizationListSchema.parse(
        await tx.query(
          'select id,name,template_id as "templateId",status,status_changed_at::text as "statusChangedAt",purge_after::text as "purgeAfter",owner_email as "ownerEmail",owner_email_verified_at::text as "ownerEmailVerifiedAt" from kpi_control.list_organizations()',
        ),
      );
    }, "kpi_control_app"),
  );
  app.post("/api/control/organizations/:tenantId/proposals", async (req) =>
    inSubject(options.controlDatabase, await subject(req), async (tx) => {
      const { tenantId } = input(z.object({ tenantId: uuid }), req.params);
      const p = input(SetupProposalSchema, req.body);
      const [row] = await tx.query(
        "select kpi_control.propose($1,$2::text::jsonb) as id",
        [tenantId, JSON.stringify(p)],
      );
      return row;
    }, "kpi_control_app"),
  );
  await registerV2Routes(app, options);
  await registerOwnerRoutes(app, options);
  await registerLifecycleRoutes(app, options);
  await registerIdentityRoutes(app, options);
}
