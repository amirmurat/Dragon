// Установка переменных окружения ПЕРЕД импортами
process.env.NODE_ENV = "test"
process.env.JWT_SECRET = "test-secret"
process.env.DATABASE_URL = process.env.DATABASE_URL || "file:./prisma/test.db"
process.env.PORT = "0" // Отключаем запуск сервера на порту

import test from "node:test"
import assert from "node:assert/strict"
import request from "supertest"
import { app } from "../../src/index.js"
import { testPrisma, createTestUser, createTestProvider, createTestCategory, createTestAppointment, cleanupTestData, createTestToken } from "../helpers.js"
import { ROLES } from "../../src/roles.js"

test.before(async () => {
  await cleanupTestData()
})

test.after(async () => {
  await cleanupTestData()
})

test("GET /admin/users requires ADMIN role", async () => {
  const client = await createTestUser({ role: ROLES.CLIENT, emailConfirmed: true })
  const token = createTestToken(client)
  
  const res = await request(app)
    .get("/admin/users")
    .set("Authorization", `Bearer ${token}`)
  
  assert.equal(res.status, 403)
  assert.equal(res.body.error, "forbidden")
  
  await cleanupTestData()
})

test("GET /admin/users returns users list for ADMIN", async () => {
  const admin = await createTestUser({ role: ROLES.ADMIN, emailConfirmed: true })
  const user1 = await createTestUser({ email: "user1@test.com", emailConfirmed: true })
  const user2 = await createTestUser({ email: "user2@test.com", emailConfirmed: true })
  const token = createTestToken(admin)
  
  const res = await request(app)
    .get("/admin/users")
    .set("Authorization", `Bearer ${token}`)
  
  assert.equal(res.status, 200)
  assert.ok(Array.isArray(res.body))
  assert.ok(res.body.length >= 2)
  assert.ok(res.body.some(u => u.id === user1.id))
  assert.ok(res.body.some(u => u.id === user2.id))
  
  await cleanupTestData()
})

test("GET /admin/users filters by role", async () => {
  const admin = await createTestUser({ role: ROLES.ADMIN, emailConfirmed: true })
  const client = await createTestUser({ email: "client@test.com", role: ROLES.CLIENT, emailConfirmed: true })
  const provider = await createTestUser({ email: "provider@test.com", role: ROLES.PROVIDER, emailConfirmed: true })
  const token = createTestToken(admin)
  
  const res = await request(app)
    .get("/admin/users?role=CLIENT")
    .set("Authorization", `Bearer ${token}`)
  
  assert.equal(res.status, 200)
  assert.ok(Array.isArray(res.body))
  assert.ok(res.body.every(u => u.role === ROLES.CLIENT))
  assert.ok(res.body.some(u => u.id === client.id))
  
  await cleanupTestData()
})

test("PATCH /admin/users/:id updates user role", async () => {
  const admin = await createTestUser({ role: ROLES.ADMIN, emailConfirmed: true })
  const user = await createTestUser({ role: ROLES.CLIENT, emailConfirmed: true })
  const token = createTestToken(admin)
  
  const res = await request(app)
    .patch(`/admin/users/${user.id}`)
    .set("Authorization", `Bearer ${token}`)
    .send({ role: ROLES.PROVIDER })
  
  assert.equal(res.status, 200)
  assert.equal(res.body.role, ROLES.PROVIDER)
  
  const updated = await testPrisma.user.findUnique({ where: { id: user.id } })
  assert.equal(updated.role, ROLES.PROVIDER)
  
  await cleanupTestData()
})

test("PATCH /admin/users/:id rejects invalid role", async () => {
  const admin = await createTestUser({ role: ROLES.ADMIN, emailConfirmed: true })
  const user = await createTestUser({ emailConfirmed: true })
  const token = createTestToken(admin)
  
  const res = await request(app)
    .patch(`/admin/users/${user.id}`)
    .set("Authorization", `Bearer ${token}`)
    .send({ role: "INVALID_ROLE" })
  
  assert.equal(res.status, 400)
  assert.equal(res.body.error, "invalid_role")
  
  await cleanupTestData()
})

test("DELETE /admin/users/:id deletes user", async () => {
  const admin = await createTestUser({ role: ROLES.ADMIN, emailConfirmed: true })
  const user = await createTestUser({ emailConfirmed: true })
  const token = createTestToken(admin)
  
  const res = await request(app)
    .delete(`/admin/users/${user.id}`)
    .set("Authorization", `Bearer ${token}`)
  
  assert.equal(res.status, 204)
  
  const deleted = await testPrisma.user.findUnique({ where: { id: user.id } })
  assert.equal(deleted, null)
  
  await cleanupTestData()
})

test("DELETE /admin/users/:id prevents self-deletion", async () => {
  const admin = await createTestUser({ role: ROLES.ADMIN, emailConfirmed: true })
  const token = createTestToken(admin)
  
  const res = await request(app)
    .delete(`/admin/users/${admin.id}`)
    .set("Authorization", `Bearer ${token}`)
  
  assert.equal(res.status, 400)
  assert.equal(res.body.error, "cannot_delete_self")
  
  await cleanupTestData()
})

test("GET /admin/providers returns providers list", async () => {
  const admin = await createTestUser({ role: ROLES.ADMIN, emailConfirmed: true })
  const provider1 = await createTestProvider({ name: "Provider 1" })
  const provider2 = await createTestProvider({ name: "Provider 2" })
  const token = createTestToken(admin)
  
  const res = await request(app)
    .get("/admin/providers")
    .set("Authorization", `Bearer ${token}`)
  
  assert.equal(res.status, 200)
  assert.ok(Array.isArray(res.body))
  assert.ok(res.body.length >= 2)
  assert.ok(res.body.some(p => p.id === provider1.id))
  assert.ok(res.body.some(p => p.id === provider2.id))
  
  await cleanupTestData()
})

test("GET /admin/providers filters by query", async () => {
  const admin = await createTestUser({ role: ROLES.ADMIN, emailConfirmed: true })
  const provider1 = await createTestProvider({ name: "Beauty Salon" })
  const provider2 = await createTestProvider({ name: "Hair Studio" })
  const token = createTestToken(admin)
  
  const res = await request(app)
    .get("/admin/providers?q=Beauty")
    .set("Authorization", `Bearer ${token}`)
  
  assert.equal(res.status, 200)
  assert.ok(Array.isArray(res.body))
  assert.ok(res.body.some(p => p.id === provider1.id))
  assert.ok(!res.body.some(p => p.id === provider2.id))
  
  await cleanupTestData()
})

test("GET /admin/metrics returns statistics", async () => {
  const admin = await createTestUser({ role: ROLES.ADMIN, emailConfirmed: true })
  await createTestUser({ email: "user1@test.com", emailConfirmed: true })
  await createTestProvider()
  await createTestAppointment({ 
    userId: admin.id, 
    providerId: (await createTestProvider()).id 
  })
  const token = createTestToken(admin)
  
  const res = await request(app)
    .get("/admin/metrics")
    .set("Authorization", `Bearer ${token}`)
  
  assert.equal(res.status, 200)
  assert.ok(typeof res.body.users === "number")
  assert.ok(typeof res.body.providers === "number")
  assert.ok(typeof res.body.appointments === "number")
  assert.ok(typeof res.body.newAppointments === "number")
  assert.ok(res.body.users >= 2)
  assert.ok(res.body.providers >= 2)
  
  await cleanupTestData()
})

test("POST /admin/categories creates category", async () => {
  const admin = await createTestUser({ role: ROLES.ADMIN, emailConfirmed: true })
  const token = createTestToken(admin)
  
  const res = await request(app)
    .post("/admin/categories")
    .set("Authorization", `Bearer ${token}`)
    .send({ name: "Test Category", slug: `test-cat-${Date.now()}` })
  
  assert.equal(res.status, 201)
  assert.equal(res.body.name, "Test Category")
  
  await cleanupTestData()
})

test("POST /admin/categories rejects duplicate slug", async () => {
  const admin = await createTestUser({ role: ROLES.ADMIN, emailConfirmed: true })
  const category = await createTestCategory({ slug: "unique-slug" })
  const token = createTestToken(admin)
  
  const res = await request(app)
    .post("/admin/categories")
    .set("Authorization", `Bearer ${token}`)
    .send({ name: "Another Category", slug: "unique-slug" })
  
  assert.equal(res.status, 400)
  assert.equal(res.body.error, "slug_already_exists")
  
  await cleanupTestData()
})

test("GET /admin/categories returns categories list", async () => {
  const admin = await createTestUser({ role: ROLES.ADMIN, emailConfirmed: true })
  const category = await createTestCategory({ name: "Test Category" })
  const token = createTestToken(admin)
  
  const res = await request(app)
    .get("/admin/categories")
    .set("Authorization", `Bearer ${token}`)
  
  assert.equal(res.status, 200)
  assert.ok(Array.isArray(res.body))
  assert.ok(res.body.some(c => c.id === category.id))
  
  await cleanupTestData()
})

test("PATCH /admin/categories/:id updates category", async () => {
  const admin = await createTestUser({ role: ROLES.ADMIN, emailConfirmed: true })
  const category = await createTestCategory({ name: "Old Name" })
  const token = createTestToken(admin)
  
  const res = await request(app)
    .patch(`/admin/categories/${category.id}`)
    .set("Authorization", `Bearer ${token}`)
    .send({ name: "New Name", slug: "new-slug" })
  
  assert.equal(res.status, 200)
  assert.equal(res.body.name, "New Name")
  assert.equal(res.body.slug, "new-slug")
  
  await cleanupTestData()
})

test("DELETE /admin/categories/:id deletes category", async () => {
  const admin = await createTestUser({ role: ROLES.ADMIN, emailConfirmed: true })
  const category = await createTestCategory()
  const token = createTestToken(admin)
  
  const res = await request(app)
    .delete(`/admin/categories/${category.id}`)
    .set("Authorization", `Bearer ${token}`)
  
  assert.equal(res.status, 204)
  
  const deleted = await testPrisma.category.findUnique({ where: { id: category.id } })
  assert.equal(deleted, null)
  
  await cleanupTestData()
})

test("GET /admin/appointments returns appointments", async () => {
  const admin = await createTestUser({ role: ROLES.ADMIN, emailConfirmed: true })
  const client = await createTestUser({ email: "client@test.com", emailConfirmed: true })
  const provider = await createTestProvider()
  const appointment = await createTestAppointment({ userId: client.id, providerId: provider.id })
  const token = createTestToken(admin)
  
  const res = await request(app)
    .get("/admin/appointments")
    .set("Authorization", `Bearer ${token}`)
  
  assert.equal(res.status, 200)
  assert.ok(Array.isArray(res.body))
  assert.ok(res.body.some(a => a.id === appointment.id))
  
  await cleanupTestData()
})

test("PATCH /admin/appointments/:id updates status", async () => {
  const admin = await createTestUser({ role: ROLES.ADMIN, emailConfirmed: true })
  const client = await createTestUser({ email: "client@test.com", emailConfirmed: true })
  const provider = await createTestProvider()
  const appointment = await createTestAppointment({ userId: client.id, providerId: provider.id, status: "BOOKED" })
  const token = createTestToken(admin)
  
  const res = await request(app)
    .patch(`/admin/appointments/${appointment.id}`)
    .set("Authorization", `Bearer ${token}`)
    .send({ status: "CONFIRMED" })
  
  assert.equal(res.status, 200)
  assert.equal(res.body.status, "CONFIRMED")
  
  await cleanupTestData()
})

test("DELETE /admin/providers/:id deletes provider and related data", async () => {
  const admin = await createTestUser({ role: ROLES.ADMIN, emailConfirmed: true })
  const provider = await createTestProvider()
  await testPrisma.workingHours.create({
    data: { providerId: provider.id, weekday: 1, startTime: "09:00", endTime: "18:00" }
  })
  await testPrisma.service.create({
    data: { providerId: provider.id, title: "Test Service", price: 1000, durationMin: 30 }
  })
  const token = createTestToken(admin)
  
  const res = await request(app)
    .delete(`/admin/providers/${provider.id}`)
    .set("Authorization", `Bearer ${token}`)
  
  assert.equal(res.status, 204)
  
  const deleted = await testPrisma.provider.findUnique({ where: { id: provider.id } })
  assert.equal(deleted, null)
  
  await cleanupTestData()
})


