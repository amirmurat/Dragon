import { PrismaClient } from "@prisma/client"
const prisma = new PrismaClient()

async function main(){
  await prisma.appointment.deleteMany()
  await prisma.timeOff.deleteMany()
  await prisma.workingHours.deleteMany()
  await prisma.service.deleteMany()
  await prisma.provider.deleteMany()

  const providerId = "11111111-1111-1111-1111-111111111111"
  await prisma.provider.create({
    data: {
      id: providerId,
      name: "Barber King",
      description: "Men haircut",
      address: "Almaty, Dostyk 123",
      lat: 43.24, lng: 76.92, ratingAvg: 4.9
    }
  })

  await prisma.service.createMany({
    data: [
      { id: "22222222-2222-2222-2222-222222222222", providerId, title: "Haircut", price: 5000, durationMin: 30, isActive: true },
      { id: "33333333-3333-3333-3333-333333333333", providerId, title: "Beard trim", price: 3000, durationMin: 20, isActive: true }
    ]
  })

  for (const weekday of [1,2,3,4,5]){
    await prisma.workingHours.create({
      data: { providerId, weekday, startTime: "10:00", endTime: "19:00" }
    })
  }

  console.log("Seed completed")
}

main().finally(()=> prisma.$disconnect())
