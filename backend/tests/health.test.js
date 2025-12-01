// Установка переменных окружения ПЕРЕД импортами
process.env.NODE_ENV = "test"
process.env.DATABASE_URL = process.env.DATABASE_URL || "file:./prisma/dev.db"
process.env.PORT = "0" // Отключаем запуск сервера на порту

import test from "node:test"
import assert from "node:assert/strict"
import request from "supertest"

const { app } = await import("../src/index.js")

test("health endpoint responds", async () => {
  const res = await request(app).get("/api/health")
  assert.equal(res.status, 200)
  assert.equal(res.body.status, "UP")
})

