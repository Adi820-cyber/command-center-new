import mysql, { type Pool, type PoolConnection } from 'mysql2/promise';
import { randomUUID } from 'node:crypto';

export type SqlParam = string | number | boolean | null | undefined;

export interface Tx {
  query(text: string, params?: SqlParam[]): Promise<readonly Record<string, unknown>[]>;
}

export interface Database {
  transaction<T>(fn: (tx: Tx) => Promise<T>): Promise<T>;
  query(text: string, params?: SqlParam[]): Promise<readonly Record<string, unknown>[]>;
}

export interface MySqlDatabaseOptions {
  host?: string;
  port?: number;
  user?: string;
  password?: string;
  database?: string;
  url?: string;
  ssl?: boolean | object;
  connectionLimit?: number;
}

/** Parses standard MySQL connection URL (mysql://user:pass@host:port/db) */
export function parseMySqlUrl(rawUrl: string): MySqlDatabaseOptions {
  try {
    const parsed = new URL(rawUrl);
    return {
      host: parsed.hostname || '127.0.0.1',
      port: parsed.port ? parseInt(parsed.port, 10) : 3306,
      user: decodeURIComponent(parsed.username || 'root'),
      password: decodeURIComponent(parsed.password || ''),
      database: parsed.pathname ? parsed.pathname.replace(/^\//, '') : 'orbit_kpi',
    };
  } catch {
    return { database: 'orbit_kpi' };
  }
}

/**
 * Normalizes SQL queries written with PostgreSQL syntax (schemas, casts, $1, $2, functions, ...)
 * to MySQL 8.4 syntax and placeholder format (?, ?, ...).
 */
export function normalizeSqlForMySql(
  sqlText: string,
  params: SqlParam[] = [],
): { text: string; values: unknown[]; generatedId?: string } {
  let normalized = sqlText.trim();
  let finalParams = [...params];
  let generatedId: string | undefined;

  // 1. Intercept Postgres session / role management queries
  if (/^\s*set\s+local\s+role/i.test(normalized)) {
    return { text: 'SELECT 1 as noop', values: [] };
  }
  if (/^\s*select\s+set_config\('statement_timeout'/i.test(normalized)) {
    return { text: 'SELECT 1 as noop', values: [] };
  }
  if (/^\s*select\s+set_config\('kpi\.subject'/i.test(normalized)) {
    // Convert to MySQL session variable with explicit unicode collation
    return { text: 'SET @kpi_subject = CAST(? AS CHAR CHARACTER SET utf8mb4) COLLATE utf8mb4_unicode_ci', values: [finalParams[0]] };
  }
  if (/^\s*select\s+pg_advisory_xact_lock/i.test(normalized)) {
    return { text: 'SELECT 1 as noop', values: [] };
  }

  // 2. Rewrite Postgres schemas to MySQL table names
  normalized = normalized.replaceAll("kpi.organizations", "kpi_organizations");
  normalized = normalized.replaceAll("kpi.memberships", "kpi_memberships");
  normalized = normalized.replaceAll("kpi.units", "kpi_units");
  normalized = normalized.replaceAll("kpi.roles", "kpi_roles");
  normalized = normalized.replaceAll("kpi.member_roles", "kpi_member_roles");
  normalized = normalized.replaceAll("kpi.measures", "kpi_measures");
  normalized = normalized.replaceAll("kpi.definitions", "kpi_definitions");
  normalized = normalized.replaceAll("kpi.grants", "kpi_grants");
  normalized = normalized.replaceAll("kpi.invitations", "kpi_invitations");
  normalized = normalized.replaceAll("kpi.batches", "kpi_batches");
  normalized = normalized.replaceAll("kpi.inputs", "kpi_inputs");
  normalized = normalized.replaceAll("kpi.results", "kpi_results");
  normalized = normalized.replaceAll("kpi.actions", "kpi_actions");
  normalized = normalized.replaceAll("kpi.proposals", "kpi_proposals");
  normalized = normalized.replaceAll("kpi.audit", "kpi_audit");
  normalized = normalized.replaceAll("kpi.period_locks", "kpi_period_locks");
  normalized = normalized.replaceAll("kpi.email_codes", "kpi_email_codes");
  normalized = normalized.replaceAll("kpi.knowledge_chunks", "kpi_knowledge_chunks");
  normalized = normalized.replaceAll("kpi_control.operators", "kpi_control_operators");
  normalized = normalized.replaceAll("kpi_control.registry", "kpi_control_registry");
  normalized = normalized.replaceAll("kpi_control.lifecycle", "kpi_control_lifecycle");
  normalized = normalized.replaceAll("kpi_catalog.measures", "kpi_catalog_measures");
  normalized = normalized.replaceAll("kpi_catalog.kpis", "kpi_catalog_kpis");
  normalized = normalized.replaceAll("kpi_catalog.templates", "kpi_catalog_templates");
  normalized = normalized.replaceAll("kpi_catalog.template_roles", "kpi_catalog_template_roles");
  normalized = normalized.replaceAll("kpi_catalog.template_role_kpis", "kpi_catalog_template_role_kpis");

  // 3. Rewrite Postgres SQL functions to MySQL expressions
  // A. kpi.my_organizations()
  normalized = normalized.replaceAll(
    "from kpi.my_organizations()",
    "from (select o.id, o.name, m.owner, o.status from kpi_memberships m join kpi_organizations o on o.id=m.tenant_id where m.subject=@kpi_subject and m.active = 1) as my_orgs",
  );
  normalized = normalized.replaceAll(
    "kpi.my_organizations()",
    "(select o.id, o.name, m.owner, o.status from kpi_memberships m join kpi_organizations o on o.id=m.tenant_id where m.subject=@kpi_subject and m.active = 1)",
  );

  // B. kpi.is_owner(...)
  normalized = normalized.replaceAll(
    "kpi.is_owner(id)",
    "COALESCE((SELECT 1 FROM kpi_memberships m2 WHERE m2.tenant_id = kpi_organizations.id AND m2.subject = @kpi_subject AND m2.active = 1 AND m2.owner = 1 LIMIT 1), 0)",
  );
  normalized = normalized.replaceAll(
    "kpi.is_owner(m.tenant_id)",
    "COALESCE((SELECT 1 FROM kpi_memberships m2 WHERE m2.tenant_id = m.tenant_id AND m2.subject = @kpi_subject AND m2.active = 1 AND m2.owner = 1 LIMIT 1), 0)",
  );
  normalized = normalized.replaceAll(
    /select\s+kpi\.is_owner\(([^)]+)\)\s+as\s+([a-zA-Z0-9_]+)/gi,
    "SELECT COALESCE((SELECT 1 FROM kpi_memberships m2 WHERE m2.tenant_id = $1 AND m2.subject = @kpi_subject AND m2.active = 1 AND m2.owner = 1 LIMIT 1), 0) AS $2",
  );

  // C. kpi.is_member(...)
  normalized = normalized.replaceAll(
    /select\s+kpi\.is_member\(([^)]+)\)\s+as\s+([a-zA-Z0-9_]+)/gi,
    "SELECT COALESCE((SELECT 1 FROM kpi_memberships WHERE tenant_id = $1 AND subject = @kpi_subject AND active = 1 LIMIT 1), 0) AS $2",
  );

  // D. kpi.allowed(...)
  normalized = normalized.replaceAll(
    /select\s+kpi\.allowed\(\$1,\s*\$2(,\s*\$3)?(,\s*\$4)?\)\s+as\s+allowed/gi,
    "SELECT COALESCE((SELECT 1 FROM kpi_memberships m WHERE m.tenant_id = $1 AND m.subject = @kpi_subject AND m.active = 1 AND (m.owner = 1 OR EXISTS (SELECT 1 FROM kpi_member_roles mr JOIN kpi_grants g ON g.tenant_id = mr.tenant_id AND g.role_id = mr.role_id WHERE mr.tenant_id = m.tenant_id AND mr.member_id = m.id AND g.capability = $2)) LIMIT 1), 0) AS allowed",
  );

  // E. kpi.my_roles(...)
  normalized = normalized.replaceAll(
    /select\s+id,\s*name\s+from\s+kpi\.my_roles\(([^)]+)\)/gi,
    "SELECT r.id, r.name FROM kpi_member_roles mr JOIN kpi_roles r ON r.id = mr.role_id JOIN kpi_memberships m ON m.id = mr.member_id WHERE m.tenant_id = $1 AND m.subject = @kpi_subject AND m.active = 1",
  );
  normalized = normalized.replaceAll(
    /select\s+name\s+from\s+kpi\.my_roles\(([^)]+)\)/gi,
    "SELECT r.name FROM kpi_member_roles mr JOIN kpi_roles r ON r.id = mr.role_id JOIN kpi_memberships m ON m.id = mr.member_id WHERE m.tenant_id = $1 AND m.subject = @kpi_subject AND m.active = 1",
  );

  // F. kpi_control.list_organizations()
  normalized = normalized.replaceAll(
    /from\s+kpi_control\.list_organizations\(\)/gi,
    `from (select r.id, o.name, r.industry, r.plan, r.subscription_status, r.subscription_status as "subscriptionStatus", r.template_id, r.template_id as "templateId", o.status, o.status_changed_at, o.status_changed_at as "statusChangedAt", o.purge_after, o.purge_after as "purgeAfter", r.owner_name, r.owner_name as "ownerName", r.owner_email, r.owner_email as "ownerEmail", r.owner_email_verified_at, r.owner_email_verified_at as "ownerEmailVerifiedAt", (case when r.owner_password_reset_at is null then 'pending_reset' else 'verified' end) as credential_status, (case when r.owner_password_reset_at is null then 'pending_reset' else 'verified' end) as "credentialStatus", (select count(*) from kpi_memberships m where m.tenant_id = o.id and m.active = 1) as user_count, (select count(*) from kpi_memberships m where m.tenant_id = o.id and m.active = 1) as "userCount", (select count(*) from kpi_roles ro where ro.tenant_id = o.id) as role_count, (select count(*) from kpi_roles ro where ro.tenant_id = o.id) as "roleCount" from kpi_control_registry r join kpi_organizations o on o.id = r.id) as org_list`,
  );

  // F2. kpi_control.is_operator()
  normalized = normalized.replaceAll(
    /select\s+kpi_control\.is_operator\(\)\s+as\s+allowed/gi,
    'SELECT COALESCE((SELECT 1 FROM kpi_control_operators WHERE subject = @kpi_subject AND active = 1 LIMIT 1), 0) AS allowed',
  );

  // G. submittable_measure_keys lateral join in workspace.ts
  normalized = normalized.replaceAll(
    /cross\s+join\s+lateral\s+kpi\.submittable_measure_keys\([^)]+\)\s+s/gi,
    "JOIN (SELECT DISTINCT `key` as measure_key FROM kpi_measures WHERE tenant_id = $1) s ON 1=1",
  );
  normalized = normalized.replaceAll(
    /select\s+measure_key\s+from\s+kpi\.submittable_measure_keys\([^)]+\)/gi,
    "SELECT DISTINCT `key` as measure_key FROM kpi_measures WHERE tenant_id = $1",
  );

  // H. JSON aggregations and object construction
  normalized = normalized.replaceAll(/jsonb_build_object\(/gi, "JSON_OBJECT(");
  normalized = normalized.replaceAll(/jsonb_agg\(/gi, "JSON_ARRAYAGG(");
  normalized = normalized.replaceAll(
    "coalesce((select JSON_ARRAYAGG",
    "coalesce((select JSON_ARRAYAGG",
  );
  normalized = normalized.replaceAll("),'[]')", "), JSON_ARRAY())");
  normalized = normalized.replaceAll(
    /coalesce\(\(select\s+array_agg\(mr\.role_id\)\s+from\s+kpi_member_roles\s+mr\s+where\s+mr\.tenant_id=m\.tenant_id\s+and\s+mr\.member_id=m\.id\),'\{\}'\)/gi,
    "COALESCE((SELECT JSON_ARRAYAGG(mr.role_id) FROM kpi_member_roles mr WHERE mr.tenant_id = m.tenant_id AND mr.member_id = m.id), JSON_ARRAY())",
  );

  // I. distinct on in workspace.ts results
  if (/select\s+distinct\s+on\([^)]+\)/i.test(normalized)) {
    normalized = normalized.replace(/select\s+distinct\s+on\([^)]+\)/i, "SELECT");
  }

  // 4. Escape reserved words in MySQL like `key` and `position`
  normalized = normalized.replace(/\bwhere key =/gi, 'where `key` =');
  normalized = normalized.replace(/\band key =/gi, 'and `key` =');
  normalized = normalized.replace(/\bselect key\b/gi, 'select `key`');
  normalized = normalized.replace(/\bselect key,/gi, 'select `key`,');
  normalized = normalized.replace(/\bselect id, key\b/gi, 'select id, `key`');
  normalized = normalized.replace(/\bselect id,key\b/gi, 'select id,`key`');
  normalized = normalized.replace(/\border by key\b/gi, 'order by `key`');
  normalized = normalized.replace(/\bset key =/gi, 'set `key` =');
  normalized = normalized.replace(/\(key,/gi, '(`key`,');
  normalized = normalized.replace(/,key,/gi, ',`key`,');
  normalized = normalized.replace(/,key\)/gi, ',`key`)');
  normalized = normalized.replace(/,sort_order,key,/gi, ',sort_order,`key`,');
  normalized = normalized.replace(/,position\)/gi, ',`position`)');

  // 5. Remove Postgres type casts like ::uuid, ::text, ::jsonb, ::date, ::numeric, ::timestamptz
  normalized = normalized.replace(/::[a-zA-Z0-9_\.\[\]]+/g, '');

  // 6. Handle INSERT ... RETURNING id
  const insertReturningMatch = normalized.match(
    /^insert\s+into\s+([a-zA-Z0-9_`]+)\s*\(([^)]+)\)\s*values\s*\(([^)]+)\)\s*returning\s+id$/i,
  );
  if (insertReturningMatch && insertReturningMatch[1] && insertReturningMatch[2] && insertReturningMatch[3]) {
    const table = insertReturningMatch[1];
    const rawCols = insertReturningMatch[2];
    const rawVals = insertReturningMatch[3];
    const cols = rawCols.split(',').map((c) => c.trim().toLowerCase());

    if (!cols.includes('id') && !cols.includes('`id`')) {
      generatedId = randomUUID();
      normalized = `INSERT INTO ${table} (id, ${rawCols}) VALUES ($NEW_ID_SLOT, ${rawVals})`;
      finalParams = [generatedId, ...finalParams];
      normalized = normalized.replace('$NEW_ID_SLOT', '$1');
      // re-index remaining $1, $2 to $2, $3 etc
      let offset = 1;
      normalized = normalized.replace(/\$(\d+)/g, (m, d) => {
        if (m === '$1' && offset++ === 1) return '$1';
        return `$${parseInt(d, 10) + 1}`;
      });
    } else {
      normalized = normalized.replace(/\s*returning\s+id$/i, '');
    }
  }

  // Handle UPDATE ... RETURNING id
  if (/\s*returning\s+id$/i.test(normalized) && /^update\s+/i.test(normalized)) {
    normalized = normalized.replace(/\s*returning\s+id$/i, '');
    generatedId = String(finalParams[1] ?? finalParams[0] ?? '');
  }

  // 7. Postgres positional parameters $1, $2, ... -> ?
  const matches = [...normalized.matchAll(/\$(\d+)/g)];
  if (matches.length > 0) {
    const values: unknown[] = [];
    const text = normalized.replace(/\$(\d+)/g, (_, idxStr) => {
      const idx = parseInt(idxStr, 10) - 1;
      values.push(finalParams[idx]);
      return '?';
    });
    return { text, values, generatedId };
  }

  return { text: normalized, values: finalParams, generatedId };
}

export function createMySqlDatabase(options: MySqlDatabaseOptions): Database {
  const pool: Pool = options.url
    ? mysql.createPool({
        uri: options.url,
        waitForConnections: true,
        connectionLimit: options.connectionLimit ?? 10,
        queueLimit: 0,
        charset: 'utf8mb4',
      })
    : mysql.createPool({
        host: options.host ?? '127.0.0.1',
        port: options.port ?? 3306,
        user: options.user ?? 'root',
        password: options.password ?? '',
        database: options.database ?? 'orbit_kpi',
        waitForConnections: true,
        connectionLimit: options.connectionLimit ?? 10,
        queueLimit: 0,
        charset: 'utf8mb4',
        ssl: options.ssl ? { rejectUnauthorized: false } : undefined,
      });

function convertBooleansInRows(rows: Record<string, unknown>[]): Record<string, unknown>[] {
  const booleanFields = new Set([
    'allowed',
    'owner',
    'active',
    'is_owner',
    'rolls_up',
    'rollsUp',
    'on_target',
    'onTarget',
    'needs_history',
    'allow_self_approval',
    'must_change_password',
  ]);

  for (const row of rows) {
    for (const key of Object.keys(row)) {
      if (booleanFields.has(key)) {
        if (row[key] === 1) row[key] = true;
        else if (row[key] === 0) row[key] = false;
      } else if (row[key] instanceof Date) {
        row[key] = (row[key] as Date).toISOString();
      } else if (typeof row[key] === 'bigint') {
        row[key] = Number(row[key]);
      }
    }
  }
  return rows;
}

async function applyTemplateToTenant(
  conn: PoolConnection | Pool,
  tenantId: string,
  templateId: string,
  actorSubject = 'system',
): Promise<void> {
  const [tplRows] = await conn.query('SELECT id FROM kpi_catalog_templates WHERE id = ?', [templateId]);
  if (!Array.isArray(tplRows) || tplRows.length === 0) {
    throw new Error(`Unknown template: ${templateId}`);
  }

  await conn.query(
    `INSERT IGNORE INTO kpi_measures (tenant_id, \`key\`, name, unit, description, rolls_up, created_at)
     SELECT DISTINCT ?, m.\`key\`, m.name, m.unit, m.description, m.rolls_up, NOW(6)
     FROM kpi_catalog_template_role_kpis x
     JOIN kpi_catalog_kpis c ON c.id = x.kpi_id
     JOIN kpi_catalog_measures m ON JSON_CONTAINS(c.measures, JSON_QUOTE(m.\`key\`))
     WHERE x.template_id = ?`,
    [tenantId, templateId],
  );

  await conn.query(
    `INSERT IGNORE INTO kpi_definitions (id, tenant_id, \`key\`, version, name, description, unit, formula, direction, target, state, created_by, approved_by, domain, catalog_id, sort_order, scope, created_at)
     SELECT UUID(), ?, LOWER(REPLACE(c.id, '-', '_')), 1, c.name, c.description, c.unit, c.formula, c.direction, NULL, 'active', ?, ?, c.domain, c.id,
            (SELECT MIN(x2.position) FROM kpi_catalog_template_role_kpis x2 WHERE x2.template_id = ? AND x2.kpi_id = c.id),
            c.scope, NOW(6)
     FROM kpi_catalog_kpis c
     WHERE c.id IN (SELECT kpi_id FROM kpi_catalog_template_role_kpis WHERE template_id = ?)`,
    [tenantId, actorSubject, actorSubject, templateId, templateId],
  );

  const [roleRows] = await conn.query(
    'SELECT role_key, name, description, capabilities, position FROM kpi_catalog_template_roles WHERE template_id = ? ORDER BY position',
    [templateId],
  );

  if (Array.isArray(roleRows)) {
    for (const r of roleRows as Record<string, unknown>[]) {
      const roleId = randomUUID();
      await conn.query(
        'INSERT INTO kpi_roles (id, tenant_id, name, template_key, description, created_at) VALUES (?, ?, ?, ?, ?, NOW(6))',
        [roleId, tenantId, r.name, r.role_key, r.description],
      );

      let caps: string[] = [];
      if (Array.isArray(r.capabilities)) {
        caps = r.capabilities as string[];
      } else if (typeof r.capabilities === 'string') {
        try { caps = JSON.parse(r.capabilities); } catch { caps = []; }
      }
      for (const cap of caps) {
        if (!cap || typeof cap !== 'string' || !['configure', 'submit', 'approve', 'view', 'act'].includes(cap)) continue;
        await conn.query(
          'INSERT INTO kpi_grants (id, tenant_id, role_id, capability) VALUES (UUID(), ?, ?, ?)',
          [tenantId, roleId, cap],
        );
      }

      await conn.query(
        `INSERT INTO kpi_grants (id, tenant_id, role_id, capability, kpi_id)
         SELECT UUID(), ?, ?, 'view', d.id
         FROM kpi_catalog_template_role_kpis x
         JOIN kpi_definitions d ON d.tenant_id = ? AND d.catalog_id = x.kpi_id
         WHERE x.template_id = ? AND x.role_key = ?`,
        [tenantId, roleId, tenantId, templateId, r.role_key],
      );
    }
  }
}

  async function executeOnConnection(
    conn: PoolConnection | Pool,
    sqlText: string,
    params: SqlParam[] = [],
  ): Promise<readonly Record<string, unknown>[]> {
    const trimmed = sqlText.trim();

    // Intercept kpi_control.provision_with_people
    if (/select\s+kpi_control\.provision_with_people/i.test(trimmed)) {
      const orgName = String(params[0]);
      const templateId = params[1] ? String(params[1]) : null;
      let members: any[] = [];
      try {
        members = typeof params[2] === 'string' ? JSON.parse(params[2]) : ((params[2] as unknown as any[]) || []);
      } catch {
        members = [];
      }

      const tenantId = randomUUID();
      await conn.query(
        'INSERT INTO kpi_organizations (id, name, status, status_changed_at) VALUES (?, ?, "active", NOW(6))',
        [tenantId, orgName],
      );
      await conn.query(
        'INSERT INTO kpi_control_registry (id, name, created_by, template_id, created_at) VALUES (?, ?, COALESCE(@kpi_subject, "system"), ?, NOW(6))',
        [tenantId, orgName, templateId],
      );
      const unitId = randomUUID();
      await conn.query(
        'INSERT INTO kpi_units (id, tenant_id, name, kind, created_at) VALUES (?, ?, ?, "Organization", NOW(6))',
        [unitId, tenantId, orgName],
      );

      if (templateId) {
        await applyTemplateToTenant(conn, tenantId, templateId, 'system');
      }

      // 1. Ensure an explicit "Organization Administrator" role exists for the tenant
      const adminRoleId = randomUUID();
      await conn.query(
        `INSERT IGNORE INTO kpi_roles (id, tenant_id, name, template_key, description, created_at)
         VALUES (?, ?, 'Organization Administrator', 'org_admin', 'Full administrative authority over organization roles, staff, KPI targets, and configurations', NOW(6))`,
        [adminRoleId, tenantId],
      );

      // 2. Grant all administrative capabilities to this role
      const adminCaps = ['configure', 'submit', 'approve', 'view', 'act'];
      for (const cap of adminCaps) {
        await conn.query(
          'INSERT IGNORE INTO kpi_grants (id, tenant_id, role_id, capability) VALUES (UUID(), ?, ?, ?)',
          [tenantId, adminRoleId, cap],
        );
      }

      // 3. Grant view permissions on all tenant KPIs to the Organization Administrator role
      await conn.query(
        `INSERT IGNORE INTO kpi_grants (id, tenant_id, role_id, capability, kpi_id)
         SELECT UUID(), ?, ?, 'view', d.id
         FROM kpi_definitions d
         WHERE d.tenant_id = ?`,
        [tenantId, adminRoleId, tenantId],
      );

      for (const m of members) {
        const memberId = randomUUID();
        const subject = m.subject || randomUUID();
        const isOwner = m.owner === true || m.owner === 1 || m.owner === 'true';
        const displayName = m.displayName || (m.email ? m.email.split('@')[0] : 'Member');
        await conn.query(
          'INSERT INTO kpi_memberships (id, tenant_id, subject, display_name, email, owner, active, created_at) VALUES (?, ?, ?, ?, ?, ?, 1, NOW(6))',
          [memberId, tenantId, subject, displayName, m.email || '', isOwner ? 1 : 0],
        );

        if (isOwner) {
          // Explicitly assign the owner to the Organization Administrator role
          await conn.query(
            'INSERT IGNORE INTO kpi_member_roles (tenant_id, member_id, role_id) VALUES (?, ?, ?)',
            [tenantId, memberId, adminRoleId],
          );
        }

        if (Array.isArray(m.roleKeys) && m.roleKeys.length > 0) {
          for (const roleKey of m.roleKeys) {
            await conn.query(
              'INSERT IGNORE INTO kpi_member_roles (tenant_id, member_id, role_id) SELECT ?, ?, r.id FROM kpi_roles r WHERE r.tenant_id = ? AND r.template_key = ?',
              [tenantId, memberId, tenantId, roleKey],
            );
          }
        }
      }

      return [{ id: tenantId }];
    }

    // Intercept kpi_control.record_creation
    if (/select\s+kpi_control\.record_creation/i.test(trimmed)) {
      const tenantId = String(params[0]);
      const activate = params[1] === true || params[1] === 1 || params[1] === 'true';
      const ownerEmail = params[2] ? String(params[2]) : null;
      const verified = params[3] === true || params[3] === 1 || params[3] === 'true';

      await conn.query(
        'UPDATE kpi_organizations SET status = ? WHERE id = ?',
        [activate ? 'active' : 'pending', tenantId],
      );
      await conn.query(
        'UPDATE kpi_control_registry SET owner_email = ?, owner_email_verified_at = ? WHERE id = ?',
        [ownerEmail, verified ? new Date() : null, tenantId],
      );
      return [{ ok: true }];
    }

    // Intercept kpi_control.record_profile
    if (/select\s+kpi_control\.record_profile/i.test(trimmed)) {
      const tenantId = String(params[0]);
      const industry = params[1] ? String(params[1]) : 'Other';
      const plan = params[2] ? String(params[2]) : 'Pilot';
      const ownerName = params[3] ? String(params[3]) : null;
      const subStatus = params[4] ? String(params[4]) : 'active';

      await conn.query(
        'UPDATE kpi_control_registry SET industry = ?, plan = ?, owner_name = ?, subscription_status = ? WHERE id = ?',
        [industry, plan, ownerName, subStatus, tenantId],
      );
      return [{ ok: true }];
    }

    // Intercept kpi_control.set_org_status
    if (/select\s+kpi_control\.set_org_status/i.test(trimmed)) {
      const tenantId = String(params[0]);
      const status = String(params[1]);
      await conn.query(
        'UPDATE kpi_organizations SET status = ?, status_changed_at = NOW(6) WHERE id = ?',
        [status, tenantId],
      );
      await conn.query(
        'INSERT INTO kpi_control_lifecycle (id, tenant_id, name, event, actor, at) SELECT UUID(), ?, o.name, ?, COALESCE(@kpi_subject, "operator"), NOW(6) FROM kpi_organizations o WHERE o.id = ?',
        [tenantId, status, tenantId],
      );
      return [{ ok: true }];
    }

    // Intercept kpi_control.purge_organization
    if (/select\s+kpi_control\.purge_organization/i.test(trimmed)) {
      const tenantId = String(params[0]);
      const [members] = await conn.query('SELECT subject FROM kpi_memberships WHERE tenant_id = ?', [tenantId]);
      const subjects = Array.isArray(members) ? (members as any[]).map((m) => m.subject) : [];
      await conn.query('DELETE FROM kpi_organizations WHERE id = ?', [tenantId]);
      await conn.query('DELETE FROM kpi_control_registry WHERE id = ?', [tenantId]);
      return [{ subjects }];
    }

    // Intercept kpi_control.add_people_to
    if (/select\s+kpi_control\.add_people_to/i.test(trimmed)) {
      const tenantId = String(params[0]);
      let members: any[] = [];
      try {
        members = typeof params[1] === 'string' ? JSON.parse(params[1]) : ((params[1] as unknown as any[]) || []);
      } catch {
        members = [];
      }
      for (const m of members) {
        const memberId = randomUUID();
        const subject = m.subject || randomUUID();
        const isOwner = m.owner === true || m.owner === 1;
        const displayName = m.displayName || (m.email ? m.email.split('@')[0] : 'Member');
        await conn.query(
          'INSERT INTO kpi_memberships (id, tenant_id, subject, display_name, email, owner, active, created_at) VALUES (?, ?, ?, ?, ?, ?, 1, NOW(6))',
          [memberId, tenantId, subject, displayName, m.email || '', isOwner ? 1 : 0],
        );
        if (Array.isArray(m.roleKeys)) {
          for (const roleKey of m.roleKeys) {
            await conn.query(
              'INSERT IGNORE INTO kpi_member_roles (tenant_id, member_id, role_id) SELECT ?, ?, r.id FROM kpi_roles r WHERE r.tenant_id = ? AND r.template_key = ?',
              [tenantId, memberId, tenantId, roleKey],
            );
          }
        }
      }
      return [{ count: members.length }];
    }

    // Intercept kpi.start_from_template
    if (/select\s+kpi\.start_from_template/i.test(trimmed)) {
      const tenantId = String(params[0]);
      const templateId = String(params[1]);
      await applyTemplateToTenant(conn, tenantId, templateId, 'system');
      await conn.query('UPDATE kpi_control_registry SET template_id = ? WHERE id = ?', [templateId, tenantId]);
      return [{ ok: true }];
    }

    // Intercept kpi.add_catalog_kpi
    if (/select\s+kpi\.add_catalog_kpi/i.test(trimmed)) {
      const tenantId = String(params[0]);
      const catalogId = String(params[1]);
      const defId = randomUUID();

      const [kpiRows] = await conn.query('SELECT * FROM kpi_catalog_kpis WHERE id = ?', [catalogId]);
      if (Array.isArray(kpiRows) && kpiRows[0]) {
        const c = kpiRows[0] as any;
        await conn.query(
          `INSERT IGNORE INTO kpi_measures (tenant_id, \`key\`, name, unit, description, rolls_up, created_at)
           SELECT ?, m.\`key\`, m.name, m.unit, m.description, m.rolls_up, NOW(6)
           FROM kpi_catalog_measures m
           WHERE JSON_CONTAINS(?, JSON_QUOTE(m.\`key\`))`,
          [tenantId, JSON.stringify(c.measures || [])],
        );

        await conn.query(
          `INSERT INTO kpi_definitions (id, tenant_id, \`key\`, version, name, description, unit, formula, direction, target, state, created_by, domain, catalog_id, scope, created_at)
           VALUES (?, ?, LOWER(REPLACE(?, '-', '_')), 1, ?, ?, ?, ?, ?, NULL, 'active', COALESCE(@kpi_subject, 'owner'), ?, ?, ?, NOW(6))`,
          [defId, tenantId, c.id, c.name, c.description, c.unit, JSON.stringify(c.formula), c.direction, c.domain, c.id, c.scope || 'all'],
        );
      }
      return [{ id: defId }];
    }

    // Intercept kpi.set_target
    if (/select\s+kpi\.set_target/i.test(trimmed)) {
      const tenantId = String(params[0]);
      const kpiId = String(params[1]);
      const target = params[2];
      await conn.query('UPDATE kpi_definitions SET target = ? WHERE tenant_id = ? AND id = ?', [target, tenantId, kpiId]);
      return [{ ok: true }];
    }

    // Intercept kpi.save_role
    if (/select\s+kpi\.save_role/i.test(trimmed)) {
      const tenantId = String(params[0]);
      const existingRoleId = params[1] ? String(params[1]) : null;
      const roleName = String(params[2]);
      let grants: any[] = [];
      try {
        grants = typeof params[3] === 'string' ? JSON.parse(params[3]) : ((params[3] as unknown as any[]) || []);
      } catch {
        grants = [];
      }

      let roleId = existingRoleId;
      if (roleId) {
        await conn.query('UPDATE kpi_roles SET name = ? WHERE tenant_id = ? AND id = ?', [roleName, tenantId, roleId]);
        await conn.query('DELETE FROM kpi_grants WHERE tenant_id = ? AND role_id = ?', [tenantId, roleId]);
      } else {
        roleId = randomUUID();
        await conn.query(
          'INSERT INTO kpi_roles (id, tenant_id, name, is_custom, created_at) VALUES (?, ?, ?, 1, NOW(6))',
          [roleId, tenantId, roleName],
        );
      }

      for (const g of grants) {
        if (!g.capability || typeof g.capability !== 'string' || !['configure', 'submit', 'approve', 'view', 'act'].includes(g.capability)) continue;
        await conn.query(
          'INSERT INTO kpi_grants (id, tenant_id, role_id, capability, unit_id, kpi_id) VALUES (UUID(), ?, ?, ?, ?, ?)',
          [tenantId, roleId, g.capability, g.unitId ?? null, g.kpiId ?? null],
        );
      }

      return [{ id: roleId }];
    }

    // Intercept kpi.delete_role
    if (/select\s+kpi\.delete_role/i.test(trimmed)) {
      const tenantId = String(params[0]);
      const roleId = String(params[1]);
      await conn.query('DELETE FROM kpi_roles WHERE tenant_id = ? AND id = ?', [tenantId, roleId]);
      return [{ ok: true }];
    }

    // Intercept kpi.retire_kpi
    if (/select\s+kpi\.retire_kpi/i.test(trimmed)) {
      const tenantId = String(params[0]);
      const kpiId = String(params[1]);
      await conn.query('UPDATE kpi_definitions SET state = "retired" WHERE tenant_id = ? AND id = ?', [tenantId, kpiId]);
      return [{ ok: true }];
    }

    // Intercept kpi.set_kpi_audience
    if (/select\s+kpi\.set_kpi_audience/i.test(trimmed)) {
      const tenantId = String(params[0]);
      const kpiId = String(params[1]);
      const rawRoleIds = String(params[2] || '');
      const roleIds = rawRoleIds.replace(/^\{|\}$/g, '').split(',').map((s) => s.trim()).filter(Boolean);

      await conn.query('DELETE FROM kpi_grants WHERE tenant_id = ? AND kpi_id = ? AND capability = "view"', [tenantId, kpiId]);
      for (const rId of roleIds) {
        await conn.query('INSERT INTO kpi_grants (id, tenant_id, role_id, capability, kpi_id) VALUES (UUID(), ?, ?, "view", ?)', [tenantId, rId, kpiId]);
      }
      return [{ ok: true }];
    }

    // Intercept kpi.rename_unit
    if (/select\s+kpi\.rename_unit/i.test(trimmed)) {
      const tenantId = String(params[0]);
      const unitId = String(params[1]);
      const name = String(params[2]);
      const kind = String(params[3]);
      await conn.query('UPDATE kpi_units SET name = ?, kind = ? WHERE tenant_id = ? AND id = ?', [name, kind, tenantId, unitId]);
      return [{ ok: true }];
    }

    // Intercept kpi.delete_unit
    if (/select\s+kpi\.delete_unit/i.test(trimmed)) {
      const tenantId = String(params[0]);
      const unitId = String(params[1]);
      await conn.query('DELETE FROM kpi_units WHERE tenant_id = ? AND id = ?', [tenantId, unitId]);
      return [{ ok: true }];
    }

    // Intercept kpi.rename_organization
    if (/select\s+kpi\.rename_organization/i.test(trimmed)) {
      const tenantId = String(params[0]);
      const name = String(params[1]);
      await conn.query('UPDATE kpi_organizations SET name = ? WHERE id = ?', [name, tenantId]);
      await conn.query('UPDATE kpi_control_registry SET name = ? WHERE id = ?', [name, tenantId]);
      return [{ ok: true }];
    }

    // Intercept kpi.approve_batch
    if (/select\s+kpi\.approve_batch/i.test(trimmed)) {
      const tenantId = String(params[0]);
      const batchId = String(params[1]);
      await conn.query('UPDATE kpi_batches SET status = "approved", approved_by = COALESCE(@kpi_subject, "owner"), approved_at = NOW(6) WHERE tenant_id = ? AND id = ?', [tenantId, batchId]);
      return [{ ok: true }];
    }

    // Intercept kpi.reject_batch
    if (/select\s+kpi\.reject_batch/i.test(trimmed)) {
      const tenantId = String(params[0]);
      const batchId = String(params[1]);
      await conn.query('UPDATE kpi_batches SET status = "rejected", approved_by = COALESCE(@kpi_subject, "owner"), approved_at = NOW(6) WHERE tenant_id = ? AND id = ?', [tenantId, batchId]);
      return [{ ok: true }];
    }

    // Intercept kpi.issue_email_code
    if (/select\s+kpi\.issue_email_code/i.test(trimmed)) {
      const codeHash = String(params[0]);
      await conn.query(
        'UPDATE kpi_email_codes SET expires_at = NOW(6) WHERE subject = @kpi_subject AND used_at IS NULL AND expires_at > NOW(6)',
      );
      await conn.query(
        'INSERT INTO kpi_email_codes (id, subject, purpose, code_hash, created_at, expires_at) VALUES (UUID(), @kpi_subject, "password", ?, NOW(6), DATE_ADD(NOW(6), INTERVAL 10 MINUTE))',
        [codeHash],
      );
      return [{ ok: true }];
    }

    // Intercept kpi.use_email_code
    if (/select\s+kpi\.use_email_code/i.test(trimmed)) {
      const codeHash = String(params[0]);
      const [rows] = await conn.query(
        'SELECT id, code_hash, attempts FROM kpi_email_codes WHERE subject = @kpi_subject AND used_at IS NULL AND expires_at > NOW(6) ORDER BY created_at DESC LIMIT 1',
      );
      if (!Array.isArray(rows) || rows.length === 0) {
        throw new Error('There is no valid code. Ask for a new one.');
      }
      const codeRow = (rows as any[])[0];
      if (codeRow.attempts >= 5) {
        throw new Error('Too many wrong codes. Ask for a new one.');
      }
      if (codeRow.code_hash === codeHash) {
        await conn.query('UPDATE kpi_email_codes SET used_at = NOW(6) WHERE id = ?', [codeRow.id]);
        return [{ ok: true }];
      } else {
        await conn.query('UPDATE kpi_email_codes SET attempts = attempts + 1 WHERE id = ?', [codeRow.id]);
        return [{ ok: false }];
      }
    }

    // Intercept kpi.mark_owner_credentials_verified
    if (/select\s+kpi\.mark_owner_credentials_verified/i.test(trimmed)) {
      await conn.query(
        'UPDATE kpi_control_registry SET owner_password_reset_at = NOW(6) WHERE id IN (SELECT tenant_id FROM kpi_memberships WHERE subject = @kpi_subject AND owner = 1)',
      );
      return [{ ok: true }];
    }

    const { text, values, generatedId } = normalizeSqlForMySql(sqlText, params);
    const [rows] = await conn.query(text, values as any);

    if (generatedId) {
      return [{ id: generatedId }];
    }

    if (Array.isArray(rows)) {
      return convertBooleansInRows(rows as Record<string, unknown>[]);
    }
    return convertBooleansInRows([rows as unknown as Record<string, unknown>]);
  }

  return {
    async query(text: string, params: SqlParam[] = []) {
      const maxRetries = 3;
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          return await executeOnConnection(pool, text, params);
        } catch (err: any) {
          const isDeadlock = err?.code === 'ER_LOCK_DEADLOCK' || err?.errno === 1213;
          if (isDeadlock && attempt < maxRetries) {
            await new Promise((res) => setTimeout(res, 50 * attempt));
            continue;
          }
          throw err;
        }
      }
      return [];
    },

    async transaction<T>(fn: (tx: Tx) => Promise<T>): Promise<T> {
      const maxRetries = 3;
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        const connection = await pool.getConnection();
        try {
          await connection.beginTransaction();
          const tx: Tx = {
            query: (text, params = []) => executeOnConnection(connection, text, params),
          };
          const result = await fn(tx);
          await connection.commit();
          return result;
        } catch (err: any) {
          try { await connection.rollback(); } catch {}
          const isDeadlock = err?.code === 'ER_LOCK_DEADLOCK' || err?.errno === 1213;
          if (isDeadlock && attempt < maxRetries) {
            await new Promise((res) => setTimeout(res, 50 * attempt));
            continue;
          }
          throw err;
        } finally {
          connection.release();
        }
      }
      throw new Error('Transaction failed after deadlocks');
    },
  };
}
