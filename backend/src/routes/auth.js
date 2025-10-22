import { Router } from "express"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"

export const authRouter = Router()

authRouter.post("/register", async (req, res) => {
  const { email, password } = req.body || {}
  if (!email || !password) return res.status(400).json({ error: "email and password required" })
  const prisma = req.ctx.prisma
  const exists = await prisma.user.findUnique({ where: { email } })
  if (exists) return res.status(400).json({ error: "email already registered" })
  const hash = await bcrypt.hash(password, 10)
  const user = await prisma.user.create({ data: { email, passwordHash: hash, role: "CLIENT" } })
  const token = jwt.sign({ email: user.email, role: user.role }, process.env.JWT_SECRET || "dev-secret", { subject: user.id, expiresIn: "60m" })
  res.json({ accessToken: token })
})

authRouter.post("/login", async (req, res) => {
  const { email, password } = req.body || {}
  const prisma = req.ctx.prisma
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) return res.status(404).json({ error: "user not found" })
  const ok = await bcrypt.compare(password, user.passwordHash)
  if (!ok) return res.status(400).json({ error: "bad credentials" })
  const token = jwt.sign({ email: user.email, role: user.role }, process.env.JWT_SECRET || "dev-secret", { subject: user.id, expiresIn: "60m" })
  res.json({ accessToken: token })
})

authRouter.get("/me", (req, res) => {
  if (!req.user) return res.status(401).json({ error: "unauthorized" })
  res.json(req.user)
})
