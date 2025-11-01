import { PrismaClient } from "@prisma/client"
const prisma = new PrismaClient()

async function main(){
  await prisma.appointment.deleteMany()
  await prisma.timeOff.deleteMany()
  await prisma.workingHours.deleteMany()
  await prisma.service.deleteMany()
  await prisma.provider.deleteMany()
  await prisma.category.deleteMany()

  // Create demo categories
  await prisma.category.createMany({
    data: [
      { id: "cat-001", name: "Makeup", slug: "makeup", icon: "💄" },
      { id: "cat-002", name: "Nails", slug: "nails", icon: "💅" },
      { id: "cat-003", name: "Hair", slug: "hair", icon: "💇" },
      { id: "cat-004", name: "Massage", slug: "massage", icon: "💆" },
      { id: "cat-005", name: "Eyebrows", slug: "eyebrows", icon: "✏️" },
    ]
  })

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
      { id: "22222222-2222-2222-2222-222222222222", providerId, categoryId: "cat-003", title: "Haircut", price: 5000, durationMin: 30, isActive: true },
      { id: "33333333-3333-3333-3333-333333333333", providerId, categoryId: "cat-003", title: "Beard trim", price: 3000, durationMin: 20, isActive: true }
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
