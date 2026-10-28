import { z } from 'zod';
import { API_SURFACES, type ApiSurface } from './surface.ts';
import { DEFAULT_EMBEDDING_MODEL } from './modules/chatbot/embedder.ts';
import type { MailConfig } from './modules/saas/mail.ts';
import { groqProvider, openRouterProvider, type ModelProvider } from './modules/ask/narrator.ts';

/**
 * The only module that reads `process.env` (ARCH §13: keep platform-specific
 * env names behind one config module). Variable names follow `.env.example`.
 */
/**
 * An optional variable present but empty (`KEY=`) means "not set". Env files
 * routinely carry empty placeholders, and treating one as an invalid value
 * would stop the API at startup for a key nobody meant to configure.
 */
const optional = <T extends z.ZodType>(schema: T) =>
  z.preprocess((value) => (value === '' ? undefined : value), schema.optional());

const EnvSchema = z.object({
  SUPABASE_URL: optional(z.string().url()),
  SUPABASE_JWKS_URL: optional(z.string().url()),
  MYSQL_HOST: optional(z.string().min(1)),
  MYSQL_PORT: optional(z.coerce.number().int().positive().default(3306)),
  MYSQL_USER: optional(z.string().min(1)),
  MYSQL_PASSWORD: optional(z.string()),
  MYSQL_DATABASE: optional(z.string().min(1).default('orbit_kpi')),
  JWT_SECRET: optional(z.string().min(1)),
  DATABASE_URL: optional(z.string().min(1)),
  KPI_DATABASE_URL: optional(z.string().min(1)),
  CONTROL_DATABASE_URL: optional(z.string().min(1)),
  /** The identity API: lets an owner create logins for their own people. Holds the secret key. */
  IDENTITY_DATABASE_URL: optional(z.string().min(1)),
  /** Supabase secret key. Control API only: it lets the operator create logins for the people they add. */
  SUPABASE_SECRET_KEY: optional(z.string().min(1)),
  /** 'true': refuse customer data to anyone whose temporary password is not yet replaced through the emailed code. */
  ENFORCE_PASSWORD_CHANGE: optional(z.enum(['true', 'false'])),
  /** How the identity API sends codes: 'brevo' (free plan) or 'outbox' (a local file, for tests). */
  MAIL_PROVIDER: optional(z.enum(['brevo', 'outbox'])),
  BREVO_API_KEY: optional(z.string().min(1)),
  MAIL_FROM: optional(z.email()),
  MAIL_FROM_NAME: z.string().min(1).default('Command Center'),
  MAIL_OUTBOX: optional(z.string().min(1)),
  ALLOWED_ORIGINS: z.string().default(''),
  ORBIT_LIVE_SOURCES: z.string().default(''),
  /** Which half of Orbit this deployment serves (src/surface.ts). Default `all`. */
  ORBIT_SURFACE: optional(z.enum(API_SURFACES)),
  PORT: z.coerce.number().int().positive().default(3000),
  /*
   * Ask narration (ADR 0014). All optional: absent keys mean Ask stays fully
   * deterministic, which is the current shipped behaviour. A missing key must
   * degrade, never break.
   *
   * SERVER ONLY. Never expose these as VITE_* — Vite inlines VITE_* into the
   * browser bundle, so a model key in one is a published key.
   */
  GROQ_API_KEY: optional(z.string().min(1)),
  GROQ_MODEL: z.string().min(1).default('openai/gpt-oss-20b'),
  OPENROUTER_API_KEY: optional(z.string().min(1)),
  OPENROUTER_MODEL: optional(z.string().min(1)),
  /** Knowledge-base embeddings (ADR 0019). Must produce 1024 dimensions; uses the OpenRouter key. */
  EMBEDDING_MODEL: z.string().min(1).default(DEFAULT_EMBEDDING_MODEL),
}).superRefine((data, ctx) => {
  if (!data.MYSQL_HOST && !data.SUPABASE_URL) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'SUPABASE_URL is required',
      path: ['SUPABASE_URL'],
    });
  }
});

export interface MySqlConfig {
  host: string;
  port: number;
  user: string;
  password?: string;
  database: string;
}

export interface ApiConfig {
  mysql?: MySqlConfig;
  jwtSecret?: string;
  issuer: string;
  audience: string;
  jwksUrl: URL;
  databaseUrl: string | undefined;
  kpiDatabaseUrl: string | undefined;
  controlDatabaseUrl: string | undefined;
  identityDatabaseUrl: string | undefined;
  enforcePasswordChange: boolean;
  mail: MailConfig | undefined;
  /** Present only on the control API. Absent means people are added by invitation link. */
  supabaseSecretKey: string | undefined;
  supabaseUrl: string;
  allowedOrigins: readonly string[];
  /** Sources switched from fail-closed to real by `ORBIT_LIVE_SOURCES`. Empty by default. */
  liveSources: ReadonlySet<LiveSource>;
  port: number;
  /** Leader routes, ERP routes, or both (ADR 0016 §9). */
  surface: ApiSurface;
  /**
   * Ask narration providers, in fallback order. Empty when no key is configured,
   * which leaves Ask fully deterministic (ADR 0014).
   */
  askProviders: readonly ModelProvider[];
  /** Embedding model for the knowledge base (ADR 0019). */
  embeddingModel: string;
}

/**
 * Sources that can be switched on by configuration, each once its
 * prerequisite lands. Everything not listed stays fail-closed (`unavailable`).
 * - `memberships`, `entitlements`, `scope`, `entities`: Maruti's schema (migrations 000400–000500)
 * - `transitions`: Aditya's sign-off of services/api/TRANSITIONS.md
 * - `actions`, `audit`, `assignees`: migration 20260924000700
 * - `dataset`, `observations`, `exceptions`: migration 20260924000800 and seed 0002
 */
export const LIVE_SOURCES = [
  'memberships',
  'entitlements',
  'scope',
  'entities',
  'transitions',
  'actions',
  'audit',
  'assignees',
  'dataset',
  'observations',
  'exceptions',
  'erp',
  'knowledge',
] as const;
export type LiveSource = (typeof LIVE_SOURCES)[number];

/** Sources that read Postgres and therefore need `DATABASE_URL`. */
export const DATABASE_SOURCES: readonly LiveSource[] = [
  'memberships',
  'entitlements',
  'scope',
  'entities',
  'actions',
  'audit',
  'assignees',
  'dataset',
  'observations',
  'exceptions',
  'erp',
  'knowledge',
];

function mailConfig(vars: z.infer<typeof EnvSchema>): MailConfig | undefined {
  if (vars.MAIL_PROVIDER === 'outbox') {
    if (!vars.MAIL_OUTBOX) throw new Error('MAIL_PROVIDER=outbox needs MAIL_OUTBOX (a file path)');
    return { provider: 'outbox', file: vars.MAIL_OUTBOX };
  }
  if (vars.MAIL_PROVIDER === 'brevo') {
    if (!vars.BREVO_API_KEY || !vars.MAIL_FROM) throw new Error('MAIL_PROVIDER=brevo needs BREVO_API_KEY and MAIL_FROM');
    return { provider: 'brevo', apiKey: vars.BREVO_API_KEY, fromEmail: vars.MAIL_FROM, fromName: vars.MAIL_FROM_NAME };
  }
  return undefined;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): ApiConfig {
  const parsed = EnvSchema.safeParse(env);
  if (!parsed.success) {
    // Name the variables only; never echo their values.
    const names = [...new Set(parsed.error.issues.map((issue) => String(issue.path[0])))];
    throw new Error(`Invalid or missing API environment variables: ${names.join(', ')}`);
  }
  const vars = parsed.data;
  if ([vars.KPI_DATABASE_URL, vars.CONTROL_DATABASE_URL, vars.IDENTITY_DATABASE_URL].filter(Boolean).length > 1) {
    throw new Error('Deploy the customer API, control API and identity API separately; configure only one database credential in each process.');
  }
  if (vars.SUPABASE_SECRET_KEY && vars.KPI_DATABASE_URL) {
    // The customer API reads customer data. It must never hold a key that can create or alter logins.
    throw new Error('SUPABASE_SECRET_KEY belongs only on the control API, not on a process with KPI_DATABASE_URL.');
  }
  const base = (vars.SUPABASE_URL ?? 'https://orbit.internal').replace(/\/+$/, '');

  const mysqlConfig = vars.MYSQL_HOST
    ? {
        host: vars.MYSQL_HOST,
        port: vars.MYSQL_PORT ?? 3306,
        user: vars.MYSQL_USER ?? 'root',
        password: vars.MYSQL_PASSWORD,
        database: vars.MYSQL_DATABASE ?? 'orbit_kpi',
      }
    : undefined;

  const liveSources = parseLiveSources(vars.ORBIT_LIVE_SOURCES);
  if (!mysqlConfig && !vars.DATABASE_URL && DATABASE_SOURCES.some((source) => liveSources.has(source))) {
    throw new Error('ORBIT_LIVE_SOURCES names a database source but DATABASE_URL is not set');
  }

  return {
    mysql: mysqlConfig,
    jwtSecret: vars.JWT_SECRET || 'orbit-jwt-secret-secure-key-2026-auth',
    kpiDatabaseUrl: vars.KPI_DATABASE_URL,
    controlDatabaseUrl: vars.CONTROL_DATABASE_URL,
    identityDatabaseUrl: vars.IDENTITY_DATABASE_URL,
    enforcePasswordChange: vars.ENFORCE_PASSWORD_CHANGE === 'true',
    mail: mailConfig(vars),
    supabaseSecretKey: vars.SUPABASE_SECRET_KEY,
    supabaseUrl: base,
    issuer: mysqlConfig ? 'https://orbit.internal/auth/v1' : `${base}/auth/v1`,
    audience: 'authenticated',
    jwksUrl: new URL(vars.SUPABASE_JWKS_URL ?? `${base}/auth/v1/.well-known/jwks.json`),
    databaseUrl: vars.DATABASE_URL,
    allowedOrigins: parseOrigins(vars.ALLOWED_ORIGINS),
    liveSources,
    port: vars.PORT,
    surface: vars.ORBIT_SURFACE ?? 'all',
    askProviders: buildAskProviders(vars),
    embeddingModel: vars.EMBEDDING_MODEL,
  };
}

/**
 * Narration providers in fallback order: Groq first, OpenRouter second
 * (ADR 0014 §2).
 *
 * OpenRouter needs an explicit model name and has no default on purpose. Its
 * structured-output support is per *endpoint*, not per model, so a default
 * pinned here from documentation would be a guess about a specific endpoint's
 * capability at a moment I cannot check. A key with no model is treated as not
 * configured rather than silently routed to something arbitrary.
 */
function buildAskProviders(vars: z.infer<typeof EnvSchema>): readonly ModelProvider[] {
  const providers: ModelProvider[] = [];
  if (vars.GROQ_API_KEY) {
    providers.push(groqProvider(vars.GROQ_API_KEY, vars.GROQ_MODEL));
  }
  if (vars.OPENROUTER_API_KEY && vars.OPENROUTER_MODEL) {
    providers.push(openRouterProvider(vars.OPENROUTER_API_KEY, vars.OPENROUTER_MODEL));
  }
  return providers;
}

/** Exact origins only. Wildcards are rejected until Aditya decides the preview policy. */
function parseOrigins(raw: string): string[] {
  const origins = raw
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);

  for (const origin of origins) {
    const url = new URL(origin);
    if (origin.includes('*') || url.origin !== origin) {
      throw new Error(`ALLOWED_ORIGINS entries must be exact origins, got an invalid entry`);
    }
  }
  return origins;
}

/** Comma-separated source names. An unknown name is a configuration error, never ignored. */
function parseLiveSources(raw: string): ReadonlySet<LiveSource> {
  const names = raw
    .split(',')
    .map((name) => name.trim())
    .filter((name) => name.length > 0);
  const known = new Set<string>(LIVE_SOURCES);
  const unknown = names.filter((name) => !known.has(name));
  if (unknown.length > 0) {
    throw new Error(`ORBIT_LIVE_SOURCES has unknown source names: ${unknown.join(', ')}`);
  }
  return new Set(LIVE_SOURCES.filter((source) => names.includes(source)));
}
