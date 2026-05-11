# Path To 100k DAU

This repository is structured for a realistic path toward 100,000 daily active users, but it has not been load tested or production-infrastructure verified for that scale.

## Current Architecture

- Next.js 16 App Router on Vercel.
- Supabase Auth and Postgres with RLS for user-owned data.
- Bounded dashboard reads using daily and weekly summary tables.
- Server-side AI provider abstraction with deterministic safety fallback.
- AI.GBL for normalized case context.
- Emotion Engine for tone guidance only, not decisioning.
- Privacy-safe analytics and AI usage event tables.
- Shared rate-limit adapter with Redis/Upstash support for production plus database-backed per-user AI limits.
- Backend-first mobile health sync with idempotent batches and bounded normalized records.

## Scaling Assumptions

- Public and static pages should remain cache-friendly.
- User-specific dashboard and history routes must stay dynamic and private.
- Lists must default to pagination or bounded limits.
- Raw logs should roll up into summary tables for dashboard views.
- AI calls should use per-user daily limits, max input size, short output caps, timeout handling, and fallback responses.
- Long-running document or AI jobs should move to `analysis_jobs` plus a processor/polling model before large files or multi-minute analysis are enabled.

## Database Strategy

- Keep `user_id` on every user-owned table.
- Keep composite indexes for common access patterns: `user_id, created_at`, `user_id, status`, `user_id, analysis_type`, `user_id, urgency_level`, and date-based summaries.
- Avoid full-table scans from app routes.
- Avoid client-side joins over large datasets.
- Keep large raw document extraction separate from small metadata and summaries.
- Review RLS policy query plans in Supabase before launch.

## API And Abuse Controls

- Auth-required routes use Supabase sessions.
- AI.GBL and Emotion Engine validate input length and include request IDs.
- AI routes record privacy-safe usage events.
- Anonymous AI use and mobile sync bursts use privacy-minimized hashed rate-limit keys. Production should configure Redis/Upstash, Vercel Firewall/rate limits, or another shared edge/store solution.
- Auth abuse should rely on Supabase Auth controls plus Vercel/WAF rules.

## Observability Targets

Track:

- DAU, MAU, signup conversion, onboarding completion, dashboard activation.
- AI.GBL analysis count, Emotion Engine analysis count, insurance analysis count.
- API error rate, API latency, AI provider latency, AI provider failures.
- Estimated AI token use and cost.
- Supabase query latency and slow queries.
- Auth failures, rate-limit hits, and unusual IP/user patterns.

Dashboards to build before serious production traffic:

- Product health.
- API health.
- Auth health.
- AI cost and provider reliability.
- Database health.
- Abuse/rate-limit health.

## Validation Before Claiming 100k DAU

- Run load tests for public pages, auth callback, dashboard, history, and AI APIs.
- Test Supabase connection pooling and query plans under realistic concurrent users.
- Verify Vercel function duration, cold starts, payload sizes, and error rates.
- Verify AI provider quotas, timeout behavior, and cost controls.
- Run incident response and rollback drills.
