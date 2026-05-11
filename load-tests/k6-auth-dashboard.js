import http from "k6/http";
import { check, sleep } from "k6";

const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";
const AUTH_TOKEN = __ENV.AUTH_TOKEN || "";

export const options = {
  stages: [
    { duration: "30s", target: 2 },
    { duration: "1m", target: 5 },
    { duration: "30s", target: 0 },
  ],
  thresholds: {
    http_req_failed: ["rate<0.02"],
    http_req_duration: ["p(95)<1800", "p(99)<3500"],
  },
};

export default function authDashboard() {
  if (!AUTH_TOKEN) {
    throw new Error("AUTH_TOKEN is required for authenticated dashboard load tests.");
  }

  const headers = {
    Authorization: `Bearer ${AUTH_TOKEN}`,
    "Content-Type": "application/json",
    "x-load-test": "synthetic-auth-dashboard",
  };

  const dashboard = http.get(`${BASE_URL}/api/dashboard`, { headers, tags: { route: "dashboard" } });
  check(dashboard, {
    "dashboard returns auth-aware status": (res) => [200, 401, 403].includes(res.status),
    "dashboard avoids raw 5xx": (res) => res.status < 500,
  });

  const history = http.get(`${BASE_URL}/api/history?limit=10`, { headers, tags: { route: "history" } });
  check(history, {
    "history returns auth-aware status": (res) => [200, 401, 403].includes(res.status),
    "history avoids raw 5xx": (res) => res.status < 500,
  });

  const water = http.post(
    `${BASE_URL}/api/logs/water`,
    JSON.stringify({ amount_ml: 250 }),
    { headers, tags: { route: "quick-add-water" } },
  );
  check(water, {
    "quick add returns auth-aware status": (res) => [200, 401, 403, 429].includes(res.status),
    "quick add avoids raw 5xx": (res) => res.status < 500,
  });

  sleep(1);
}
