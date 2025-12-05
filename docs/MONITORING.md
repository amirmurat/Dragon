# Мониторинг и метрики

MoonSalon включает систему мониторинга на основе Prometheus метрик.

## Доступные метрики

### Endpoint метрик

**URL:** `GET /metrics`

Возвращает метрики в формате Prometheus.

### HTTP метрики

- `http_request_duration_seconds` - длительность HTTP запросов (гистограмма)
- `http_requests_total` - общее количество HTTP запросов (счетчик)
- `http_request_errors_total` - количество ошибок HTTP запросов (счетчик)

**Labels:**
- `method` - HTTP метод (GET, POST, etc.)
- `route` - маршрут запроса
- `status` - HTTP статус код

### Бизнес метрики

- `appointments_created_total` - количество созданных бронирований
- `appointments_cancelled_total` - количество отмененных бронирований
- `users_registered_total` - количество зарегистрированных пользователей
- `active_users` - количество активных пользователей (gauge)

### Database метрики

- `db_query_duration_seconds` - длительность запросов к БД (гистограмма)

**Labels:**
- `operation` - тип операции (findMany, create, update, etc.)

## Использование метрик

### Просмотр метрик локально

```bash
# Запустите backend
cd backend && npm run dev

# Откройте в браузере
http://localhost:8080/metrics
```

### Интеграция с Prometheus

1. Установите Prometheus:
   ```bash
   # macOS
   brew install prometheus

   # Linux
   wget https://github.com/prometheus/prometheus/releases/download/v2.45.0/prometheus-2.45.0.linux-amd64.tar.gz
   tar xvfz prometheus-*.tar.gz
   cd prometheus-*
   ```

2. Создайте конфигурацию `prometheus.yml`:
   ```yaml
   global:
     scrape_interval: 15s

   scrape_configs:
     - job_name: 'moonsalon-backend'
       static_configs:
         - targets: ['localhost:8080']
   ```

3. Запустите Prometheus:
   ```bash
   ./prometheus --config.file=prometheus.yml
   ```

4. Откройте Prometheus UI: `http://localhost:9090`

### Интеграция с Grafana

1. Установите Grafana:
   ```bash
   # macOS
   brew install grafana

   # Linux
   wget https://dl.grafana.com/oss/release/grafana-10.0.0.linux-amd64.tar.gz
   tar -zxvf grafana-10.0.0.linux-amd64.tar.gz
   cd grafana-10.0.0
   ```

2. Запустите Grafana:
   ```bash
   ./bin/grafana-server
   ```

3. Откройте Grafana UI: `http://localhost:3000`
   - Логин: `admin`
   - Пароль: `admin`

4. Добавьте Prometheus как источник данных:
   - Configuration → Data Sources → Add data source
   - Выберите Prometheus
   - URL: `http://localhost:9090`
   - Save & Test

5. Создайте дашборд:
   - Create → Dashboard → Add visualization
   - Выберите метрики для отображения

### Примеры запросов Prometheus

**Средняя длительность запросов:**
```promql
rate(http_request_duration_seconds_sum[5m]) / rate(http_request_duration_seconds_count[5m])
```

**Количество ошибок в минуту:**
```promql
rate(http_request_errors_total[1m])
```

**Количество созданных бронирований:**
```promql
rate(appointments_created_total[5m])
```

**Активные пользователи:**
```promql
active_users
```

## Алерты

### Настройка алертов в Prometheus

Создайте файл `alerts.yml`:

```yaml
groups:
  - name: moonsalon_alerts
    rules:
      - alert: HighErrorRate
        expr: rate(http_request_errors_total[5m]) > 0.1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value }} errors per second"

      - alert: SlowResponseTime
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 2
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Slow response time"
          description: "95th percentile response time is {{ $value }} seconds"

      - alert: HighDatabaseQueryTime
        expr: histogram_quantile(0.95, rate(db_query_duration_seconds_bucket[5m])) > 1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Slow database queries"
          description: "95th percentile DB query time is {{ $value }} seconds"
```

Добавьте в `prometheus.yml`:
```yaml
rule_files:
  - "alerts.yml"

alerting:
  alertmanagers:
    - static_configs:
        - targets: ['localhost:9093']
```

## Логирование

### Файлы логов

- `backend/logs/access.log` - логи всех HTTP запросов (через morgan)
- `backend/logs/activity.log` - логи бизнес-событий (создание бронирований, отмены, etc.)

### Формат логов

**Access log (morgan combined format):**
```
::1 - - [01/Jan/2024:12:00:00 +0000] "GET /api/health HTTP/1.1" 200 45 "-" "Mozilla/5.0..."
```

**Activity log (JSON):**
```json
{"ts":"2024-01-01T12:00:00.000Z","event":"appointment_created","payload":{"appointmentId":"123","userId":"456"}}
```

### Просмотр логов

```bash
# Access logs
tail -f backend/logs/access.log

# Activity logs
tail -f backend/logs/activity.log

# Поиск по логам
grep "appointment_created" backend/logs/activity.log
```

## Метрики в админке

Админ-панель включает endpoint для быстрого просмотра метрик:

**URL:** `GET /admin/metrics` (требует роль ADMIN)

**Ответ:**
```json
{
  "users": 150,
  "providers": 25,
  "appointments": 500,
  "newAppointments": 10
}
```

Где:
- `users` - общее количество пользователей
- `providers` - общее количество провайдеров
- `appointments` - общее количество бронирований
- `newAppointments` - количество бронирований за последние 24 часа

## Production мониторинг

### Рекомендации для production

1. **Настройте автоматические алерты:**
   - Высокий процент ошибок
   - Медленные ответы
   - Проблемы с базой данных

2. **Используйте внешний сервис мониторинга:**
   - [Datadog](https://www.datadoghq.com/)
   - [New Relic](https://newrelic.com/)
   - [Sentry](https://sentry.io/) для отслеживания ошибок

3. **Настройте логирование:**
   - Централизованное хранение логов
   - Ротация логов
   - Архивация старых логов

4. **Мониторинг ресурсов:**
   - CPU использование
   - Память
   - Дисковое пространство
   - Сетевая активность

## Интеграция с облачными платформами

### Render

Render предоставляет встроенный мониторинг:
- Логи доступны в Dashboard
- Метрики CPU/памяти
- Используйте `/metrics` endpoint для Prometheus

### Heroku

Heroku предоставляет:
- Логи через `heroku logs --tail`
- Метрики через Heroku Metrics
- Add-ons для мониторинга (New Relic, Datadog)

### AWS

Для AWS используйте:
- CloudWatch для метрик и логов
- X-Ray для трейсинга
- CloudWatch Alarms для алертов
