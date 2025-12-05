# Backend Dockerfile
FROM node:20-alpine

WORKDIR /app

# Копируем файлы зависимостей
COPY package*.json ./
COPY prisma ./prisma/

# Устанавливаем зависимости
RUN npm ci --only=production

# Устанавливаем Prisma CLI для миграций
RUN npm install -g prisma@^5.20.0

# Генерируем Prisma клиент
RUN npx prisma generate

# Копируем исходный код
COPY src ./src

# Создаем директорию для логов
RUN mkdir -p logs

# Открываем порт
EXPOSE 8080

# Переменные окружения по умолчанию
ENV NODE_ENV=production
ENV PORT=8080
ENV DATABASE_URL=file:./prisma/dev.db
ENV JWT_SECRET=change-me-in-production

# Применяем миграции и запускаем сервер
CMD ["sh", "-c", "npx prisma migrate deploy && node src/index.js"]

