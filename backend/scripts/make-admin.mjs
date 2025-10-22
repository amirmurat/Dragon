import "dotenv/config"
import { PrismaClient } from "@prisma/client"
const prisma = new PrismaClient()

const email = (process.argv[2]||"").toLowerCase()
if (!email) {
  console.error("Usage: node scripts/make-admin.mjs user@example.com")
  process.exit(1)
}

const u = await prisma.user.update({
  where: { email },
  data: { role: "ADMIN" },
  select: { email:true, role:true }
}).catch(()=>null)

if (!u) { console.error("User not found"); process.exit(2) }
console.log("OK:", u.email, "->", u.role)
await prisma.$disconnect()
