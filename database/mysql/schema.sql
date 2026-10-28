-- ============================================================================
-- Orbit Command Center — MySQL 8.0 DDL & Setup Script
-- Replaces Supabase / PostgreSQL with native MySQL 8.0 schemas, tables, and auth.
-- Character Set: utf8mb4 | Collation: utf8mb4_unicode_ci
-- ============================================================================

CREATE DATABASE IF NOT EXISTS orbit_kpi
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE orbit_kpi;

SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------------------------------------------------------
-- 1. Authentication & Identity (Replaces Supabase auth.users)
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS auth_users;
CREATE TABLE auth_users (
  id CHAR(36) NOT NULL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  display_name VARCHAR(255) NOT NULL DEFAULT 'User',
  role VARCHAR(50) NOT NULL DEFAULT 'member',
  must_change_password TINYINT(1) NOT NULL DEFAULT 0,
  email_confirmed_at DATETIME(6) NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  INDEX idx_auth_users_email (email)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 2. Platform Control Plane (Operator Registry & Tenant Lifecycle)
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS kpi_control_operators;
CREATE TABLE kpi_control_operators (
  subject CHAR(36) NOT NULL PRIMARY KEY,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB;

DROP TABLE IF EXISTS kpi_control_registry;
CREATE TABLE kpi_control_registry (
  id CHAR(36) NOT NULL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  created_by CHAR(36) NOT NULL,
  owner_email VARCHAR(255) NULL,
  owner_name VARCHAR(255) NULL,
  owner_email_verified_by CHAR(36) NULL,
  owner_email_verified_at DATETIME(6) NULL,
  owner_password_reset_at DATETIME(6) NULL,
  industry VARCHAR(100) NOT NULL DEFAULT 'Other',
  plan VARCHAR(50) NOT NULL DEFAULT 'Pilot',
  subscription_status ENUM('trial', 'active', 'past_due', 'cancelled') NOT NULL DEFAULT 'trial',
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  INDEX idx_registry_owner_email (owner_email)
) ENGINE=InnoDB;

DROP TABLE IF EXISTS kpi_control_lifecycle;
CREATE TABLE kpi_control_lifecycle (
  id CHAR(36) NOT NULL PRIMARY KEY,
  tenant_id CHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  event VARCHAR(100) NOT NULL,
  actor CHAR(36) NOT NULL,
  at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  INDEX idx_lifecycle_tenant_at (tenant_id, at DESC)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 3. Core Tenant Organizations & Hierarchy
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS kpi_organizations;
CREATE TABLE kpi_organizations (
  id CHAR(36) NOT NULL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  allow_self_approval TINYINT(1) NOT NULL DEFAULT 0,
  status ENUM('pending', 'active', 'suspended', 'deleted') NOT NULL DEFAULT 'active',
  status_changed_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  deleted_at DATETIME(6) NULL,
  purge_after DATETIME(6) NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  INDEX idx_org_status (status)
) ENGINE=InnoDB;

DROP TABLE IF EXISTS kpi_units;
CREATE TABLE kpi_units (
  id CHAR(36) NOT NULL PRIMARY KEY,
  tenant_id CHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  kind VARCHAR(50) NOT NULL,
  parent_id CHAR(36) NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  CONSTRAINT fk_units_tenant FOREIGN KEY (tenant_id) REFERENCES kpi_organizations(id) ON DELETE CASCADE,
  CONSTRAINT fk_units_parent FOREIGN KEY (parent_id) REFERENCES kpi_units(id) ON DELETE SET NULL,
  INDEX idx_units_tenant (tenant_id, parent_id)
) ENGINE=InnoDB;

DROP TABLE IF EXISTS kpi_roles;
CREATE TABLE kpi_roles (
  id CHAR(36) NOT NULL PRIMARY KEY,
  tenant_id CHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  template_key VARCHAR(100) NULL,
  description TEXT NULL,
  is_custom TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  UNIQUE KEY uq_roles_tenant_name (tenant_id, name),
  CONSTRAINT fk_roles_tenant FOREIGN KEY (tenant_id) REFERENCES kpi_organizations(id) ON DELETE CASCADE,
  INDEX idx_roles_tenant (tenant_id)
) ENGINE=InnoDB;

DROP TABLE IF EXISTS kpi_memberships;
CREATE TABLE kpi_memberships (
  id CHAR(36) NOT NULL PRIMARY KEY,
  tenant_id CHAR(36) NOT NULL,
  subject CHAR(36) NOT NULL,
  display_name VARCHAR(255) NOT NULL DEFAULT 'Member',
  owner TINYINT(1) NOT NULL DEFAULT 0,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  UNIQUE KEY uq_memberships_tenant_subject (tenant_id, subject),
  CONSTRAINT fk_memberships_tenant FOREIGN KEY (tenant_id) REFERENCES kpi_organizations(id) ON DELETE CASCADE,
  INDEX idx_memberships_subject (subject),
  INDEX idx_memberships_tenant (tenant_id)
) ENGINE=InnoDB;

DROP TABLE IF EXISTS kpi_member_roles;
CREATE TABLE kpi_member_roles (
  tenant_id CHAR(36) NOT NULL,
  member_id CHAR(36) NOT NULL,
  role_id CHAR(36) NOT NULL,
  PRIMARY KEY (tenant_id, member_id, role_id),
  CONSTRAINT fk_member_roles_member FOREIGN KEY (member_id) REFERENCES kpi_memberships(id) ON DELETE CASCADE,
  CONSTRAINT fk_member_roles_role FOREIGN KEY (role_id) REFERENCES kpi_roles(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 4. Measures, Definitions & Permissions
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS kpi_measures;
CREATE TABLE kpi_measures (
  tenant_id CHAR(36) NOT NULL,
  `key` VARCHAR(64) NOT NULL,
  name VARCHAR(255) NOT NULL,
  unit VARCHAR(50) NOT NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (tenant_id, `key`),
  CONSTRAINT fk_measures_tenant FOREIGN KEY (tenant_id) REFERENCES kpi_organizations(id) ON DELETE CASCADE
) ENGINE=InnoDB;

DROP TABLE IF EXISTS kpi_definitions;
CREATE TABLE kpi_definitions (
  id CHAR(36) NOT NULL PRIMARY KEY,
  tenant_id CHAR(36) NOT NULL,
  `key` VARCHAR(100) NOT NULL,
  version INT NOT NULL DEFAULT 1,
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  unit VARCHAR(50) NOT NULL,
  formula JSON NOT NULL,
  direction ENUM('higher', 'lower', 'neutral') NOT NULL,
  target DECIMAL(30, 10) NULL,
  state ENUM('draft', 'active', 'retired') NOT NULL DEFAULT 'draft',
  created_by CHAR(36) NOT NULL,
  approved_by CHAR(36) NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  UNIQUE KEY uq_definitions_tenant_key_version (tenant_id, `key`, version),
  CONSTRAINT fk_definitions_tenant FOREIGN KEY (tenant_id) REFERENCES kpi_organizations(id) ON DELETE CASCADE,
  INDEX idx_definitions_tenant_state (tenant_id, `key`, state)
) ENGINE=InnoDB;

DROP TABLE IF EXISTS kpi_grants;
CREATE TABLE kpi_grants (
  id CHAR(36) NOT NULL PRIMARY KEY,
  tenant_id CHAR(36) NOT NULL,
  role_id CHAR(36) NOT NULL,
  capability ENUM('configure', 'submit', 'approve', 'view', 'act') NOT NULL,
  unit_id CHAR(36) NULL,
  kpi_id CHAR(36) NULL,
  CONSTRAINT fk_grants_tenant FOREIGN KEY (tenant_id) REFERENCES kpi_organizations(id) ON DELETE CASCADE,
  CONSTRAINT fk_grants_role FOREIGN KEY (role_id) REFERENCES kpi_roles(id) ON DELETE CASCADE,
  CONSTRAINT fk_grants_unit FOREIGN KEY (unit_id) REFERENCES kpi_units(id) ON DELETE CASCADE,
  CONSTRAINT fk_grants_kpi FOREIGN KEY (kpi_id) REFERENCES kpi_definitions(id) ON DELETE CASCADE,
  INDEX idx_grants_lookup (tenant_id, role_id, capability)
) ENGINE=InnoDB;

DROP TABLE IF EXISTS kpi_invitations;
CREATE TABLE kpi_invitations (
  id CHAR(36) NOT NULL PRIMARY KEY,
  tenant_id CHAR(36) NOT NULL,
  email VARCHAR(255) NOT NULL,
  token_hash VARCHAR(255) NOT NULL UNIQUE,
  owner TINYINT(1) NOT NULL DEFAULT 0,
  role_ids JSON NOT NULL,
  expires_at DATETIME(6) NOT NULL,
  accepted_at DATETIME(6) NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  CONSTRAINT fk_invitations_tenant FOREIGN KEY (tenant_id) REFERENCES kpi_organizations(id) ON DELETE CASCADE,
  INDEX idx_invitations_email (tenant_id, email)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 5. Data Batches, Inputs, and Computed Results
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS kpi_batches;
CREATE TABLE kpi_batches (
  id CHAR(36) NOT NULL PRIMARY KEY,
  tenant_id CHAR(36) NOT NULL,
  unit_id CHAR(36) NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  status ENUM('submitted', 'approved', 'rejected') NOT NULL DEFAULT 'submitted',
  origin ENUM('manual', 'import', 'synthetic') NOT NULL,
  submitted_by CHAR(36) NOT NULL,
  approved_by CHAR(36) NULL,
  approved_at DATETIME(6) NULL,
  idempotency_key CHAR(36) NOT NULL,
  payload_hash VARCHAR(255) NOT NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  UNIQUE KEY uq_batches_idempotency (tenant_id, idempotency_key),
  CONSTRAINT fk_batches_tenant FOREIGN KEY (tenant_id) REFERENCES kpi_organizations(id) ON DELETE CASCADE,
  CONSTRAINT fk_batches_unit FOREIGN KEY (unit_id) REFERENCES kpi_units(id) ON DELETE CASCADE,
  INDEX idx_batches_period (tenant_id, unit_id, period_start, period_end)
) ENGINE=InnoDB;

DROP TABLE IF EXISTS kpi_inputs;
CREATE TABLE kpi_inputs (
  id CHAR(36) NOT NULL PRIMARY KEY,
  tenant_id CHAR(36) NOT NULL,
  batch_id CHAR(36) NOT NULL,
  measure VARCHAR(64) NOT NULL,
  value DECIMAL(30, 10) NOT NULL,
  UNIQUE KEY uq_inputs_batch_measure (tenant_id, batch_id, measure),
  CONSTRAINT fk_inputs_batch FOREIGN KEY (batch_id) REFERENCES kpi_batches(id) ON DELETE CASCADE,
  INDEX idx_inputs_tenant (tenant_id, measure)
) ENGINE=InnoDB;

DROP TABLE IF EXISTS kpi_results;
CREATE TABLE kpi_results (
  id CHAR(36) NOT NULL PRIMARY KEY,
  tenant_id CHAR(36) NOT NULL,
  kpi_id CHAR(36) NOT NULL,
  unit_id CHAR(36) NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  value JSON NOT NULL,
  input_ids JSON NOT NULL,
  origin JSON NOT NULL,
  target DECIMAL(30, 10) NULL,
  direction VARCHAR(20) NOT NULL,
  on_target TINYINT(1) NULL,
  computed_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  run_id CHAR(36) NOT NULL,
  UNIQUE KEY uq_results_run_kpi (tenant_id, run_id, kpi_id),
  CONSTRAINT fk_results_tenant FOREIGN KEY (tenant_id) REFERENCES kpi_organizations(id) ON DELETE CASCADE,
  CONSTRAINT fk_results_kpi FOREIGN KEY (kpi_id) REFERENCES kpi_definitions(id) ON DELETE CASCADE,
  CONSTRAINT fk_results_unit FOREIGN KEY (unit_id) REFERENCES kpi_units(id) ON DELETE CASCADE,
  INDEX idx_results_kpi_period (tenant_id, kpi_id, period_start, period_end)
) ENGINE=InnoDB;

DROP TABLE IF EXISTS kpi_actions;
CREATE TABLE kpi_actions (
  id CHAR(36) NOT NULL PRIMARY KEY,
  tenant_id CHAR(36) NOT NULL,
  result_id CHAR(36) NOT NULL,
  title VARCHAR(255) NOT NULL,
  assignee_id CHAR(36) NOT NULL,
  due_date DATE NOT NULL,
  state ENUM('open', 'in_progress', 'done') NOT NULL DEFAULT 'open',
  version INT NOT NULL DEFAULT 1,
  created_by CHAR(36) NOT NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  CONSTRAINT fk_actions_tenant FOREIGN KEY (tenant_id) REFERENCES kpi_organizations(id) ON DELETE CASCADE,
  CONSTRAINT fk_actions_result FOREIGN KEY (result_id) REFERENCES kpi_results(id) ON DELETE CASCADE,
  CONSTRAINT fk_actions_assignee FOREIGN KEY (assignee_id) REFERENCES kpi_memberships(id) ON DELETE CASCADE,
  INDEX idx_actions_tenant_assignee (tenant_id, assignee_id, state)
) ENGINE=InnoDB;

DROP TABLE IF EXISTS kpi_proposals;
CREATE TABLE kpi_proposals (
  id CHAR(36) NOT NULL PRIMARY KEY,
  tenant_id CHAR(36) NOT NULL,
  configuration JSON NOT NULL,
  state ENUM('pending', 'accepted', 'rejected') NOT NULL DEFAULT 'pending',
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  CONSTRAINT fk_proposals_tenant FOREIGN KEY (tenant_id) REFERENCES kpi_organizations(id) ON DELETE CASCADE
) ENGINE=InnoDB;

DROP TABLE IF EXISTS kpi_audit;
CREATE TABLE kpi_audit (
  id CHAR(36) NOT NULL PRIMARY KEY,
  tenant_id CHAR(36) NOT NULL,
  subject CHAR(36) NOT NULL,
  event VARCHAR(100) NOT NULL,
  resource_id CHAR(36) NULL,
  payload JSON NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  INDEX idx_audit_tenant_at (tenant_id, created_at DESC)
) ENGINE=InnoDB;

DROP TABLE IF EXISTS kpi_period_locks;
CREATE TABLE kpi_period_locks (
  tenant_id CHAR(36) NOT NULL,
  unit_id CHAR(36) NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  PRIMARY KEY (tenant_id, unit_id, period_start, period_end),
  CONSTRAINT fk_locks_unit FOREIGN KEY (unit_id) REFERENCES kpi_units(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 6. Email OTP Codes (Password Resets & Role Setup)
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS kpi_email_codes;
CREATE TABLE kpi_email_codes (
  id CHAR(36) NOT NULL PRIMARY KEY,
  subject CHAR(36) NOT NULL,
  purpose ENUM('password', 'role_creation') NOT NULL DEFAULT 'password',
  code_hash VARCHAR(64) NOT NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  expires_at DATETIME(6) NOT NULL,
  attempts INT NOT NULL DEFAULT 0,
  used_at DATETIME(6) NULL,
  INDEX idx_email_codes_lookup (subject, purpose, created_at DESC)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 7. Knowledge Chunks for AI Assistant & Grounding
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS kpi_knowledge_chunks;
CREATE TABLE kpi_knowledge_chunks (
  id CHAR(36) NOT NULL PRIMARY KEY,
  tenant_id CHAR(36) NOT NULL,
  kpi_id CHAR(36) NULL,
  unit_id CHAR(36) NULL,
  title VARCHAR(255) NOT NULL,
  content MEDIUMTEXT NOT NULL,
  category VARCHAR(50) NOT NULL DEFAULT 'general',
  domain VARCHAR(50) NOT NULL DEFAULT 'general',
  source VARCHAR(50) NOT NULL DEFAULT 'auto',
  source_key VARCHAR(100) NULL,
  visible_role_keys JSON NOT NULL,
  content_hash VARCHAR(64) NULL,
  embedded_hash VARCHAR(64) NULL,
  embedding_model VARCHAR(100) NULL,
  embedding JSON NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  CONSTRAINT fk_knowledge_tenant FOREIGN KEY (tenant_id) REFERENCES kpi_organizations(id) ON DELETE CASCADE,
  INDEX idx_knowledge_tenant (tenant_id, category),
  FULLTEXT INDEX ft_knowledge_content (title, content)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 8. Global KPI Catalog (Templates & Standards)
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS kpi_catalog_measures;
CREATE TABLE kpi_catalog_measures (
  `key` VARCHAR(64) NOT NULL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  unit VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  rolls_up TINYINT(1) NOT NULL DEFAULT 1,
  domain VARCHAR(64) NOT NULL
) ENGINE=InnoDB;

DROP TABLE IF EXISTS kpi_catalog_kpis;
CREATE TABLE kpi_catalog_kpis (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  domain VARCHAR(64) NOT NULL,
  industries JSON NOT NULL,
  formula JSON NOT NULL,
  formula_text TEXT NOT NULL,
  unit VARCHAR(50) NOT NULL,
  direction ENUM('higher', 'lower', 'neutral') NOT NULL,
  measures JSON NOT NULL,
  needs_history TINYINT(1) NOT NULL DEFAULT 0,
  sources JSON NOT NULL,
  scope VARCHAR(50) NOT NULL DEFAULT 'all',
  INDEX idx_cat_kpis_domain (domain)
) ENGINE=InnoDB;

DROP TABLE IF EXISTS kpi_catalog_templates;
CREATE TABLE kpi_catalog_templates (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  industry VARCHAR(100) NOT NULL,
  description TEXT NOT NULL
) ENGINE=InnoDB;

DROP TABLE IF EXISTS kpi_catalog_template_roles;
CREATE TABLE kpi_catalog_template_roles (
  template_id VARCHAR(64) NOT NULL,
  role_key VARCHAR(64) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  capabilities JSON NOT NULL,
  position INT NOT NULL DEFAULT 0,
  PRIMARY KEY (template_id, role_key),
  CONSTRAINT fk_tpl_roles_template FOREIGN KEY (template_id) REFERENCES kpi_catalog_templates(id) ON DELETE CASCADE
) ENGINE=InnoDB;

DROP TABLE IF EXISTS kpi_catalog_template_role_kpis;
CREATE TABLE kpi_catalog_template_role_kpis (
  template_id VARCHAR(64) NOT NULL,
  role_key VARCHAR(64) NOT NULL,
  kpi_id VARCHAR(64) NOT NULL,
  position INT NOT NULL DEFAULT 0,
  PRIMARY KEY (template_id, role_key, kpi_id),
  CONSTRAINT fk_tpl_role_kpi_role FOREIGN KEY (template_id, role_key) REFERENCES kpi_catalog_template_roles(template_id, role_key) ON DELETE CASCADE,
  CONSTRAINT fk_tpl_role_kpi_kpi FOREIGN KEY (kpi_id) REFERENCES kpi_catalog_kpis(id) ON DELETE CASCADE
) ENGINE=InnoDB;

SET FOREIGN_KEY_CHECKS = 1;

-- ----------------------------------------------------------------------------
-- 9. Initial Bootstrap Seeds (Platform Operator & Demo Users)
-- ----------------------------------------------------------------------------
INSERT INTO auth_users (id, email, password_hash, display_name, role, must_change_password, email_confirmed_at)
VALUES
  ('0ae98de5-74d7-4145-867a-d23526ee7a07', 'ghanshamrn.a27@gmail.com', 'pbkdf2$100000$bfdde41d772c202591ae1f1b4ed8eb51$2cdd95499110e56a036b3b85207458b90ccfdfc464032a71878af3e91418e93bde81f61ae440a961e718428a7ccba7f81d7a7099c70aee10b868b896d6a92f3d', 'Ghansham (Platform Operator)', 'platform-operator', 0, NOW()),
  ('11111111-1111-1111-1111-111111111111', 'owner@kestrion.demo', '$scrypt$N=16384,r=8,p=1$pbkdf2_sha256$Password@123', 'Kestrion Admin', 'owner', 0, NOW()),
  ('22222222-2222-2222-2222-222222222222', 'hospital@kestrion.demo', '$scrypt$N=16384,r=8,p=1$pbkdf2_sha256$Password@123', 'Hospital Lead', 'member', 0, NOW())
ON DUPLICATE KEY UPDATE display_name = VALUES(display_name);

INSERT INTO kpi_control_operators (subject, active)
VALUES ('0ae98de5-74d7-4145-867a-d23526ee7a07', 1)
ON DUPLICATE KEY UPDATE active = 1;
