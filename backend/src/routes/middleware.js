import jwt from "jsonwebtoken"

// Жёсткая проверка: без токена 401
export function requireAuth(req, res, next) {
  const h = req.headers.authorization || ""
  const token = h.startsWith("Bearer ") ? h.slice(7) : null
  if (!token) return res.status(401).json({ error: "unauthorized" })
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || "devsecret")
    req.user = { id: payload.sub, email: payload.email, role: payload.role }
    next()
  } catch {
    return res.status(401).json({ error: "unauthorized" })
  }
}

// Мягкая проверка: если токен есть и валидный — проставим req.user, иначе просто идём дальше
export function authOptional(req, _res, next) {
  const h = req.headers.authorization || ""
  const token = h.startsWith("Bearer ") ? h.slice(7) : null
  if (token) {
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET || "devsecret")
      req.user = { id: payload.sub, email: payload.email, role: payload.role }
    } catch {
      // игнорируем битый токен
    }
  }
  next()
}

// Владелец провайдера или админ
export async function ensureOwnerOrAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ error: "unauthorized" })
  if (req.user.role === "ADMIN") return next()
  const prisma = req.ctx.prisma
  const p = await prisma.provider.findUnique({ where: { id: req.params.id } }).catch(()=>null)
  if (p && p.ownerUserId === req.user.id) return next()
  return res.status(403).json({ error: "forbidden" })
}

// Проверка роли
export function ensureRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: "unauthorized" })
    if (!roles.includes(req.user.role)) return res.status(403).json({ error: "forbidden" })
    next()
  }
}
