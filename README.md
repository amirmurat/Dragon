# Zapis Clone — Variant A (Express + SQLite/Prisma + JWT)

**Frontend:** React + Vite + TS + Tailwind v4  
**Backend:** Node.js + Express + Prisma (SQLite), JWT (jsonwebtoken), bcrypt

## Быстрый запуск на другом ноутбуке (Windows/macOS/Linux)

### Требования

- Node.js 18+ (рекомендовано 20 LTS)
- npm 9+ (идёт в комплекте с Node.js)

### 1) Клонирование проекта

```bash
git clone <ваш-репозиторий> moon-salon
cd moon-salon
```

### 2) Запуск backend (порт 8080)

```bash
cd backend
npm ci
npm run db:push      # создаст/обновит SQLite-схему
npm run seed         # наполнит базу демо-данными (пользователи, мастера, услуги)
npm run dev          # запустит сервер с автоперезапуском
```

Сервер поднимется на http://localhost:8080

Полезные скрипты:

- Сделать пользователя администратором (после регистрации через фронт):
  ```bash
  node ./scripts/make-admin.mjs --email you@example.com
  ```

### 3) Запуск frontend (порт 5173)

В новом терминале:

```bash
cd frontend
npm ci
npm run dev
```

Откройте в браузере: http://localhost:5173

### 4) Вход в систему

- Зарегистрируйтесь на странице Sign up (или используйте данные из seed)
- После входа доступны: список провайдеров, бронирования, кабинет владельца, админ-панель (для ADMIN)

### Переменные окружения (опционально)

По умолчанию используются значения:

- Backend CORS: `http://localhost:5173`
- SQLite база: `backend/prisma/dev.db`
  Файл `.env` не обязателен для локального запуска.

### Типичные проблемы

- Порт занят: измените порт фронтенда флагом `--port 5174` (Vite) или закройте процесс, занимающий 8080/5173
- Ошибка Prisma: переустановите зависимости `npm ci` и выполните `npm run db:push`
- Нет прав ADMIN: запустите `node ./backend/scripts/make-admin.mjs --email ваш@почта`

### Структура изображений

Кладите ассеты в `frontend/public/images/` (например: `logo.svg`, `background.png`). Они будут доступны по пути `/images/<имя>`.
