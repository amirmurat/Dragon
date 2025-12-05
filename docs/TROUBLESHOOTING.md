# Troubleshooting

## Ошибка: "localhost:8080 Failed to load resource: net::ERR_CONNECTION_REFUSED"

**Проблема:** Frontend пытается подключиться к `localhost:8080` вместо продакшен backend.

**Причина:** Переменная окружения `VITE_API_BASE` не установлена в Vercel или установлена неправильно.

**Решение:**

1. Зайдите в Vercel Dashboard → ваш frontend проект → Settings → Environment Variables
2. Проверьте, что есть переменная:
   - **Key:** `VITE_API_BASE`
   - **Value:** `https://moonsalon-backend.onrender.com` (ваш реальный URL backend из Render)
   - ⚠️ **БЕЗ завершающего слэша!**
3. Если переменной нет, добавьте её:
   - Нажмите "Add New"
   - Key: `VITE_API_BASE`
   - Value: ваш URL backend из Render
   - Environments: Production, Preview, Development (или только Production)
   - Нажмите "Save"
4. **Пересоберите проект:**
   - Deployments → последний деплой → "Redeploy"
   - Или запушьте новый коммит в GitHub

## Ошибка: "Manifest: Line: 1, column: 1, Syntax error"

**Проблема:** Файл `site.webmanifest` отсутствует или имеет неправильный формат.

**Решение:**

1. Убедитесь, что файл `frontend/public/site.webmanifest` существует
2. Проверьте, что файл имеет правильный JSON формат (без комментариев)
3. Если файла нет, создайте его:

```json
{
  "name": "MoonSalon",
  "short_name": "MoonSalon",
  "description": "MoonSalon: book beauty and wellness providers in a few clicks.",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#103559",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

4. Закоммитьте и запушьте изменения

## Ошибка: "/providers/me: 404 Not Found"

**Проблема:** Эндпоинт `/providers/me` возвращает 404.

**Причина:** Это **нормальное поведение**, если у пользователя нет провайдера. Эндпоинт возвращает 404, если провайдер не найден для текущего пользователя.

**Решение:**

- Если вы PROVIDER и хотите создать провайдера:
  1. Войдите в систему
  2. Перейдите в Dashboard
  3. Создайте провайдера через форму

- Если вы ADMIN и хотите проверить провайдеров:
  1. Войдите в систему
  2. Перейдите в Admin панель (`/admin`)
  3. Откройте вкладку "Providers"

**Если ошибка возникает постоянно и мешает работе:**

Проверьте, что:
1. Backend запущен и доступен
2. Вы авторизованы (есть токен в localStorage)
3. Ваш токен не истек

## Ошибка: "unauthorized" при попытке войти

См. [ADMIN_ACCOUNT.md](./ADMIN_ACCOUNT.md) для инструкций по созданию админского аккаунта.

## Ошибка: CORS policy

**Проблема:** "Access to fetch at '...' from origin '...' has been blocked by CORS policy"

**Решение:**

1. Проверьте `CORS_ORIGIN` в Render:
   - Render Dashboard → ваш backend → Environment
   - Убедитесь, что `CORS_ORIGIN` установлен в **точный URL вашего frontend**
   - ⚠️ **БЕЗ завершающего слэша!**
   - Например: `https://dragon-1-ten.vercel.app` (не `https://dragon-1-ten.vercel.app/`)

2. Пересоберите backend на Render после изменения переменной

3. Пересоберите frontend на Vercel

## Проверка переменных окружения

### Frontend (Vercel)

Проверьте в Vercel Dashboard → ваш проект → Settings → Environment Variables:

- ✅ `VITE_API_BASE` = `https://moonsalon-backend.onrender.com` (ваш URL backend)

### Backend (Render)

Проверьте в Render Dashboard → ваш backend → Environment:

- ✅ `DATABASE_URL` = ваш PostgreSQL URL
- ✅ `JWT_SECRET` = случайная строка (минимум 32 символа)
- ✅ `CORS_ORIGIN` = `https://dragon-1-ten.vercel.app` (ваш URL frontend, БЕЗ слэша)
- ✅ `FRONTEND_URL` = `https://dragon-1-ten.vercel.app` (ваш URL frontend, БЕЗ слэша)
- ✅ `PORT` = `10000` (или оставьте пустым, Render установит автоматически)

