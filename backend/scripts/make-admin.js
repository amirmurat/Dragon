import "dotenv/config"
import { PrismaClient } from "@prisma/client"
const prisma = new PrismaClient()

const email = process.argv[2]
if (!email) {
  console.error("Usage: node scripts/make-admin.js user@example.com")
  process.exit(1)
}

try {
  const u = await prisma.user.update({
    where: { email },
    data: { role: "ADMIN" },
    select: { id: true, email: true, role: true }
  })
  console.log("OK:", u.email, "->", u.role)
} catch (e) {
  console.error("Failed:", e?.message || e)
  process.exit(2)
} finally {
  await prisma.$disconnect()
}
