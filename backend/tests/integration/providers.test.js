// Установка переменных окружения ПЕРЕД импортами
process.env.NODE_ENV = "test"
process.env.JWT_SECRET = "test-secret"
process.env.DATABASE_URL = process.env.DATABASE_URL || "file:./prisma/test.db"
process.env.PORT = "0" // Отключаем запуск сервера на порту

import test from "node:test"
import assert from "node:assert/strict"
import request from "supertest"
import { app } from "../../src/index.js"
import { testPrisma, createTestUser, createTestProvider, createTestCategory, createTestService, cleanupTestData, createTestToken } from "../helpers.js"
import { ROLES } from "../../src/roles.js"

test.before(async () => {
  await cleanupTestData()
})

test.after(async () => {
  await cleanupTestData()
})

test("GET /providers returns list of providers", async () => {
  const user = await createTestUser({ emailConfirmed: true })
  const provider = await createTestProvider()
  const token = createTestToken(user)
  
  const res = await request(app)
    .get("/providers")
    .set("Authorization", `Bearer ${token}`)
  
  assert.equal(res.status, 200)
  assert.ok(Array.isArray(res.body.items))
  assert.ok(res.body.total >= 1)
  assert.ok(res.body.items.some(p => p.id === provider.id))
  
  await cleanupTestData()
})

test("GET /providers requires authentication", async () => {
  const res = await request(app)
    .get("/providers")
  
  assert.equal(res.status, 401)
  assert.equal(res.body.error, "unauthorized")
})

test("GET /providers/:id returns provider details", async () => {
  const user = await createTestUser({ emailConfirmed: true })
  const provider = await createTestProvider({ name: "Test Salon" })
  const token = createTestToken(user)
  
  const res = await request(app)
    .get(`/providers/${provider.id}`)
    .set("Authorization", `Bearer ${token}`)
  
  assert.equal(res.status, 200)
  assert.equal(res.body.id, provider.id)
  assert.equal(res.body.name, "Test Salon")
  
  await cleanupTestData()
})

test("GET /providers/categories returns categories", async () => {
  const user = await createTestUser({ emailConfirmed: true })
  const category = await createTestCategory({ name: "Test Category" })
  const token = createTestToken(user)
  
  const res = await request(app)
    .get("/providers/categories")
    .set("Authorization", `Bearer ${token}`)
  
  assert.equal(res.status, 200)
  assert.ok(Array.isArray(res.body))
  assert.ok(res.body.some(c => c.id === category.id))
  
  await cleanupTestData()
})

test("POST /providers creates provider for PROVIDER role", async () => {
  const provider = await createTestUser({ role: ROLES.PROVIDER, emailConfirmed: true })
  const token = createTestToken(provider)
  
  const res = await request(app)
    .post("/providers")
    .set("Authorization", `Bearer ${token}`)
    .send({
      name: "New Provider",
      description: "Test description",
      address: "Test Address",
    })
  
  assert.equal(res.status, 201)
  assert.equal(res.body.name, "New Provider")
  assert.equal(res.body.ownerUserId, provider.id)
  
  await cleanupTestData()
})

test("POST /providers rejects for CLIENT role", async () => {
  const client = await createTestUser({ role: ROLES.CLIENT, emailConfirmed: true })
  const token = createTestToken(client)
  
  const res = await request(app)
    .post("/providers")
    .set("Authorization", `Bearer ${token}`)
    .send({
      name: "New Provider",
      description: "Test description",
      address: "Test Address",
    })
  
  assert.equal(res.status, 403)
  assert.equal(res.body.error, "forbidden")
  
  await cleanupTestData()
})

test("GET /providers/:id/services returns services", async () => {
  const user = await createTestUser({ emailConfirmed: true })
  const provider = await createTestProvider()
  const service = await createTestService({ providerId: provider.id, title: "Test Service" })
  const token = createTestToken(user)
  
  const res = await request(app)
    .get(`/providers/${provider.id}/services`)
    .set("Authorization", `Bearer ${token}`)
  
  assert.equal(res.status, 200)
  assert.ok(Array.isArray(res.body))
  assert.ok(res.body.some(s => s.id === service.id))
  
  await cleanupTestData()
})

test("POST /providers/:id/services creates service as owner", async () => {
  const owner = await createTestUser({ role: ROLES.PROVIDER, emailConfirmed: true })
  const provider = await createTestProvider({ ownerUserId: owner.id })
  const token = createTestToken(owner)
  
  const res = await request(app)
    .post(`/providers/${provider.id}/services`)
    .set("Authorization", `Bearer ${token}`)
    .send({
      title: "New Service",
      price: 5000,
      durationMin: 60,
    })
  
  assert.equal(res.status, 201)
  assert.equal(res.body.title, "New Service")
  assert.equal(res.body.price, 5000)
  assert.equal(res.body.durationMin, 60)
  
  await cleanupTestData()
})

test("GET /providers/me returns owner provider", async () => {
  const owner = await createTestUser({ role: ROLES.PROVIDER, emailConfirmed: true })
  const provider = await createTestProvider({ ownerUserId: owner.id, name: "My Provider" })
  const token = createTestToken(owner)
  
  const res = await request(app)
    .get("/providers/me")
    .set("Authorization", `Bearer ${token}`)
  
  assert.equal(res.status, 200)
  assert.equal(res.body.id, provider.id)
  assert.equal(res.body.name, "My Provider")
  
  await cleanupTestData()
})

test("GET /providers/me returns 404 if no provider", async () => {
  const user = await createTestUser({ role: ROLES.CLIENT, emailConfirmed: true })
  const token = createTestToken(user)
  
  const res = await request(app)
    .get("/providers/me")
    .set("Authorization", `Bearer ${token}`)
  
  assert.equal(res.status, 404)
  assert.equal(res.body.error, "not_found")
  
  await cleanupTestData()
})

test("PATCH /providers/:id updates provider as owner", async () => {
  const owner = await createTestUser({ role: ROLES.PROVIDER, emailConfirmed: true })
  const provider = await createTestProvider({ ownerUserId: owner.id, name: "Old Name" })
  const token = createTestToken(owner)
  
  const res = await request(app)
    .patch(`/providers/${provider.id}`)
    .set("Authorization", `Bearer ${token}`)
    .send({ name: "New Name", description: "New Description" })
  
  assert.equal(res.status, 200)
  assert.equal(res.body.name, "New Name")
  assert.equal(res.body.description, "New Description")
  
  await cleanupTestData()
})

test("GET /providers/:id/availability returns available slots", async () => {
  const user = await createTestUser({ emailConfirmed: true })
  const provider = await createTestProvider()
  
  // Create working hours
  await testPrisma.workingHours.create({
    data: {
      providerId: provider.id,
      weekday: 1, // Monday
      startTime: "09:00",
      endTime: "18:00",
    },
  })
  
  const token = createTestToken(user)
  const tomorrow = new Date()
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)
  const weekday = ((tomorrow.getUTCDay() + 6) % 7) + 1
  
  if (weekday === 1) {
    const dateStr = tomorrow.toISOString().split("T")[0]
    const res = await request(app)
      .get(`/providers/${provider.id}/availability`)
      .set("Authorization", `Bearer ${token}`)
      .query({ date: dateStr })
    
    assert.equal(res.status, 200)
    assert.ok(Array.isArray(res.body))
  }
  
  await cleanupTestData()
})

test("DELETE /providers/:id/services/:sid deletes service as owner", async () => {
  const owner = await createTestUser({ role: ROLES.PROVIDER, emailConfirmed: true })
  const provider = await createTestProvider({ ownerUserId: owner.id })
  const service = await createTestService({ providerId: provider.id })
  const token = createTestToken(owner)
  
  const res = await request(app)
    .delete(`/providers/${provider.id}/services/${service.id}`)
    .set("Authorization", `Bearer ${token}`)
  
  assert.equal(res.status, 204)
  
  const deleted = await testPrisma.service.findUnique({ where: { id: service.id } })
  assert.equal(deleted, null)
  
  await cleanupTestData()
})


