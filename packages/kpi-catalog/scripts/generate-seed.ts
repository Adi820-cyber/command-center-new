import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { seedSql } from "../src/seed-sql.ts";

const target = fileURLToPath(new URL("../../../database/catalog-seed.sql", import.meta.url));
writeFileSync(target, seedSql());
console.log(`wrote ${target}`);
