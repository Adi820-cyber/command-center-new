import { describe, expect, it } from "vitest";
import { ControlOrganizationListSchema, ProvisionRequestSchema } from "./index.ts";

describe("operator tenant metadata contracts", () => {
  it("parses the onboarding profile and applies safe legacy defaults", () => {
    const request = ProvisionRequestSchema.parse({
      name: "Northstar",
      ownerEmail: "owner@example.test",
      ownerEmailVerified: true,
      members: [],
    });
    expect(request).toMatchObject({
      industry: "Other",
      plan: "Pilot",
      ownerName: "Organization owner",
      subscriptionStatus: "trial",
    });
  });

  it("requires the control response to expose counts and reset state", () => {
    const result = ControlOrganizationListSchema.safeParse([
      {
        id: "00000000-0000-4000-8000-000000000001",
        name: "Northstar",
        industry: "Services",
        plan: "Pilot",
        subscriptionStatus: "trial",
        templateId: null,
        status: "active",
        statusChangedAt: "2026-10-22T00:00:00.000Z",
        purgeAfter: null,
        ownerName: "Asha",
        ownerEmail: "asha@example.test",
        ownerEmailVerifiedAt: "2026-10-22T00:00:00.000Z",
        credentialStatus: "pending_reset",
        userCount: 1,
        roleCount: 0,
      },
    ]);
    expect(result.success).toBe(true);
  });
});
