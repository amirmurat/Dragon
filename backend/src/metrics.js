import { Registry, Counter, Histogram, Gauge } from 'prom-client';

// Создаем отдельный registry для метрик
export const register = new Registry();

// Добавляем стандартные метрики Node.js
register.setDefaultLabels({
  app: 'moonsalon-backend',
});

// HTTP метрики
export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.1, 0.5, 1, 2, 5],
  registers: [register],
});

export const httpRequestTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status'],
  registers: [register],
});

export const httpRequestErrors = new Counter({
  name: 'http_request_errors_total',
  help: 'Total number of HTTP request errors',
  labelNames: ['method', 'route', 'status'],
  registers: [register],
});

// Бизнес метрики
export const appointmentsCreated = new Counter({
  name: 'appointments_created_total',
  help: 'Total number of appointments created',
  registers: [register],
});

export const appointmentsCancelled = new Counter({
  name: 'appointments_cancelled_total',
  help: 'Total number of appointments cancelled',
  registers: [register],
});

export const usersRegistered = new Counter({
  name: 'users_registered_total',
  help: 'Total number of users registered',
  registers: [register],
});

export const activeUsers = new Gauge({
  name: 'active_users',
  help: 'Number of active users (logged in)',
  registers: [register],
});

// Database метрики
export const dbQueryDuration = new Histogram({
  name: 'db_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['operation'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1],
  registers: [register],
});

// Регистрируем все метрики
register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestTotal);
register.registerMetric(httpRequestErrors);
register.registerMetric(appointmentsCreated);
register.registerMetric(appointmentsCancelled);
register.registerMetric(usersRegistered);
register.registerMetric(activeUsers);
register.registerMetric(dbQueryDuration);

