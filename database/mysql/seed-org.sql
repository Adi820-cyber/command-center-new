USE orbit_kpi;
SET FOREIGN_KEY_CHECKS = 0;

-- 1. Create Organization
INSERT INTO kpi_organizations (id, name, allow_self_approval, status)
VALUES ('a0000000-0000-4000-8000-000000000001', 'Kestrion Healthcare', 0, 'active')
ON DUPLICATE KEY UPDATE name = VALUES(name), status = VALUES(status);

-- 2. Register Organization in Control Registry
INSERT INTO kpi_control_registry (id, owner_email, owner_name, template_id, industry, plan, subscription_status)
VALUES ('a0000000-0000-4000-8000-000000000001', 'owner@kestrion.demo', 'Kestrion Admin', 'hospital-system', 'Healthcare', 'Enterprise', 'active')
ON DUPLICATE KEY UPDATE owner_email = VALUES(owner_email), industry = VALUES(industry), plan = VALUES(plan);

-- 3. Users in auth_users
INSERT INTO auth_users (id, email, password_hash, display_name, role, must_change_password, email_confirmed_at)
VALUES
  ('0ae98de5-74d7-4145-867a-d23526ee7a07', 'ghanshamrn.a27@gmail.com', '$scrypt$N=16384,r=8,p=1$pbkdf2_sha256$Ghansham@123', 'Ghansham (Platform Operator)', 'platform-operator', 0, NOW()),
  ('a0000000-0000-4000-8000-000000000002', 'owner@kestrion.demo', '$scrypt$N=16384,r=8,p=1$pbkdf2_sha256$Password@123', 'Kestrion Admin', 'owner', 0, NOW()),
  ('a0000000-0000-4000-8000-000000000003', 'hospital@kestrion.demo', '$scrypt$N=16384,r=8,p=1$pbkdf2_sha256$Password@123', 'Hospital Lead', 'member', 0, NOW())
ON DUPLICATE KEY UPDATE display_name = VALUES(display_name), password_hash = VALUES(password_hash);

-- 4. Memberships
INSERT INTO kpi_memberships (id, tenant_id, subject, display_name, owner, active)
VALUES
  ('b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000002', 'Kestrion Admin', 1, 1),
  ('b0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000001', '0ae98de5-74d7-4145-867a-d23526ee7a07', 'Ghansham', 1, 1),
  ('b0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000003', 'Hospital Lead', 0, 1)
ON DUPLICATE KEY UPDATE display_name = VALUES(display_name), owner = VALUES(owner), active = VALUES(active);

-- 5. Units
INSERT INTO kpi_units (id, tenant_id, name, kind, parent_id)
VALUES
  ('c0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'City General Hospital', 'hospital', NULL),
  ('c0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000001', 'Intensive Care Unit (ICU)', 'department', 'c0000000-0000-4000-8000-000000000001'),
  ('c0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000001', 'Cardiology & Critical Care', 'department', 'c0000000-0000-4000-8000-000000000001')
ON DUPLICATE KEY UPDATE name = VALUES(name), kind = VALUES(kind);

-- 6. Roles
INSERT INTO kpi_roles (id, tenant_id, name, template_key)
VALUES
  ('d0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'Executive Leadership', 'executive'),
  ('d0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000001', 'Clinical Operations Lead', 'clinical')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- 7. Member Roles
INSERT INTO kpi_member_roles (tenant_id, member_id, role_id)
VALUES
  ('a0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000001'),
  ('a0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000002', 'd0000000-0000-4000-8000-000000000001'),
  ('a0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000003', 'd0000000-0000-4000-8000-000000000002')
ON DUPLICATE KEY UPDATE role_id = VALUES(role_id);

-- 8. Grants
INSERT INTO kpi_grants (id, tenant_id, role_id, capability, unit_id, kpi_id)
VALUES
  ('e0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000001', 'configure', NULL, NULL),
  ('e0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000001', 'view', NULL, NULL),
  ('e0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000001', 'approve', NULL, NULL),
  ('e0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000002', 'view', NULL, NULL),
  ('e0000000-0000-4000-8000-000000000005', 'a0000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000002', 'submit', NULL, NULL)
ON DUPLICATE KEY UPDATE capability = VALUES(capability);

-- 9. Seed Measures from Catalog
INSERT INTO kpi_measures (tenant_id, `key`, name, unit, description, rolls_up)
SELECT 'a0000000-0000-4000-8000-000000000001', `key`, name, unit, description, rolls_up
FROM kpi_catalog_measures
LIMIT 20
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- 10. Seed Definitions from Catalog
INSERT INTO kpi_definitions (id, tenant_id, `key`, version, name, description, unit, formula, direction, target, state, created_by, domain, catalog_id, sort_order)
SELECT
  UUID(),
  'a0000000-0000-4000-8000-000000000001',
  LOWER(REPLACE(id, '-', '_')),
  1,
  name,
  description,
  unit,
  formula,
  direction,
  85.0,
  'active',
  'a0000000-0000-4000-8000-000000000002',
  domain,
  id,
  1
FROM kpi_catalog_kpis
LIMIT 10
ON DUPLICATE KEY UPDATE name = VALUES(name);

SET FOREIGN_KEY_CHECKS = 1;
