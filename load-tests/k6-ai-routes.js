import http from "k6/http";
import { check, sleep } from "k6";

const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";

http.setResponseCallback(http.expectedStatuses(200, 429));

export const options = {
  stages: [
    { duration: "30s", target: 1 },
    { duration: "1m", target: 3 },
    { duration: "30s", target: 0 },
  ],
  thresholds: {
    http_req_failed: ["rate<0.02"],
    http_req_duration: ["p(95)<2500"],
    "http_req_duration{route:gbl}": ["p(95)<3500"],
    "http_req_duration{route:emotion}": ["p(95)<2000"],
  },
};

const headers = {
  "Content-Type": "application/json",
  "x-load-test": "synthetic-ai-baseline",
};

export default function aiRoutes() {
  const gbl = http.post(
    `${BASE_URL}/api/gbl/analyze`,
    JSON.stringify({
      title: "Synthetic readiness case",
      analysisType: "healthcare_navigation",
      userType: "patient_member",
      language: "zh-Hant",
      primaryConcern: "Synthetic non-urgent wellness navigation question for testing only.",
      healthcareContext: "Synthetic context. No real symptoms or personal data.",
      insuranceContext: "Synthetic policy education context. No real policy text.",
      emotionText: "Synthetic calm message for classifier testing.",
      save: false,
    }),
    { headers, tags: { route: "gbl" } },
  );

  check(gbl, {
    "GBL returns 200 or safe 429": (res) => res.status === 200 || res.status === 429,
    "GBL returns JSON": (res) => String(res.headers["Content-Type"]).includes("application/json"),
  });

  const emotion = http.post(
    `${BASE_URL}/api/emotion/analyze`,
    JSON.stringify({
      text: "Synthetic neutral planning text for testing only.",
      language: "zh-Hant",
      save: false,
    }),
    { headers, tags: { route: "emotion" } },
  );

  check(emotion, {
    "Emotion returns 200 or safe 429": (res) => res.status === 200 || res.status === 429,
    "Emotion returns JSON": (res) => String(res.headers["Content-Type"]).includes("application/json"),
  });

  sleep(1);
}
