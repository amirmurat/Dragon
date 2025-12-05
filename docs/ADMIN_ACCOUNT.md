# Создание админского аккаунта

## Локально

Для создания админского аккаунта локально:

```bash
cd backend
npm run create-admin admin@gmail.com admin123
```

Или сделать существующего пользователя админом:

```bash
cd backend
npm run make-admin existing-user@example.com
```

## На продакшене (Render)

Если вы пытаетесь войти на продакшене и получаете ошибку "unauthorized", возможно, админский аккаунт не создан в продакшен базе данных.

⚠️ **Примечание:** Render Shell платный, поэтому используем альтернативные способы.

### Вариант 1: Через внешний URL базы данных (если доступен)

Render PostgreSQL базы данных обычно имеют два URL:
- **Внутренний** (для сервисов внутри Render): `dpg-xxx-a`
- **Внешний** (для внешних подключений): `dpg-xxx-a.oregon-postgres.render.com:5432`

1. Проверьте в Render Dashboard → ваш PostgreSQL сервис → **"Info"** или **"Connections"**
2. Найдите **"External Connection String"** или **"External Database URL"**
3. Используйте этот URL для подключения:

**Windows PowerShell:**
```powershell
# Используйте ВНЕШНИЙ URL (с доменом .render.com)
$env:DATABASE_URL="postgresql://user:password@dpg-xxx-a.oregon-postgres.render.com:5432/database?sslmode=require"
cd backend
npm run db:switch:postgresql
npm run prisma:generate
node scripts/create-admin.mjs admin@gmail.com admin123
```

⚠️ **Если внешний URL недоступен или база данных в приватной сети**, используйте Вариант 2.

### Вариант 2: Через временный API endpoint (РЕКОМЕНДУЕТСЯ, если база недоступна)

Самый простой способ - использовать специальный API endpoint для создания первого админа:

**Windows PowerShell:**
```powershell
# Замените на ваш реальный URL backend из Render
$backendUrl = "https://moonsalon-backend.onrender.com"
$body = @{
    email = "admin@gmail.com"
    password = "admin123"
} | ConvertTo-Json

Invoke-RestMethod -Uri "$backendUrl/auth/create-first-admin" -Method POST -Body $body -ContentType "application/json"
```

**Или через curl (если установлен):**
```bash
curl -X POST https://moonsalon-backend.onrender.com/auth/create-first-admin \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@gmail.com","password":"admin123"}'
```

**Или через браузер (консоль разработчика F12):**
```javascript
fetch('https://moonsalon-backend.onrender.com/auth/create-first-admin', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'admin@gmail.com', password: 'admin123' })
})
.then(r => r.json())
.then(console.log)
```

⚠️ **Важно:** 
- Этот endpoint работает только **один раз** - если в базе уже есть админ, он вернет ошибку `admin_already_exists`
- После создания первого админа, используйте обычный способ через админ-панель для создания дополнительных админов

### Вариант 3: Через локальное подключение (если база доступна)

1. Скопируйте `DATABASE_URL` из Render Dashboard → ваш backend сервис → Environment
2. Создайте временный файл `.env.production`:

```bash
DATABASE_URL="ваш_postgresql_url_из_render"
```

3. Запустите скрипт с этим файлом:

```bash
cd backend
node -r dotenv/config scripts/create-admin.mjs admin@gmail.com admin123 dotenv_config_path=.env.production
```

**Или установите переменную окружения напрямую (проще):**

**Windows PowerShell:**
```powershell
$env:DATABASE_URL="ваш_postgresql_url_из_render"
cd backend
node scripts/create-admin.mjs admin@gmail.com admin123
```

**Windows CMD:**
```cmd
set DATABASE_URL=ваш_postgresql_url_из_render
cd backend
node scripts/create-admin.mjs admin@gmail.com admin123
```

**Linux/Mac:**
```bash
export DATABASE_URL="ваш_postgresql_url_из_render"
cd backend
node scripts/create-admin.mjs admin@gmail.com admin123
```

### Вариант 3: Через Prisma Studio (визуально)

1. Подключитесь к продакшен базе:

```bash
cd backend
# Установите DATABASE_URL из Render
export DATABASE_URL="ваш_postgresql_url_из_render"  # Linux/Mac
# или
set DATABASE_URL=ваш_postgresql_url_из_render  # Windows CMD
# или
$env:DATABASE_URL="ваш_postgresql_url_из_render"  # Windows PowerShell

# Переключите Prisma на PostgreSQL
npm run db:switch:postgresql

# Откройте Prisma Studio
npx prisma studio
```

2. В Prisma Studio:
   - Найдите пользователя `admin@gmail.com` (или создайте нового)
   - Установите `role: ADMIN`
   - Установите `emailConfirmed: true`
   - Сохраните

## Проверка админского аккаунта

Проверить, что админский аккаунт создан правильно:

```bash
cd backend
node scripts/check-user.mjs admin@gmail.com
```

Проверить пароль:

```bash
cd backend
node scripts/test-login.mjs admin@gmail.com admin123
```

## Данные для входа (по умолчанию)

- **Email:** `admin@gmail.com`
- **Password:** `admin123`
- **Role:** `ADMIN`
- **Email Verified:** `✅`

⚠️ **Важно:** После создания админского аккаунта на продакшене, вы сможете войти на сайте `https://dragon-1-ten.vercel.app` (или ваш URL frontend).

## Сброс пароля

Если забыли пароль:

```bash
cd backend
npm run reset-password admin@gmail.com новый_пароль
```

Или используйте скрипт напрямую:

```bash
cd backend
node scripts/reset-password.mjs admin@gmail.com новый_пароль
```

