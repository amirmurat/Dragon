﻿import { Router } from "express"
import { requireAuth, ensureOwnerOrAdmin, ensureRole } from "./middleware.js"

export const providersRouter = Router()

// ----- LIST (только после логина) -----
providersRouter.get("/", requireAuth, async (req, res) => {
  const prisma = req.ctx.prisma
  const q        = (req.query.q || "").toString().trim()
  const serviceQ = (req.query.service || "").toString().trim()
  const minPrice = req.query.minPrice ? Number(req.query.minPrice) : null
  const maxPrice = req.query.maxPrice ? Number(req.query.maxPrice) : null

  const and = []
  if (q) {
    and.push({ OR: [
      { name: { contains: q } },
      { address: { contains: q } },
      { description: { contains: q } },
    ]})
  }
  const svc = {}
  if (serviceQ) svc.title = { contains: serviceQ }
  if (minPrice != null || maxPrice != null) {
    svc.price = {}
    if (minPrice != null) svc.price.gte = minPrice
    if (maxPrice != null) svc.price.lte = maxPrice
  }
  if (Object.keys(svc).length > 0) and.push({ services: { some: { isActive: true, ...svc } } })

  const where = and.length ? { AND: and } : undefined
  const list = await prisma.provider.findMany({
    where,
    orderBy: { name: "asc" },
    select: { id: true, name: true, address: true, description: true }
  })
  res.json(list)
})

// ----- /me (оставляем как было) -----
providersRouter.get("/me", requireAuth, async (req, res) => {
  const prisma = req.ctx.prisma
  const p = await prisma.provider.findFirst({ where: { ownerUserId: req.user.id } })
  if (!p) return res.status(404).json({ error: "not_found" })
  res.json(p)
})

// ----- GET categories (public, after login) -----
providersRouter.get("/categories", requireAuth, async (req, res) => {
  const prisma = req.ctx.prisma
  const cats = await prisma.category.findMany({ orderBy: { name: "asc" } })
  res.json(cats)
})

// ----- CREATE provider (только PROVIDER/ADMIN) -----
providersRouter.post("/", requireAuth, ensureRole("PROVIDER","ADMIN"), async (req, res) => {
  const prisma = req.ctx.prisma
  const { name, description, address } = req.body || {}
  if (!name) return res.status(400).json({ error: "name required" })
  const exists = await prisma.provider.findFirst({ where: { ownerUserId: req.user.id } })
  if (exists) return res.status(400).json({ error: "provider already exists for user" })
  const p = await prisma.provider.create({ data: { name, description, address, ownerUserId: req.user.id } })
  res.status(201).json(p)
})

// ----- DETAILS (после логина) -----
providersRouter.get("/:id", requireAuth, async (req, res) => {
  const prisma = req.ctx.prisma
  const p = await prisma.provider.findUnique({
    where: { id: req.params.id },
    select: { id: true, name: true, address: true, description: true }
  })
  if (!p) return res.status(404).end()
  res.json(p)
})

providersRouter.get("/:id/services", requireAuth, async (req, res) => {
  const prisma = req.ctx.prisma
  const list = await prisma.service.findMany({
    where: { providerId: req.params.id, isActive: true },
    orderBy: { title: "asc" },
    include: { category: { select: { id: true, name: true, slug: true } } }
  })
  res.json(list)
})

providersRouter.patch("/:id", requireAuth, ensureOwnerOrAdmin, async (req, res) => {
  const prisma = req.ctx.prisma
  const { name, description, address } = req.body || {}
  const p = await prisma.provider.update({ where: { id: req.params.id }, data: { name, description, address } })
  res.json(p)
})

providersRouter.post("/:id/services", requireAuth, ensureOwnerOrAdmin, async (req, res) => {
  const prisma = req.ctx.prisma
  const { title, price, durationMin, isActive = true, categoryId } = req.body || {}
  if (!title || !price || !durationMin) return res.status(400).json({ error: "title, price, durationMin required" })
  const s = await prisma.service.create({ data: { providerId: req.params.id, title, price, durationMin, isActive, categoryId: categoryId || null } })
  res.status(201).json(s)
})

providersRouter.patch("/:id/services/:sid", requireAuth, ensureOwnerOrAdmin, async (req, res) => {
  const prisma = req.ctx.prisma
  const s = await prisma.service.update({ where: { id: req.params.sid }, data: req.body || {} })
  res.json(s)
})

providersRouter.delete("/:id/services/:sid", requireAuth, ensureOwnerOrAdmin, async (req, res) => {
  const prisma = req.ctx.prisma
  await prisma.service.delete({ where: { id: req.params.sid } })
  res.status(204).end()
})

// ----- Working hours -----
providersRouter.get("/:id/working-hours", requireAuth, ensureOwnerOrAdmin, async (req, res) => {
  const prisma = req.ctx.prisma
  const rows = await prisma.workingHours.findMany({ where: { providerId: req.params.id }, orderBy: { weekday: "asc" } })
  res.json(rows)
})

providersRouter.put("/:id/working-hours", requireAuth, ensureOwnerOrAdmin, async (req, res) => {
  const prisma = req.ctx.prisma
  const items = Array.isArray(req.body) ? req.body : []
  await prisma.$transaction([
    prisma.workingHours.deleteMany({ where: { providerId: req.params.id } }),
    ...items.map(it => prisma.workingHours.create({
      data: { providerId: req.params.id, weekday: Number(it.weekday), startTime: String(it.startTime), endTime: String(it.endTime) }
    }))
  ])
  const rows = await prisma.workingHours.findMany({ where: { providerId: req.params.id }, orderBy: { weekday: "asc" } })
  res.json(rows)
})

providersRouter.post("/:id/working-hours/default", requireAuth, ensureOwnerOrAdmin, async (req, res) => {
  const prisma = req.ctx.prisma
  await prisma.workingHours.deleteMany({ where: { providerId: req.params.id } })
  for (const wd of [1,2,3,4,5]) {
    await prisma.workingHours.create({ data: { providerId: req.params.id, weekday: wd, startTime: "10:00", endTime: "19:00" } })
  }
  const rows = await prisma.workingHours.findMany({ where: { providerId: req.params.id }, orderBy: { weekday: "asc" } })
  res.json(rows)
})

// ----- Availability (после логина) -----
providersRouter.get("/:id/availability", requireAuth, async (req, res) => {
  const prisma = req.ctx.prisma
  const providerId = req.params.id
  const dateStr = req.query.date
  const serviceId = req.query.serviceId || null
  if (!dateStr) return res.status(400).json({ error: "date required" })
  const date = new Date(dateStr + "T00:00:00Z")
  const weekday = ((date.getUTCDay() + 6) % 7) + 1
  const wh = await prisma.workingHours.findMany({ where: { providerId, weekday } })
  const offs = await prisma.timeOff.findMany({ where: { providerId, fromDate: { lte: date }, toDate: { gte: date } } })
  if (offs.length > 0) return res.json([])
  let step = 30
  if (serviceId) {
    const s = await prisma.service.findUnique({ where: { id: serviceId } })
    if (s?.durationMin) step = Math.max(15, s.durationMin)
  }
  const from = new Date(date)
  const to = new Date(date); to.setUTCDate(to.getUTCDate() + 1)
  const booked = await prisma.appointment.findMany({ where: { providerId, startAt: { gte: from, lt: to } }, select: { startAt: true } })
  const busy = new Set(booked.map(b => new Date(b.startAt).toISOString()))
  const slots = []
  for (const h of wh) {
    const [hs, ms] = h.startTime.split(":").map(Number)
    const [he, me] = h.endTime.split(":").map(Number)
    let t = new Date(date); t.setUTCHours(hs, ms, 0, 0)
    const end = new Date(date); end.setUTCHours(he, me, 0, 0)
    while (new Date(t.getTime() + step * 60000) <= end) {
      const iso = t.toISOString()
      if (!busy.has(iso)) slots.push(iso)
      t = new Date(t.getTime() + step * 60000)
    }
  }
  slots.sort()
  res.json(slots)
})

// ----- Provider day appointments -----
providersRouter.get("/:id/appointments", requireAuth, ensureOwnerOrAdmin, async (req, res) => {
  const prisma = req.ctx.prisma
  const dateStr = req.query.date
  if (!dateStr) return res.status(400).json({ error: "date required" })
  const date = new Date(dateStr + "T00:00:00Z")
  const from = new Date(date)
  const to = new Date(date); to.setUTCDate(to.getUTCDate() + 1)
  const items = await prisma.appointment.findMany({
    where: { providerId: req.params.id, startAt: { gte: from, lt: to }, NOT: { status: "CANCELLED" } },
    orderBy: { startAt: "asc" },
    include: { service: true, user: { select: { email: true } } }
  })
  res.json(items.map(a => ({
    id: a.id, startAt: a.startAt, endAt: a.endAt, status: a.status,
    serviceTitle: a.service?.title ?? null,
    userEmail: a.user?.email ?? null
  })))
})
