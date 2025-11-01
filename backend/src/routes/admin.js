import { Router } from "express"
import { requireAuth, ensureRole } from "./middleware.js"
import { ROLES } from "../roles.js"

export const adminRouter = Router()

// Все эндпоинты ниже доступны только ADMIN
adminRouter.use(requireAuth, ensureRole(ROLES.ADMIN))

// GET /admin/users?q=&role=CLIENT|PROVIDER|ADMIN
adminRouter.get("/users", async (req, res) => {
  const prisma = req.ctx.prisma
  const { q, role } = req.query

  const where = {}
  if (q) where.email = { contains: String(q) }          // без mode: "insensitive" (SQLite)
  if (role) where.role = String(role)

  const users = await prisma.user.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200,
    select: { id: true, email: true, role: true, createdAt: true }
  })
  res.json(users)
})

// PATCH /admin/users/:id  { role: "CLIENT"|"PROVIDER"|"ADMIN" }
adminRouter.patch("/users/:id", async (req, res) => {
  const prisma = req.ctx.prisma
  const { role } = req.body || {}
  if (!role || ![ROLES.CLIENT, ROLES.PROVIDER, ROLES.ADMIN].includes(role)) {
    return res.status(400).json({ error: "invalid_role" })
  }
  const u = await prisma.user.update({
    where: { id: req.params.id },
    data: { role },
    select: { id: true, email: true, role: true }
  }).catch(() => null)
  if (!u) return res.status(404).json({ error: "user_not_found" })
  res.json(u)
})

// DELETE /admin/users/:id
adminRouter.delete("/users/:id", async (req, res) => {
  const prisma = req.ctx.prisma
  const targetUserId = req.params.id
  if (targetUserId === req.user.id) return res.status(400).json({ error: "cannot_delete_self" })

  // Соберём связанные провайдеры пользователя
  const providers = await prisma.provider.findMany({ where: { ownerUserId: targetUserId }, select: { id: true } })
  const providerIds = providers.map(p => p.id)

  await prisma.$transaction(async (tx) => {
    if (providerIds.length) {
      await tx.timeOff.deleteMany({ where: { providerId: { in: providerIds } } })
      await tx.workingHours.deleteMany({ where: { providerId: { in: providerIds } } })
      await tx.service.deleteMany({ where: { providerId: { in: providerIds } } })
      await tx.appointment.deleteMany({ where: { providerId: { in: providerIds } } })
      await tx.provider.deleteMany({ where: { id: { in: providerIds } } })
    }
    await tx.appointment.deleteMany({ where: { userId: targetUserId } })
    await tx.user.delete({ where: { id: targetUserId } })
  }).catch((e)=> {
    return res.status(500).json({ error: "delete_user_failed", details: String(e?.message||e) })
  })

  if (res.headersSent) return
  return res.status(204).end()
})

// GET /admin/providers?q=
adminRouter.get("/providers", async (req, res) => {
  const prisma = req.ctx.prisma
  const { q } = req.query
  const where = q ? {
    OR: [
      { name:        { contains: String(q) } },
      { address:     { contains: String(q) } },
      { description: { contains: String(q) } },
    ]
  } : {}

  const items = await prisma.provider.findMany({
    where,
    orderBy: { name: "asc" },
    take: 200,
    select: { id: true, name: true, address: true, description: true, ownerUserId: true }
  })
  res.json(items)
})

// PATCH /admin/providers/:id  { name?, address?, description? }
adminRouter.patch("/providers/:id", async (req, res) => {
  const prisma = req.ctx.prisma
  const { name, address, description } = req.body || {}
  const p = await prisma.provider.update({ where: { id: req.params.id }, data: { name, address, description } }).catch(()=> null)
  if (!p) return res.status(404).json({ error: "provider_not_found" })
  res.json(p)
})

// DELETE /admin/providers/:id
adminRouter.delete("/providers/:id", async (req, res) => {
  const prisma = req.ctx.prisma
  const providerId = req.params.id
  const exists = await prisma.provider.findUnique({ where: { id: providerId }, select: { id: true } })
  if (!exists) return res.status(204).end()
  await prisma.$transaction(async (tx) => {
    await tx.timeOff.deleteMany({ where: { providerId } })
    await tx.workingHours.deleteMany({ where: { providerId } })
    await tx.service.deleteMany({ where: { providerId } })
    await tx.appointment.deleteMany({ where: { providerId } })
    await tx.provider.delete({ where: { id: providerId } })
  }).catch((e)=> {
    return res.status(500).json({ error: "delete_provider_failed", details: String(e?.message||e) })
  })
  if (res.headersSent) return
  return res.status(204).end()
})

// GET /admin/appointments?date=YYYY-MM-DD
adminRouter.get("/appointments", async (req, res) => {
  const prisma = req.ctx.prisma
  const { date } = req.query

  let where = {}
  if (date) {
    const dayStart = new Date(`${date}T00:00:00.000Z`)
    if (isNaN(dayStart.valueOf())) return res.status(400).json({ error: "invalid_date" })
    const dayEnd = new Date(dayStart); dayEnd.setUTCDate(dayEnd.getUTCDate() + 1)
    where = { startAt: { gte: dayStart, lt: dayEnd } }
  }

  const items = await prisma.appointment.findMany({
    where,
    orderBy: { startAt: "desc" },
    take: 200,
    include: { service: true }
  })

  res.json(items.map(a => ({
    id: a.id,
    providerId: a.providerId,
    userId: a.userId,
    startAt: a.startAt,
    endAt: a.endAt,
    status: a.status,
    serviceTitle: a.service?.title ?? null,
  })))
})

// PATCH /admin/appointments/:id { status: "BOOKED"|"CONFIRMED"|"CANCELLED" }
adminRouter.patch("/appointments/:id", async (req, res) => {
  const prisma = req.ctx.prisma
  const { status } = req.body || {}
  if (!status || !["BOOKED","CONFIRMED","CANCELLED"].includes(status)) {
    return res.status(400).json({ error: "invalid_status" })
  }
  const a = await prisma.appointment.update({ where: { id: req.params.id }, data: { status } }).catch(()=> null)
  if (!a) return res.status(404).json({ error: "not_found" })
  res.json(a)
})

// DELETE /admin/appointments/:id
adminRouter.delete("/appointments/:id", async (req, res) => {
  const prisma = req.ctx.prisma
  await prisma.appointment.delete({ where: { id: req.params.id } }).catch(()=> null)
  return res.status(204).end()
})

// GET /admin/categories
adminRouter.get("/categories", async (req, res) => {
  const prisma = req.ctx.prisma
  const items = await prisma.category.findMany({ orderBy: { name: "asc" } })
  res.json(items)
})

// POST /admin/categories { name, slug, icon? }
adminRouter.post("/categories", async (req, res) => {
  const prisma = req.ctx.prisma
  const { name, slug, icon } = req.body || {}
  if (!name || !slug) return res.status(400).json({ error: "name_and_slug_required" })
  const cat = await prisma.category.create({ data: { name, slug, icon: icon || null } }).catch(()=> null)
  if (!cat) return res.status(400).json({ error: "slug_already_exists" })
  res.status(201).json(cat)
})

// PATCH /admin/categories/:id { name?, slug?, icon? }
adminRouter.patch("/categories/:id", async (req, res) => {
  const prisma = req.ctx.prisma
  const { name, slug, icon } = req.body || {}
  const cat = await prisma.category.update({ where: { id: req.params.id }, data: { name, slug, icon } }).catch(()=> null)
  if (!cat) return res.status(404).json({ error: "category_not_found" })
  res.json(cat)
})

// DELETE /admin/categories/:id
adminRouter.delete("/categories/:id", async (req, res) => {
  const prisma = req.ctx.prisma
  await prisma.service.updateMany({ where: { categoryId: req.params.id }, data: { categoryId: null } })
  await prisma.category.delete({ where: { id: req.params.id } }).catch(()=> null)
  return res.status(204).end()
})
