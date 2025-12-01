// Установка переменных окружения ПЕРЕД импортами
process.env.NODE_ENV = "test"
process.env.JWT_SECRET = "test-secret"
process.env.DATABASE_URL = process.env.DATABASE_URL || "file:./prisma/test.db"
process.env.PORT = "0" // Отключаем запуск сервера на порту

import test from "node:test"
import assert from "node:assert/strict"
import request from "supertest"
import { app } from "../../src/index.js"
import { testPrisma, createTestUser, createTestProvider, cleanupTestData, createTestToken } from "../helpers.js"
import { ROLES } from "../../src/roles.js"

test.before(async () => {
  await cleanupTestData()
})

test.after(async () => {
  await cleanupTestData()
})

test("ensureOwnerOrAdmin allows provider owner to access their provider", async () => {
  const owner = await createTestUser({ role: ROLES.PROVIDER, emailConfirmed: true })
  const provider = await createTestProvider({ ownerUserId: owner.id })
  const token = createTestToken(owner)
  
  const res = await request(app)
    .get(`/providers/${provider.id}`)
    .set("Authorization", `Bearer ${token}`)
  
  assert.equal(res.status, 200)
  
  await cleanupTestData()
})

test("ensureOwnerOrAdmin allows ADMIN to access any provider", async () => {
  const admin = await createTestUser({ role: ROLES.ADMIN, emailConfirmed: true })
  const owner = await createTestUser({ email: "owner@test.com", role: ROLES.PROVIDER, emailConfirmed: true })
  const provider = await createTestProvider({ ownerUserId: owner.id })
  const token = createTestToken(admin)
  
  const res = await request(app)
    .patch(`/providers/${provider.id}`)
    .set("Authorization", `Bearer ${token}`)
    .send({ name: "Updated Name" })
  
  assert.equal(res.status, 200)
  
  await cleanupTestData()
})

test("ensureOwnerOrAdmin rejects non-owner access", async () => {
  const owner = await createTestUser({ email: "owner@test.com", role: ROLES.PROVIDER, emailConfirmed: true })
  const otherUser = await createTestUser({ email: "other@test.com", role: ROLES.PROVIDER, emailConfirmed: true })
  const provider = await createTestProvider({ ownerUserId: owner.id })
  const token = createTestToken(otherUser)
  
  const res = await request(app)
    .patch(`/providers/${provider.id}`)
    .set("Authorization", `Bearer ${token}`)
    .send({ name: "Hacked Name" })
  
  assert.equal(res.status, 403)
  assert.equal(res.body.error, "forbidden")
  
  await cleanupTestData()
})


