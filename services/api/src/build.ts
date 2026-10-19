import cors from "@fastify/cors";
import Fastify, { type FastifyInstance } from "fastify";
import type { AuthOptions } from "./plugins/auth.ts";
import { ApiError, registerErrorHandling } from "./plugins/errors.ts";
import type { ModuleDeps } from "./modules/ports.ts";
import type { ApiSurface } from "./surface.ts";
import type { Database } from "./db/client.ts";
import type { ModelProvider } from "./modules/ask/narrator.ts";
import type { AuthAdmin } from "./modules/saas/auth-admin.ts";
import type { Mailer } from "./modules/saas/mail.ts";
import { registerSaasRoutes } from "./modules/saas/routes.ts";

export interface AppOptions {
  auth: AuthOptions;
  allowedOrigins: readonly string[];
  database?: Database;
  controlDatabase?: Database;
  /** Identity API only: lets an owner create logins for their own people. */
  identityDatabase?: Database;
  /** Creates logins for people an operator adds (control API only). */
  authAdmin?: AuthAdmin;
  /** Identity API only: sends emailed codes. */
  mailer?: Mailer;
  /** Refuse data to anyone whose temporary password is not yet replaced. */
  enforcePasswordChange?: boolean;
  /** Models that may reword an Ask answer. Leave empty to keep Ask fully deterministic. */
  askProviders?: readonly ModelProvider[];
  logger?: boolean;
  /** Legacy callers may still supply these; no legacy routes are registered. */
  modules?: ModuleDeps;
  surface?: ApiSurface;
}
export async function buildApp(options: AppOptions): Promise<FastifyInstance> {
  const app = Fastify({
    bodyLimit: 256 * 1024,
    logController: new Fastify.LogController({ disableRequestLogging: true }),
    logger: options.logger
      ? {
          redact: [
            "req.headers.authorization",
            "req.headers.cookie",
            "req.body",
            "res.body",
          ],
        }
      : false,
  });
  registerErrorHandling(app);
  app.addHook("onSend", async (_req, reply, payload) => {
    reply.header("Cache-Control", "no-store");
    reply.header("X-Content-Type-Options", "nosniff");
    reply.header("X-Frame-Options", "DENY");
    reply.header("Referrer-Policy", "no-referrer");
    return payload;
  });
  await app.register(cors, {
    origin: [...options.allowedOrigins],
    methods: ["GET", "POST"],
    allowedHeaders: ["Authorization", "Content-Type"],
    credentials: false,
  });
  // Each process answers only the routes it serves. The customer API has no control
  // database login, so operator routes do not exist there; the control API has no
  // customer database login, so customer routes do not exist there. Without this a
  // route would answer with an error instead of not existing, and any route added
  // later would be reachable on the wrong process by default.
  app.addHook("onRequest", async (req) => {
    const path = req.url.split("?")[0] ?? "";
    const servedHere = path.startsWith("/api/control/")
      ? options.controlDatabase
      : path.startsWith("/api/identity/")
        ? options.identityDatabase
        : path.startsWith("/api/saas/")
          ? options.database
          : true;
    if (!servedHere) throw new ApiError("not_found", "The requested resource does not exist.");
  });
  app.get("/health", async () => ({ status: "ok" }));
  app.get("/api/health", async () => ({ status: "ok" }));
  await registerSaasRoutes(app, options);
  return app;
}
