import Fastify from "fastify";
import { describe, expect, it, vi } from "vitest";
import type { SaasOptions } from "./helpers.ts";

const T = "00000000-0000-4000-8000-000000000001";
const S = "00000000-0000-4000-8000-000000000099";

vi.mock("../../plugins/auth.ts", () => ({
  verifyAccessToken: vi.fn(async () => S),
  verifyAccessTokenClaims: vi.fn(async () => ({
    sub: S,
    email: "owner@kestrion.demo",
    mustChangePassword: false,
  })),
}));

async function buildTestApp() {
  const { registerOwnerRoutes } = await import("./owner.ts");
  const app = Fastify();
  const mockDb = {
    transaction: async <T>(fn: (tx: unknown) => Promise<T>) => {
      const tx = {
        query: async (queryText: string) => {
          if (queryText.includes("kpi.is_member")) return [{ allowed: true }];
          if (queryText.includes("kpi.is_owner")) return [{ allowed: true }];
          if (queryText.includes("kpi.save_role")) return [{ id: "00000000-0000-4000-8000-000000000123" }];
          if (queryText.includes("kpi.audit")) return [];
          return [];
        },
      };
      return fn(tx);
    },
  };

  const options: SaasOptions = {
    auth: {
      getKey: async () => ({} as never),
      issuer: "test",
      audience: "test",
      memberships: { findBySubject: async () => [] },
    },
    database: mockDb as never,
  };

  await registerOwnerRoutes(app, options);
  return app;
}

describe("role creation OTP flow", () => {
  it("exports schemas properly", async () => {
    const { RequestRoleOtpRequestSchema, RequestRoleOtpResponseSchema } = await import("@orbit/contracts");
    const req = RequestRoleOtpRequestSchema.parse({ roleName: "Branch Manager" });
    expect(req.roleName).toBe("Branch Manager");

    const res = RequestRoleOtpResponseSchema.parse({
      sentTo: "o***@org.com",
      expiresInMinutes: 10,
      debugCode: "654321",
    });
    expect(res.expiresInMinutes).toBe(10);
    expect(res.debugCode).toBe("654321");
  });

  it("handles request-otp, verify-otp, and save with OTP validation", async () => {
    const app = await buildTestApp();

    // 1. Request OTP
    const reqRes = await app.inject({
      method: "POST",
      url: `/api/saas/${T}/roles/request-otp`,
      headers: { authorization: "Bearer valid-token" },
      payload: { roleName: "Quality Auditor" },
    });
    expect(reqRes.statusCode).toBe(200);
    const otpData = JSON.parse(reqRes.payload);
    expect(otpData.expiresInMinutes).toBe(10);
    expect(otpData.sentTo).toContain("@kestrion.demo");
    const otpCode = otpData.debugCode;
    expect(otpCode).toMatch(/^\d{6}$/);

    // 2. Reject incorrect verification code
    const badVerifyRes = await app.inject({
      method: "POST",
      url: `/api/saas/${T}/roles/verify-otp`,
      headers: { authorization: "Bearer valid-token" },
      payload: { otpCode: "000000" },
    });
    expect(badVerifyRes.statusCode).toBe(400);
    expect(JSON.parse(badVerifyRes.payload).message).toContain("Incorrect verification code");

    // 3. Accept correct verification code
    const goodVerifyRes = await app.inject({
      method: "POST",
      url: `/api/saas/${T}/roles/verify-otp`,
      headers: { authorization: "Bearer valid-token" },
      payload: { otpCode },
    });
    expect(goodVerifyRes.statusCode).toBe(200);
    expect(JSON.parse(goodVerifyRes.payload)).toEqual({ ok: true, roleName: "Quality Auditor" });

    // 4. Save role with invalid OTP fails
    const badSaveRes = await app.inject({
      method: "POST",
      url: `/api/saas/${T}/roles/save`,
      headers: { authorization: "Bearer valid-token" },
      payload: {
        name: "Quality Auditor",
        capabilities: ["view", "act"],
        scopeUnitId: null,
        kpiIds: [],
        otpCode: "999999",
      },
    });
    expect(badSaveRes.statusCode).toBe(400);

    // 5. Save role with valid OTP succeeds
    const goodSaveRes = await app.inject({
      method: "POST",
      url: `/api/saas/${T}/roles/save`,
      headers: { authorization: "Bearer valid-token" },
      payload: {
        name: "Quality Auditor",
        capabilities: ["view", "act"],
        scopeUnitId: null,
        kpiIds: [],
        otpCode,
      },
    });
    expect(goodSaveRes.statusCode).toBe(200);
    expect(JSON.parse(goodSaveRes.payload)).toEqual({ id: "00000000-0000-4000-8000-000000000123" });

    // 6. Submitting the consumed OTP again fails (single-use protection)
    const reuseSaveRes = await app.inject({
      method: "POST",
      url: `/api/saas/${T}/roles/save`,
      headers: { authorization: "Bearer valid-token" },
      payload: {
        name: "Quality Auditor",
        capabilities: ["view", "act"],
        scopeUnitId: null,
        kpiIds: [],
        otpCode,
      },
    });
    expect(reuseSaveRes.statusCode).toBe(400);
    expect(JSON.parse(reuseSaveRes.payload).message).toContain("Verification code has expired or was not requested");
  });
});
