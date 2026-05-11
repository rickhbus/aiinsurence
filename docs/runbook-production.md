# Production Runbook

## Pre-Promotion Gates

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- Supabase migrations applied in order, including `006_mobile_health_sync.sql` when mobile sync is enabled.
- RLS, index, and query-plan diagnostics run against staging.
- Vercel preview smoke passes for `/api/health` and `/api/readiness`.
- Load-test baseline captured against preview or staging, not uncontrolled production.

## Environment Variables

Browser-safe:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` or `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_APP_ENV`

Server-only:

- `SUPABASE_SERVICE_ROLE_KEY` only for future server-only maintenance jobs that truly need it.
- `DEEPSEEK_API_KEY`, `GROQ_API_KEY`, `OPENAI_API_KEY`
- `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `REDIS_REST_URL`, `REDIS_REST_TOKEN`

Never prefix service-role keys, provider keys, Redis tokens, auth tokens, or private API keys with `NEXT_PUBLIC_`.

## Daily Checks

- `/api/health` returns `status: ok`.
- `/api/readiness` returns `ready` or an honest degraded status with named blockers.
- Vercel runtime logs show no boot errors.
- Supabase slow queries and connection utilization stay within budget.
- AI fallback/provider-failure rate is within expected range.
- 429s protect expensive routes without blocking normal dashboard use.

## Provider Outage

- Keep deterministic safety routing active.
- Let AI.GBL fallback handle provider failures.
- Review provider quota, timeout, and cost dashboards before re-enabling high traffic.

## RLS Verification After Migrations

1. Run `supabase/diagnostics/rls-validation.sql`.
2. Confirm all user-owned tables have RLS enabled and own-row policies.
3. Confirm `health_lessons` is public read-only.
4. Confirm adviser handoff policies still require consent.

## Mobile Health Sync

- Native apps must ask HealthKit / Health Connect permissions per data type.
- Sync only bounded summaries through `/api/mobile-health/sync`.
- Keep mobile clients on public keys and authenticated server API routes.
- Do not ingest clinical records, diagnoses, medications, glucose, or raw continuous heart data without a separate product, privacy, clinical, and compliance review.
