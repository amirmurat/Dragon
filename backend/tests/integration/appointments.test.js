// Установка переменных окружения ПЕРЕД импортами
process.env.NODE_ENV = "test"
process.env.JWT_SECRET = "test-secret"
process.env.DATABASE_URL = process.env.DATABASE_URL || "file:./prisma/test.db"
process.env.PORT = "0" // Отключаем запуск сервера на порту

import test from "node:test"
import assert from "node:assert/strict"
import request from "supertest"
import { app } from "../../src/index.js"
import { testPrisma, createTestUser, createTestProvider, createTestService, createTestAppointment, cleanupTestData, createTestToken } from "../helpers.js"
import { ROLES } from "../../src/roles.js"

test.before(async () => {
  await cleanupTestData()
})

test.after(async () => {
  await cleanupTestData()
})

test("GET /appointments returns list of appointments", async () => {
  const client = await createTestUser({ role: ROLES.CLIENT, emailConfirmed: true })
  const provider = await createTestProvider()
  const appointment = await createTestAppointment({ userId: client.id, providerId: provider.id })
  const token = createTestToken(client)
  
  const res = await request(app)
    .get("/appointments")
    .set("Authorization", `Bearer ${token}`)
  
  assert.equal(res.status, 200)
  assert.ok(Array.isArray(res.body.items))
  assert.ok(res.body.total >= 1)
  assert.ok(res.body.items.some(a => a.id === appointment.id))
  
  await cleanupTestData()
})

test("GET /appointments?mine=true returns only user appointments", async () => {
  const client1 = await createTestUser({ email: "client1@test.com", role: ROLES.CLIENT, emailConfirmed: true })
  const client2 = await createTestUser({ email: "client2@test.com", role: ROLES.CLIENT, emailConfirmed: true })
  const provider = await createTestProvider()
  
  const appt1 = await createTestAppointment({ userId: client1.id, providerId: provider.id })
  const appt2 = await createTestAppointment({ userId: client2.id, providerId: provider.id })
  
  const token = createTestToken(client1)
  
  const res = await request(app)
    .get("/appointments?mine=true")
    .set("Authorization", `Bearer ${token}`)
  
  assert.equal(res.status, 200)
  assert.ok(res.body.items.every(a => a.userId === client1.id))
  assert.ok(res.body.items.some(a => a.id === appt1.id))
  assert.ok(!res.body.items.some(a => a.id === appt2.id))
  
  await cleanupTestData()
})

test("POST /appointments creates new appointment", async () => {
  const client = await createTestUser({ role: ROLES.CLIENT, emailConfirmed: true })
  const provider = await createTestProvider()
  const token = createTestToken(client)
  
  const startAt = new Date(Date.now() + 24 * 60 * 60 * 1000)
  const endAt = new Date(startAt.getTime() + 30 * 60 * 1000)
  
  const res = await request(app)
    .post("/appointments")
    .set("Authorization", `Bearer ${token}`)
    .send({
      providerId: provider.id,
      startAt: startAt.toISOString(),
      endAt: endAt.toISOString(),
    })
  
  assert.equal(res.status, 201)
  assert.equal(res.body.providerId, provider.id)
  assert.equal(res.body.userId, client.id)
  assert.equal(res.body.status, "BOOKED")
  
  await cleanupTestData()
})

test("POST /appointments rejects booking in the past", async () => {
  const client = await createTestUser({ role: ROLES.CLIENT, emailConfirmed: true })
  const provider = await createTestProvider()
  const token = createTestToken(client)
  
  const startAt = new Date(Date.now() - 60 * 60 * 1000) // 1 hour ago
  const endAt = new Date(startAt.getTime() + 30 * 60 * 1000)
  
  const res = await request(app)
    .post("/appointments")
    .set("Authorization", `Bearer ${token}`)
    .send({
      providerId: provider.id,
      startAt: startAt.toISOString(),
      endAt: endAt.toISOString(),
    })
  
  assert.equal(res.status, 400)
  assert.equal(res.body.error, "cannot_book_past")
  
  await cleanupTestData()
})

test("POST /appointments rejects booking with non-existent provider", async () => {
  const client = await createTestUser({ role: ROLES.CLIENT, emailConfirmed: true })
  const token = createTestToken(client)
  
  const startAt = new Date(Date.now() + 24 * 60 * 60 * 1000)
  const endAt = new Date(startAt.getTime() + 30 * 60 * 1000)
  
  const res = await request(app)
    .post("/appointments")
    .set("Authorization", `Bearer ${token}`)
    .send({
      providerId: "non-existent-id",
      startAt: startAt.toISOString(),
      endAt: endAt.toISOString(),
    })
  
  assert.equal(res.status, 404)
  assert.equal(res.body.error, "provider_not_found")
  
  await cleanupTestData()
})

test("POST /appointments rejects overlapping appointments", async () => {
  const client = await createTestUser({ role: ROLES.CLIENT, emailConfirmed: true })
  const provider = await createTestProvider()
  const token = createTestToken(client)
  
  const startAt = new Date(Date.now() + 24 * 60 * 60 * 1000)
  const endAt = new Date(startAt.getTime() + 30 * 60 * 1000)
  
  // Create first appointment
  await createTestAppointment({ userId: client.id, providerId: provider.id, startAt, endAt })
  
  // Try to create overlapping appointment
  const res = await request(app)
    .post("/appointments")
    .set("Authorization", `Bearer ${token}`)
    .send({
      providerId: provider.id,
      startAt: startAt.toISOString(),
      endAt: endAt.toISOString(),
    })
  
  assert.equal(res.status, 409)
  assert.equal(res.body.error, "time_slot_taken")
  
  await cleanupTestData()
})

test("PATCH /appointments/:id cancels appointment as CLIENT", async () => {
  const client = await createTestUser({ role: ROLES.CLIENT, emailConfirmed: true })
  const provider = await createTestProvider()
  const appointment = await createTestAppointment({ userId: client.id, providerId: provider.id })
  const token = createTestToken(client)
  
  const res = await request(app)
    .patch(`/appointments/${appointment.id}`)
    .set("Authorization", `Bearer ${token}`)
    .send({ action: "cancel" })
  
  assert.equal(res.status, 200)
  assert.equal(res.body.status, "CANCELLED")
  
  const updated = await testPrisma.appointment.findUnique({ where: { id: appointment.id } })
  assert.equal(updated.status, "CANCELLED")
  
  await cleanupTestData()
})

test("PATCH /appointments/:id rejects cancellation of other user appointment", async () => {
  const client1 = await createTestUser({ email: "client1@test.com", role: ROLES.CLIENT, emailConfirmed: true })
  const client2 = await createTestUser({ email: "client2@test.com", role: ROLES.CLIENT, emailConfirmed: true })
  const provider = await createTestProvider()
  const appointment = await createTestAppointment({ userId: client1.id, providerId: provider.id })
  const token = createTestToken(client2)
  
  const res = await request(app)
    .patch(`/appointments/${appointment.id}`)
    .set("Authorization", `Bearer ${token}`)
    .send({ action: "cancel" })
  
  assert.equal(res.status, 403)
  assert.equal(res.body.error, "forbidden")
  
  await cleanupTestData()
})

test("PATCH /appointments/:id confirms appointment as PROVIDER", async () => {
  const provider = await createTestUser({ role: ROLES.PROVIDER, emailConfirmed: true })
  const client = await createTestUser({ email: "client@test.com", role: ROLES.CLIENT, emailConfirmed: true })
  const prov = await createTestProvider({ ownerUserId: provider.id })
  const appointment = await createTestAppointment({ userId: client.id, providerId: prov.id })
  const token = createTestToken(provider)
  
  const res = await request(app)
    .patch(`/appointments/${appointment.id}`)
    .set("Authorization", `Bearer ${token}`)
    .send({ action: "confirm" })
  
  assert.equal(res.status, 200)
  assert.equal(res.body.status, "CONFIRMED")
  
  await cleanupTestData()
})

test("PATCH /appointments/:id confirms appointment as ADMIN", async () => {
  const admin = await createTestUser({ role: ROLES.ADMIN, emailConfirmed: true })
  const client = await createTestUser({ email: "client@test.com", role: ROLES.CLIENT, emailConfirmed: true })
  const provider = await createTestProvider()
  const appointment = await createTestAppointment({ userId: client.id, providerId: provider.id })
  const token = createTestToken(admin)
  
  const res = await request(app)
    .patch(`/appointments/${appointment.id}`)
    .set("Authorization", `Bearer ${token}`)
    .send({ action: "confirm" })
  
  assert.equal(res.status, 200)
  assert.equal(res.body.status, "CONFIRMED")
  
  await cleanupTestData()
})

test("GET /appointments with status filter", async () => {
  const client = await createTestUser({ role: ROLES.CLIENT, emailConfirmed: true })
  const provider = await createTestProvider()
  
  const booked = await createTestAppointment({ userId: client.id, providerId: provider.id, status: "BOOKED" })
  const cancelled = await createTestAppointment({ userId: client.id, providerId: provider.id, status: "CANCELLED" })
  
  const token = createTestToken(client)
  
  const res = await request(app)
    .get("/appointments?status=BOOKED")
    .set("Authorization", `Bearer ${token}`)
  
  assert.equal(res.status, 200)
  assert.ok(res.body.items.every(a => a.status === "BOOKED"))
  assert.ok(res.body.items.some(a => a.id === booked.id))
  assert.ok(!res.body.items.some(a => a.id === cancelled.id))
  
  await cleanupTestData()
})


