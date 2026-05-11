# Production Live Readiness Report

Date: 2026-05-12 HKT
Repo: `rickhbus/aiinsurence`
Branch: `main`
Hosting target: Vercel
Database/auth/storage target: Supabase

## Current Repo State

- Local checkout is on `main` tracking `origin/main`.
- Framework verified from `package.json`: Next.js `16.2.6`, React `19.2.4`, TypeScript, Tailwind v4, shadcn/ui.
- Relevant Next.js 16 local docs reviewed before edits:
  - `node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md`
  - `node_modules/next/dist/docs/01-app/02-guides/environment-variables.md`
  - `node_modules/next/dist/docs/01-app/02-guides/data-security.md`
- `.vercelignore` now prevents local env files, Vercel metadata, macOS metadata, signing keys, and mobile provisioning artifacts from being uploaded in future deployments.

## Verification Evidence

Latest local checks after the production-readiness fixes:

- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `npm run test`: passed, 24 files / 80 tests.
- `npm run build`: passed.

Focused checks also passed for readiness and mobile-health normalization/route coverage.

## Supabase Migration And Diagnostics Evidence

Configured remote Supabase database was checked from this workstation with secrets redacted from logs.

- Remote migration state now includes `001_auth_memory.sql` through `006_mobile_health_sync.sql`.
- `supabase db push --db-url [redacted] --yes` applied `006_mobile_health_sync.sql`.
- `supabase/diagnostics/rls-validation.sql`: passed, 37 diagnostic rows, no missing expected RLS or select/insert policy coverage found.
- `supabase/diagnostics/index-validation.sql`: passed, 38 expected indexes present and no missing `user_id` index coverage found.
- `supabase/diagnostics/query-plan-validation.sql`: passed after qualifying the mobile-health column references; expected indexes were present and representative `EXPLAIN ANALYZE` probes used indexed access.

Before production traffic, repeat the same diagnostics from the actual staging/prod operator environment and save the SQL output alongside the release artifact.

## Vercel Deployment Evidence

Vercel project: `aiinsurence` under `taletypes-projects`.

- Preview deployment: `https://aiinsurence-7io7rr7m4-taletypes-projects.vercel.app`
- Preview deployment id: `dpl_7HSRLrb1Aqo62fYs76WtCfdN3NQs`
- Production deployment: `https://aiinsurence-dej0pfyne-taletypes-projects.vercel.app`
- Production deployment id: `dpl_5R4by2rocSZdEj1CHgUKGGDHmPbX`
- Production aliases include `https://aiinsurence-ten.vercel.app`.

Production smoke after rollback drill and re-promotion:

- `GET /api/health`: 200, `status: ok`, deployment `dpl_5R4by2rocSZdEj1CHgUKGGDHmPbX`.
- `GET /api/readiness`: 200, `status: degraded`.
- Passing readiness checks: runtime config, Supabase connectivity, `health_lessons`, `profiles`, `health_memory`, `ai_usage_events`, `gbl_cases`, `gbl_analysis_results`, `emotion_engine_results`, `insurance_analyses`, `mobile_health_sync_batches`, and `mobile_health_records`.
- Remaining readiness warnings: no AI provider key configured and no shared Redis/Upstash rate-limit store configured.

A first deployment attempt read the local `.env` before `.vercelignore` was added. That deployment was removed and later deployments were created with Vercel env handling, but the conservative production posture is to rotate any Supabase, Postgres, service-role, provider, or Redis secrets that existed in the local `.env` at deployment time.

## Load-Test Baseline Evidence

Baselines were run against the local production server with synthetic traffic.

- `BASE_URL=http://localhost:3022 k6 run load-tests/k6-public-pages.js`: passed; p95 274.99 ms, p99 559.22 ms, 0% HTTP failures, 100% checks, 4,880 requests.
- `BASE_URL=http://localhost:3022 k6 run load-tests/k6-ai-apis.js`: passed; p95 11.56 ms, p99 26.45 ms, 0% HTTP failures, 100% checks.
- `load-tests/k6-authenticated-api.js` with a temporary synthetic Supabase user: passed with strict bearer-token checks; p95 453.63 ms, 0% HTTP failures, 100% checks.
- `load-tests/k6-auth-dashboard.js` with a temporary synthetic Supabase user: passed with strict bearer-token checks; p95 1.07 s, p99 1.24 s, 0% HTTP failures, 100% checks.
- `load-tests/k6-mobile-health-sync.js` with a temporary synthetic Supabase user: passed; p95 2.14 s, p99 2.15 s, 0% HTTP failures, 100% checks.
- The synthetic user was deleted after a targeted cleanup retry.

These are baseline signals only. They are not proof of 100k DAU capacity because they were not run from a controlled load environment against preview/staging with production-shaped data, full monitoring, provider quotas, shared rate limiting, and database telemetry.

## Rollback And Incident Drill Evidence

- Ran a Vercel rollback to deployment `dpl_51Yesbm2FgWteHLf9mbDV76iaqoT`.
- Verified rolled-back `/api/health` returned 200.
- Promoted the latest intended production deployment `dpl_5R4by2rocSZdEj1CHgUKGGDHmPbX` back to production.
- Verified production `/api/health` and `/api/readiness` after re-promotion.

This covers the basic Vercel rollback path. Full incident readiness still needs named owners, alert routing, Supabase restore validation, key-rotation rehearsal, and a timed communications drill.

## Mobile Health Integration Status

Backend contract is implemented and tested.

Native bridge source was added for app integration:

- `native/mobile-health/ios/HealthKitMobileHealthBridge.swift`
- `native/mobile-health/android/HealthConnectMobileHealthBridge.kt`
- `native/mobile-health/README.md`

The native bridge is not yet wired into a real Xcode or Gradle app target in this repo, so device-level HealthKit / Health Connect permission prompts and end-to-end app sync still require a native app integration pass.

The app must not ingest clinical records, diagnoses, medications, reproductive/sexual health, glucose, or raw continuous heart streams without a separate product, privacy, clinical, and compliance review.

## Monitoring And Alerting Status

Current runtime health/readiness endpoints and structured request-id evidence are in place, and Vercel production smokes passed.

Monitoring remains incomplete until these are configured and evidenced:

- Shared Redis/Upstash or equivalent production rate-limit telemetry.
- Vercel runtime/function latency, error, and cold-start dashboards.
- Supabase CPU, connection pool, slow query, RLS error, and storage dashboards.
- AI provider quota, fallback, timeout, spend, and alert thresholds.
- Alert routing with named owners and escalation windows.
- WAF/abuse controls if production traffic is opened beyond a controlled launch.

## 100k DAU Readiness Status

Status: production-readiness improved, still not proven for 100k DAU.

The repo now has a deployed Vercel app, applied Supabase migration through `006`, remote RLS/index/query-plan diagnostic evidence, k6 local baselines, rollback drill evidence, and additive native bridge source. It must still not be described as proven for 100k DAU until staging/production-shaped load, monitoring, shared rate limiting, provider quota/cost controls, alerting, and incident drills pass with saved evidence.

## Remaining Blockers

- Rotate secrets that may have existed in local `.env` during the first removed Vercel deployment.
- Configure shared Redis/Upstash-compatible production rate limiting or explicitly keep readiness degraded.
- Configure an AI provider key only if provider-backed generation is intended for launch; deterministic fallback can remain a deliberate degraded mode.
- Run controlled preview/staging load tests with production-shaped data and full telemetry.
- Complete Vercel/Supabase/provider monitoring dashboards and alert routing.
- Run a full incident drill with owner handoff, Supabase restore validation, and key-rotation rehearsal.
- Wire the native HealthKit / Health Connect bridge into actual iOS/Android app targets and verify on devices.
