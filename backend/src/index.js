import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { PrismaClient } from "@prisma/client";
import { authRouter } from "./routes/auth.js";
import { providersRouter } from "./routes/providers.js";
import { appointmentsRouter } from "./routes/appointments.js";
import { adminRouter } from "./routes/admin.js";
import { requestLogger } from "./loggers.js";
import { setupSwagger } from "./swagger.js";
import { register } from "./metrics.js";

export const app = express();

// Trust proxy для работы за прокси (Render, Heroku, etc.)
app.set("trust proxy", 1);

app.use(helmet());
const corsOrigin = process.env.CORS_ORIGIN || "http://localhost:5173";
app.use(cors({ origin: corsOrigin, credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(requestLogger);
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 200,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Определяем тестовый режим ДО использования
const port = Number(process.env.PORT) || 8080;
const isTestMode =
  process.env.NODE_ENV === "test" || port === 0 || process.env.PORT === "0";

app.use((req, res, next) => {
  req.ctx = { prisma: new PrismaClient() };
  // Закрываем Prisma клиент после завершения ответа
  const originalEnd = res.end;
  res.end = function (...args) {
    if (req.ctx?.prisma) {
      req.ctx.prisma.$disconnect().catch(() => {});
    }
    return originalEnd.apply(this, args);
  };
  next();
});

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [System]
 *     responses:
 *       200:
 *         description: Сервис работает
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthResponse'
 */
app.get("/api/health", (_req, res) =>
  res.json({ status: "UP", service: "backend" })
);

// Prometheus metrics endpoint
app.get("/metrics", async (_req, res) => {
  try {
    res.set("Content-Type", register.contentType);
    res.end(await register.metrics());
  } catch (err) {
    res.status(500).end(err);
  }
});

// Swagger UI (только в development/production, не в тестах)
if (!isTestMode) {
  setupSwagger(app);
}

app.use("/auth", authRouter);
app.use("/providers", providersRouter);
app.use("/appointments", appointmentsRouter);
app.use("/admin", adminRouter);

// Запуск сервера - только если это НЕ тестовый режим
// В тестах переменная окружения NODE_ENV=test устанавливается ДО импорта
if (!isTestMode) {
  app.listen(port, () => {
    console.log(`Backend listening on http://localhost:${port}`);
  });
}
