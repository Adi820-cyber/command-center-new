import type { FastifyInstance } from 'fastify';
import { createRemoteJWKSet } from 'jose';
import { buildApp } from './build.ts';
import { loadConfig } from './config.ts';
import { createDatabase } from './db/client.ts';
import { createMySqlDatabase } from './db/mysql-client.ts';
import { createAuthAdmin } from './modules/saas/auth-admin.ts';
import { createMySqlAuthAdmin } from './modules/saas/mysql-auth.ts';
import { createMailer } from './modules/saas/mail.ts';

// Vercel entrypoint (src/app.ts). The app is built in ./build.ts.
const config = loadConfig();

const mysqlDb = config.mysql ? createMySqlDatabase(config.mysql) : undefined;
const jwtSecret = new TextEncoder().encode(config.jwtSecret);

const kpiDb = mysqlDb ?? (config.kpiDatabaseUrl ? createDatabase({ url: config.kpiDatabaseUrl }) : undefined);
const controlDb = mysqlDb ?? (config.controlDatabaseUrl ? createDatabase({ url: config.controlDatabaseUrl }) : undefined);
const identityDb = mysqlDb ?? (config.identityDatabaseUrl ? createDatabase({ url: config.identityDatabaseUrl }) : undefined);

const authAdmin = mysqlDb
  ? createMySqlAuthAdmin(mysqlDb)
  : config.supabaseSecretKey
    ? createAuthAdmin({ supabaseUrl: config.supabaseUrl, secretKey: config.supabaseSecretKey })
    : undefined;

// No top-level await: Vercel's runtime may load this module with require()
buildApp({
  logger: true,
  database: kpiDb,
  controlDatabase: controlDb,
  identityDatabase: identityDb,
  askProviders: config.askProviders,
  mailer: config.mail
    ? createMailer(config.mail)
    : {
        async send(to: string, subject: string, text: string) {
          console.log(`\n📬 [EMAIL DISPATCHED]\nTo: ${to}\nSubject: ${subject}\n\n${text}\n----------------------------------------\n`);
        },
      },
  enforcePasswordChange: config.enforcePasswordChange,
  authAdmin,
  allowedOrigins: config.allowedOrigins,
  auth: {
    getKey: mysqlDb ? jwtSecret : createRemoteJWKSet(config.jwksUrl),
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
