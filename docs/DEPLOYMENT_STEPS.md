# Пошаговая инструкция по деплою

Этот документ содержит детальные инструкции для деплоя MoonSalon на облачные платформы.

## ⚠️ КРИТИЧЕСКИ ВАЖНО перед деплоем!

**Проблема:** Prisma schema по умолчанию использует SQLite (для локальной разработки), но на Render нужен PostgreSQL.

**Если вы видите ошибку "migrate found failed migrations"** - см. раздел Troubleshooting ниже.

**ОБЯЗАТЕЛЬНО выполните перед деплоем:**

```bash
cd backend
npm run db:switch:postgresql  # переключит на PostgreSQL (обновит schema.prisma и migration_lock.toml)

git add prisma/schema.prisma
git add prisma/migrations/migration_lock.toml
git commit -m "Switch to PostgreSQL for production"
git push
```

**Проверьте, что в `backend/prisma/schema.prisma` теперь:**

```prisma
datasource db {
  provider = "postgresql"  ← должно быть "postgresql"!
  url      = env("DATABASE_URL")
}
```

**После деплоя (для локальной разработки):**

```bash
cd backend
npm run db:switch:sqlite  # вернуть на SQLite для локальной разработки
npm run db:push
npm run seed
```

---

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
   - **Build Command:** `cd backend && npm ci && npx prisma generate && npx prisma db push --accept-data-loss`

   ⚠️ **КРИТИЧЕСКИ ВАЖНО:**

   - Используем `prisma db push` вместо `migrate deploy`, так как миграции были созданы для SQLite, а мы используем PostgreSQL.
   - `db push` создаст схему напрямую из `schema.prisma` без использования миграций.
   - Если вы видите ошибку про failed migrations, см. раздел Troubleshooting ниже.
   - Убедитесь, что вы выполнили переключение на PostgreSQL перед деплоем (см. раздел "⚠️ КРИТИЧЕСКИ ВАЖНО перед деплоем!" выше).

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

   ⚠️ **Важно:** `CORS_ORIGIN` пока можно оставить как есть или оставить пустым.
   Вы обновите его на **реальный URL вашего frontend** после деплоя frontend (см. Шаг 4).
   Например, если ваш frontend будет `https://moonsalon-abc123.vercel.app`,
   то используйте именно этот URL, а не `your-frontend-domain.vercel.app`!

6. Создайте PostgreSQL базу данных:

   **В Render Dashboard (на главной странице):**

   - Нажмите кнопку "New +" (вверху справа)
   - В выпадающем меню выберите "PostgreSQL"
   - В форме создания базы данных:
     - **Name:** `moonsalon-db` (или любое другое имя)
     - **Database:** `moonsalon` (или оставьте по умолчанию)
     - **User:** `moonsalon` (или оставьте по умолчанию)
     - **Region:** выберите ближайший к вам
     - **Plan:** выберите **Free** (или платный, если нужен)
   - Нажмите "Create Database"
   - Дождитесь создания базы (обычно 1-2 минуты)
   - После создания база появится в списке ваших сервисов на главной странице Render Dashboard
   - **Кликните на название вашей базы данных** (например, `moonsalon-db`) в списке сервисов
   - Это откроет страницу настроек базы данных
   - В левом меню или в основном разделе найдите секцию **"Connections"** или **"Info"**
   - Найдите поле **"Internal Database URL"** (может называться "Internal Connection String")
   - Скопируйте этот URL (он будет выглядеть как: `postgresql://user:password@host:5432/dbname`)
   - Вернитесь к настройке вашего Web Service
   - В разделе "Environment Variables" найдите `DATABASE_URL`
   - Вставьте скопированный Internal Database URL в значение `DATABASE_URL`
   - Или можно оставить `DATABASE_URL` пустым и Render автоматически подключит базу, если вы используете `render.yaml`

7. Нажмите "Create Web Service"
8. Дождитесь завершения деплоя (обычно 5-10 минут)
9. **Скопируйте реальный URL вашего backend сервиса:**

   **Где найти URL в Render Dashboard (пошагово):**

   1. **Откройте ваш Web Service:**

      - На главной странице Render Dashboard нажмите на название вашего сервиса
      - Например, если сервис называется `moonsalon-backend`, нажмите на него

   2. **URL находится в верхней части страницы сервиса:**

      - Прямо под названием сервиса (большой заголовок)
      - Вы увидите синюю ссылку с текстом типа: `https://moonsalon-backend.onrender.com`
      - Или: `https://moonsalon-backend-xxxx.onrender.com` (где `xxxx` - случайные символы)
      - Это и есть ваш реальный backend URL!

   3. **Скопируйте URL:**
      - Наведите курсор на синюю ссылку
      - Правый клик → "Copy link address" (или просто выделите текст и Ctrl+C / Cmd+C)
      - Сохраните этот URL - он понадобится для настройки frontend

   ⚠️ **ВАЖНО:** НЕ используйте примеры из инструкций - используйте ваш реальный URL из Render Dashboard!

   **Если не видите URL:**

   - Убедитесь, что деплой завершился успешно (статус "Live" или зеленая галочка)
   - Проверьте раздел "Info" в левом меню - там также должен быть указан URL
   - В разделе "Events" после успешного деплоя будет сообщение с URL

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

   ⚠️ **ВАЖНО:** Добавляйте обычную переменную окружения, а не Secret!

   - В разделе "Environment Variables" нажмите "Add New"
   - **Name:** `VITE_API_BASE`
   - **Value:** Вставьте **реальный URL вашего backend** из Render (который вы скопировали в Шаге 2, пункт 9)
   - ⚠️ **НЕ используйте примеры** - используйте ваш реальный URL из Render Dashboard!
   - **Environment:** Выберите "Production", "Preview" и "Development" (или только "Production")
   - **НЕ выбирайте "Secret"** - это должна быть обычная переменная окружения
   - Нажмите "Save"

   ⚠️ **Если вы видите ошибку "references Secret which does not exist":**

   - Удалите существующую переменную (если есть)
   - Добавьте новую переменную как описано выше
   - Убедитесь, что вы НЕ выбираете опцию "Secret"

6. Нажмите "Deploy"
7. Дождитесь завершения деплоя
8. Скопируйте URL вашего frontend (например: `https://moonsalon.vercel.app`)

### Шаг 4: Обновление CORS в Backend

1. Вернитесь в Render Dashboard
2. Откройте ваш backend сервис
3. Перейдите в "Environment"
4. Найдите переменную `CORS_ORIGIN`
5. **Скопируйте реальный URL вашего frontend** из Vercel (из Шага 3, пункт 8)
   - Это будет что-то вроде: `https://moonsalon-abc123.vercel.app` (ваш реальный URL будет другим!)
6. Вставьте его в значение `CORS_ORIGIN`, заменив placeholder:
   ```
   CORS_ORIGIN=https://moonsalon-abc123.vercel.app
   ```
   ⚠️ **НЕ копируйте `your-frontend-domain.vercel.app` или `https://your-frontend-domain.vercel.app` - это был placeholder!**
   ⚠️ **Используйте реальный URL из Vercel, который вы скопировали в Шаге 3, пункт 8!**
7. Нажмите "Save Changes" - сервис автоматически перезапустится

### Шаг 5: Проверка деплоя

1. **Backend Health Check:**

   ```
   https://<ваш-реальный-backend-url>.onrender.com/api/health
   ```

   ⚠️ **Замените `<ваш-реальный-backend-url>` на реальный URL из Render Dashboard!**

   Должен вернуть: `{"status":"UP","service":"backend"}`

2. **Swagger Documentation:**

   ```
   https://<ваш-реальный-backend-url>.onrender.com/api-docs
   ```

3. **Prometheus Metrics:**

   ```
   https://<ваш-реальный-backend-url>.onrender.com/metrics
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

   ⚠️ **ВАЖНО:** Добавляйте обычную переменную окружения, а не Secret!

   - В разделе "Site settings" → "Environment variables" нажмите "Add a variable"
   - **Key:** `VITE_API_BASE`
   - **Value:** Вставьте **реальный URL вашего backend** из Render (который вы скопировали в Шаге 2, пункт 9)
   - ⚠️ **НЕ используйте примеры** - используйте ваш реальный URL из Render Dashboard!
   - **Scopes:** Выберите "All scopes" или "Production"
   - Нажмите "Save"

   ⚠️ **Если вы видите ошибку "references Secret which does not exist":**

   - Удалите существующую переменную (если есть)
   - Добавьте новую переменную как описано выше
   - Убедитесь, что вы НЕ используете Secrets

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

### Проблема: Ошибка "the URL must start with the protocol `file:`" или "SQLite database"

**Ошибка выглядит так:**

```
Error: Prisma schema validation
error: Error validating datasource `db`: the URL must start with the protocol `file:`.
Datasource "db": SQLite database
```

**Решение:**

1. **Проверьте `backend/prisma/schema.prisma`:**

   ```prisma
   datasource db {
     provider = "postgresql"  ← должно быть "postgresql"!
     url      = env("DATABASE_URL")
   }
   ```

2. **Если там `sqlite`, измените на `postgresql`:**

   ```bash
   cd backend
   npm run db:switch:postgresql
   git add prisma/schema.prisma
   git commit -m "Fix: Switch to PostgreSQL for production"
   git push
   ```

3. **Дождитесь автоматического пересборки на Render** (или запустите вручную)

4. **Проверьте, что `DATABASE_URL` в Render указывает на PostgreSQL:**
   - Должен начинаться с `postgresql://` или `postgres://`
   - Не должен начинаться с `file:`

### Проблема: Ошибка "migrate found failed migrations in the target database"

**Ошибка выглядит так:**

```
Error: P3009
migrate found failed migrations in the target database, new migrations will not be applied.
The `20251022033954_init` migration started at ... failed
```

**Решение:**

Эта ошибка возникает, когда миграции были созданы для SQLite, а теперь применяются к PostgreSQL. Есть два варианта:

**Вариант 1: Использовать `db push` (рекомендуется)**

1. **Измените Build Command в Render Dashboard:**

   - Зайдите в Settings вашего Web Service
   - Найдите "Build Command"
   - Измените на: `cd backend && npm ci && npx prisma generate && npx prisma db push --accept-data-loss`
   - Сохраните изменения
   - Запустите Manual Deploy

2. **`db push` создаст схему напрямую из `schema.prisma`**, игнорируя failed migrations.

**Вариант 2: Очистить failed migrations вручную**

Если вы хотите использовать миграции, нужно очистить failed migrations:

1. **Подключитесь к базе данных через Render Shell:**

   - В Render Dashboard: Settings → Shell
   - Выполните:

   ```bash
   cd backend
   npx prisma migrate resolve --rolled-back 20251022033954_init
   ```

   (замените `20251022033954_init` на имя вашей failed migration)

2. **Или удалите таблицу миграций:**

   ```sql
   -- В Render: PostgreSQL → Connect → Query
   DROP TABLE IF EXISTS "_prisma_migrations";
   ```

3. **Затем используйте `db push` для создания схемы:**
   ```bash
   npx prisma db push --accept-data-loss
   ```

**Рекомендация:** Используйте Вариант 1 (`db push`) - это проще и надежнее для первого деплоя.

### Проблема: Backend не запускается

**Решение:**

- Проверьте логи в Render Dashboard
- Убедитесь, что `DATABASE_URL` правильно настроен (PostgreSQL URL)
- Проверьте, что Prisma схема применена (используйте `db push` или исправьте failed migrations)
- Убедитесь, что в `schema.prisma` указан `provider = "postgresql"`

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

### Проблема: Ошибка "Environment Variable references Secret which does not exist"

**Ошибка выглядит так:**

```
Environment Variable "VITE_API_BASE" references Secret "vite_api_base", which does not exist.
```

**Решение:**

Эта ошибка возникает, когда переменная окружения настроена как Secret, но Secret не существует.

**Для Vercel:**

1. **Удалите существующую переменную:**

   - Зайдите в Settings → Environment Variables
   - Найдите переменную `VITE_API_BASE`
   - Если она существует, удалите её (нажмите на иконку корзины)

2. **Добавьте новую переменную правильно:**

   - Нажмите "Add New"
   - **Name:** `VITE_API_BASE`
   - **Value:** Вставьте **реальный URL вашего backend** из Render (который вы скопировали в Шаге 2, пункт 9)
   - ⚠️ **НЕ используйте примеры** - используйте ваш реальный URL из Render Dashboard!
   - **Environment:** Выберите "Production", "Preview" и "Development" (или только "Production")
   - **НЕ выбирайте опцию "Secret"** - это должна быть обычная переменная окружения
   - Нажмите "Save"

3. **Пересоберите проект:**
   - Deployments → выберите последний деплой → "Redeploy"

**Для Netlify:**

1. **Удалите существующую переменную:**

   - Зайдите в Site settings → Environment variables
   - Найдите переменную `VITE_API_BASE`
   - Если она существует, удалите её

2. **Добавьте новую переменную правильно:**

   - Нажмите "Add a variable"
   - **Key:** `VITE_API_BASE`
   - **Value:** Вставьте **реальный URL вашего backend** из Render (который вы скопировали в Шаге 2, пункт 9)
   - ⚠️ **НЕ используйте примеры** - используйте ваш реальный URL из Render Dashboard!
   - **Scopes:** Выберите "All scopes" или "Production"
   - Нажмите "Save"

3. **Пересоберите проект:**
   - Deploys → "Trigger deploy" → "Clear cache and deploy site"

### Проблема: Ошибка "The 'X-Forwarded-For' header is set but the Express 'trust proxy' setting is false"

**Ошибка выглядит так:**

```
ValidationError: The 'X-Forwarded-For' header is set but the Express 'trust proxy' setting is false
```

**Решение:**

Эта ошибка возникает, когда приложение работает за прокси (Render, Heroku), но Express не настроен для работы с прокси.

**Исправление:**

1. **Откройте `backend/src/index.js`**

2. **Добавьте `trust proxy` перед использованием rate limiter:**

   ```javascript
   export const app = express();

   // Trust proxy для работы за прокси (Render, Heroku, etc.)
   app.set("trust proxy", 1);

   app.use(helmet());
   // ... остальной код
   ```

3. **Закоммитьте и запушьте изменения:**

   ```bash
   git add backend/src/index.js
   git commit -m "Fix: Add trust proxy for Render deployment"
   git push
   ```

4. **Render автоматически пересоберет проект** - ошибка исчезнет

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
