import cors from "@fastify/cors";
import Fastify, { type FastifyInstance } from "fastify";
import type { AuthOptions } from "./plugins/auth.ts";
import { registerErrorHandling } from "./plugins/errors.ts";
import type { ModuleDeps } from "./modules/ports.ts";
import type { ApiSurface } from "./surface.ts";
import type { Database } from "./db/client.ts";
import type { ModelProvider } from "./modules/ask/narrator.ts";
import { registerSaasRoutes } from "./modules/saas/routes.ts";

export interface AppOptions {
  auth: AuthOptions;
  allowedOrigins: readonly string[];
  database?: Database;
  controlDatabase?: Database;
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
  app.get("/health", async () => ({ status: "ok" }));
  app.get("/api/health", async () => ({ status: "ok" }));
  await registerSaasRoutes(app, options);
  return app;
}
