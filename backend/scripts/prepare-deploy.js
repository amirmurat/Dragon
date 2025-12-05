// Скрипт для подготовки к деплою
// Автоматически определяет провайдер БД по DATABASE_URL

import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const schemaPath = join(__dirname, "..", "prisma", "schema.prisma");

const dbUrl = process.env.DATABASE_URL || "";

// Определяем провайдер по URL
let provider = "postgresql"; // по умолчанию PostgreSQL для production
if (dbUrl.startsWith("file:")) {
  provider = "sqlite";
} else if (
  dbUrl.startsWith("postgresql://") ||
  dbUrl.startsWith("postgres://")
) {
  provider = "postgresql";
}

// Читаем schema
let schema = readFileSync(schemaPath, "utf-8");

// Заменяем provider
schema = schema.replace(
  /provider\s*=\s*["'](sqlite|postgresql)["']/,
  `provider = "${provider}"`
);

// Сохраняем
writeFileSync(schemaPath, schema, "utf-8");

console.log(`✅ Prisma provider установлен на: ${provider}`);
