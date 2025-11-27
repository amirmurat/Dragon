import { Router } from "express"
import { requireAuth, ensureRole } from "./middleware.js"
import { ROLES } from "../roles.js"
import { logActivity } from "../loggers.js"

export const appointmentsRouter = Router()

// Мои брони (CLIENT) или фильтр по mine=true
appointmentsRouter.get("/", requireAuth, async (req, res) => {
  const prisma = req.ctx.prisma
  const mine = req.query.mine === "true"
  const where = mine ? { userId: req.user.id } : {}
  const statuses = (req.query.status || "").toString().split(",").map(s => s.trim()).filter(Boolean)
  if (statuses.length) where.status = { in: statuses }
  const range = {}
  if (req.query.dateFrom) {
    const d = new Date(req.query.dateFrom)
    if (!isNaN(d.valueOf())) range.gte = d
  }
  if (req.query.dateTo) {
    const d = new Date(req.query.dateTo)
    if (!isNaN(d.valueOf())) range.lte = d
  }
  if (Object.keys(range).length) where.startAt = range
  const page = Math.max(1, Number(req.query.page) || 1)
  const pageSizeRaw = Number(req.query.pageSize) || 10
  const pageSize = Math.min(Math.max(pageSizeRaw, 5), 50)
  const skip = (page - 1) * pageSize
  const sortBy = req.query.sortBy === "status" ? "status" : "startAt"
  const sortOrder = req.query.sortOrder === "asc" ? "asc" : "desc"
  const [items, total] = await prisma.$transaction([
    prisma.appointment.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: pageSize,
      include: { service: true, provider: true }
    }),
    prisma.appointment.count({ where })
  ])
  res.json({
    items: items.map(a => ({
      id: a.id,
      providerId: a.providerId,
      providerName: a.provider?.name ?? null,
      userId: a.userId,
      startAt: a.startAt,
      endAt: a.endAt,
      status: a.status,
      priceFinal: a.priceFinal ?? null,
      serviceId: a.serviceId,
      serviceTitle: a.service?.title ?? null
    })),
    page,
    pageSize,
    total
  })
})

// Создание записи (CLIENT)
appointmentsRouter.post("/", requireAuth, ensureRole(ROLES.CLIENT), async (req, res) => {
  const prisma = req.ctx.prisma
  const { providerId, serviceId, startAt, endAt } = req.body || {}
  if (!providerId || !startAt || !endAt) {
    return res.status(400).json({ error: "providerId_startAt_endAt_required" })
  }
  const start = new Date(startAt)
  const end   = new Date(endAt)
  if (isNaN(start.valueOf()) || isNaN(end.valueOf()) || end <= start) {
    return res.status(400).json({ error: "invalid_time_range" })
  }
  // запрет на запись в прошлое
  if (start < new Date()) return res.status(400).json({ error: "cannot_book_past" })

  // провайдер существует
  const provider = await prisma.provider.findUnique({ where: { id: providerId } })
  if (!provider) return res.status(404).json({ error: "provider_not_found" })

  // запрет владельцу бронировать у себя
  if (provider.ownerUserId && provider.ownerUserId === req.user.id) {
    return res.status(403).json({ error: "owner_cannot_book_own_provider" })
  }

  // (простая) проверка пересечений: если уже есть бронь с таким же startAt у провайдера
  const overlap = await prisma.appointment.findFirst({
    where: {
      providerId,
      OR: [
        { startAt: { lte: end }, endAt: { gt: start } }, // пересечение интервалов
      ]
    }
  })
  if (overlap) return res.status(409).json({ error: "time_slot_taken" })

  const created = await prisma.appointment.create({
    data: {
      userId: req.user.id,
      providerId,
      serviceId: serviceId ?? null,
      startAt: start, endAt: end,
      status: "BOOKED",
      priceFinal: null,
    }
  })
  logActivity("appointment_created", { appointmentId: created.id, userId: req.user.id, providerId })
  res.status(201).json(created)
})

// Изменение статуса (CLIENT отменяет свою, PROVIDER/ADMIN подтверждают/отменяют)
appointmentsRouter.patch("/:id", requireAuth, async (req, res) => {
  const prisma = req.ctx.prisma
  const { action } = req.body || {}
  if (!["cancel","confirm"].includes(action)) return res.status(400).json({ error: "invalid_action" })

  const a = await prisma.appointment.findUnique({ where: { id: req.params.id }, include: { provider: true } })
  if (!a) return res.status(404).json({ error: "not_found" })

  // CLIENT может отменить ТОЛЬКО свою запись
  if (action === "cancel" && req.user.role === ROLES.CLIENT) {
    if (a.userId !== req.user.id) return res.status(403).json({ error: "forbidden" })
    const upd = await prisma.appointment.update({ where: { id: a.id }, data: { status: "CANCELLED" } })
    logActivity("appointment_cancelled", { appointmentId: a.id, userId: req.user.id })
    return res.json(upd)
  }

  // PROVIDER (владелец этого провайдера) или ADMIN
  const isOwner = a.provider?.ownerUserId && a.provider.ownerUserId === req.user.id
  if (req.user.role === ROLES.ADMIN || isOwner) {
    const status = action === "confirm" ? "CONFIRMED" : "CANCELLED"
    const upd = await prisma.appointment.update({ where: { id: a.id }, data: { status } })
    logActivity("appointment_status_changed", { appointmentId: a.id, userId: req.user.id, status })
    return res.json(upd)
  }

  return res.status(403).json({ error: "forbidden" })
})
