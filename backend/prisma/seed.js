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

  const providers = [
    {
      id: "11111111-1111-1111-1111-111111111111",
      name: "Barber King",
      description: "Men haircut studio",
      address: "Almaty, Dostyk 123",
      lat: 43.24, lng: 76.92, ratingAvg: 4.9,
      services: [
        { id: "22222222-2222-2222-2222-222222222222", categoryId: "cat-003", title: "Haircut", price: 5000, durationMin: 30 },
        { id: "33333333-3333-3333-3333-333333333333", categoryId: "cat-003", title: "Beard trim", price: 3000, durationMin: 20 }
      ]
    },
    {
      id: "44444444-4444-4444-4444-444444444444",
      name: "MoonSalon",
      description: "Full service beauty bar: makeup, nails, brows",
      address: "Astana, Kabanbay batyr 45/1",
      lat: 51.13, lng: 71.43, ratingAvg: 4.8,
      services: [
        { id: "55555555-5555-5555-5555-555555555555", categoryId: "cat-001", title: "Evening makeup", price: 15000, durationMin: 70 },
        { id: "66666666-6666-6666-6666-666666666666", categoryId: "cat-002", title: "Gel manicure", price: 9000, durationMin: 90 },
        { id: "77777777-7777-7777-7777-777777777777", categoryId: "cat-005", title: "Brow lamination", price: 7000, durationMin: 45 }
      ]
    },
    {
      id: "88888888-8888-8888-8888-888888888888",
      name: "Lammi Me",
      description: "Makeup artists & stylists for events",
      address: "Almaty, Nazarbayev 118",
      lat: 43.25, lng: 76.95, ratingAvg: 4.7,
      services: [
        { id: "99999999-9999-9999-9999-999999999999", categoryId: "cat-001", title: "Bridal makeup", price: 25000, durationMin: 90 },
        { id: "aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaa1", categoryId: "cat-001", title: "Soft glam makeup", price: 18000, durationMin: 75 },
        { id: "aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaa2", categoryId: "cat-003", title: "Styling curls", price: 12000, durationMin: 60 }
      ]
    },
    {
      id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
      name: "Nur Beauty Lounge",
      description: "Premium makeup & nails studio for women",
      address: "Astana, Mangilik El 21",
      lat: 51.15, lng: 71.42, ratingAvg: 4.95,
      services: [
        { id: "cccccccc-cccc-cccc-cccc-cccccccccccc", categoryId: "cat-001", title: "Photo shoot makeup", price: 20000, durationMin: 80 },
        { id: "dddddddd-dddd-dddd-dddd-dddddddddddd", categoryId: "cat-002", title: "French manicure", price: 11000, durationMin: 100 },
        { id: "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee", categoryId: "cat-004", title: "Relax massage", price: 16000, durationMin: 60 }
      ]
    },
    {
      id: "fffffff1-ffff-ffff-ffff-fffffffffff1",
      name: "Silk Studio",
      description: "Hair coloring and care center",
      address: "Astana, Turan 35",
      lat: 51.17, lng: 71.39, ratingAvg: 4.6,
      services: [
        { id: "fffffff2-ffff-ffff-ffff-fffffffffff2", categoryId: "cat-003", title: "Balayage coloring", price: 32000, durationMin: 120 },
        { id: "fffffff3-ffff-ffff-ffff-fffffffffff3", categoryId: "cat-003", title: "Keratin therapy", price: 28000, durationMin: 150 }
      ]
    },
    {
      id: "10101010-1010-1010-1010-101010101010",
      name: "BeautyLab",
      description: "Urban beauty lab for busy women",
      address: "Almaty, Seifullina 489",
      lat: 43.23, lng: 76.91, ratingAvg: 4.85,
      services: [
        { id: "12121212-1212-1212-1212-121212121212", categoryId: "cat-002", title: "Express manicure", price: 6000, durationMin: 45 },
        { id: "13131313-1313-1313-1313-131313131313", categoryId: "cat-005", title: "Henna brows", price: 8000, durationMin: 40 },
        { id: "14141414-1414-1414-1414-141414141414", categoryId: "cat-001", title: "Day makeup", price: 12000, durationMin: 50 }
      ]
    },
    {
      id: "20202020-2020-2020-2020-202020202020",
      name: "Glow Room",
      description: "Spa-inspired place for nails and massage",
      address: "Astana, Sarayshyk 7",
      lat: 51.12, lng: 71.47, ratingAvg: 4.75,
      services: [
        { id: "21212121-2121-2121-2121-212121212121", categoryId: "cat-002", title: "Spa pedicure", price: 12000, durationMin: 80 },
        { id: "22222223-2323-2323-2323-232323232323", categoryId: "cat-004", title: "Hot stone massage", price: 20000, durationMin: 70 }
      ]
    },
    {
      id: "30303030-3030-3030-3030-303030303030",
      name: "Velvet Touch",
      description: "Lux brow, lash, and makeup atelier",
      address: "Almaty, Auezova 146",
      lat: 43.21, lng: 76.88, ratingAvg: 4.9,
      services: [
        { id: "31313131-3131-3131-3131-313131313131", categoryId: "cat-005", title: "Brow shaping + tint", price: 9000, durationMin: 50 },
        { id: "32323232-3232-3232-3232-323232323232", categoryId: "cat-001", title: "Classic makeup", price: 14000, durationMin: 65 },
        { id: "33333334-3434-3434-3434-343434343434", categoryId: "cat-001", title: "Smokey makeup", price: 17000, durationMin: 80 }
      ]
    },
    {
      id: "40404040-4040-4040-4040-404040404040",
      name: "Blossom Nails",
      description: "Nail art studio with seasonal collections",
      address: "Astana, Dostyk 13",
      lat: 51.16, lng: 71.41, ratingAvg: 4.7,
      services: [
        { id: "41414141-4141-4141-4141-414141414141", categoryId: "cat-002", title: "Chrome manicure", price: 10000, durationMin: 85 },
        { id: "42424242-4242-4242-4242-424242424242", categoryId: "cat-002", title: "Nail art design", price: 13000, durationMin: 95 }
      ]
    },
    {
      id: "50505050-5050-5050-5050-505050505050",
      name: "Aura Spa",
      description: "Massage and relaxation hub",
      address: "Almaty, Kunaeva 88",
      lat: 43.24, lng: 76.89, ratingAvg: 4.65,
      services: [
        { id: "51515151-5151-5151-5151-515151515151", categoryId: "cat-004", title: "Aromatherapy massage", price: 18000, durationMin: 75 },
        { id: "52525252-5252-5252-5252-525252525252", categoryId: "cat-004", title: "Anti-stress massage", price: 17000, durationMin: 70 }
      ]
    },
    {
      id: "60606060-6060-6060-6060-606060606060",
      name: "Shine Studio",
      description: "Fast beauty services before events",
      address: "Astana, Keruen City 4F",
      lat: 51.14, lng: 71.45, ratingAvg: 4.55,
      services: [
        { id: "61616161-6161-6161-6161-616161616161", categoryId: "cat-001", title: "15-min touch-up", price: 7000, durationMin: 20 },
        { id: "62626262-6262-6262-6262-626262626262", categoryId: "cat-003", title: "Quick styling", price: 9000, durationMin: 30 }
      ]
    },
    {
      id: "70707070-7070-7070-7070-707070707070",
      name: "Luxe Lash Bar",
      description: "Lash extensions and brow care",
      address: "Almaty, Timiryazeva 15",
      lat: 43.20, lng: 76.85, ratingAvg: 4.88,
      services: [
        { id: "71717171-7171-7171-7171-717171717171", categoryId: "cat-005", title: "Classic lash set", price: 16000, durationMin: 120 },
        { id: "72727272-7272-7272-7272-727272727272", categoryId: "cat-005", title: "Volume lash set", price: 20000, durationMin: 150 }
      ]
    }
  ]

  for (const p of providers){
    await prisma.provider.create({ data: { id: p.id, name: p.name, description: p.description, address: p.address, lat: p.lat, lng: p.lng, ratingAvg: p.ratingAvg } })
    await prisma.service.createMany({
      data: p.services.map(s => ({ ...s, providerId: p.id, isActive: true }))
    })
    for (const weekday of [1,2,3,4,5]){
      await prisma.workingHours.create({
        data: { providerId: p.id, weekday, startTime: "10:00", endTime: "20:00" }
      })
    }
  }

  console.log("Seed completed")
}

main().finally(()=> prisma.$disconnect())
