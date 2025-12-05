// Smoke test - минимальная нагрузка для проверки работоспособности
import http from "k6/http";
import { check, sleep } from "k6";
import { Rate } from "k6/metrics";

const errorRate = new Rate("errors");

export const options = {
  stages: [
    { duration: "30s", target: 1 }, // 1 пользователь на 30 секунд
  ],
  thresholds: {
    errors: ["rate<0.1"], // менее 10% ошибок
    http_req_duration: ["p(95)<500"], // 95% запросов должны быть быстрее 500ms
  },
};

const BASE_URL = __ENV.BASE_URL || "http://localhost:8080";

const TEST_CLIENT = { email: "client@gmail.com", password: "password123" };

function login(account) {
  const res = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({
      email: account.email,
      password: account.password,
    }),
    {
      headers: { "Content-Type": "application/json" },
    }
  );

  if (res.status === 200) {
    const body = JSON.parse(res.body);
    return body.token;
  }
  return null;
}

export default function () {
  // Health check
  const healthRes = http.get(`${BASE_URL}/api/health`);
  const healthOk = check(healthRes, {
    "health check status is 200": (r) => r.status === 200,
    "health check response is UP": (r) => JSON.parse(r.body).status === "UP",
  });
  errorRate.add(!healthOk);

  sleep(1);

  // Простой тест аутентификации
  const token = login(TEST_CLIENT);
  if (token) {
    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    // Тест получения провайдеров
    const providersRes = http.get(`${BASE_URL}/providers?page=1&pageSize=5`, {
      headers,
    });
    check(providersRes, {
      "providers status is 200": (r) => r.status === 200,
    });
  }

  sleep(1);
}
