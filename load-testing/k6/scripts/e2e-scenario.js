// End-to-end scenario test - полный сценарий пользователя
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('errors');
const scenarioDuration = new Trend('scenario_duration');

export const options = {
  stages: [
    { duration: '1m', target: 5 },  // 5 пользователей выполняют полный сценарий
    { duration: '3m', target: 5 },
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    errors: ['rate<0.05'],
    http_req_duration: ['p(95)<1500'],
    scenario_duration: ['p(95)<5000'], // Весь сценарий должен завершиться за 5 секунд
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';

// Используем предварительно созданные аккаунты
const TEST_CLIENT = { email: 'client@gmail.com', password: 'password123' };

function login(account) {
  const res = http.post(`${BASE_URL}/auth/login`, JSON.stringify({
    email: account.email,
    password: account.password,
  }), {
    headers: { 'Content-Type': 'application/json' },
  });

  if (res.status === 200) {
    const body = JSON.parse(res.body);
    return body.token;
  }
  return null;
}

export default function () {
  const scenarioStart = Date.now();

  // 1. Health check
  const healthRes = http.get(`${BASE_URL}/api/health`);
  check(healthRes, {
    'health check status is 200': (r) => r.status === 200,
  });

  sleep(0.5);

  // 2. Логин
  const token = login(TEST_CLIENT);
  if (!token) {
    errorRate.add(1);
    return;
  }

  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  sleep(0.5);

  // 3. Получение списка провайдеров с фильтрами
  const providersRes = http.get(`${BASE_URL}/providers?page=1&pageSize=10&sortBy=name&sortOrder=asc`, { headers });
  const providersOk = check(providersRes, {
    'providers status is 200': (r) => r.status === 200,
    'providers returns data': (r) => {
      const body = JSON.parse(r.body);
      return (Array.isArray(body.items) && body.items.length > 0) || Array.isArray(body);
    },
  });
  errorRate.add(!providersOk);

  if (!providersOk) {
    return;
  }

  const providersBody = JSON.parse(providersRes.body);
  const providers = Array.isArray(providersBody.items) ? providersBody.items : providersBody;
  
  if (providers.length === 0) {
    return;
  }

  const firstProvider = providers[0];
  sleep(1);

  // 4. Получение информации о провайдере
  const providerRes = http.get(`${BASE_URL}/providers/${firstProvider.id}`, { headers });
  check(providerRes, {
    'provider details status is 200': (r) => r.status === 200,
  });

  sleep(0.5);

  // 5. Получение услуг провайдера
  const servicesRes = http.get(`${BASE_URL}/providers/${firstProvider.id}/services`, { headers });
  const servicesOk = check(servicesRes, {
    'services status is 200': (r) => r.status === 200,
    'services returns array': (r) => Array.isArray(JSON.parse(r.body)),
  });
  errorRate.add(!servicesOk);

  sleep(0.5);

  // 6. Получение доступных слотов (на завтра)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dateStr = tomorrow.toISOString().split('T')[0];
  
  const availabilityRes = http.get(`${BASE_URL}/providers/${firstProvider.id}/availability?date=${dateStr}`, { headers });
  check(availabilityRes, {
    'availability status is 200': (r) => r.status === 200,
  });

  sleep(1);

  // 7. Получение моих бронирований
  const appointmentsRes = http.get(`${BASE_URL}/appointments?mine=true&page=1&pageSize=10`, { headers });
  check(appointmentsRes, {
    'appointments status is 200': (r) => r.status === 200,
  });

  sleep(1);

  // 8. Получение информации о текущем пользователе
  const meRes = http.get(`${BASE_URL}/auth/me`, { headers });
  check(meRes, {
    'me status is 200': (r) => r.status === 200,
    'me returns user data': (r) => {
      const body = JSON.parse(r.body);
      return body.email && body.role;
    },
  });

  scenarioDuration.add(Date.now() - scenarioStart);
}

