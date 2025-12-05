# Load Testing with k6

Этот каталог содержит скрипты для нагрузочного тестирования API MoonSalon с использованием [k6](https://k6.io/).

## Установка k6

### Windows
```powershell
# Через Chocolatey
choco install k6

# Или скачайте установщик с https://k6.io/docs/getting-started/installation/
```

### macOS
```bash
brew install k6
```

### Linux
```bash
# Ubuntu/Debian
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

## Подготовка тестовых данных

Перед запуском тестов убедитесь, что в базе данных есть тестовые аккаунты:

```bash
cd backend
npm run seed
```

Это создаст аккаунты:
- `client@gmail.com` / `password123`
- `seller@gmail.com` / `password123`
- `admin@gmail.com` / `password123`

## Запуск тестов

### 1. Smoke Test (минимальная нагрузка)

Проверяет базовую работоспособность API:

```bash
k6 run load-testing/k6/scripts/smoke.js
```

**Параметры:**
- 1 виртуальный пользователь
- 30 секунд
- Проверяет health endpoint и базовую аутентификацию

### 2. Load Test (средняя нагрузка)

Проверяет производительность при нормальной нагрузке:

```bash
k6 run load-testing/k6/scripts/load.js
```

**Параметры:**
- Ramp up до 10 пользователей
- Увеличение до 20 пользователей
- Проверяет регистрацию, логин, получение провайдеров и бронирований

**С кастомным URL:**
```bash
k6 run --env BASE_URL=http://localhost:8080 load-testing/k6/scripts/load.js
```

### 3. Stress Test (высокая нагрузка)

Проверяет пределы системы:

```bash
k6 run load-testing/k6/scripts/stress.js
```

**Параметры:**
- До 150 виртуальных пользователей
- Параллельные запросы
- Проверяет устойчивость системы

### 4. Spike Test (резкие скачки)

Проверяет реакцию на резкие изменения нагрузки:

```bash
k6 run load-testing/k6/scripts/spike.js
```

**Параметры:**
- Резкие скачки от 10 до 200-300 пользователей
- Проверяет устойчивость к внезапным нагрузкам

### 5. End-to-End Scenario (полный сценарий)

Имитирует полный путь пользователя:

```bash
k6 run load-testing/k6/scripts/e2e-scenario.js
```

**Сценарий:**
1. Health check
2. Логин
3. Поиск провайдеров
4. Просмотр деталей провайдера
5. Просмотр услуг
6. Проверка доступных слотов
7. Просмотр бронирований
8. Получение информации о пользователе

## Переменные окружения

- `BASE_URL` - URL backend API (по умолчанию: `http://localhost:8080`)

Пример:
```bash
k6 run --env BASE_URL=https://api.yourdomain.com load-testing/k6/scripts/load.js
```

## Интерпретация результатов

### Основные метрики

- **http_req_duration** - время выполнения запроса
- **http_req_failed** - процент неудачных запросов
- **vus** - количество виртуальных пользователей
- **iterations** - количество выполненных итераций

### Thresholds (пороги)

Каждый скрипт определяет пороги производительности:
- **errors** - максимальный процент ошибок
- **http_req_duration** - максимальное время ответа (p95, p99)

Если пороги не соблюдаются, тест считается проваленным.

### Пример вывода

```
✓ health check status is 200
✓ providers status is 200
✓ appointments status is 200

checks.........................: 100.00% ✓ 1500      ✗ 0
data_received..................: 2.5 MB  42 kB/s
data_sent......................: 450 kB  7.5 kB/s
http_req_duration..............: avg=250ms min=100ms med=200ms max=800ms p(95)=500ms
http_req_failed................: 0.00%   ✓ 0        ✗ 0
iterations.....................: 500     8.3/s
vus............................: 10      min=1      max=20
```

## Рекомендации

### Перед запуском тестов

1. **Убедитесь, что backend запущен:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Проверьте, что база данных заполнена:**
   ```bash
   cd backend
   npm run seed
   ```

3. **Для production тестов:**
   - Используйте отдельную тестовую среду
   - Убедитесь, что rate limiting не блокирует запросы
   - Мониторьте ресурсы сервера (CPU, память, БД)

### Оптимальные результаты

- **Smoke test:** Все проверки должны пройти
- **Load test:** < 5% ошибок, p95 < 1s
- **Stress test:** < 10% ошибок, система должна восстановиться
- **Spike test:** Система должна выдержать скачки без падений

## Интеграция с CI/CD

Можно добавить smoke test в GitHub Actions:

```yaml
- name: Run k6 smoke test
  run: |
    k6 run load-testing/k6/scripts/smoke.js --env BASE_URL=http://localhost:8080
```

## Troubleshooting

### Проблема: Все запросы возвращают 401

**Решение:** Убедитесь, что тестовые аккаунты созданы и верифицированы:
```bash
cd backend
npm run seed
# Или верифицируйте аккаунты вручную через админку
```

### Проблема: Высокий процент ошибок

**Решение:**
- Проверьте, что backend запущен и доступен
- Увеличьте пороги в options.thresholds
- Проверьте логи backend на ошибки

### Проблема: Медленные ответы

**Решение:**
- Проверьте производительность базы данных
- Убедитесь, что нет других процессов, нагружающих систему
- Рассмотрите оптимизацию запросов к БД

## Дополнительные ресурсы

- [k6 Documentation](https://k6.io/docs/)
- [k6 JavaScript API](https://k6.io/docs/javascript-api/)
- [Best Practices](https://k6.io/docs/using-k6/best-practices/)

