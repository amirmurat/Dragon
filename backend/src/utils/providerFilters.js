function toNumber(value) {
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

export function buildProviderWhere(params = {}) {
  const { q, service, categoryId, minPrice, maxPrice } = params
  const and = []
  if (q) {
    const needle = String(q).trim()
    if (needle) {
      and.push({
        OR: [
          { name: { contains: needle } },
          { address: { contains: needle } },
          { description: { contains: needle } }
        ]
      })
    }
  }
  const svc = {}
  const serviceNeedle = service ? String(service).trim() : ""
  if (serviceNeedle) svc.title = { contains: serviceNeedle }
  if (categoryId) svc.categoryId = String(categoryId)
  const min = toNumber(minPrice)
  const max = toNumber(maxPrice)
  if (min != null || max != null) {
    svc.price = {}
    if (min != null) svc.price.gte = min
    if (max != null) svc.price.lte = max
  }
  if (Object.keys(svc).length) {
    and.push({ services: { some: { isActive: true, ...svc } } })
  }
  return and.length ? { AND: and } : undefined
}

export function normalizePagination(query = {}) {
  const page = Math.max(1, Number(query.page) || 1)
  const pageSizeRaw = Number(query.pageSize) || 10
  const pageSize = Math.min(Math.max(pageSizeRaw, 5), 50)
  const allowedSort = ["name", "ratingAvg"]
  const sortBy = allowedSort.includes(query.sortBy) ? query.sortBy : "name"
  const sortOrder = query.sortOrder === "desc" ? "desc" : "asc"
  return { page, pageSize, skip: (page - 1) * pageSize, take: pageSize, sortBy, sortOrder }
}

