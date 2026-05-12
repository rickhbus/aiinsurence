# Vercel And Supabase 100k DAU Readiness

This document is a readiness plan, not proof. AI Health Guide / 智健導航 must not be described as proven for 100k DAU until the criteria at the end pass with evidence.

## Vercel Env Checklist

- `NEXT_PUBLIC_SUPABASE_URL` set for preview and production.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` or `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` set for preview and production.
- No service-role key in any `NEXT_PUBLIC_*` variable.
- AI provider keys are server-only and optional for app boot.
- Redis/Upstash rate-limit env vars are server-only and required for production API traffic.
- Monitoring alert destination is configured and declared with `MONITORING_ALERTS_ENABLED=true`.
- Secret rotation metadata is current after real provider rotation.
- Secrets pasted into chat have been rotated after deployment setup is stable.

## Vercel Deployment Checks

- `/` returns 200 in production-like env.
- `/gbl`, `/emotion`, and `/history` return page shells or auth-aware UI, not raw 500s.
- `/api/health` returns 200.
- `/api/readiness` returns structured JSON with `status`, `checks`, `requestId`, and `timestamp`.
- Runtime logs are structured and include request ids without PHI/PII.
- Security headers remain enabled.

## Supabase Auth Callback URL Checks

- Local callback URL configured.
- Vercel preview callback URL configured.
- Production callback URL configured.
- Anonymous-first use remains available.
- Authenticated persistence uses Supabase sessions and RLS.

## Supabase Pooling And Query Performance

- Run `supabase/diagnostics/query-plan-validation.sql` in staging.
- Confirm dashboard, history, daily-limit, memory, and summary queries use expected indexes.
- Monitor CPU, connection pool, slow queries, row reads, and error rate.
- Keep dashboard AI context based on summaries instead of unbounded raw history.

## WAF And Rate-Limit Plan

- In-memory limiting is acceptable only for local/test.
- Production API traffic fails closed if the shared Redis/Upstash-compatible store is missing or unreachable.
- Anonymous AI-adjacent routes must return 429 with `Retry-After`.
- Authenticated daily AI limits should continue using Supabase-backed `ai_usage_events`.

## Observability Plan

Recommended dashboards:

- Product health: sign-in/start rate, onboarding completion, dashboard loads, history loads.
- API health: request volume, p50/p95/p99 latency, 4xx/5xx by route, request ids.
- Auth health: Supabase Auth errors, callback failures, anonymous session creation, sign-out failures.
- AI cost/provider reliability: generated/fallback/failed counts, timeout rate, token estimates, spend/quota.
- Database health: CPU, memory, connection pool, slow queries, table/index bloat, RLS errors.
- Abuse/rate-limit health: 429 volume by route, top anonymous IP hashes, shared store latency, WAF events.
- Readiness alert: `npm run monitor:readiness` runs from an external scheduler and alerts on any non-ready status.

## Load-Test Plan

- Start with low-rate preview smoke from `load-tests/`.
- Run staging tests with synthetic data only.
- Increase traffic in controlled steps while monitoring Vercel, Supabase, AI provider, and rate-limit dashboards.
- Capture baseline p95 latency, error rate, function duration, DB query plans, and cost.
- Do not run uncontrolled production stress from a laptop.

## Cost-Control Plan

- Keep deterministic provider-free fallback available when AI provider keys are absent or provider calls fail.
- Set AI provider spend caps and alerts.
- Track token estimates in `ai_usage_events`.
- Keep provider retries bounded.
- Review Vercel function usage, Supabase egress, and Redis/Upstash operations before launch campaigns.

## Criteria Before Saying "100k DAU Ready"

- Build, typecheck, lint, and tests pass on the release commit.
- Staging restore drill has completed.
- RLS verification has completed after latest migrations.
- Query-plan diagnostics show indexed access for dashboard, history, AI usage, memory, and summaries.
- Shared production rate-limit controls are configured and verified.
- Monitoring dashboards and alerts are live.
- Secrets exposed in chat are rotated and readiness rotation metadata is current.
- Load tests at agreed traffic profiles pass with documented p95 latency and error-rate targets.
- Incident-response drill has been run or scheduled with owners.
- Cost caps and provider quotas have been reviewed.
