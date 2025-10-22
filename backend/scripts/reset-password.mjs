import "dotenv/config"
import bcrypt from "bcryptjs"
import { PrismaClient } from "@prisma/client"
const prisma = new PrismaClient()

const [,, email, newPass] = process.argv
if (!email || !newPass) {
  console.error("Usage: node scripts/reset-password.mjs user@example.com NEW_PASSWORD")
  process.exit(1)
}
const hash = await bcrypt.hash(newPass, 10)
const u = await prisma.user.update({
  where: { email: email.toLowerCase() },
  data: { passwordHash: hash }
}).catch(()=>null)
if (!u) { console.error("User not found"); process.exit(2) }
console.log("Password updated for", u.email)
await prisma.$disconnect()
