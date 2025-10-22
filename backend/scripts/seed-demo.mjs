import "dotenv/config"
import bcrypt from "bcryptjs"
import { PrismaClient } from "@prisma/client"
const prisma = new PrismaClient()

async function upsertUser(email, role, password){
  const hash = await bcrypt.hash(password, 10)
  const lower = email.toLowerCase()
  const existing = await prisma.user.findUnique({ where: { email: lower } })
  if (!existing) {
    return prisma.user.create({ data: { email: lower, passwordHash: hash, role } })
  } else {
    return prisma.user.update({ where: { email: lower }, data: { role } })
  }
}

async function main(){
  const owner = await upsertUser("owner@demo.local", "PROVIDER", "owner123!")
  const client = await upsertUser("client@demo.local", "CLIENT", "client123!")

  // провайдер, привязанный к owner
  let p = await prisma.provider.findFirst({ where: { ownerUserId: owner.id } })
  if (!p){
    p = await prisma.provider.create({
      data: {
        ownerUserId: owner.id,
        name: "Demo Barbershop",
        address: "Almaty, Dostyk Ave 1",
        description: "Demo provider"
      }
    })
  }

  // услуга
  const svcTitle = "Haircut"
  let svc = await prisma.service.findFirst({ where: { providerId: p.id, title: svcTitle } })
  if (!svc){
    svc = await prisma.service.create({
      data: { providerId: p.id, title: svcTitle, price: 5000, durationMin: 30, isActive: true }
    })
  }

  // рабочие часы Пн-Пт 09:00-18:00
  const weekdays = [1,2,3,4,5] // 0=Sun
  for (const d of weekdays){
    const exists = await prisma.workingHours.findFirst({ where: { providerId: p.id, weekday: d } })
    if (!exists){
      await prisma.workingHours.create({
        data: { providerId: p.id, weekday: d, startTime: "09:00", endTime: "18:00" }
      })
    }
  }

  console.log("OK",
    { owner: owner.email, client: client.email, provider: p.name, service: svc.title })
}

main().catch(e=>{ console.error(e); process.exit(1) })
  .finally(async()=> await prisma.$disconnect())
