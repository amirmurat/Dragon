# Zapis Clone — Variant A (Express + SQLite/Prisma + JWT)

**Frontend:** React + Vite + TS + Tailwind v4  
**Backend:** Node.js + Express + Prisma (SQLite), JWT (jsonwebtoken), bcrypt

## Быстрый запуск

### Вариант 1: Docker (рекомендуется)

**Требования:**

- Docker Desktop (Windows/Mac) или Docker Engine (Linux)
- Docker Compose

```bash
# Запуск всего проекта одной командой
docker-compose up --build
```

Backend: http://localhost:8080  
Frontend: http://localhost:80

Подробнее: [docs/DOCKER.md](./docs/DOCKER.md)

### Вариант 2: Локальная разработка

**Требования:**

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

## Week 9–15 Deliverables

- `/providers` поддерживает расширенный поиск (ключевые слова, категории, услуги, цена, сортировка по имени или рейтингу, пагинация на фронте).
- `/appointments?mine=true` получает фильтры по статусу и датам, сортировку и пагинацию; страница Bookings использует их для удобной навигации.
- Включены `helmet`, глобальный rate limit, файловые логи запросов и активности, а также `/admin/metrics` для быстрой диагностики.
- `npm test` в backend запускает автоматические проверки здоровья API и логики фильтров.
- Инструкции по деплою и работе с проектом: `docs/DEPLOYMENT.md`, `docs/PROJECT_GUIDE.md`.

### Структура изображений

Кладите ассеты в `frontend/public/images/` (например: `logo.svg`, `background.png`). Они будут доступны по пути `/images/<имя>`.

## CI/CD

Проект включает GitHub Actions workflow для автоматического тестирования и сборки:

- Тесты запускаются при каждом push/PR
- Docker образы собираются для проверки
- См. `.github/workflows/ci.yml` для деталей

## Документация

- [Docker Guide](./docs/DOCKER.md) — запуск с Docker
- [Deployment Guide](./docs/DEPLOYMENT.md) — деплой на production
- [Deployment Steps](./docs/DEPLOYMENT_STEPS.md) — пошаговая инструкция по деплою
- [Project Guide](./docs/PROJECT_GUIDE.md) — структура проекта
- [Testing Guide](./backend/tests/README.md) — запуск тестов
- [Load Testing Guide](./load-testing/k6/README.md) — нагрузочное тестирование с k6
- [Monitoring Guide](./docs/MONITORING.md) — мониторинг и метрики

## Load Testing

Проект включает скрипты для нагрузочного тестирования с k6:

```bash
# Smoke test (минимальная нагрузка)
k6 run load-testing/k6/scripts/smoke.js

# Load test (средняя нагрузка)
k6 run load-testing/k6/scripts/load.js

# Stress test (высокая нагрузка)
k6 run load-testing/k6/scripts/stress.js
```

Подробнее: [load-testing/k6/README.md](./load-testing/k6/README.md)
