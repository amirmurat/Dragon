import { Router } from "express"
import { requireAuth, ensureRole } from "./middleware.js"
import { ROLES } from "../roles.js"

export const appointmentsRouter = Router()

// Мои брони (CLIENT) или фильтр по mine=true
appointmentsRouter.get("/", requireAuth, async (req, res) => {
  const prisma = req.ctx.prisma
  const mine = req.query.mine === "true"
  const where = mine ? { userId: req.user.id } : {}
  const items = await prisma.appointment.findMany({
    where,
    orderBy: { startAt: "desc" },
    take: 200,
    include: { service: true, provider: true }
  })
  res.json(items.map(a => ({
    id: a.id,
    providerId: a.providerId,
    providerName: a.provider?.name ?? null,
    userId: a.userId,
    startAt: a.startAt,
    endAt: a.endAt,
    status: a.status,
    priceFinal: a.priceFinal ?? null,
    serviceId: a.serviceId,
    serviceTitle: a.service?.title ?? null,
  })))
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
    return res.json(upd)
  }

  // PROVIDER (владелец этого провайдера) или ADMIN
  const isOwner = a.provider?.ownerUserId && a.provider.ownerUserId === req.user.id
  if (req.user.role === ROLES.ADMIN || isOwner) {
    const status = action === "confirm" ? "CONFIRMED" : "CANCELLED"
    const upd = await prisma.appointment.update({ where: { id: a.id }, data: { status } })
    return res.json(upd)
  }

  return res.status(403).json({ error: "forbidden" })
})
