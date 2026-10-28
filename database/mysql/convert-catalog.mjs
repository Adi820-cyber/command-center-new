// Converts database/catalog-seed.sql (Postgres) to database/mysql/catalog-seed-mysql.sql (MySQL)
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const inputPath = resolve("database/catalog-seed.sql");
const outputPath = resolve("database/mysql/catalog-seed-mysql.sql");

console.log("Reading PostgreSQL catalog seed...");
let sql = readFileSync(inputPath, "utf8");

// 1. Replace target database
sql = "USE orbit_kpi;\nSET FOREIGN_KEY_CHECKS = 0;\n" + sql;

// 2. Table mappings and escaping reserved column names
sql = sql.replaceAll("kpi_catalog.measures(key,", "kpi_catalog_measures(`key`,");
sql = sql.replaceAll("kpi_catalog.measures", "kpi_catalog_measures");
sql = sql.replaceAll("kpi_catalog.kpis", "kpi_catalog_kpis");
sql = sql.replaceAll("kpi_catalog.templates", "kpi_catalog_templates");
sql = sql.replaceAll("kpi_catalog.template_roles", "kpi_catalog_template_roles");
sql = sql.replaceAll("kpi_catalog.template_role_kpis", "kpi_catalog_template_role_kpis");
sql = sql.replaceAll(",position)", ",`position`)");

// 3. Remove Postgres type casts
sql = sql.replaceAll("::text[]", "");
sql = sql.replaceAll("::jsonb", "");

// 4. Translate ON CONFLICT ... DO UPDATE to MySQL ON DUPLICATE KEY UPDATE
sql = sql.replace(
  /on conflict \(key\) do update set name=excluded\.name, unit=excluded\.unit, description=excluded\.description, rolls_up=excluded\.rolls_up, domain=excluded\.domain;/g,
  "ON DUPLICATE KEY UPDATE name=VALUES(name), unit=VALUES(unit), description=VALUES(description), rolls_up=VALUES(rolls_up), domain=VALUES(domain);"
);

sql = sql.replace(
  /on conflict \(id\) do update set name=excluded\.name, description=excluded\.description, domain=excluded\.domain, industries=excluded\.industries, formula=excluded\.formula, formula_text=excluded\.formula_text, unit=excluded\.unit, direction=excluded\.direction, measures=excluded\.measures, needs_history=excluded\.needs_history, sources=excluded\.sources, scope=excluded\.scope;/g,
  "ON DUPLICATE KEY UPDATE name=VALUES(name), description=VALUES(description), domain=VALUES(domain), industries=VALUES(industries), formula=VALUES(formula), formula_text=VALUES(formula_text), unit=VALUES(unit), direction=VALUES(direction), measures=VALUES(measures), needs_history=VALUES(needs_history), sources=VALUES(sources), scope=VALUES(scope);"
);

// 5. Postgres ARRAY[...] / array[...] to JSON string '["..."]'
sql = sql.replace(/array\[(.*?)\]/gsi, (match, items) => {
  if (!items.trim()) return "'[]'";
  const parts = items.split(/,\s*(?=(?:[^']*'[^']*')*[^']*$)/).map((p) => {
    let s = p.trim();
    if (s.startsWith("'") && s.endsWith("'")) {
      return s.slice(1, -1).replaceAll("''", "'").replaceAll('"', '\\"');
    }
    return s;
  });
  return "'" + JSON.stringify(parts).replaceAll("'", "''") + "'";
});

// 4. Clean up transactions and footer
sql = sql.replaceAll("begin;", "START TRANSACTION;");
sql = sql.replaceAll("commit;", "COMMIT;\nSET FOREIGN_KEY_CHECKS = 1;");

writeFileSync(outputPath, sql, "utf8");
console.log(`Generated MySQL catalog seed at: ${outputPath}`);
