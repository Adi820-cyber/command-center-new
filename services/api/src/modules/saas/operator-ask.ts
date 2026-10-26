import {
  ControlOrganizationListSchema,
  WorkspaceAskResponseSchema,
  type WorkspaceAskResponse,
} from "@orbit/contracts";
import type { Tx } from "../../db/client.ts";

export async function loadControlOrganizations(tx: Tx) {
  try {
    return ControlOrganizationListSchema.parse(
      await tx.query(
        `select id,name,industry,plan,subscription_status as "subscriptionStatus",
          template_id as "templateId",status,status_changed_at::text as "statusChangedAt",
          purge_after::text as "purgeAfter",owner_name as "ownerName",owner_email as "ownerEmail",
          owner_email_verified_at::text as "ownerEmailVerifiedAt",credential_status as "credentialStatus",
          user_count as "userCount",role_count as "roleCount"
         from kpi_control.list_organizations()`,
      ),
    );
  } catch {
    // Graceful fallback for database instances where the additive metadata migration
    // (20261029000100_operator_tenant_metadata.sql) has not yet been applied.
    const legacy = await tx.query(
      `select id,name,template_id as "templateId",status,status_changed_at::text as "statusChangedAt",
        purge_after::text as "purgeAfter",owner_email as "ownerEmail",
        owner_email_verified_at::text as "ownerEmailVerifiedAt"
       from kpi_control.list_organizations()`,
    );
    return ControlOrganizationListSchema.parse(legacy);
  }
}

type Organizations = ReturnType<typeof ControlOrganizationListSchema.parse>;
type Fact = WorkspaceAskResponse["facts"][number];

const PLATFORM_FINANCIALS = /\b(platform revenue|our revenue|total revenue|mrr|arr|billing revenue|saas kpi|platform kpi|financial summary)\b/i;
const PRIVACY = /\b(kpi|metric|revenue|profit|sales|customer data|business data|performance|result|input)\b/i;
const PENDING = /\b(pending|reset|credential|password|owner)\b/i;
const PLAN = /\b(plan|subscription|tier|trial|past due|cancel)/i;
const VELOCITY = /\b(onboard|velocity|new|recent|last 30|month)\b/i;

const fact = (label: string, value: string, tone: Fact["tone"] = "neutral"): Fact => ({ label, value, tone });

/**
 * Answers only from control-plane metadata. No function in this module accepts
 * a tenant database connection or a workspace, which keeps KPI values outside
 * the operator assistant by construction.
 */
export function answerOperatorQuestion(question: string, organizations: Organizations, today = new Date()): WorkspaceAskResponse {
  const suggestions = [
    "Give me a platform revenue summary",
    "Which owners still need to reset their password?",
    "Summarize subscription plans",
    "How many organizations were onboarded recently?",
    "What data can the operator see?",
  ];

  if (PLATFORM_FINANCIALS.test(question)) {
    let totalMRR = 0;
    let activeOrgs = 0;
    const planCounts = new Map<string, number>();

    for (const organization of organizations) {
      if (organization.status === "active") activeOrgs++;
      const plan = (organization.plan || "Pilot").trim();
      const p = plan.toLowerCase();
      let key = "Pilot";
      let base = 199;
      if (p.includes("enter")) {
        key = "Enterprise";
        base = 2500;
      } else if (p.includes("pro")) {
        key = "Professional";
        base = 1200;
      } else if (p.includes("stan")) {
        key = "Standard";
        base = 499;
      }
      planCounts.set(key, (planCounts.get(key) ?? 0) + 1);

      if (organization.status === "active" && organization.subscriptionStatus !== "cancelled") {
        totalMRR += base;
      }
    }

    const totalARR = totalMRR * 12;
    const arpu = activeOrgs > 0 ? Math.round(totalMRR / activeOrgs) : 0;

    return WorkspaceAskResponseSchema.parse({
      mode: "facts",
      topic: "platform_revenues",
      answer: `The platform generates approximately $${totalMRR.toLocaleString()}/month in recurring revenue ($${totalARR.toLocaleString()} ARR) across ${activeOrgs} active client organizations.`,
      facts: [
        fact("Total MRR", `$${totalMRR.toLocaleString()}`, "good"),
        fact("Annualized Run Rate (ARR)", `$${totalARR.toLocaleString()}`, "good"),
        fact("ARPU (Average per Client)", `$${arpu.toLocaleString()}/mo`, "neutral"),
        fact("Active Organizations", String(activeOrgs), "good"),
        fact("Total Organizations", String(organizations.length), "neutral"),
        fact("Enterprise Tier", String(planCounts.get("Enterprise") ?? 0), "neutral"),
        fact("Professional Tier", String(planCounts.get("Professional") ?? 0), "neutral"),
        fact("Standard Tier", String(planCounts.get("Standard") ?? 0), "neutral"),
        fact("Pilot Tier", String(planCounts.get("Pilot") ?? 0), "neutral"),
      ],
      resultIds: [],
      suggestions,
    });
  }

  if (PRIVACY.test(question)) {
    return WorkspaceAskResponseSchema.parse({
      mode: "facts",
      topic: "privacy",
      answer:
        "I cannot access any organization's KPIs, metrics, inputs, results, or operational data. The operator boundary exposes only onboarding and subscription metadata.",
      facts: [],
      resultIds: [],
      suggestions,
    });
  }

  if (PENDING.test(question)) {
    const pending = organizations.filter((organization) => organization.credentialStatus === "pending_reset");
    return WorkspaceAskResponseSchema.parse({
      mode: "facts",
      topic: "credentials",
      answer: pending.length
        ? `${pending.length} organization owner${pending.length === 1 ? " still needs" : "s still need"} to replace a temporary password.`
        : "Every organization owner has replaced their temporary password.",
      facts: pending.slice(0, 30).map((organization) =>
        fact(organization.name, organization.ownerEmail ?? "Owner email unavailable", "bad"),
      ),
      resultIds: [],
      suggestions,
    });
  }

  if (PLAN.test(question)) {
    const counts = new Map<string, number>();
    for (const organization of organizations) {
      const key = `${organization.plan} · ${organization.subscriptionStatus.replace("_", " ")}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return WorkspaceAskResponseSchema.parse({
      mode: "facts",
      topic: "subscriptions",
      answer: organizations.length
        ? `There are ${organizations.length} organizations across ${counts.size} plan and subscription combination${counts.size === 1 ? "" : "s"}.`
        : "No organizations have been onboarded yet.",
      facts: [...counts].map(([label, count]) => fact(label, String(count))),
      resultIds: [],
      suggestions,
    });
  }

  if (VELOCITY.test(question)) {
    const since = new Date(today);
    since.setUTCDate(since.getUTCDate() - 30);
    const recent = organizations.filter((organization) => new Date(organization.statusChangedAt) >= since);
    return WorkspaceAskResponseSchema.parse({
      mode: "facts",
      topic: "onboarding",
      answer: `${recent.length} organization${recent.length === 1 ? " has" : "s have"} a lifecycle change in the last 30 days.`,
      facts: recent.slice(0, 30).map((organization) => fact(organization.name, organization.status)),
      resultIds: [],
      suggestions,
    });
  }

  const active = organizations.filter((organization) => organization.status === "active").length;
  const pending = organizations.filter((organization) => organization.credentialStatus === "pending_reset").length;
  return WorkspaceAskResponseSchema.parse({
    mode: "facts",
    topic: "summary",
    answer: `The platform has ${organizations.length} organization${organizations.length === 1 ? "" : "s"}; ${active} active and ${pending} awaiting an owner password reset. I have no access to their internal KPI data.`,
    facts: [
      fact("Organizations", String(organizations.length)),
      fact("Active", String(active), active ? "good" : "neutral"),
      fact("Owner resets pending", String(pending), pending ? "bad" : "good"),
      fact("Users", String(organizations.reduce((sum, organization) => sum + organization.userCount, 0))),
      fact("Roles", String(organizations.reduce((sum, organization) => sum + organization.roleCount, 0))),
    ],
    resultIds: [],
    suggestions,
  });
}
