import http from "k6/http";
import { check, sleep } from "k6";

const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";
const AUTH_TOKEN = __ENV.AUTH_TOKEN || "";

http.setResponseCallback(http.expectedStatuses(200, 429));

export const options = {
  stages: [
    { duration: "30s", target: 1 },
    { duration: "1m", target: 3 },
    { duration: "30s", target: 0 },
  ],
  thresholds: {
    http_req_failed: ["rate<0.02"],
    http_req_duration: ["p(95)<2500", "p(99)<5000"],
    "http_req_duration{route:mobile-health-sync}": ["p(95)<3000"],
  },
};

export default function mobileHealthSync() {
  if (!AUTH_TOKEN) {
    throw new Error("AUTH_TOKEN is required for mobile health sync load tests.");
  }

  const now = new Date();
  const start = new Date(now.getTime() - 30 * 60 * 1000);
  const headers = {
    Authorization: `Bearer ${AUTH_TOKEN}`,
    "Content-Type": "application/json",
    "x-load-test": "synthetic-mobile-health-sync",
  };

  const response = http.post(
    `${BASE_URL}/api/mobile-health/sync`,
    JSON.stringify({
      sourcePlatform: "android_health_connect",
      sourceDevice: "synthetic-test-device",
      idempotencyKey: `k6-${__VU}-${__ITER}-${Date.now()}`,
      consentGranted: true,
      records: [
        {
          type: "steps",
          startTime: start.toISOString(),
          endTime: now.toISOString(),
          value: 1200,
          unit: "count",
        },
        {
          type: "workout",
          workoutType: "run",
          startTime: start.toISOString(),
          endTime: now.toISOString(),
          distanceKm: 3,
          calories: 220,
          averageHeartRateBpm: 135,
        },
      ],
    }),
    { headers, tags: { route: "mobile-health-sync" } },
  );

  check(response, {
    "mobile sync accepts bearer token": (res) => [200, 429].includes(res.status),
    "mobile sync avoids raw 5xx": (res) => res.status < 500,
    "mobile sync returns JSON": (res) => String(res.headers["Content-Type"]).includes("application/json"),
  });

  sleep(1);
}
