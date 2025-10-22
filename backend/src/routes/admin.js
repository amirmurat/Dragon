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
