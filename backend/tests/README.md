# Тестирование

В проекте реализованы unit и integration тесты с использованием встроенного Node.js test runner и supertest.

## Структура тестов

```
tests/
├── helpers.js                    # Утилиты для тестов (создание тестовых данных)
├── unit/                         # Unit тесты
│   ├── middleware.test.js        # Тесты middleware функций
│   └── utils.test.js             # Тесты утилит
├── integration/                  # Integration тесты
│   ├── auth.test.js              # Тесты аутентификации
│   ├── appointments.test.js      # Тесты записей
│   ├── providers.test.js         # Тесты провайдеров
│   ├── admin.test.js             # Тесты админ-панели
│   └── middleware-owner.test.js  # Тесты проверки владельца
├── health.test.js                # Тест health endpoint
└── providerFilters.test.js       # Тесты фильтров провайдеров
```

## Запуск тестов

```bash
# Все тесты
npm test

# Конкретный файл
node --test tests/integration/auth.test.js
```

## Тестовая база данных

По умолчанию тесты используют базу данных `file:./prisma/test.db`. Для использования отдельной тестовой БД можно установить переменную окружения:

```bash
DATABASE_URL="file:./prisma/test.db" npm test
```

## Типы тестов

### Unit тесты

- **middleware.test.js** - тестирует функции middleware:
  - `requireAuth` - проверка аутентификации
  - `authOptional` - опциональная аутентификация
  - `ensureRole` - проверка ролей

- **utils.test.js** - тестирует утилиты:
  - `buildProviderWhere` - построение фильтров для провайдеров
  - `normalizePagination` - нормализация пагинации

### Integration тесты

- **auth.test.js** - тестирует endpoints аутентификации:
  - POST `/auth/register` - регистрация
  - POST `/auth/login` - вход
  - GET `/auth/me` - текущий пользователь
  - GET `/auth/verify` - верификация email

- **appointments.test.js** - тестирует endpoints записей:
  - GET `/appointments` - список записей
  - POST `/appointments` - создание записи
  - PATCH `/appointments/:id` - обновление записи
  - Фильтрация и пагинация

- **providers.test.js** - тестирует endpoints провайдеров:
  - GET `/providers` - список провайдеров
  - POST `/providers` - создание провайдера
  - GET `/providers/:id/services` - услуги провайдера
  - Управление услугами и рабочими часами

- **admin.test.js** - тестирует админ-панель:
  - Управление пользователями
  - Управление провайдерами
  - Управление категориями
  - Метрики и статистика

- **middleware-owner.test.js** - тестирует проверку владельца:
  - `ensureOwnerOrAdmin` - доступ владельца и админа

## Helpers

Файл `helpers.js` содержит утилиты для упрощения написания тестов:

- `createTestUser()` - создание тестового пользователя
- `createTestProvider()` - создание тестового провайдера
- `createTestCategory()` - создание тестовой категории
- `createTestService()` - создание тестовой услуги
- `createTestAppointment()` - создание тестовой записи
- `createTestToken()` - создание JWT токена
- `cleanupTestData()` - очистка тестовых данных
- `testPrisma` - экземпляр PrismaClient для тестов

## Очистка данных

Каждый integration тест использует `test.before()` и `test.after()` для очистки данных перед и после тестов. Это гарантирует изолированность тестов.

## Заметки

- Тесты используют реальную БД (SQLite), что делает их integration тестами
- Для unit тестов middleware используются моки без БД
- Все тесты должны быть идемпотентными и не зависеть друг от друга


