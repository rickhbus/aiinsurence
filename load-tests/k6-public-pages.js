import http from "k6/http";
import { check, sleep } from "k6";

const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";

export const options = {
  stages: [
    { duration: "30s", target: 5 },
    { duration: "1m", target: 10 },
    { duration: "30s", target: 0 },
  ],
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<1200", "p(99)<2500"],
  },
};

const routes = [
  "/",
  "/onboarding",
  "/dashboard",
  "/coach",
  "/gbl",
  "/emotion",
  "/insurance",
  "/settings",
  "/api/health",
  "/api/readiness",
];

export default function publicPages() {
  for (const route of routes) {
    const response = http.get(`${BASE_URL}${route}`, {
      headers: { "x-load-test": "synthetic-public-pages" },
      tags: { route },
    });

    check(response, {
      [`${route} returns non-5xx`]: (res) => res.status < 500,
      [`${route} has content`]: (res) => res.body.length > 0,
    });
  }

  sleep(1);
}
