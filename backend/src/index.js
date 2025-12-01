import express from "express"
import cors from "cors"
import helmet from "helmet"
import rateLimit from "express-rate-limit"
import { PrismaClient } from "@prisma/client"
import { authRouter } from "./routes/auth.js"
import { providersRouter } from "./routes/providers.js"
import { appointmentsRouter } from "./routes/appointments.js"
import { adminRouter } from "./routes/admin.js"
import { requestLogger } from "./loggers.js"

export const app = express()
app.use(helmet())
app.use(cors({ origin: "http://localhost:5173", credentials: true }))
app.use(express.json({ limit: "1mb" }))
app.use(requestLogger)
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 200, standardHeaders: true, legacyHeaders: false })
app.use(limiter)
app.use((req, res, next) => { 
  req.ctx = { prisma: new PrismaClient() }
  // Закрываем Prisma клиент после завершения ответа
  const originalEnd = res.end
  res.end = function(...args) {
    if (req.ctx?.prisma) {
      req.ctx.prisma.$disconnect().catch(() => {})
    }
    return originalEnd.apply(this, args)
  }
  next()
})

app.get("/api/health", (_req, res) => res.json({ status: "UP", service: "backend" }))

app.use("/auth", authRouter)
app.use("/providers", providersRouter)
app.use("/appointments", appointmentsRouter)
app.use("/admin", adminRouter)

// Запуск сервера - только если это НЕ тестовый режим
// В тестах переменная окружения NODE_ENV=test устанавливается ДО импорта
const port = Number(process.env.PORT) || 8080
const isTestMode = process.env.NODE_ENV === "test" || port === 0 || process.env.PORT === "0"

if (!isTestMode) {
  app.listen(port, () => {
    console.log(`Backend listening on http://localhost:${port}`)
  })
}
