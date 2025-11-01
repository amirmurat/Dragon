import { Router } from "express"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { ROLES } from "../roles.js"
import { requireAuth } from "./middleware.js"

export const authRouter = Router()

function signToken(user) {
  const payload = { sub: user.id, email: user.email, role: user.role }
  const secret = process.env.JWT_SECRET || "devsecret"
  // 7 дней для учебного проекта
  return jwt.sign(payload, secret, { expiresIn: "7d" })
}

// POST /auth/register  {email, password}
authRouter.post("/register", async (req, res) => {
  const prisma = req.ctx.prisma
  const { email, password } = req.body || {}
  if (!email || !password) return res.status(400).json({ error: "email_and_password_required" })
  if (String(password).length < 6) return res.status(400).json({ error: "password_min_6" })

  try {
    const hash = await bcrypt.hash(password, 10)
    const verifyToken = Math.random().toString(36).substring(2) + Date.now().toString(36)
    await prisma.user.create({
      data: { 
        email: String(email).toLowerCase(), 
        passwordHash: hash, 
        role: ROLES.CLIENT,
        emailConfirmed: false,
        emailVerifyToken: verifyToken,
        emailVerifySent: new Date()
      }
    })
    // В реальном приложении здесь отправка письма через nodemailer
    console.log(`🔗 Verification link: http://localhost:5173/verify?token=${verifyToken}`)
    return res.status(201).json({ ok: true, verifyToken })
  } catch (e) {
    // Prisma unique constraint
    if (String(e?.code) === "P2002") return res.status(409).json({ error: "email_exists" })
    return res.status(500).json({ error: "register_failed" })
  }
})

// POST /auth/login  {email, password}  ->  {token, user:{id,email,role}}
authRouter.post("/login", async (req, res) => {
  const prisma = req.ctx.prisma
  const { email, password } = req.body || {}
  if (!email || !password) return res.status(400).json({ error: "email_and_password_required" })

  const u = await prisma.user.findUnique({ where: { email: String(email).toLowerCase() } })
  if (!u) return res.status(401).json({ error: "invalid_credentials" })

  const ok = await bcrypt.compare(String(password), u.passwordHash)
  if (!ok) return res.status(401).json({ error: "invalid_credentials" })

  if (!u.emailConfirmed) {
    return res.status(403).json({ error: "email_not_verified", message: "Please verify your email to login" })
  }

  const token = signToken(u)
  return res.json({ token, user: { id: u.id, email: u.email, role: u.role } })
})

// GET /auth/me -> {id,email,role}
authRouter.get("/me", requireAuth, async (req, res) => {
  // requireAuth уже положил req.user
  return res.json({ id: req.user.id, email: req.user.email, role: req.user.role })
})

// GET /auth/verify?token=xxx
authRouter.get("/verify", async (req, res) => {
  const prisma = req.ctx.prisma
  const token = req.query.token
  if (!token) return res.status(400).json({ error: "token_required" })

  const u = await prisma.user.findUnique({ where: { emailVerifyToken: String(token) } })
  if (!u) return res.status(404).json({ error: "invalid_token" })
  if (u.emailConfirmed) return res.status(400).json({ error: "already_verified" })

  await prisma.user.update({
    where: { id: u.id },
    data: { emailConfirmed: true, emailVerifyToken: null, emailVerifySent: null }
  })

  return res.json({ ok: true, message: "Email verified successfully" })
})
