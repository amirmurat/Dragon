import { Router } from "express"
import { requireAuth } from "./middleware.js"

export const appointmentsRouter = Router()

// Создать запись (CLIENT/PROVIDER/ADMIN). Запрещаем брони у собственного провайдера.
appointmentsRouter.post("/", requireAuth, async (req, res) => {
  const prisma = req.ctx.prisma
  const { providerId, serviceId, startAt } = req.body || {}
  if (!providerId || !startAt) return res.status(400).json({ error: "providerId and startAt required" })

  const provider = await prisma.provider.findUnique({ where: { id: providerId } })
  if (!provider) return res.status(404).json({ error: "provider_not_found" })
  if (provider.ownerUserId === req.user.id) {
    return res.status(400).json({ error: "cannot_book_own_provider" })
  }

  // длительность из услуги (если есть), иначе 30 минут
  let durationMin = 30
  if (serviceId) {
    const svc = await prisma.service.findUnique({ where: { id: serviceId } })
    if (!svc || svc.providerId !== providerId) return res.status(400).json({ error: "invalid_service" })
    durationMin = svc.durationMin || durationMin
  }

  const start = new Date(startAt)
  const end   = new Date(start.getTime() + durationMin * 60000)

  // проверка на рабочие часы
  const weekday = ((start.getUTCDay() + 6) % 7) + 1
  const hours = await prisma.workingHours.findMany({ where: { providerId, weekday } })
  const within = hours.some(h => {
    const [hs, ms] = h.startTime.split(":").map(Number)
    const [he, me] = h.endTime.split(":").map(Number)
    const whStart = new Date(start); whStart.setUTCHours(hs, ms, 0, 0)
    const whEnd   = new Date(start); whEnd.setUTCHours(he, me, 0, 0)
    return start >= whStart && end <= whEnd
  })
  if (!within) return res.status(400).json({ error: "outside_working_hours" })

  // day-off провайдера
  const day = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()))
  const offs = await prisma.timeOff.findMany({ where: { providerId, fromDate: { lte: day }, toDate: { gte: day } } })
  if (offs.length) return res.status(400).json({ error: "provider_time_off" })

  // слот не занят
  const conflict = await prisma.appointment.findFirst({ where: { providerId, startAt: start } })
  if (conflict) return res.status(409).json({ error: "slot_taken" })

  const appt = await prisma.appointment.create({
    data: {
      userId: req.user.id,
      providerId,
      serviceId: serviceId || null,
      startAt: start,
      endAt: end,
      status: "BOOKED",
    }
  })
  res.status(201).json(appt)
})

// Список бронирований
// ?mine=true — мои брони (для клиента/провайдера/админа)
// без параметров — только ADMIN (последние 200)
appointmentsRouter.get("/", requireAuth, async (req, res) => {
  const prisma = req.ctx.prisma
  if (String(req.query.mine) === "true") {
    const items = await prisma.appointment.findMany({
      where: { userId: req.user.id },
      orderBy: { startAt: "desc" },
      include: { service: true, provider: true }
    })
    return res.json(items.map(a => ({
      id: a.id,
      status: a.status,
      startAt: a.startAt,
      endAt: a.endAt,
      providerId: a.providerId,
      providerName: a.provider?.name ?? null,
      serviceTitle: a.service?.title ?? null
    })))
  }

  if (req.user.role !== "ADMIN") return res.status(403).json({ error: "forbidden" })
  const items = await prisma.appointment.findMany({
    orderBy: { startAt: "desc" },
    take: 200,
    include: { service: true, provider: true, user: true }
  })
  return res.json(items.map(a => ({
    id: a.id,
    status: a.status,
    startAt: a.startAt,
    endAt: a.endAt,
    providerId: a.providerId,
    providerName: a.provider?.name ?? null,
    userEmail: a.user?.email ?? null,
    serviceTitle: a.service?.title ?? null
  })))
})

// Изменение статуса: {action:"confirm"|"cancel"}
// confirm — только владелец провайдера или ADMIN
// cancel  — тот, кто бронировал, либо владелец, либо ADMIN
appointmentsRouter.patch("/:id", requireAuth, async (req, res) => {
  const prisma = req.ctx.prisma
  const { action } = req.body || {}
  if (!["confirm", "cancel"].includes(action)) return res.status(400).json({ error: "invalid_action" })

  const a = await prisma.appointment.findUnique({
    where: { id: req.params.id },
    include: { provider: true }
  })
  if (!a) return res.status(404).end()

  if (action === "confirm") {
    const isOwner = a.provider?.ownerUserId === req.user.id
    if (!(isOwner || req.user.role === "ADMIN")) return res.status(403).json({ error: "forbidden" })
    const upd = await prisma.appointment.update({ where: { id: a.id }, data: { status: "CONFIRMED" } })
    return res.json(upd)
  }

  if (action === "cancel") {
    const isOwner = a.provider?.ownerUserId === req.user.id
    const isClient = a.userId === req.user.id
    if (!(isOwner || isClient || req.user.role === "ADMIN")) return res.status(403).json({ error: "forbidden" })
    const upd = await prisma.appointment.update({ where: { id: a.id }, data: { status: "CANCELLED" } })
    return res.json(upd)
  }
})
