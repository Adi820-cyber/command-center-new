import type { FastifyInstance } from 'fastify';
import { createRemoteJWKSet } from 'jose';
import { buildApp } from './build.ts';
import { loadConfig } from './config.ts';
import { createDatabase } from './db/client.ts';
import { createAuthAdmin } from './modules/saas/auth-admin.ts';
import { createMailer } from './modules/saas/mail.ts';

// Vercel entrypoint (src/app.ts). The app is built in ./build.ts. Vercel's
// Fastify detection needs this file itself to import fastify.
const config = loadConfig();

// No top-level await: Vercel's runtime may load this module with require(),
// which Node rejects for ES modules that use top-level await.
buildApp({
  logger: true,
  database: config.kpiDatabaseUrl ? createDatabase({ url: config.kpiDatabaseUrl }) : undefined,
  controlDatabase: config.controlDatabaseUrl ? createDatabase({ url: config.controlDatabaseUrl }) : undefined,
  identityDatabase: config.identityDatabaseUrl ? createDatabase({ url: config.identityDatabaseUrl }) : undefined,
  askProviders: config.askProviders,
  mailer: config.mail ? createMailer(config.mail) : undefined,
  enforcePasswordChange: config.enforcePasswordChange,
  authAdmin: config.supabaseSecretKey
    ? createAuthAdmin({ supabaseUrl: config.supabaseUrl, secretKey: config.supabaseSecretKey })
    : undefined,
  allowedOrigins: config.allowedOrigins,
  auth: {
    getKey: createRemoteJWKSet(config.jwksUrl),
    issuer: config.issuer,
    audience: config.audience,
    // The generic routes resolve tenant membership through RLS after JWT verification.
    memberships: { findBySubject: async () => [] },
  },
})
  .then((app: FastifyInstance) => app.listen({ port: config.port }))
  .catch((error: unknown) => {
    console.error('Command Center API failed to start', error);
    process.exit(1);
  });
