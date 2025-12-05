// Скрипт для переключения между SQLite и PostgreSQL
// Использование:
//   node scripts/switch-db.js sqlite    - для локальной разработки
//   node scripts/switch-db.js postgresql - для production

import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const schemaPath = join(__dirname, "..", "prisma", "schema.prisma");

const provider = process.argv[2] || "postgresql";

if (!["sqlite", "postgresql"].includes(provider)) {
  console.error("❌ Используйте: sqlite или postgresql");
  process.exit(1);
}

let schema = readFileSync(schemaPath, "utf-8");
schema = schema.replace(
  /provider\s*=\s*["'](sqlite|postgresql)["']/,
  `provider = "${provider}"`
);

writeFileSync(schemaPath, schema, "utf-8");
console.log(`✅ Prisma provider изменен на: ${provider}`);
