// Скрипт для сброса failed migrations в PostgreSQL
// Использование: node scripts/reset-migrations.js
// ВНИМАНИЕ: Используйте только в production, если у вас есть failed migrations

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function resetMigrations() {
  try {
    console.log("🔄 Подключение к базе данных...");
    
    // Проверяем подключение
    await prisma.$connect();
    console.log("✅ Подключено к базе данных");

    // Удаляем таблицу миграций
    console.log("🗑️ Удаление таблицы _prisma_migrations...");
    await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "_prisma_migrations" CASCADE;`);
    console.log("✅ Таблица _prisma_migrations удалена");

    console.log("\n✅ Готово! Теперь вы можете использовать:");
    console.log("   npx prisma db push --accept-data-loss");
    console.log("\n⚠️ ВНИМАНИЕ: После этого создайте новые миграции для PostgreSQL:");
    console.log("   npx prisma migrate dev --name init_postgresql");
  } catch (error) {
    console.error("❌ Ошибка:", error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

resetMigrations();


