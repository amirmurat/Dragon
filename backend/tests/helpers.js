import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { ROLES } from "../src/roles.js"

export const testPrisma = new PrismaClient()

// Создание тестового пользователя
export async function createTestUser({ email, password = "testpass123", role = ROLES.CLIENT, emailConfirmed = true } = {}) {
  const passwordHash = await bcrypt.hash(password, 10)
  const user = await testPrisma.user.create({
    data: {
      email: email || `test${Date.now()}@example.com`,
      passwordHash,
      role,
      emailConfirmed,
      emailVerifyToken: null,
      emailVerifySent: null,
    },
  })
  return user
}

// Создание JWT токена для тестов
export function createTestToken(user) {
  const payload = { sub: user.id, email: user.email, role: user.role }
  const secret = process.env.JWT_SECRET || "devsecret"
  return jwt.sign(payload, secret, { expiresIn: "7d" })
}

// Создание тестового провайдера
export async function createTestProvider({ ownerUserId, name = "Test Provider", address, description } = {}) {
  const provider = await testPrisma.provider.create({
    data: {
      ownerUserId: ownerUserId || null,
      name,
      address: address || "Test Address",
      description: description || "Test Description",
    },
  })
  return provider
}

// Создание тестовой категории
export async function createTestCategory({ name, slug, icon } = {}) {
  const cat = await testPrisma.category.create({
    data: {
      name: name || `Test Category ${Date.now()}`,
      slug: slug || `test-category-${Date.now()}`,
      icon: icon || null,
    },
  })
  return cat
}

// Создание тестовой услуги
export async function createTestService({ providerId, categoryId, title = "Test Service", price = 1000, durationMin = 30 } = {}) {
  const service = await testPrisma.service.create({
    data: {
      providerId,
      categoryId: categoryId || null,
      title,
      price,
      durationMin,
      isActive: true,
    },
  })
  return service
}

// Создание тестовой записи
export async function createTestAppointment({ userId, providerId, serviceId, startAt, endAt, status = "BOOKED" } = {}) {
  const appointment = await testPrisma.appointment.create({
    data: {
      userId,
      providerId,
      serviceId: serviceId || null,
      startAt: startAt || new Date(Date.now() + 24 * 60 * 60 * 1000), // завтра
      endAt: endAt || new Date(Date.now() + 24 * 60 * 60 * 1000 + 30 * 60 * 1000), // +30 мин
      status,
      priceFinal: null,
    },
  })
  return appointment
}

// Очистка тестовых данных
export async function cleanupTestData() {
  await testPrisma.appointment.deleteMany()
  await testPrisma.timeOff.deleteMany()
  await testPrisma.workingHours.deleteMany()
  await testPrisma.service.deleteMany()
  await testPrisma.provider.deleteMany()
  await testPrisma.category.deleteMany()
  await testPrisma.user.deleteMany()
}


