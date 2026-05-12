# Supabase Production Checklist

AI Health Guide / 智健導航 stores sensitive health-adjacent user data. RLS is a launch gate, not a best-effort task.

## Required Env Vars

- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: browser-safe anon key.
- `AI_PROVIDER`: `deepseek`, `groq`, or `openai`.
- Provider key, server-only: `DEEPSEEK_API_KEY`, `GROQ_API_KEY`, or `OPENAI_API_KEY`.

Optional:

- `NEXT_PUBLIC_ANALYTICS_KEY`: product analytics routing key.
- `APP_ENV` / `NEXT_PUBLIC_APP_ENV`: use `production` only when the production env is complete.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: supported fallback for projects using publishable-key naming.

Never set a service-role key with a `NEXT_PUBLIC_` prefix.

## Migration Order

Apply in numeric order:

1. `supabase/migrations/001_auth_memory.sql`
2. `supabase/migrations/002_mvp_audit_tables.sql`
3. `supabase/migrations/003_health_os_data_foundation.sql`
4. `supabase/migrations/004_production_readiness.sql`
5. `supabase/migrations/005_gbl_emotion_engine.sql`
6. `supabase/migrations/006_mobile_health_sync.sql`
7. `supabase/migrations/007_daily_checkins.sql`
8. `supabase/migrations/008_health_companion_mvp.sql`

`004_production_readiness.sql` adds onboarding profile fields, normalizes explicit own-row RLS policies, preserves stricter linked-row checks, and adds dashboard-scale indexes.
`006_mobile_health_sync.sql` adds mobile sync consent, idempotent sync batches, normalized mobile health records, RLS, and mobile-health indexes.
`007_daily_checkins.sql` adds user-owned everyday wake, meal, water, exercise, and health-review check-ins with own-row RLS and dashboard indexes.
`008_health_companion_mvp.sql` adds the Super Family Doctor / AI Health Companion MVP tables for daily health logs, mood, meals, hydration, bowel/urine, gym workouts, exercise sets, workout templates, mock entitlements, business leads, and additive summary columns.

`005_gbl_emotion_engine.sql` adds AI.GBL cases, AI.GBL analysis results, Emotion Engine results, insurance analyses, and a simple analysis job table for future async work.

## Tables Covered

User-owned RLS tables:

`profiles`, `user_preferences`, `household_members`, `conversation_sessions`, `conversation_messages`, `saved_recommendations`, `consent_events`, `triage_assessments`, `department_recommendations`, `insurance_profiles`, `insurance_recommendations`, `escalation_cases`, `audit_logs`, `health_memory`, `running_logs`, `gym_logs`, `meals`, `water_logs`, `sleep_logs`, `body_metrics`, `daily_checkins`, `daily_health_logs`, `mood_logs`, `meal_logs`, `hydration_logs`, `bowel_urine_logs`, `gym_workouts`, `gym_exercise_sets`, `workout_templates`, `subscription_entitlements`, `goals`, `daily_health_summaries`, `weekly_health_summaries`, `user_streaks`, `user_goal_progress`, `ai_daily_recommendations`, `ai_usage_events`, `symptom_checks`, `insurance_notes`, `analytics_events`, `gbl_cases`, `gbl_analysis_results`, `emotion_engine_results`, `insurance_analyses`, `analysis_jobs`.

Public read-only content:

`health_lessons` is intentionally readable by `anon` and `authenticated`. Do not grant writes from the app roles.

## RLS Verification Steps

Run these in Supabase SQL editor after applying migrations:

```sql
select schemaname, tablename, rowsecurity
from pg_tables
where schemaname = 'public'
order by tablename;
```

Every user-owned table above must show `rowsecurity = true`.

```sql
select schemaname, tablename, policyname, cmd, roles
from pg_policies
where schemaname = 'public'
order by tablename, policyname;
```

For each user-owned table, verify policies exist for:

- `select own rows`
- `insert own rows`
- `update own rows`
- `delete own rows`

Linked-row exceptions to verify:

- `conversation_messages_insert_own` checks the referenced session belongs to the same user.
- `saved_recommendations_insert_own` checks the referenced session belongs to the same user when present.
- `escalation_cases_insert_own` requires explicit adviser handoff consent.
- `escalation_cases_select_adviser_with_consent` allows adviser access only after consent.

## Index Verification

Run:

```sql
select tablename, indexname, indexdef
from pg_indexes
where schemaname = 'public'
order by tablename, indexname;
```

Confirm indexes exist for dashboard-scale access patterns:

- `user_id`
- `user_id, created_at`
- `user_id, summary_date`
- `user_id, week_start_date`
- `user_id, progress_date`
- `user_id, memory_type`
- `user_id, status`
- `user_id, goal_type`
- `user_id, event_name`
- `user_id, analysis_type`
- `user_id, urgency_level`
- `user_id, feature`

Required summary indexes:

- `daily_health_summaries(user_id, summary_date)`
- `weekly_health_summaries(user_id, week_start_date)`

## Known Local Caveat

In local development, `/api/dashboard` returns `503` when Supabase env vars are not configured. The dashboard UI now keeps real-data panels empty until Supabase is configured. Configure `.env.local` with the required Supabase public URL and anon key to test real data locally.

## Production Deployment Notes

- Apply migrations before enabling production traffic.
- Configure Supabase Auth redirect URLs for local, preview, and production domains.
- Keep service-role keys out of browser code and out of Vercel public env vars.
- Set `APP_ENV=production` only after required env vars are configured; the app will fail fast when production-required env is missing.
- Verify red-flag symptom routing still escalates to `999` / A&E after deployment.
- Verify insurance helper responses always include the non-advice disclaimer.
- Verify `/gbl`, `/emotion`, and `/history` work for an authenticated test user.
- Verify Emotion Engine outputs are not used for eligibility, pricing, coverage, claims, or care-access decisions.
