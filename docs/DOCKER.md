# Docker Guide

## Быстрый старт с Docker

### Требования
- Docker Desktop (Windows/Mac) или Docker Engine (Linux)
- Docker Compose (входит в Docker Desktop)

### Запуск всего проекта одной командой

```bash
# Из корня проекта
docker-compose up --build
```

Это запустит:
- **Backend** на `http://localhost:8080`
- **Frontend** на `http://localhost:80`

### Остановка

```bash
docker-compose down
```

### Пересборка после изменений

```bash
docker-compose up --build
```

## Отдельный запуск сервисов

### Backend

```bash
# Сборка образа
docker build -t moonsalon-backend ./backend

# Запуск контейнера
docker run -p 8080:8080 \
  -e DATABASE_URL=file:./prisma/dev.db \
  -e JWT_SECRET=your-secret \
  -v $(pwd)/backend/prisma/dev.db:/app/prisma/dev.db \
  moonsalon-backend
```

### Frontend

```bash
# Сборка образа
docker build -t moonsalon-frontend ./frontend

# Запуск контейнера
docker run -p 80:80 moonsalon-frontend
```

## Переменные окружения

### Backend

Создайте файл `backend/.env` или используйте переменные в `docker-compose.yml`:

```env
NODE_ENV=production
PORT=8080
DATABASE_URL=file:./prisma/dev.db
JWT_SECRET=your-secret-key-here
CORS_ORIGIN=http://localhost:5173
```

### Frontend

При сборке frontend образа можно передать переменные через build args:

```dockerfile
# В docker-compose.yml или при сборке
docker build --build-arg VITE_API_BASE=https://api.example.com ./frontend
```

Или через `.env` файл (для локальной разработки):

```env
VITE_API_BASE=http://localhost:8080
```

## Production деплой с Docker

### 1. Сборка production образов

```bash
# Backend
docker build -t moonsalon-backend:latest ./backend

# Frontend
docker build --build-arg VITE_API_BASE=https://api.yourdomain.com -t moonsalon-frontend:latest ./frontend
```

### 2. Запуск на сервере

```bash
# Используйте docker-compose.prod.yml (создайте его на основе docker-compose.yml)
docker-compose -f docker-compose.prod.yml up -d
```

### 3. Использование внешней БД

Для production рекомендуется использовать PostgreSQL вместо SQLite:

```yaml
# В docker-compose.yml
environment:
  - DATABASE_URL=postgresql://user:password@postgres:5432/moonsalon
```

## Troubleshooting

### Проблема: База данных не сохраняется

**Решение:** Убедитесь, что volume правильно смонтирован:
```yaml
volumes:
  - ./backend/prisma/dev.db:/app/prisma/dev.db
```

### Проблема: Frontend не может подключиться к backend

**Решение:** Проверьте переменную `VITE_API_BASE` при сборке frontend:
```bash
docker build --build-arg VITE_API_BASE=http://localhost:8080 ./frontend
```

### Проблема: Порт уже занят

**Решение:** Измените порты в `docker-compose.yml`:
```yaml
ports:
  - "3000:8080"  # Вместо 8080:8080
```

### Просмотр логов

```bash
# Все сервисы
docker-compose logs

# Только backend
docker-compose logs backend

# Следить за логами в реальном времени
docker-compose logs -f backend
```

## Разработка с Docker

### Hot reload для backend

Для разработки используйте volume для исходного кода:

```yaml
volumes:
  - ./backend/src:/app/src
  - ./backend/prisma:/app/prisma
```

Затем запустите с nodemon или используйте `npm run dev` внутри контейнера.

### Hot reload для frontend

Для разработки лучше использовать `npm run dev` локально, а не Docker.

## Безопасность

⚠️ **Важно для production:**

1. **Никогда не коммитьте `.env` файлы** с реальными секретами
2. **Используйте Docker secrets** или переменные окружения на сервере
3. **Меняйте JWT_SECRET** на уникальный случайный ключ
4. **Используйте HTTPS** в production
5. **Ограничьте CORS_ORIGIN** только вашим доменом

## Полезные команды

```bash
# Просмотр запущенных контейнеров
docker-compose ps

# Остановка всех контейнеров
docker-compose stop

# Удаление контейнеров и volumes
docker-compose down -v

# Перезапуск сервиса
docker-compose restart backend

# Выполнение команды внутри контейнера
docker-compose exec backend sh

# Просмотр использования ресурсов
docker stats
```

