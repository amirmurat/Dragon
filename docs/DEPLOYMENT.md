# Deployment Guide

## Варианты деплоя

### 1. Docker (рекомендуется)

См. [DOCKER.md](./DOCKER.md) для подробных инструкций.

**Быстрый старт:**
```bash
docker-compose up --build
```

### 2. Render + Vercel/Netlify

#### Backend (Render)
1. Push the latest branch to GitHub.
2. Create a new Web Service on [Render](https://render.com/) and connect the repository.
3. Build command: `cd backend && npm install && npx prisma migrate deploy`.
4. Start command: `cd backend && npm run start`.
5. Add environment variables:
   - `DATABASE_URL=file:./prisma/dev.db` for SQLite or a remote database connection string.
   - `JWT_SECRET=<random_string>`.
   - `PORT=8080`.
   - `CORS_ORIGIN=https://your-frontend-domain.com`.
6. Enable automatic deploys so Render rebuilds after each push.
7. Verify the `/api/health` endpoint responds with `status: UP`.

#### Frontend (Vercel or Netlify)
1. Connect the same repository.
2. Build command: `cd frontend && npm install && npm run build`.
3. Set environment variable: `VITE_API_BASE=https://<render-app>.onrender.com`.
4. Expose the build output directory `frontend/dist`.
5. Deploy and confirm the site can log in, search providers, and view bookings.

### 3. Docker на собственном сервере

1. Склонируйте репозиторий на сервер.
2. Создайте `.env` файлы с production переменными.
3. Запустите: `docker-compose -f docker-compose.prod.yml up -d`.
4. Настройте reverse proxy (nginx) для HTTPS.

## CI/CD Pipeline

Проект включает GitHub Actions workflow (`.github/workflows/ci.yml`):

- **Автоматические тесты** при каждом push/PR
- **Сборка Docker образов** для проверки
- **Проверка зависимостей** и линтинг

Для автоматического деплоя настройте secrets в GitHub:
- `RENDER_API_KEY` (если используете Render)
- `VITE_API_BASE` (URL вашего backend API)

## Testing Before Deployment

1. Run `cd backend && npm test` - все тесты должны пройти.
2. Run `cd backend && npm run dev` plus `cd frontend && npm run dev` for manual smoke tests.
3. Проверьте Docker сборку: `docker-compose up --build`.
4. Commit only after tests pass to keep the deployment pipeline green.

## Environment Variables

### Backend Production
```env
NODE_ENV=production
PORT=8080
DATABASE_URL=postgresql://user:pass@host:5432/dbname  # или file:./prisma/dev.db для SQLite
JWT_SECRET=<strong-random-secret>
CORS_ORIGIN=https://your-frontend-domain.com
```

### Frontend Production
```env
VITE_API_BASE=https://api.yourdomain.com
```

## Health Checks

После деплоя проверьте:
- Backend: `GET https://api.yourdomain.com/api/health` → `{"status":"UP","service":"backend"}`
- Frontend: Откройте в браузере и проверьте консоль на ошибки
- Login flow: Попробуйте зарегистрироваться и войти
- API calls: Проверьте, что запросы идут на правильный backend URL

