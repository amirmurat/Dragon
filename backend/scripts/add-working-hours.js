import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main(){
  const providerId = process.argv[2]
  if (!providerId){ console.error('Usage: node scripts/add-working-hours.js <PROVIDER_ID>'); process.exit(1) }
  await prisma.workingHours.deleteMany({ where: { providerId } })
  for (const weekday of [1,2,3,4,5]) {
    await prisma.workingHours.create({ data: { providerId, weekday, startTime: '10:00', endTime: '19:00' } })
  }
  console.log('Working hours set for Mon-Fri 10:00-19:00')
}
main().finally(()=> prisma.$disconnect())
