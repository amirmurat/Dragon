import test from "node:test"
import assert from "node:assert/strict"
import { buildProviderWhere, normalizePagination } from "../../src/utils/providerFilters.js"

test("buildProviderWhere returns undefined for empty params", () => {
  const where = buildProviderWhere({})
  assert.equal(where, undefined)
})

test("buildProviderWhere creates search filter for query", () => {
  const where = buildProviderWhere({ q: "Spa" })
  assert.ok(where)
  assert.ok(where.AND)
  assert.equal(where.AND.length, 1)
  assert.ok(where.AND[0].OR)
  assert.ok(where.AND[0].OR.some(c => c.name?.contains === "Spa"))
})

test("buildProviderWhere creates service filter with category", () => {
  const where = buildProviderWhere({ categoryId: "cat-123" })
  assert.ok(where)
  assert.ok(where.AND)
  assert.ok(where.AND[0].services)
  assert.equal(where.AND[0].services.some.categoryId, "cat-123")
})

test("buildProviderWhere creates price filter", () => {
  const where = buildProviderWhere({ minPrice: 50, maxPrice: 200 })
  assert.ok(where)
  assert.ok(where.AND[0].services.some.price)
  assert.equal(where.AND[0].services.some.price.gte, 50)
  assert.equal(where.AND[0].services.some.price.lte, 200)
})

test("buildProviderWhere combines multiple filters", () => {
  const where = buildProviderWhere({ q: "Salon", categoryId: "cat-1", minPrice: 100 })
  assert.ok(where)
  assert.equal(where.AND.length, 2) // text search + service filter
  assert.ok(where.AND[0].OR) // text search
  assert.ok(where.AND[1].services) // service filter
})

test("buildProviderWhere ignores invalid price values", () => {
  const where = buildProviderWhere({ minPrice: "invalid", maxPrice: null })
  assert.ok(!where || !where.AND?.some(r => r.services?.some?.price))
})

test("normalizePagination uses default values", () => {
  const cfg = normalizePagination({})
  assert.equal(cfg.page, 1)
  assert.equal(cfg.pageSize, 10)
  assert.equal(cfg.sortBy, "name")
  assert.equal(cfg.sortOrder, "asc")
  assert.equal(cfg.skip, 0)
  assert.equal(cfg.take, 10)
})

test("normalizePagination enforces minimum page", () => {
  const cfg = normalizePagination({ page: "-5", pageSize: "10" })
  assert.equal(cfg.page, 1)
  assert.equal(cfg.skip, 0)
})

test("normalizePagination enforces pageSize bounds", () => {
  const cfgMin = normalizePagination({ pageSize: "1" })
  assert.equal(cfgMin.pageSize, 5) // minimum
  
  const cfgMax = normalizePagination({ pageSize: "200" })
  assert.equal(cfgMax.pageSize, 50) // maximum
  
  const cfgValid = normalizePagination({ pageSize: "25" })
  assert.equal(cfgValid.pageSize, 25)
})

test("normalizePagination validates sortBy", () => {
  const cfgValid = normalizePagination({ sortBy: "ratingAvg" })
  assert.equal(cfgValid.sortBy, "ratingAvg")
  
  const cfgInvalid = normalizePagination({ sortBy: "invalidField" })
  assert.equal(cfgInvalid.sortBy, "name") // default
})

test("normalizePagination calculates skip and take correctly", () => {
  const cfg = normalizePagination({ page: "3", pageSize: "15" })
  assert.equal(cfg.page, 3)
  assert.equal(cfg.pageSize, 15)
  assert.equal(cfg.skip, 30) // (3-1) * 15
  assert.equal(cfg.take, 15)
})

test("normalizePagination validates sortOrder", () => {
  const cfgDesc = normalizePagination({ sortOrder: "desc" })
  assert.equal(cfgDesc.sortOrder, "desc")
  
  const cfgAsc = normalizePagination({ sortOrder: "asc" })
  assert.equal(cfgAsc.sortOrder, "asc")
  
  const cfgInvalid = normalizePagination({ sortOrder: "invalid" })
  assert.equal(cfgInvalid.sortOrder, "asc") // default
})


