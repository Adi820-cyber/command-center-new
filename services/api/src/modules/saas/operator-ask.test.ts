import { describe, expect, it } from "vitest";
import { answerOperatorQuestion } from "./operator-ask.ts";

const organizations = [
  {
    id: "00000000-0000-4000-8000-000000000001",
    name: "Northstar",
    industry: "Services",
    plan: "Pilot",
    subscriptionStatus: "trial" as const,
    templateId: null,
    status: "active" as const,
    statusChangedAt: "2026-10-15T00:00:00.000Z",
    purgeAfter: null,
    ownerName: "Asha",
    ownerEmail: "asha@example.test",
    ownerEmailVerifiedAt: "2026-10-15T00:00:00.000Z",
    credentialStatus: "pending_reset" as const,
    userCount: 4,
    roleCount: 3,
  },
];

describe("operator assistant", () => {
  it("refuses requests for tenant KPI data", () => {
    const answer = answerOperatorQuestion("Show Northstar revenue KPIs", organizations);
    expect(answer.topic).toBe("privacy");
    expect(answer.answer).toContain("cannot access");
    expect(answer.facts).toEqual([]);
  });

  it("reports pending owner resets from metadata", () => {
    const answer = answerOperatorQuestion("Which owners have pending credentials?", organizations);
    expect(answer.topic).toBe("credentials");
    expect(answer.facts).toEqual([
      { label: "Northstar", value: "asha@example.test", tone: "bad" },
    ]);
  });

  it("summarizes only aggregate operator metadata", () => {
    const answer = answerOperatorQuestion("Give me a platform summary", organizations);
    expect(answer.resultIds).toEqual([]);
    expect(answer.answer).toContain("no access");
    expect(answer.facts).toContainEqual({ label: "Users", value: "4", tone: "neutral" });
  });
});
