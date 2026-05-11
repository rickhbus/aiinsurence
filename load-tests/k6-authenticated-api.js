import http from "k6/http";
import { check, sleep } from "k6";

const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";
const AUTH_TOKEN = __ENV.AUTH_TOKEN || "";

export const options = {
  stages: [
    { duration: "30s", target: 1 },
    { duration: "1m", target: 2 },
    { duration: "30s", target: 0 },
  ],
  thresholds: {
    http_req_failed: ["rate<0.02"],
    http_req_duration: ["p(95)<1800"],
  },
};

export default function authenticatedApi() {
  if (!AUTH_TOKEN) {
    throw new Error("AUTH_TOKEN is required for authenticated API load tests.");
  }

  const response = http.get(`${BASE_URL}/api/history?limit=10`, {
    headers: {
      Authorization: `Bearer ${AUTH_TOKEN}`,
      "x-load-test": "synthetic-auth-baseline",
    },
  });

  check(response, {
    "history authenticated API returns non-5xx": (res) => res.status < 500,
    "history authenticated API returns auth-aware status": (res) =>
      [200, 401, 403].includes(res.status),
  });

  sleep(1);
}
