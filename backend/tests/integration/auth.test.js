// Установка переменных окружения ПЕРЕД импортами
process.env.NODE_ENV = "test"
process.env.JWT_SECRET = "test-secret"
process.env.DATABASE_URL = process.env.DATABASE_URL || "file:./prisma/test.db"
process.env.PORT = "0" // Отключаем запуск сервера на порту

import test from "node:test"
import assert from "node:assert/strict"
import request from "supertest"
import { app } from "../../src/index.js"
import { testPrisma, createTestUser, cleanupTestData, createTestToken } from "../helpers.js"
import bcrypt from "bcryptjs"

test.before(async () => {
  await cleanupTestData()
})

test.after(async () => {
  await cleanupTestData()
})

test("POST /auth/register creates new user", async () => {
  const email = `test${Date.now()}@example.com`
  const res = await request(app)
    .post("/auth/register")
    .send({ email, password: "testpass123" })
  
  assert.equal(res.status, 201)
  assert.ok(res.body.ok)
  assert.ok(res.body.verifyToken)
  
  const user = await testPrisma.user.findUnique({ where: { email } })
  assert.ok(user)
  assert.equal(user.email, email)
  assert.equal(user.role, "CLIENT")
  assert.equal(user.emailConfirmed, false)
  
  await testPrisma.user.delete({ where: { id: user.id } })
})

test("POST /auth/register rejects duplicate email", async () => {
  const email = `duplicate${Date.now()}@example.com`
  
  await request(app)
    .post("/auth/register")
    .send({ email, password: "testpass123" })
  
  const res = await request(app)
    .post("/auth/register")
    .send({ email, password: "testpass123" })
  
  assert.equal(res.status, 409)
  assert.equal(res.body.error, "email_exists")
  
  await testPrisma.user.deleteMany({ where: { email } })
})

test("POST /auth/register rejects short password", async () => {
  const res = await request(app)
    .post("/auth/register")
    .send({ email: `test${Date.now()}@example.com`, password: "12345" })
  
  assert.equal(res.status, 400)
  assert.equal(res.body.error, "password_min_6")
})

test("POST /auth/register rejects missing fields", async () => {
  const res1 = await request(app)
    .post("/auth/register")
    .send({ email: "test@example.com" })
  
  assert.equal(res1.status, 400)
  assert.equal(res1.body.error, "email_and_password_required")
  
  const res2 = await request(app)
    .post("/auth/register")
    .send({ password: "testpass123" })
  
  assert.equal(res2.status, 400)
  assert.equal(res2.body.error, "email_and_password_required")
})

test("POST /auth/login succeeds with valid credentials", async () => {
  const email = `login${Date.now()}@example.com`
  const password = "testpass123"
  const user = await createTestUser({ email, password, emailConfirmed: true })
  
  const res = await request(app)
    .post("/auth/login")
    .send({ email, password })
  
  assert.equal(res.status, 200)
  assert.ok(res.body.token)
  assert.equal(res.body.user.id, user.id)
  assert.equal(res.body.user.email, email)
  assert.equal(res.body.user.role, user.role)
  
  await testPrisma.user.delete({ where: { id: user.id } })
})

test("POST /auth/login rejects invalid password", async () => {
  const email = `login2${Date.now()}@example.com`
  const user = await createTestUser({ email, password: "correctpass", emailConfirmed: true })
  
  const res = await request(app)
    .post("/auth/login")
    .send({ email, password: "wrongpass" })
  
  assert.equal(res.status, 401)
  assert.equal(res.body.error, "invalid_credentials")
  
  await testPrisma.user.delete({ where: { id: user.id } })
})

test("POST /auth/login rejects non-existent user", async () => {
  const res = await request(app)
    .post("/auth/login")
    .send({ email: "nonexistent@example.com", password: "testpass123" })
  
  assert.equal(res.status, 401)
  assert.equal(res.body.error, "invalid_credentials")
})

test("POST /auth/login rejects unverified email", async () => {
  const email = `unverified${Date.now()}@example.com`
  const user = await createTestUser({ email, emailConfirmed: false })
  
  const res = await request(app)
    .post("/auth/login")
    .send({ email, password: "testpass123" })
  
  assert.equal(res.status, 403)
  assert.equal(res.body.error, "email_not_verified")
  
  await testPrisma.user.delete({ where: { id: user.id } })
})

test("GET /auth/me returns current user", async () => {
  const user = await createTestUser({ emailConfirmed: true })
  const token = createTestToken(user)
  
  const res = await request(app)
    .get("/auth/me")
    .set("Authorization", `Bearer ${token}`)
  
  assert.equal(res.status, 200)
  assert.equal(res.body.id, user.id)
  assert.equal(res.body.email, user.email)
  assert.equal(res.body.role, user.role)
  
  await testPrisma.user.delete({ where: { id: user.id } })
})

test("GET /auth/me rejects unauthenticated request", async () => {
  const res = await request(app)
    .get("/auth/me")
  
  assert.equal(res.status, 401)
  assert.equal(res.body.error, "unauthorized")
})

test("GET /auth/verify confirms email", async () => {
  const email = `verify${Date.now()}@example.com`
  const verifyToken = `token-${Date.now()}`
  
  const user = await testPrisma.user.create({
    data: {
      email,
      passwordHash: await bcrypt.hash("testpass", 10),
      role: "CLIENT",
      emailConfirmed: false,
      emailVerifyToken: verifyToken,
      emailVerifySent: new Date(),
    },
  })
  
  const res = await request(app)
    .get("/auth/verify")
    .query({ token: verifyToken })
  
  assert.equal(res.status, 200)
  assert.ok(res.body.ok)
  
  const updatedUser = await testPrisma.user.findUnique({ where: { id: user.id } })
  assert.equal(updatedUser.emailConfirmed, true)
  assert.equal(updatedUser.emailVerifyToken, null)
  
  await testPrisma.user.delete({ where: { id: user.id } })
})

test("GET /auth/verify rejects invalid token", async () => {
  const res = await request(app)
    .get("/auth/verify")
    .query({ token: "invalid-token" })
  
  assert.equal(res.status, 404)
  assert.equal(res.body.error, "invalid_token")
})

test("GET /auth/verify rejects already verified email", async () => {
  const email = `verify2${Date.now()}@example.com`
  const verifyToken = `token2-${Date.now()}`
  
  const user = await testPrisma.user.create({
    data: {
      email,
      passwordHash: await bcrypt.hash("testpass", 10),
      role: "CLIENT",
      emailConfirmed: true,
      emailVerifyToken: verifyToken,
      emailVerifySent: new Date(),
    },
  })
  
  const res = await request(app)
    .get("/auth/verify")
    .query({ token: verifyToken })
  
  assert.equal(res.status, 400)
  assert.equal(res.body.error, "already_verified")
  
  await testPrisma.user.delete({ where: { id: user.id } })
})


