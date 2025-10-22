import "dotenv/config"
import express from "express"
import cors from "cors"
import { PrismaClient } from "@prisma/client"
import { authRouter } from "./routes/auth.js"
import { providersRouter } from "./routes/providers.js"
import { appointmentsRouter } from "./routes/appointments.js"
import { authOptional } from "./routes/middleware.js"

const prisma = new PrismaClient()
const app = express()

app.use(cors({ origin: "http://localhost:5173", credentials: true }))
app.use(express.json())

// attach prisma
app.use((req, _res, next) => { req.ctx = { prisma }; next(); })

app.get("/api/health", (_req, res) => res.json({ status: "UP", service: "backend" }))

app.use(authOptional)
app.use("/auth", authRouter)
app.use("/providers", providersRouter)
app.use("/appointments", appointmentsRouter)

const port = process.env.PORT || 8080
app.listen(port, () => console.log("Backend listening on http://localhost:"+port))
