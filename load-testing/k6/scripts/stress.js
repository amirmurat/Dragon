// Stress test - высокая нагрузка для проверки пределов системы
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '1m', target: 50 },   // Ramp up до 50 пользователей
    { duration: '2m', target: 50 },   // Держим 50 пользователей
    { duration: '1m', target: 100 }, // Увеличиваем до 100
    { duration: '2m', target: 100 }, // Держим 100 пользователей
    { duration: '1m', target: 150 },  // Увеличиваем до 150
    { duration: '2m', target: 150 },  // Держим 150 пользователей
    { duration: '1m', target: 0 },    // Ramp down
  ],
  thresholds: {
    errors: ['rate<0.1'], // допускаем до 10% ошибок при стресс-тесте
    http_req_duration: ['p(95)<2000'], // 95% запросов должны быть быстрее 2s
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';

// Используем предварительно созданные тестовые аккаунты
const TEST_ACCOUNTS = [
  { email: 'client@gmail.com', password: 'password123' },
  { email: 'seller@gmail.com', password: 'password123' },
];

function getTestAccount() {
  const index = __VU % TEST_ACCOUNTS.length;
  return TEST_ACCOUNTS[index];
}

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
  // Health check
  const healthRes = http.get(`${BASE_URL}/api/health`);
  check(healthRes, {
    'health check status is 200': (r) => r.status === 200,
  });

  // Логин
  const account = getTestAccount();
  const token = login(account);

  if (!token) {
    errorRate.add(1);
    return;
  }

  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  // Параллельные запросы для создания нагрузки
  const requests = [
    { url: `${BASE_URL}/providers?page=1&pageSize=10`, name: 'providers' },
    { url: `${BASE_URL}/providers?page=2&pageSize=10`, name: 'providers_page2' },
    { url: `${BASE_URL}/appointments?mine=true`, name: 'appointments' },
    { url: `${BASE_URL}/auth/me`, name: 'me' },
  ];

  const responses = http.batch(requests.map(req => ({
    method: 'GET',
    url: req.url,
    params: { headers },
  })));

  // Проверяем результаты
  responses.forEach((res, index) => {
    const ok = check(res, {
      [`${requests[index].name} status is 200`]: (r) => r.status === 200,
    });
    errorRate.add(!ok);
  });

  sleep(1);
}

