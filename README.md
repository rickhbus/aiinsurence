# Super Family Doctor / AI Health Companion

Traditional Chinese name: **智健家庭醫生 / 智健導航**.

This is a Hong Kong-focused Daily Health OS for body, mood, food, digestion, gym workouts, care navigation, and insurance preparation. It is anonymous-first, Traditional Chinese-first, and safety-first.

The app is **not** a doctor, insurer, broker, licensed insurance intermediary, therapist, dietitian, or personal trainer. It does not diagnose, prescribe, provide legal or regulated insurance advice, or guarantee treatment, exercise safety, eligibility, coverage, reimbursement, claim approval, or care access.

## MVP Surface

- `/` senior-first landing and anonymous-first entry.
- `/today` Senior Mode / Big Button Mode with mood, food, water, toilet, movement, photo journal, call-family, and 999 actions.
- `/check-in` fast morning/evening check-in.
- `/mood` Mood & Emotion Coach built on the existing Emotion Engine.
- `/food` manual food log plus server-side food photo analysis when an AI provider is configured; otherwise it returns a safe provider-unavailable fallback.
- `/hydration` water, caffeine, and alcohol tracker.
- `/toilet` bowel and urine log with red-flag routing.
- `/gym` workout coach with sessions, exercise sets, RPE, pain flags, recovery guidance, and charts.
- `/gym/templates` built-in workout templates.
- `/reports` AI daily/weekly report surface and doctor-summary export readiness.
- `/family` minimal consent-first family/caregiver groups, invites, daily check-in status, in-app family alerts, and family weekly report preview.
- `/doctor` doctor visit preparation and appointment planner.
- `/insurance` insurance preparation education only.
- `/pricing` Stripe Checkout subscription buttons when payment env vars are configured, with mock/free fallback when they are not.
- `/business` gym/PT/employer/clinic lead capture.
- Existing `/gbl`, `/emotion`, and `/history` remain available.

## Health OS Architecture

New deterministic lifestyle intelligence lives under `src/lib/health-os/`:

- `validators.ts` validates API input with Zod.
- `safety.ts` routes emergency/crisis/red-flag signals before normal guidance.
- `scoring.ts` calculates lifestyle readiness signals, not medical scores.
- `daily-summary.ts` and `weekly-report.ts` generate deterministic report context.
- `gym-coach.ts`, `mood.ts`, `nutrition.ts`, `hydration.ts`, and `toilet.ts` provide module-specific guidance.

AI.GBL remains the server-side global intelligence layer. Emotion Engine remains an assistive tone/distress signal only. The deterministic navigation engine remains the source of truth for emergency escalation before AI-generated normal guidance.

## Safety Boundaries

Emergency red flags in Hong Kong direct the user to call **999** or go to **Accident & Emergency** now. Self-harm, imminent danger, abuse, violence, or crisis language is handled before ordinary mood coaching.

Mobile health, gym, mood, food, and symptom data must not be used for insurance eligibility, pricing, coverage, claim outcomes, or care-access decisions.

Do not log PHI/PII, raw symptoms, policy text, claim text, raw AI prompts, auth tokens, API keys, session data, HKID, phone numbers, payment data, or private credentials.

## Supabase

Persistence uses Supabase Auth, Postgres, and RLS. Browser code may only use public anon/publishable Supabase keys. Server-only keys and AI provider keys must never be exposed to client code.

Apply migrations in numeric order:

1. `supabase/migrations/001_auth_memory.sql`
2. `supabase/migrations/002_mvp_audit_tables.sql`
3. `supabase/migrations/003_health_os_data_foundation.sql`
4. `supabase/migrations/004_production_readiness.sql`
5. `supabase/migrations/005_gbl_emotion_engine.sql`
6. `supabase/migrations/006_mobile_health_sync.sql`
7. `supabase/migrations/007_daily_checkins.sql`
8. `supabase/migrations/008_health_companion_mvp.sql`
9. `supabase/migrations/009_auth_anonymous_profile_trigger.sql`
10. `supabase/migrations/010_food_payments_family_doctor.sql`
11. `supabase/migrations/011_family_alerts_senior_mode.sql`

Migration `008` adds the Daily Health OS MVP tables: `daily_health_logs`, `mood_logs`, `meal_logs`, `hydration_logs`, `bowel_urine_logs`, `gym_workouts`, `gym_exercise_sets`, `workout_templates`, `subscription_entitlements`, and `business_leads`, plus additive summary columns. Migration `010` adds Stripe entitlement columns, locks entitlement writes to server/webhook updates, and adds consent-based family tables. Migration `011` adds senior/family-care tables for in-app family alerts, reminders, doctor appointments, and user-confirmed photo journal entries.

## API Routes

New typed routes include:

- `POST /api/daily-health/check-in`
- `GET /api/daily-health/today`
- `POST /api/mood/log`
- `POST /api/mood/analyze`
- `POST /api/food/log`
- `POST /api/food/analyze`
- `POST /api/hydration/log`
- `POST /api/toilet/log`
- `POST /api/gym/workouts`
- `GET /api/gym/workouts`
- `GET /api/gym/templates`
- `POST /api/gym/templates`
- `POST /api/gym/analyze`
- `POST /api/reports/daily`
- `GET /api/reports/weekly`
- `GET /api/doctor/report`
- `GET/POST /api/doctor/appointments`
- `GET/POST /api/family`
- `POST /api/family/alert`
- `GET /api/family/weekly-report`
- `GET/POST /api/reminders`
- `POST /api/photo-journal`
- `GET /api/payments/config`
- `POST /api/payments/checkout`
- `POST /api/payments/portal`
- `POST /api/payments/webhook`
- `POST /api/business/leads`

Authenticated writes require Supabase sessions. Anonymous users can use local-first UI and non-persistent deterministic analysis where appropriate.

## Mobile Health Sync

The web app cannot read Apple HealthKit or Android Health Connect directly. Native clients must request per-data-type permission and send normalized summaries to the backend.

First-release scope remains steps, active energy/calories, workouts/runs, sleep sessions, body weight, heart-rate summary only, and optional mindful minutes or mood with explicit non-clinical consent. Do not ingest clinical records, diagnoses, medications, reproductive/sexual health data, glucose, or raw high-frequency heart data by default.

See `docs/mobile-health-integration.md`.

## Monetization

`/pricing` supports these subscription plans:

- Basic / Free HK$0
- Care HK$58/month
- Family Care HK$198/month
- Gym/PT Partner
- Employer Wellness

Family Care is positioned as “最適合照顧爸爸媽媽 / Best for caring for parents.” Stripe Checkout is used only when all required server-side env vars are present. Webhooks, not client claims, update `subscription_entitlements`. When payment env vars are absent or partial, checkout buttons safely show `Payment not configured` and mock/free entitlements remain the fallback.

Required payment env vars:

```bash
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
NEXT_PUBLIC_APP_URL=
STRIPE_PRICE_CARE=
STRIPE_PRICE_FAMILY=
SUPABASE_SERVICE_ROLE_KEY=
```

`STRIPE_PRICE_PLUS` is still accepted as a legacy fallback for the Care plan during migration.

`SUPABASE_SERVICE_ROLE_KEY` is server-only and is used by the Stripe webhook route to update entitlement rows under RLS. Never prefix it with `NEXT_PUBLIC_`.

## Senior / Family Care Positioning

- Primary user: older adults / boomers.
- Primary payer: adult children / caregivers.
- Default UX: Senior Mode + Big Button Mode.
- Monetization: Family Care.
- Safety: not diagnosis, not an emergency replacement, call 999 for emergencies.
- Consent: family sharing only with explicit consent.

## Local Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

Required verification commands:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

This repository is not proven production-ready or 100k DAU-ready until build, tests, staging validation, RLS checks, monitoring, load testing, query-plan review, and incident drills have actually passed.
