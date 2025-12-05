import "dotenv/config"
import bcrypt from "bcryptjs"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()
const email = (process.argv[2] || "admin@gmail.com").toLowerCase()
const password = process.argv[3] || "admin123"

async function main() {
  // Проверяем, существует ли пользователь
  let user = await prisma.user.findUnique({ where: { email } })
  
  if (user) {
    // Обновляем существующего пользователя
    const hash = password ? await bcrypt.hash(password, 10) : user.passwordHash
    user = await prisma.user.update({
      where: { email },
      data: {
        role: "ADMIN",
        emailConfirmed: true,
        emailVerifyToken: null,
        emailVerifySent: null,
        ...(password ? { passwordHash: hash } : {})
      },
      select: { id: true, email: true, role: true, emailConfirmed: true }
    })
    console.log("✅ Обновлен существующий пользователь:", user)
  } else {
    // Создаем нового пользователя
    const hash = await bcrypt.hash(password, 10)
    user = await prisma.user.create({
      data: {
        email,
        passwordHash: hash,
        role: "ADMIN",
        emailConfirmed: true,
        emailVerifyToken: null,
        emailVerifySent: null
      },
      select: { id: true, email: true, role: true, emailConfirmed: true }
    })
    console.log("✅ Создан новый админский аккаунт:", user)
  }
  
  console.log("\n📋 Данные для входа:")
  console.log("   Email:", user.email)
  console.log("   Password:", password)
  console.log("   Role:", user.role)
  console.log("   Email Verified:", user.emailConfirmed ? "✅" : "❌")
}

main()
  .catch((e) => {
    console.error("❌ Ошибка:", e?.message || e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())

