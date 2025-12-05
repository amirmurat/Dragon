// Load test - средняя нагрузка для проверки производительности
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('errors');
const authDuration = new Trend('auth_duration');
const providersDuration = new Trend('providers_duration');
const appointmentsDuration = new Trend('appointments_duration');

export const options = {
  stages: [
    { duration: '1m', target: 10 },  // Ramp up до 10 пользователей за 1 минуту
    { duration: '3m', target: 10 }, // Держим 10 пользователей 3 минуты
    { duration: '1m', target: 20 },  // Увеличиваем до 20 пользователей
    { duration: '3m', target: 20 },  // Держим 20 пользователей 3 минуты
    { duration: '1m', target: 0 },   // Ramp down до 0
  ],
  thresholds: {
    errors: ['rate<0.05'], // менее 5% ошибок
    http_req_duration: ['p(95)<1000'], // 95% запросов должны быть быстрее 1s
    auth_duration: ['p(95)<500'],
    providers_duration: ['p(95)<800'],
    appointments_duration: ['p(95)<1000'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';

// Генерируем уникальный email для каждого виртуального пользователя
function generateEmail() {
  return `loadtest_${__VU}_${__ITER}_${Date.now()}@test.com`;
}

// Регистрация и получение токена
function registerAndLogin() {
  const email = generateEmail();
  const password = 'testpass123';

  // Регистрация
  const registerRes = http.post(`${BASE_URL}/auth/register`, JSON.stringify({
    email: email,
    password: password,
  }), {
    headers: { 'Content-Type': 'application/json' },
  });

  const registerOk = check(registerRes, {
    'register status is 201': (r) => r.status === 201,
  });
  errorRate.add(!registerOk);

  if (!registerOk) {
    return null;
  }

  // Для теста пропускаем верификацию email (в реальности нужно верифицировать)
  // В тестовой среде можно использовать предварительно созданные аккаунты
  // или автоматически верифицировать через админку
  
  // Попытка логина (может не сработать без верификации)
  const loginRes = http.post(`${BASE_URL}/auth/login`, JSON.stringify({
    email: email,
    password: password,
  }), {
    headers: { 'Content-Type': 'application/json' },
  });

  // Если логин не удался из-за верификации, используем тестовый аккаунт
  if (loginRes.status !== 200) {
    // Используем предварительно созданный тестовый аккаунт
    const testLoginRes = http.post(`${BASE_URL}/auth/login`, JSON.stringify({
      email: 'client@gmail.com', // Из seed данных
      password: 'password123',
    }), {
      headers: { 'Content-Type': 'application/json' },
    });

    if (testLoginRes.status === 200) {
      const body = JSON.parse(testLoginRes.body);
      return body.token;
    }
    return null;
  }

  const body = JSON.parse(loginRes.body);
  return body.token;
}

export default function () {
  const startAuth = Date.now();
  
  // Health check
  const healthRes = http.get(`${BASE_URL}/api/health`);
  check(healthRes, {
    'health check status is 200': (r) => r.status === 200,
  });

  // Аутентификация
  const token = registerAndLogin();
  authDuration.add(Date.now() - startAuth);

  if (!token) {
    errorRate.add(1);
    return;
  }

  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  sleep(1);

  // Получение списка провайдеров
  const providersStart = Date.now();
  const providersRes = http.get(`${BASE_URL}/providers?page=1&pageSize=10`, { headers });
  const providersOk = check(providersRes, {
    'providers status is 200': (r) => r.status === 200,
    'providers returns items': (r) => {
      const body = JSON.parse(r.body);
      return Array.isArray(body.items) || Array.isArray(body);
    },
  });
  errorRate.add(!providersOk);
  providersDuration.add(Date.now() - providersStart);

  sleep(1);

  // Получение моих бронирований
  const appointmentsStart = Date.now();
  const appointmentsRes = http.get(`${BASE_URL}/appointments?mine=true&page=1&pageSize=10`, { headers });
  const appointmentsOk = check(appointmentsRes, {
    'appointments status is 200': (r) => r.status === 200,
    'appointments returns items': (r) => {
      const body = JSON.parse(r.body);
      return Array.isArray(body.items) || Array.isArray(body);
    },
  });
  errorRate.add(!appointmentsOk);
  appointmentsDuration.add(Date.now() - appointmentsStart);

  sleep(2);
}

