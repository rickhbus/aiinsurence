# Load Test Scaffolding

These k6 scripts provide a safe baseline for AI Health Guide / 智健導航 route and API checks. They use synthetic data only and intentionally default to low traffic.

## Prerequisites

- Install k6 locally: `brew install k6`
- Copy `sample.env.example` into your shell or CI secret store.
- Run preview tests before production tests.

## Targets

- Preview: `BASE_URL=https://your-preview.vercel.app`
- Production: `BASE_URL=https://aiinsurence.vercel.app`

Do not run uncontrolled stress tests against production. Real 100k DAU validation requires a controlled staging or production-like environment, monitoring, database query-plan review, quota checks, and an incident lead watching dashboards during the test.

## Scripts

```bash
k6 run -e BASE_URL="$BASE_URL" load-tests/k6-public-routes.js
k6 run -e BASE_URL="$BASE_URL" load-tests/k6-ai-routes.js
k6 run -e BASE_URL="$BASE_URL" -e AUTH_TOKEN="$AUTH_TOKEN" load-tests/k6-authenticated-api.js
```

## What To Capture

- p95 latency for public pages and APIs.
- HTTP error rate.
- 429/rate-limit volume.
- Vercel function errors and cold-start symptoms.
- Supabase CPU, connection pool saturation, slow queries, and row-read volume.
- AI provider errors, fallback rate, token spend, and timeout rate.

Passing these scripts is only a smoke baseline. It is not proof that the app is ready for 100k DAU.
