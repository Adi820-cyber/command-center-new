import Fastify from "fastify";
import { describe, expect, it } from "vitest";
import { registerOwnerRoutes } from "./owner.ts";
import type { SaasOptions } from "./helpers.ts";

const T = "00000000-0000-4000-8000-000000000001";
const S = "00000000-0000-4000-8000-000000000099";

function buildTestApp() {
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

  // Mock verifyAccessToken and verifyAccessTokenClaims for unit tests
  app.addHook("preHandler", async (req) => {
    (req.headers as Record<string, string>)["authorization"] = "Bearer test-token";
  });

  return { app, options };
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
});
