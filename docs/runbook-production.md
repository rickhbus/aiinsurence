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
- `AI_GATEWAY_API_KEY` when DeepSeek is routed through Vercel AI Gateway outside Vercel OIDC.
- `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `REDIS_REST_URL`, `REDIS_REST_TOKEN`
- `MONITORING_ALERT_WEBHOOK_URL`
- `SECRETS_ROTATED_AT`, `SECRETS_ROTATION_NEXT_DUE_AT`

Never prefix service-role keys, provider keys, Redis tokens, Vercel OIDC tokens, auth tokens, or private API keys with `NEXT_PUBLIC_`.

## Production Rate Limiting

- Production API traffic is guarded in `src/proxy.ts` by a shared Redis/Upstash-backed limiter.
- `/api/health` and `/api/readiness` stay exempt so monitors can see failures.
- If `APP_ENV=production` or `VERCEL_ENV=production` and the shared store is missing or unreachable, API routes fail closed with 503.
- Route-level AI and authenticated daily limits remain in place; the proxy limit is the shared abuse gate.

## Monitoring And Alerts

- Configure either `MONITORING_ALERT_WEBHOOK_URL`, `SENTRY_DSN`, `OTEL_EXPORTER_OTLP_ENDPOINT`, or a declared Vercel log drain.
- Set `MONITORING_ALERTS_ENABLED=true` only after the destination is live.
- Run `npm run monitor:readiness` from an external scheduler or incident workstation with `MONITORING_BASE_URL` set.
- The monitor sends only readiness status, failed check names, request id, and timestamps.

## Secret Rotation

- Follow `docs/secret-rotation-runbook.md` after any pasted or suspected exposed secret.
- Set `SECRETS_ROTATED_AT` only after replacements are deployed and old secrets are revoked.
- Set `SECRETS_ROTATION_NEXT_DUE_AT` to the next scheduled rotation date.
- `/api/readiness` fails production readiness when rotation metadata is missing, invalid, or overdue.

## Daily Checks

- `/api/health` returns `status: ok`.
- `/api/readiness` returns `ready` or an honest degraded status with named blockers.
- `npm run monitor:readiness` returns `ok: true`.
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
