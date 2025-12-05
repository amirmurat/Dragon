// Spike test - резкие скачки нагрузки для проверки устойчивости
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '10s', target: 10 },   // Нормальная нагрузка
    { duration: '1m', target: 10 },
    { duration: '10s', target: 200 }, // Резкий скачок до 200 пользователей
    { duration: '1m', target: 200 },
    { duration: '10s', target: 10 },  // Резкое снижение
    { duration: '1m', target: 10 },
    { duration: '10s', target: 300 }, // Еще больший скачок
    { duration: '1m', target: 300 },
    { duration: '10s', target: 10 },  // Возврат к норме
    { duration: '1m', target: 10 },
  ],
  thresholds: {
    errors: ['rate<0.15'], // допускаем до 15% ошибок при spike тесте
    http_req_duration: ['p(95)<3000'], // 95% запросов должны быть быстрее 3s
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';

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

  // Простые запросы для создания нагрузки
  const providersRes = http.get(`${BASE_URL}/providers?page=1&pageSize=5`, { headers });
  check(providersRes, {
    'providers status is 200': (r) => r.status === 200,
  });

  sleep(0.5);
}

