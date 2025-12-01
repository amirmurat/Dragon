import test from "node:test"
import assert from "node:assert/strict"
import { requireAuth, ensureRole, authOptional } from "../../src/routes/middleware.js"
import { ROLES } from "../../src/roles.js"
import { createTestToken, createTestUser } from "../helpers.js"
import jwt from "jsonwebtoken"

process.env.NODE_ENV = "test"
process.env.JWT_SECRET = "test-secret"

test("requireAuth rejects request without token", async () => {
  const req = { headers: {} }
  const res = {
    status: (code) => {
      assert.equal(code, 401)
      return {
        json: (data) => {
          assert.equal(data.error, "unauthorized")
        },
      }
    },
  }
  let nextCalled = false
  const next = () => { nextCalled = true }
  
  requireAuth(req, res, next)
  assert.equal(nextCalled, false)
})

test("requireAuth rejects request with invalid token", async () => {
  const req = { headers: { authorization: "Bearer invalid-token" } }
  const res = {
    status: (code) => {
      assert.equal(code, 401)
      return {
        json: (data) => {
          assert.equal(data.error, "unauthorized")
        },
      }
    },
  }
  let nextCalled = false
  const next = () => { nextCalled = true }
  
  requireAuth(req, res, next)
  assert.equal(nextCalled, false)
})

test("requireAuth accepts valid token", async () => {
  const user = { id: "user-123", email: "test@example.com", role: ROLES.CLIENT }
  const token = createTestToken(user)
  
  const req = { headers: { authorization: `Bearer ${token}` } }
  let nextCalled = false
  const next = () => { nextCalled = true }
  const res = {}
  
  requireAuth(req, res, next)
  assert.equal(nextCalled, true)
  assert.equal(req.user.id, user.id)
  assert.equal(req.user.email, user.email)
  assert.equal(req.user.role, user.role)
})

test("requireAuth extracts token from Bearer prefix", async () => {
  const user = { id: "user-456", email: "test2@example.com", role: ROLES.PROVIDER }
  const token = createTestToken(user)
  
  const req = { headers: { authorization: `Bearer ${token}` } }
  let nextCalled = false
  const next = () => { nextCalled = true }
  const res = {}
  
  requireAuth(req, res, next)
  assert.equal(nextCalled, true)
  assert.equal(req.user.id, user.id)
})

test("authOptional sets user when token is valid", () => {
  const user = { id: "user-789", email: "optional@example.com", role: ROLES.CLIENT }
  const token = createTestToken(user)
  
  const req = { headers: { authorization: `Bearer ${token}` } }
  let nextCalled = false
  const next = () => { nextCalled = true }
  const res = {}
  
  authOptional(req, res, next)
  assert.equal(nextCalled, true)
  assert.equal(req.user.id, user.id)
})

test("authOptional continues without user when token is missing", () => {
  const req = { headers: {} }
  let nextCalled = false
  const next = () => { nextCalled = true }
  const res = {}
  
  authOptional(req, res, next)
  assert.equal(nextCalled, true)
  assert.equal(req.user, undefined)
})

test("authOptional continues without user when token is invalid", () => {
  const req = { headers: { authorization: "Bearer invalid" } }
  let nextCalled = false
  const next = () => { nextCalled = true }
  const res = {}
  
  authOptional(req, res, next)
  assert.equal(nextCalled, true)
  // user не установлен при невалидном токене
})

test("ensureRole allows user with correct role", () => {
  const middleware = ensureRole(ROLES.ADMIN)
  const req = { user: { id: "admin-1", role: ROLES.ADMIN } }
  let nextCalled = false
  const next = () => { nextCalled = true }
  const res = {}
  
  middleware(req, res, next)
  assert.equal(nextCalled, true)
})

test("ensureRole allows user with one of multiple roles", () => {
  const middleware = ensureRole(ROLES.ADMIN, ROLES.PROVIDER)
  const req = { user: { id: "provider-1", role: ROLES.PROVIDER } }
  let nextCalled = false
  const next = () => { nextCalled = true }
  const res = {}
  
  middleware(req, res, next)
  assert.equal(nextCalled, true)
})

test("ensureRole rejects user without required role", () => {
  const middleware = ensureRole(ROLES.ADMIN)
  const req = { user: { id: "client-1", role: ROLES.CLIENT } }
  let nextCalled = false
  const next = () => { nextCalled = true }
  const res = {
    status: (code) => {
      assert.equal(code, 403)
      return {
        json: (data) => {
          assert.equal(data.error, "forbidden")
        },
      }
    },
  }
  
  middleware(req, res, next)
  assert.equal(nextCalled, false)
})

test("ensureRole rejects unauthenticated user", () => {
  const middleware = ensureRole(ROLES.ADMIN)
  const req = {}
  let nextCalled = false
  const next = () => { nextCalled = true }
  const res = {
    status: (code) => {
      assert.equal(code, 401)
      return {
        json: (data) => {
          assert.equal(data.error, "unauthorized")
        },
      }
    },
  }
  
  middleware(req, res, next)
  assert.equal(nextCalled, false)
})


