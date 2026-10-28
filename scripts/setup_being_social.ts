import fs from 'node:fs';
import { randomUUID } from 'node:crypto';
import { createMySqlDatabase } from '../services/api/src/db/mysql-client.ts';
import { hashPassword } from '../services/api/src/modules/saas/mysql-auth.ts';
import { parseFormula } from '../packages/contracts/src/formula.ts';

const envFile = fs.readFileSync('services/api/.env', 'utf8');
const env: Record<string, string> = {};
for (const line of envFile.split('\n')) {
  const idx = line.indexOf('=');
  if (idx > 0) {
    env[line.slice(0, idx).trim()] = line.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
  }
}

async function setupBeingSocial() {
  const db = createMySqlDatabase({
    host: env.MYSQL_HOST,
    port: parseInt(env.MYSQL_PORT || '3306', 10),
    user: env.MYSQL_USER,
    password: env.MYSQL_PASSWORD,
    database: env.MYSQL_DATABASE,
  });

  console.log('🚀 Connecting to MySQL database...');

  const ownerEmail = 'beingsocial123@gmail.com';
  const ownerPass = 'sham@123';
  const ownerName = 'Being Social Admin';
  const orgName = 'Being Social';

  await db.transaction(async (tx) => {
    // 1. Setup Auth User for beingsocial123@gmail.com
    console.log('1. Setting up user:', ownerEmail);
    const passHash = hashPassword(ownerPass);
    let ownerSubject = randomUUID();

    const existingUsers = (await tx.query('SELECT id FROM auth_users WHERE email = ?', [ownerEmail])) as { id: string }[];
    if (existingUsers.length > 0) {
      ownerSubject = String(existingUsers[0].id);
      await tx.query(
        'UPDATE auth_users SET password_hash = ?, display_name = ?, role = "member", must_change_password = 0, email_confirmed_at = NOW(6) WHERE id = ?',
        [passHash, ownerName, ownerSubject]
      );
      console.log('   Updated existing user account ID:', ownerSubject);
    } else {
      await tx.query(
        'INSERT INTO auth_users (id, email, password_hash, display_name, role, must_change_password, email_confirmed_at, created_at) VALUES (?, ?, ?, ?, "member", 0, NOW(6), NOW(6))',
        [ownerSubject, ownerEmail, passHash, ownerName]
      );
      console.log('   Created new user account ID:', ownerSubject);
    }

    // 2. Setup Organization
    console.log('2. Setting up Organization:', orgName);
    let tenantId = randomUUID();
    const existingOrg = (await tx.query('SELECT id FROM kpi_organizations WHERE name = ?', [orgName])) as { id: string }[];
    if (existingOrg.length > 0) {
      tenantId = String(existingOrg[0].id);
      console.log('   Using existing organization ID:', tenantId);
    } else {
      await tx.query(
        'INSERT INTO kpi_organizations (id, name, status, status_changed_at, created_at) VALUES (?, ?, "active", NOW(6), NOW(6))',
        [tenantId, orgName]
      );
      console.log('   Created organization ID:', tenantId);
    }

    // 3. Setup Control Registry
    await tx.query(
      `INSERT INTO kpi_control_registry (id, name, created_by, owner_name, owner_email, owner_email_verified_at, industry, plan, subscription_status, created_at)
       VALUES (?, ?, ?, ?, ?, NOW(6), "Digital Marketing & Social Media", "Growth", "active", NOW(6))
       ON DUPLICATE KEY UPDATE owner_name = VALUES(owner_name), owner_email = VALUES(owner_email), owner_email_verified_at = NOW(6), subscription_status = "active"`,
      [tenantId, orgName, ownerSubject, ownerName, ownerEmail]
    );

    // 4. Setup Units Hierarchy
    console.log('3. Setting up organizational units...');
    let rootUnitId = randomUUID();
    const existingUnits = (await tx.query('SELECT id FROM kpi_units WHERE tenant_id = ? AND parent_id IS NULL', [tenantId])) as { id: string }[];
    if (existingUnits.length > 0) {
      rootUnitId = String(existingUnits[0].id);
    } else {
      await tx.query(
        'INSERT INTO kpi_units (id, tenant_id, name, kind, created_at) VALUES (?, ?, ?, "Headquarters", NOW(6))',
        [rootUnitId, tenantId, 'Being Social (HQ)']
      );
    }

    const subUnits = [
      { name: 'Social Media & Content Strategy', kind: 'Department' },
      { name: 'Online Reputation & Reviews (Birdeye)', kind: 'Department' },
      { name: 'Campaigns & Performance Marketing', kind: 'Department' },
      { name: 'Client Success & Accounts', kind: 'Department' },
    ];

    const unitMap = new Map<string, string>();
    unitMap.set('HQ', rootUnitId);

    for (const su of subUnits) {
      const uRows = (await tx.query('SELECT id FROM kpi_units WHERE tenant_id = ? AND name = ?', [tenantId, su.name])) as { id: string }[];
      let uid = randomUUID();
      if (uRows.length > 0) {
        uid = String(uRows[0].id);
      } else {
        await tx.query(
          'INSERT INTO kpi_units (id, tenant_id, name, kind, parent_id, created_at) VALUES (?, ?, ?, ?, ?, NOW(6))',
          [uid, tenantId, su.name, su.kind, rootUnitId]
        );
      }
      unitMap.set(su.name, uid);
    }

    // 5. Setup Membership for Owner
    console.log('4. Setting up memberships...');
    let ownerMemberId = randomUUID();
    const memRows = (await tx.query('SELECT id FROM kpi_memberships WHERE tenant_id = ? AND subject = ?', [tenantId, ownerSubject])) as { id: string }[];
    if (memRows.length > 0) {
      ownerMemberId = String(memRows[0].id);
      await tx.query(
        'UPDATE kpi_memberships SET display_name = ?, email = ?, owner = 1, active = 1 WHERE id = ?',
        [ownerName, ownerEmail, ownerMemberId]
      );
    } else {
      await tx.query(
        'INSERT INTO kpi_memberships (id, tenant_id, subject, display_name, email, owner, active, created_at) VALUES (?, ?, ?, ?, ?, 1, 1, NOW(6))',
        [ownerMemberId, tenantId, ownerSubject, ownerName, ownerEmail]
      );
    }

    // 6. Setup Business Roles
    console.log('5. Setting up roles & permissions...');
    const rolesToCreate = [
      {
        name: 'Organization Administrator',
        key: 'org_admin',
        desc: 'Full administrative authority over Being Social roles, staff, KPI targets, and configurations',
        caps: ['configure', 'submit', 'approve', 'view', 'act'],
      },
      {
        name: 'Social Media & Brand Head',
        key: 'social_media_head',
        desc: 'Manages social strategy, content performance, engagement rates, and impressions',
        caps: ['view', 'act', 'submit'],
      },
      {
        name: 'Reputation & Reviews Lead',
        key: 'reputation_lead',
        desc: 'Birdeye review monitoring, customer sentiment scores, and response rate management',
        caps: ['view', 'act', 'submit'],
      },
      {
        name: 'Campaign & Growth Analyst',
        key: 'growth_analyst',
        desc: 'Analyzes ad spend, ROAS, CAC, conversion metrics, and revenue attribution',
        caps: ['view', 'act'],
      },
      {
        name: 'Data Reviewer (Approver)',
        key: 'data_reviewer',
        desc: 'Reviews and approves monthly performance figures before results are published',
        caps: ['approve', 'view'],
      },
      {
        name: 'Data Contributor',
        key: 'data_contributor',
        desc: 'Uploads monthly social and review performance figures via CSV or web forms',
        caps: ['submit'],
      },
    ];

    const roleMap = new Map<string, string>();
    for (const r of rolesToCreate) {
      let rid = randomUUID();
      const rRows = (await tx.query('SELECT id FROM kpi_roles WHERE tenant_id = ? AND name = ?', [tenantId, r.name])) as { id: string }[];
      if (rRows.length > 0) {
        rid = String(rRows[0].id);
        await tx.query('UPDATE kpi_roles SET description = ?, template_key = ? WHERE id = ?', [r.desc, r.key, rid]);
      } else {
        await tx.query(
          'INSERT INTO kpi_roles (id, tenant_id, name, template_key, description, is_custom, created_at) VALUES (?, ?, ?, ?, ?, 0, NOW(6))',
          [rid, tenantId, r.name, r.key, r.desc]
        );
      }
      roleMap.set(r.name, rid);

      // Clean old grants and re-insert
      await tx.query('DELETE FROM kpi_grants WHERE tenant_id = ? AND role_id = ?', [tenantId, rid]);
      for (const cap of r.caps) {
        await tx.query(
          'INSERT INTO kpi_grants (id, tenant_id, role_id, capability) VALUES (UUID(), ?, ?, ?)',
          [tenantId, rid, cap]
        );
      }
    }

    // Assign owner to Organization Administrator role
    const adminRoleId = roleMap.get('Organization Administrator');
    if (adminRoleId) {
      await tx.query(
        'INSERT IGNORE INTO kpi_member_roles (tenant_id, member_id, role_id) VALUES (?, ?, ?)',
        [tenantId, ownerMemberId, adminRoleId]
      );
    }

    // 7. Setup Raw Input Measures
    console.log('6. Setting up raw data input measures...');
    const measures = [
      { key: 'total_reviews', name: 'Total Customer Reviews Received', unit: 'count' },
      { key: 'positive_reviews', name: 'Positive Sentiment Reviews (4-5 Stars)', unit: 'count' },
      { key: 'responded_reviews', name: 'Reviews Responded Within SLA', unit: 'count' },
      { key: 'promoter_count', name: 'NPS Promoters (9-10 Rating)', unit: 'count' },
      { key: 'detractor_count', name: 'NPS Detractors (0-6 Rating)', unit: 'count' },
      { key: 'total_respondents', name: 'Total Survey Respondents', unit: 'count' },
      { key: 'total_engagements', name: 'Social Media Interactions (Likes/Shares/Comments)', unit: 'count' },
      { key: 'total_impressions', name: 'Total Campaign Impressions', unit: 'count' },
      { key: 'total_spend', name: 'Total Campaign & Ad Spend', unit: 'INR' },
      { key: 'campaign_revenue', name: 'Attributed Campaign Revenue', unit: 'INR' },
      { key: 'new_customers', name: 'New Clients Acquired', unit: 'count' },
      { key: 'active_clients', name: 'Active Retained Clients', unit: 'count' },
      { key: 'beginning_clients', name: 'Beginning Period Clients', unit: 'count' },
      { key: 'monthly_revenue', name: 'Total Monthly Recurring Revenue (MRR)', unit: 'INR' },
      { key: 'avg_response_minutes', name: 'Average Review Response Time', unit: 'minutes' },
    ];

    for (const m of measures) {
      await tx.query(
        `INSERT INTO kpi_measures (tenant_id, \`key\`, name, unit, description, rolls_up, created_at)
         VALUES (?, ?, ?, ?, ?, 1, NOW(6))
         ON DUPLICATE KEY UPDATE name = VALUES(name), unit = VALUES(unit), description = VALUES(description), rolls_up = 1`,
        [tenantId, m.key, m.name, m.unit, m.name]
      );
    }

    // 8. Setup Definitions / KPIs (Being Social tailored)
    console.log('7. Setting up tailored & predefined KPIs...');
    const kpiDefinitions = [
      {
        key: 'review_sentiment_score',
        name: 'Review Sentiment Score (%)',
        desc: 'Percentage of customer reviews classified as positive across Birdeye, Google, and social platforms.',
        unit: '%',
        direction: 'higher',
        target: '92.00',
        domain: 'reputation',
        catalogId: 'REP-001',
        formula: parseFormula('(positive_reviews / total_reviews) * 100'),
      },
      {
        key: 'review_response_rate',
        name: 'Review Response Rate (%)',
        desc: 'Percentage of reviews replied to within SLA across all reputation platforms.',
        unit: '%',
        direction: 'higher',
        target: '95.00',
        domain: 'reputation',
        catalogId: 'REP-002',
        formula: parseFormula('(responded_reviews / total_reviews) * 100'),
      },
      {
        key: 'net_promoter_score',
        name: 'Net Promoter Score (NPS)',
        desc: 'Customer advocacy and loyalty score from brand sentiment surveys.',
        unit: '1',
        direction: 'higher',
        target: '75.00',
        domain: 'customer',
        catalogId: 'CUST-001',
        formula: parseFormula('((promoter_count - detractor_count) / total_respondents) * 100'),
      },
      {
        key: 'social_engagement_rate',
        name: 'Social Media Engagement Rate (%)',
        desc: 'Engagement efficiency: total likes, comments, and shares divided by campaign impressions.',
        unit: '%',
        direction: 'higher',
        target: '6.50',
        domain: 'marketing',
        catalogId: 'MKT-001',
        formula: parseFormula('(total_engagements / total_impressions) * 100'),
      },
      {
        key: 'return_on_ad_spend',
        name: 'Return on Ad Spend (ROAS)',
        desc: 'Revenue generated per Rupee of digital advertising and promotion spend.',
        unit: 'ratio',
        direction: 'higher',
        target: '4.50',
        domain: 'marketing',
        catalogId: 'MKT-002',
        formula: parseFormula('campaign_revenue / total_spend'),
      },
      {
        key: 'customer_acquisition_cost',
        name: 'Customer Acquisition Cost (CAC)',
        desc: 'Average marketing spend required to acquire each new paying client.',
        unit: 'INR',
        direction: 'lower',
        target: '1200.00',
        domain: 'marketing',
        catalogId: 'MKT-003',
        formula: parseFormula('total_spend / new_customers'),
      },
      {
        key: 'client_retention_rate',
        name: 'Client Retention Rate (%)',
        desc: 'Percentage of clients retained month-over-month on active retainers.',
        unit: '%',
        direction: 'higher',
        target: '94.00',
        domain: 'operations',
        catalogId: 'OPS-001',
        formula: parseFormula('(active_clients / beginning_clients) * 100'),
      },
      {
        key: 'monthly_recurring_revenue',
        name: 'Monthly Recurring Revenue (MRR)',
        desc: 'Total monthly recurring contracted revenue for agency clients.',
        unit: 'INR',
        direction: 'higher',
        target: '1800000.00',
        domain: 'finance',
        catalogId: 'FIN-001',
        formula: parseFormula('monthly_revenue'),
      },
    ];

    const kpiMap = new Map<string, string>();
    let sortOrder = 1;
    for (const kpi of kpiDefinitions) {
      let kid = randomUUID();
      const kRows = (await tx.query('SELECT id FROM kpi_definitions WHERE tenant_id = ? AND `key` = ?', [tenantId, kpi.key])) as { id: string }[];
      if (kRows.length > 0) {
        kid = String(kRows[0].id);
        await tx.query(
          `UPDATE kpi_definitions
           SET name = ?, description = ?, unit = ?, formula = ?, direction = ?, target = ?, domain = ?, state = "active", catalog_id = ?, sort_order = ?
           WHERE id = ?`,
          [kpi.name, kpi.desc, kpi.unit, JSON.stringify(kpi.formula), kpi.direction, kpi.target, kpi.domain, kpi.catalogId, sortOrder, kid]
        );
      } else {
        await tx.query(
          `INSERT INTO kpi_definitions (id, tenant_id, \`key\`, version, name, description, unit, formula, direction, target, state, domain, catalog_id, sort_order, created_at)
           VALUES (?, ?, ?, 1, ?, ?, ?, ?, ?, ?, "active", ?, ?, ?, NOW(6))`,
          [kid, tenantId, kpi.key, kpi.name, kpi.desc, kpi.unit, JSON.stringify(kpi.formula), kpi.direction, kpi.target, kpi.domain, kpi.catalogId, sortOrder]
        );
      }
      kpiMap.set(kpi.key, kid);
      sortOrder++;
    }

    // Grant all roles view permission on KPIs
    for (const rid of roleMap.values()) {
      for (const kid of kpiMap.values()) {
        await tx.query(
          'INSERT IGNORE INTO kpi_grants (id, tenant_id, role_id, capability, kpi_id) VALUES (UUID(), ?, ?, "view", ?)',
          [tenantId, rid, kid]
        );
      }
    }

    // 9. Historical Reporting Batches & Results
    console.log('8. Seeding reporting batches & calculated results...');
    const periods = [
      {
        start: '2026-07-01',
        end: '2026-07-31',
        data: {
          total_reviews: 420,
          positive_reviews: 382,
          responded_reviews: 395,
          promoter_count: 310,
          detractor_count: 38,
          total_respondents: 400,
          total_engagements: 45000,
          total_impressions: 720000,
          total_spend: 180000,
          campaign_revenue: 864000,
          new_customers: 160,
          active_clients: 48,
          beginning_clients: 50,
          monthly_revenue: 1650000,
          avg_response_minutes: 45,
        },
      },
      {
        start: '2026-08-01',
        end: '2026-08-31',
        data: {
          total_reviews: 490,
          positive_reviews: 455,
          responded_reviews: 478,
          promoter_count: 380,
          detractor_count: 32,
          total_respondents: 460,
          total_engagements: 58000,
          total_impressions: 890000,
          total_spend: 210000,
          campaign_revenue: 1050000,
          new_customers: 195,
          active_clients: 52,
          beginning_clients: 54,
          monthly_revenue: 1780000,
          avg_response_minutes: 30,
        },
      },
      {
        start: '2026-09-01',
        end: '2026-09-30',
        data: {
          total_reviews: 580,
          positive_reviews: 546,
          responded_reviews: 568,
          promoter_count: 450,
          detractor_count: 28,
          total_respondents: 520,
          total_engagements: 72000,
          total_impressions: 1050000,
          total_spend: 235000,
          campaign_revenue: 1222000,
          new_customers: 220,
          active_clients: 57,
          beginning_clients: 58,
          monthly_revenue: 1920000,
          avg_response_minutes: 25,
        },
      },
    ];

    for (const p of periods) {
      const batchId = randomUUID();
      const idempotencyKey = randomUUID();
      await tx.query(
        `INSERT INTO kpi_batches (id, tenant_id, unit_id, period_start, period_end, status, origin, submitted_by, approved_by, approved_at, idempotency_key, payload_hash, created_at)
         VALUES (?, ?, ?, ?, ?, "approved", "import", ?, ?, NOW(6), ?, "hash", NOW(6))`,
        [batchId, tenantId, rootUnitId, p.start, p.end, ownerMemberId, ownerMemberId, idempotencyKey]
      );

      // Insert inputs
      for (const [mKey, val] of Object.entries(p.data)) {
        await tx.query(
          `INSERT INTO kpi_inputs (id, tenant_id, batch_id, measure, value)
           VALUES (UUID(), ?, ?, ?, ?)`,
          [tenantId, batchId, mKey, Number(val)]
        );
      }

      // Compute and store calculated results for the period
      const sentimentVal = ((p.data.positive_reviews / p.data.total_reviews) * 100).toFixed(2);
      const responseRateVal = ((p.data.responded_reviews / p.data.total_reviews) * 100).toFixed(2);
      const npsVal = (((p.data.promoter_count - p.data.detractor_count) / p.data.total_respondents) * 100).toFixed(2);
      const engagementVal = ((p.data.total_engagements / p.data.total_impressions) * 100).toFixed(2);
      const roasVal = (p.data.campaign_revenue / p.data.total_spend).toFixed(2);
      const cacVal = (p.data.total_spend / p.data.new_customers).toFixed(2);
      const retentionVal = ((p.data.active_clients / p.data.beginning_clients) * 100).toFixed(2);
      const mrrVal = p.data.monthly_revenue.toFixed(2);

      const calculatedResults = [
        { key: 'review_sentiment_score', value: sentimentVal, target: '92.00', onTarget: parseFloat(sentimentVal) >= 92 },
        { key: 'review_response_rate', value: responseRateVal, target: '95.00', onTarget: parseFloat(responseRateVal) >= 95 },
        { key: 'net_promoter_score', value: npsVal, target: '75.00', onTarget: parseFloat(npsVal) >= 75 },
        { key: 'social_engagement_rate', value: engagementVal, target: '6.50', onTarget: parseFloat(engagementVal) >= 6.5 },
        { key: 'return_on_ad_spend', value: roasVal, target: '4.50', onTarget: parseFloat(roasVal) >= 4.5 },
        { key: 'customer_acquisition_cost', value: cacVal, target: '1200.00', onTarget: parseFloat(cacVal) <= 1200 },
        { key: 'client_retention_rate', value: retentionVal, target: '94.00', onTarget: parseFloat(retentionVal) >= 94 },
        { key: 'monthly_recurring_revenue', value: mrrVal, target: '1800000.00', onTarget: parseFloat(mrrVal) >= 1800000 },
      ];

      for (const res of calculatedResults) {
        const kId = kpiMap.get(res.key);
        if (!kId) continue;
        const valObj = JSON.stringify({ status: "available", value: res.value });
        const originArr = JSON.stringify(["calculated"]);
        const inputIdsArr = JSON.stringify([]);
        const runId = randomUUID();
        await tx.query(
          `INSERT INTO kpi_results (id, tenant_id, kpi_id, unit_id, period_start, period_end, value, input_ids, origin, target, direction, on_target, run_id, computed_at)
           VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?, "higher", ?, ?, NOW(6))`,
          [tenantId, kId, rootUnitId, p.start, p.end, valObj, inputIdsArr, originArr, res.target, res.onTarget ? 1 : 0, runId]
        );
      }
    }

    // 10. Sample Staff Members
    console.log('9. Adding team members with logins...');
    const staffMembers = [
      { name: 'Pooja Sharma', email: 'pooja.s@beingsocial.demo', roleKey: 'social_media_head' },
      { name: 'Rahul Mehta', email: 'rahul.m@beingsocial.demo', roleKey: 'reputation_lead' },
      { name: 'Vikram Seth', email: 'vikram.s@beingsocial.demo', roleKey: 'growth_analyst' },
    ];

    for (const sm of staffMembers) {
      let smSubject = randomUUID();
      const smExisting = (await tx.query('SELECT id FROM auth_users WHERE email = ?', [sm.email])) as { id: string }[];
      if (smExisting.length > 0) {
        smSubject = String(smExisting[0].id);
      } else {
        await tx.query(
          'INSERT INTO auth_users (id, email, password_hash, display_name, role, must_change_password, email_confirmed_at, created_at) VALUES (?, ?, ?, ?, "member", 0, NOW(6), NOW(6))',
          [smSubject, sm.email, passHash, sm.name]
        );
      }

      let smMemberId = randomUUID();
      const smMemRows = (await tx.query('SELECT id FROM kpi_memberships WHERE tenant_id = ? AND subject = ?', [tenantId, smSubject])) as { id: string }[];
      if (smMemRows.length > 0) {
        smMemberId = String(smMemRows[0].id);
      } else {
        await tx.query(
          'INSERT INTO kpi_memberships (id, tenant_id, subject, display_name, email, owner, active, created_at) VALUES (?, ?, ?, ?, ?, 0, 1, NOW(6))',
          [smMemberId, tenantId, smSubject, sm.name, sm.email]
        );
      }

      const assignedRoleId = roleMap.get(rolesToCreate.find((r) => r.key === sm.roleKey)?.name ?? '');
      if (assignedRoleId) {
        await tx.query(
          'INSERT IGNORE INTO kpi_member_roles (tenant_id, member_id, role_id) VALUES (?, ?, ?)',
          [tenantId, smMemberId, assignedRoleId]
        );
      }
    }

    // 11. Operational Actions
    console.log('10. Creating operational actions...');
    const latestResults = (await tx.query('SELECT id, kpi_id FROM kpi_results WHERE tenant_id = ? ORDER BY computed_at DESC LIMIT 3', [tenantId])) as { id: string; kpi_id: string }[];
    const actions = [
      {
        title: 'Respond to 12 pending customer reviews under 3 stars on Google and Birdeye',
        resId: latestResults[0]?.id || randomUUID(),
        assignee: ownerMemberId,
        due: '2026-11-05',
        state: 'in_progress',
      },
      {
        title: 'Optimize festive campaign ad creatives on Meta & LinkedIn to boost ROAS',
        resId: latestResults[1]?.id || randomUUID(),
        assignee: ownerMemberId,
        due: '2026-11-08',
        state: 'open',
      },
      {
        title: 'Publish monthly customer advocacy and Birdeye review audit report for leadership',
        resId: latestResults[2]?.id || randomUUID(),
        assignee: ownerMemberId,
        due: '2026-11-12',
        state: 'open',
      },
    ];

    for (const a of actions) {
      await tx.query(
        'INSERT INTO kpi_actions (id, tenant_id, title, result_id, assignee_id, due_date, state, version, created_at) VALUES (UUID(), ?, ?, ?, ?, ?, ?, 1, NOW(6))',
        [tenantId, a.title, a.resId, a.assignee, a.due, a.state]
      );
    }

    console.log('✅ Setup for Being Social completed successfully!');
    console.log('--------------------------------------------------');
    console.log('Organization:     Being Social');
    console.log('Login Email:      beingsocial123@gmail.com');
    console.log('Password:         sham@123');
    console.log('Tenant ID:       ', tenantId);
    console.log('Owner Subject:   ', ownerSubject);
    console.log('Units:           ', 1 + subUnits.length);
    console.log('Roles:           ', rolesToCreate.length);
    console.log('KPIs Configured: ', kpiDefinitions.length);
    console.log('Batches Seeded:  ', periods.length);
    console.log('--------------------------------------------------');
  });
}

setupBeingSocial().catch((err) => {
  console.error('❌ Setup failed:', err);
  process.exit(1);
});
