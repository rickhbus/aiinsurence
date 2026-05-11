# Production Live Readiness Report

Date: 2026-05-11
Repo: `rickhbus/aiinsurence`
Branch: `main`
Hosting target: Vercel
Database/auth/storage target: Supabase

## Current Repo State

- Local checkout is on `main` tracking `origin/main`.
- Default remote head resolves to `origin/main`.
- No unrelated working-tree edits were present before this production-readiness pass.
- Framework verified from `package.json`: Next.js `16.2.6`, React `19.2.4`, TypeScript, Tailwind v4, shadcn/ui.
- Relevant Next.js 16 local docs reviewed before edits:
  - `node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md`
  - `node_modules/next/dist/docs/01-app/02-guides/environment-variables.md`
  - `node_modules/next/dist/docs/01-app/02-guides/data-security.md`

## Verification Evidence

Baseline before edits:

- `npm install`: passed. NPM reported 2 moderate audit advisories; no force audit fix was run.
- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `npm run test`: passed, 22 test files / 75 tests.
- `npm run build`: passed.

After this pass:

- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `npm run test`: passed, 24 test files / 80 tests.
- `npm run build`: passed.

Local HTTP smoke on `http://localhost:3020`:

- `GET /api/health`: 200, `status: ok`.
- `GET /api/readiness`: 200 with `status: degraded`; named warnings were missing provider key and local in-memory rate-limit store.
- `GET /api/mobile-health/status` without session: 401, auth required.
- Invalid `POST /api/mobile-health/sync`: 400 with validation issues and request id.

## What Changed In This Pass

- Added backend-first mobile health sync contract:
  - `src/lib/mobile-health/types.ts`
  - `src/lib/mobile-health/normalize.ts`
  - `src/app/api/mobile-health/sync/route.ts`
  - `src/app/api/mobile-health/status/route.ts`
  - Tests for normalization and route validation.
- Added `supabase/migrations/006_mobile_health_sync.sql` for mobile sync consent, idempotent sync batches, normalized mobile health records, RLS, and indexes.
- Added RLS/index diagnostics:
  - `supabase/diagnostics/rls-validation.sql`
  - `supabase/diagnostics/index-validation.sql`
  - Updated `query-plan-validation.sql`.
- Hardened rate-limit key privacy by hashing IP/user subjects before shared-store keys.
- Added current load-test entrypoints for public pages, authenticated dashboard, AI APIs, and mobile health sync.
- Added mobile health integration docs, production runbooks, rollback docs, and mobile QA checklist.
- Extended onboarding/settings UI to expose mobile health sync preferences and consent posture.

## Secret Scan

- Tracked `.env*` files: only `.env.example` is tracked.
- An untracked local `.env` exists and was not printed or committed.
- Redacted scan found only placeholders, documentation references, tests, package metadata, and binary false positives in tracked/unignored files.
- No server-only secret was intentionally exposed through `NEXT_PUBLIC_*`.
- If any real secret was ever pasted into chat, logs, or local files, rotate it before production.

## Environment Status

Required browser-safe vars:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` or `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_APP_ENV`

Server-only vars:

- `DEEPSEEK_API_KEY`, `GROQ_API_KEY`, or `OPENAI_API_KEY` depending on `AI_PROVIDER`.
- `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`, or compatible Redis REST vars, for production shared rate limiting.
- `SUPABASE_SERVICE_ROLE_KEY` only if a future server-only maintenance job truly needs it.

Local readiness currently reports deterministic fallback / degraded mode because the AI provider key and shared rate-limit store are not configured in this local environment.

## Supabase Migration And RLS Status

Required migration order:

1. `001_auth_memory.sql`
2. `002_mvp_audit_tables.sql`
3. `003_health_os_data_foundation.sql`
4. `004_production_readiness.sql`
5. `005_gbl_emotion_engine.sql`
6. `006_mobile_health_sync.sql`

Diagnostics committed:

- `supabase/diagnostics/rls-validation.sql`
- `supabase/diagnostics/index-validation.sql`
- `supabase/diagnostics/query-plan-validation.sql`

Staging/fresh-project migration application was not executed from this agent environment. Production promotion remains blocked until migrations and diagnostics pass in staging with saved evidence.

## Mobile Health Integration Status

Backend contract is implemented and tested locally.

Native iOS/Android app integration is not implemented in this repo. The production path requires a native HealthKit / Health Connect bridge that requests per-type permission on device and sends bounded summaries to `/api/mobile-health/sync`.

The app must not ingest clinical records, diagnoses, medications, reproductive/sexual health, glucose, or raw continuous heart streams without a separate product, privacy, clinical, and compliance review.

## Vercel Deployment Status

No Vercel preview or production deployment was created in this pass.

Before production:

- Configure production and preview env vars.
- Apply Supabase migrations through `006`.
- Redeploy after env changes.
- Verify preview `/api/health` and `/api/readiness`.
- Review Vercel runtime logs for boot errors and request ids.
- Promote production only after smoke tests pass.

## 100k DAU Readiness Status

Status: production-readiness gated, not proven for 100k DAU.

This pass adds code and docs for a 100k DAU path, but the app must not be described as proven for 100k DAU until these pass with evidence:

- Controlled load tests against preview/staging.
- Supabase query-plan validation with production-shaped data.
- RLS policy verification.
- Monitoring dashboards and alerting.
- Provider quota and cost checks.
- Redis/Upstash shared rate-limit store validation.
- Vercel function duration/cold-start review.
- Rollback and incident drills.

## Remaining Blockers

- Run Supabase migrations `001` through `006` on fresh and staging projects.
- Run RLS, index, and query-plan diagnostics in staging.
- Configure shared Redis/Upstash rate-limit store for production or keep readiness degraded.
- Configure AI provider key or explicitly accept deterministic fallback mode for launch.
- Deploy a Vercel preview and run the full smoke flow.
- Capture mobile health settings screenshots or complete manual mobile QA.
- Run k6 baselines and record p50/p95/p99, error rate, 429 rate, function duration, Supabase query latency, provider fallback rate, rate-limit latency, connection saturation, and cost estimates.
- Confirm monitoring, rollback drill, incident drill, and key-rotation procedure.
