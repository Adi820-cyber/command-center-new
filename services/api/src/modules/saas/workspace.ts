import { WorkspaceSchema, type SaasWorkspace } from "@orbit/contracts";
import type { Tx } from "../../db/client.ts";

/**
 * Everything one member may see in one organisation. Each query runs under the
 * member's own database role and row-level-security policies, so the result is
 * already limited to what their grants allow: an executive sees their KPIs, a
 * data contributor sees none. Ask and the dashboard both build on this.
 */
export async function loadWorkspace(
  tx: Tx,
  tenant: string,
  subject: string,
): Promise<SaasWorkspace> {
  const [organization] = await tx.query(
    "select id,name,kpi.is_owner(id) as owner,status from kpi.organizations where id=$1",
    [tenant],
  );
  const units = await tx.query(
    'select id,name,kind,parent_id as "parentId" from kpi.units where tenant_id=$1 order by name',
    [tenant],
  );
  const measures = await tx.query(
    'select key,name,unit,description,rolls_up as "rollsUp" from kpi.measures where tenant_id=$1 order by name',
    [tenant],
  );
  const kpis = await tx.query(
    'select id,key,version,name,description,unit,formula,direction,target::text,state,domain,catalog_id as "catalogId",sort_order as "sortOrder" from kpi.definitions where tenant_id=$1 order by sort_order,key,version desc',
    [tenant],
  );
  const roles = await tx.query(
    `select r.id,r.name,r.template_key as "templateKey",coalesce((select jsonb_agg(jsonb_build_object('capability',g.capability,'unitId',g.unit_id,'kpiId',g.kpi_id)) from kpi.grants g where g.tenant_id=r.tenant_id and g.role_id=r.id),'[]') as grants from kpi.roles r where tenant_id=$1 order by name`,
    [tenant],
  );
  const members = await tx.query(
    `select m.id,m.subject,m.display_name as "displayName",m.owner,m.active,
       case when kpi.is_owner(m.tenant_id) then m.email end as email,
       coalesce((select array_agg(mr.role_id) from kpi.member_roles mr where mr.tenant_id=m.tenant_id and mr.member_id=m.id),'{}') as "roleIds"
     from kpi.memberships m where m.tenant_id=$1 order by m.id`,
    [tenant],
  );
  const batches = await tx.query(
    'select id,unit_id as "unitId",period_start::text as start,period_end::text as end,status,origin from kpi.batches where tenant_id=$1 order by created_at desc',
    [tenant],
  );
  const results = await tx.query(
    `select distinct on(kpi_id,unit_id,period_start,period_end) id,kpi_id as "kpiId",unit_id as "unitId",period_start::text as start,period_end::text as end,value,origin,computed_at::text as "computedAt",target::text,direction,on_target as "onTarget",input_ids as "inputIds" from kpi.results where tenant_id=$1 order by kpi_id,unit_id,period_start,period_end,computed_at desc`,
    [tenant],
  );
  const actions = await tx.query(
    'select id,title,result_id as "resultId",assignee_id as "assigneeId",due_date::text as "dueDate",state,version from kpi.actions where tenant_id=$1 order by due_date',
    [tenant],
  );
  const myRoles = await tx.query("select id,name from kpi.my_roles($1::uuid)", [tenant]);
  return WorkspaceSchema.parse({
    organization,
    subject,
    me: { owner: organization?.owner === true, roles: myRoles },
    units,
    measures,
    kpis,
    roles,
    members,
    batches,
    results,
    actions,
  });
}
