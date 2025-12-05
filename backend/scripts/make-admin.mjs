import "dotenv/config"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()
const email = (process.argv[2]||"").toLowerCase()

if (!email) {
  console.error("Usage: node scripts/make-admin.mjs user@example.com")
  process.exit(1)
}

const user = await prisma.user.findUnique({ where: { email } })
if (!user) {
  console.error("User not found:", email)
  process.exit(2)
}

const updated = await prisma.user.update({
  where: { email },
  data: { 
    role: "ADMIN",
    emailConfirmed: true,
    emailVerifyToken: null,
    emailVerifySent: null
  },
  select: { id: true, email: true, role: true, emailConfirmed: true }
})

console.log("✅ Пользователь назначен администратором:", updated)
console.log("   Email Verified:", updated.emailConfirmed ? "✅" : "❌")
await prisma.$disconnect()
