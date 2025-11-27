import test from "node:test"
import assert from "node:assert/strict"
import { buildProviderWhere, normalizePagination } from "../src/utils/providerFilters.js"

test("buildProviderWhere combines search and price filters", () => {
  const where = buildProviderWhere({ q: "Spa", minPrice: "50", maxPrice: 200, service: "Hair", categoryId: "cat1" })
  assert.ok(where)
  const rules = where.AND || []
  assert.equal(rules.length, 2)
  const textRule = rules[0]
  assert.ok(textRule.OR.some((c) => c.name || c.address || c.description))
  const serviceRule = rules[1].services.some
  assert.equal(serviceRule.title.contains, "Hair")
  assert.equal(serviceRule.categoryId, "cat1")
  assert.equal(serviceRule.price.gte, 50)
  assert.equal(serviceRule.price.lte, 200)
})

test("normalizePagination enforces bounds", () => {
  const cfg = normalizePagination({ page: "-2", pageSize: "200", sortBy: "ratingAvg", sortOrder: "desc" })
  assert.equal(cfg.page, 1)
  assert.equal(cfg.pageSize, 50)
  assert.equal(cfg.sortBy, "ratingAvg")
  assert.equal(cfg.sortOrder, "desc")
  assert.equal(cfg.skip, 0)
  assert.equal(cfg.take, 50)
})

