# Пошаговая инструкция по деплою

Этот документ содержит детальные инструкции для деплоя MoonSalon на облачные платформы.

## Вариант 1: Render (Backend) + Vercel (Frontend)

### Шаг 1: Подготовка репозитория

1. Убедитесь, что все изменения закоммичены и запушены в GitHub:
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

### Шаг 2: Деплой Backend на Render

1. Зайдите на [Render.com](https://render.com) и создайте аккаунт (если еще нет)
2. Нажмите "New +" → "Web Service"
3. Подключите ваш GitHub репозиторий
4. Настройте сервис:

   - **Name:** `moonsalon-backend`
   - **Environment:** `Node`
   - **Build Command:** `cd backend && npm ci && npx prisma generate && npx prisma migrate deploy`
   - **Start Command:** `cd backend && npm start`
   - **Plan:** Free (или выберите платный)

5. Добавьте Environment Variables:

   ```
   NODE_ENV=production
   PORT=8080
   DATABASE_URL=postgresql://... (Render создаст автоматически при создании PostgreSQL)
   JWT_SECRET=<сгенерируйте случайную строку, минимум 32 символа>
   CORS_ORIGIN=https://your-frontend-domain.vercel.app
   ```

6. Создайте PostgreSQL базу данных:

   - Нажмите "New +" → "PostgreSQL"
   - Выберите Free план
   - Скопируйте Internal Database URL
   - Добавьте его в Environment Variables как `DATABASE_URL`

7. Нажмите "Create Web Service"
8. Дождитесь завершения деплоя (обычно 5-10 минут)
9. Скопируйте URL вашего сервиса (например: `https://moonsalon-backend.onrender.com`)

### Шаг 3: Деплой Frontend на Vercel

1. Зайдите на [Vercel.com](https://vercel.com) и создайте аккаунт (если еще нет)
2. Нажмите "Add New..." → "Project"
3. Импортируйте ваш GitHub репозиторий
4. Настройте проект:

   - **Framework Preset:** Vite
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`

5. Добавьте Environment Variable:

   ```
   VITE_API_BASE=https://moonsalon-backend.onrender.com
   ```

6. Нажмите "Deploy"
7. Дождитесь завершения деплоя
8. Скопируйте URL вашего frontend (например: `https://moonsalon.vercel.app`)

### Шаг 4: Обновление CORS в Backend

1. Вернитесь в Render Dashboard
2. Откройте ваш backend сервис
3. Перейдите в "Environment"
4. Обновите `CORS_ORIGIN` на URL вашего frontend:
   ```
   CORS_ORIGIN=https://moonsalon.vercel.app
   ```
5. Нажмите "Save Changes" - сервис автоматически перезапустится

### Шаг 5: Проверка деплоя

1. **Backend Health Check:**

   ```
   https://moonsalon-backend.onrender.com/api/health
   ```

   Должен вернуть: `{"status":"UP","service":"backend"}`

2. **Swagger Documentation:**

   ```
   https://moonsalon-backend.onrender.com/api-docs
   ```

3. **Prometheus Metrics:**

   ```
   https://moonsalon-backend.onrender.com/metrics
   ```

4. **Frontend:**
   - Откройте URL вашего frontend
   - Попробуйте зарегистрироваться
   - Попробуйте войти
   - Проверьте работу основных функций

## Вариант 2: Render (Backend) + Netlify (Frontend)

### Деплой Frontend на Netlify

1. Зайдите на [Netlify.com](https://netlify.com) и создайте аккаунт
2. Нажмите "Add new site" → "Import an existing project"
3. Подключите GitHub репозиторий
4. Настройте:

   - **Base directory:** `frontend`
   - **Build command:** `npm run build`
   - **Publish directory:** `frontend/dist`

5. Добавьте Environment Variable:

   ```
   VITE_API_BASE=https://moonsalon-backend.onrender.com
   ```

6. Нажмите "Deploy site"
7. Обновите `CORS_ORIGIN` в Render на URL Netlify

## Вариант 3: Heroku (Backend) + Vercel (Frontend)

### Деплой Backend на Heroku

1. Установите [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli)
2. Войдите в Heroku:

   ```bash
   heroku login
   ```

3. Создайте приложение:

   ```bash
   cd backend
   heroku create moonsalon-backend
   ```

4. Добавьте PostgreSQL:

   ```bash
   heroku addons:create heroku-postgresql:mini
   ```

5. Настройте переменные окружения:

   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set JWT_SECRET=<ваш-секрет>
   heroku config:set CORS_ORIGIN=https://your-frontend.vercel.app
   ```

6. Деплой:

   ```bash
   git subtree push --prefix backend heroku main
   ```

7. Запустите миграции:
   ```bash
   heroku run npx prisma migrate deploy
   ```

## Использование render.yaml (автоматический деплой)

Если вы используете `render.yaml`, Render автоматически создаст все сервисы:

1. Зайдите на Render Dashboard
2. Нажмите "New +" → "Blueprint"
3. Подключите репозиторий
4. Render автоматически обнаружит `render.yaml` и создаст все сервисы
5. Обновите переменные окружения вручную после создания

## Troubleshooting

### Проблема: Backend не запускается

**Решение:**

- Проверьте логи в Render Dashboard
- Убедитесь, что `DATABASE_URL` правильно настроен
- Проверьте, что Prisma миграции выполнены

### Проблема: CORS ошибки

**Решение:**

- Убедитесь, что `CORS_ORIGIN` в backend указывает на правильный frontend URL
- Проверьте, что frontend использует правильный `VITE_API_BASE`

### Проблема: База данных пустая

**Решение:**

- Запустите seed скрипт:
  ```bash
  # В Render: Settings → Shell
  cd backend && npm run seed
  ```

### Проблема: Frontend показывает ошибки

**Решение:**

- Проверьте консоль браузера
- Убедитесь, что `VITE_API_BASE` правильно настроен
- Проверьте, что backend доступен по указанному URL

## Мониторинг после деплоя

1. **Health Check:**

   - Настройте автоматические проверки в Render/Vercel
   - Используйте `/api/health` endpoint

2. **Prometheus Metrics:**

   - Настройте сбор метрик через `/metrics` endpoint
   - Интегрируйте с Grafana (опционально)

3. **Логи:**
   - Просматривайте логи в Render Dashboard
   - Настройте алерты на критические ошибки

## Обновление деплоя

После каждого изменения в коде:

1. Закоммитьте и запушьте изменения:

   ```bash
   git add .
   git commit -m "Update"
   git push origin main
   ```

2. Render/Vercel автоматически пересоберут и задеплоят изменения

3. Проверьте, что все работает после деплоя

## Стоимость

- **Render Free Tier:**

  - Backend: бесплатно (с ограничениями)
  - PostgreSQL: бесплатно (с ограничениями)
  - Сервисы могут "засыпать" после неактивности

- **Vercel Free Tier:**

  - Frontend: бесплатно
  - Автоматические деплои из GitHub
  - CDN включен

- **Netlify Free Tier:**
  - Frontend: бесплатно
  - Автоматические деплои
  - CDN включен

Для production рекомендуется использовать платные планы для стабильности.
