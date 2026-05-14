# Health Quest Production Readiness

## Scope

Daily Health Quest retention is ready for staging only after migrations, RLS checks, safety checks, visual QA, and smoke tests pass in the target environment.

## Required Env Vars

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` or `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` server-only, never `NEXT_PUBLIC_*`
- `POSTGRES_URL_NON_POOLING` for operator migration pushes
- AI provider credential for configured `AI_PROVIDER`
- Stripe server vars only if premium gates are enabled
- `HEALTH_QUEST_QA_ENABLED=true` only for explicit QA access in production-like environments

## Migration Order

Apply Supabase migrations in numeric order. Health Quest retention requires `013` through `027` after the Health OS foundation:

- `013_health_quest_onboarding.sql`
- `014_health_quest_streak_freeze_economy.sql`
- `015_health_quest_lessons.sql`
- `016_health_quest_family_challenges.sql`
- `017_health_quest_analytics.sql`
- `018_health_quest_doctor_missions.sql`
- `019_health_quest_preferences_and_reminders.sql`
- `020_health_quest_production_hardening.sql`
- `021_health_quest_rewards.sql`
- `022_health_quest_leagues.sql`
- `023_health_quest_achievements.sql`
- `024_health_quest_cosmetics.sql`
- `025_health_quest_review_scheduler.sql`
- `026_health_quest_lesson_tree_units.sql`
- `027_health_quest_rls_rewards_practice_hardening.sql`

Run:

```bash
npx supabase db push --dry-run --db-url "$POSTGRES_URL_NON_POOLING" --yes
npx supabase db push --db-url "$POSTGRES_URL_NON_POOLING" --yes
npx supabase db lint --db-url "$POSTGRES_URL_NON_POOLING" --level warning
```

## Staging Smoke Tests

- `/today`
- `/today/advanced`
- `/onboarding`
- `/learn`
- `/weekly-review`
- `/family/quest-circle`
- `/doctor/mission`
- `/insurance/mission`
- `/settings/reminders`
- `/progress`
- `/dev/health-quest-qa` with `HEALTH_QUEST_QA_ENABLED=true`

## Staging Data Checks

- Run `supabase/diagnostics/health-quest-rls-verification.sql` with disposable users after migration `027`.
- Open the same daily chest twice and confirm the second response has `duplicate: true` and unchanged wallet totals.
- Complete one practice item twice and confirm the second response has `completedNow: false` and `xp: 0`.
- Load `/leagues` and confirm network responses do not include raw auth UUIDs or health/insurance detail.

## Rollback Plan

1. Pause new deployment promotion.
2. Roll back Vercel to the previous passing deployment.
3. Do not delete Health Quest tables. New migration `020` is additive.
4. If a route-level issue appears, disable the UI entry point while keeping safety guidance available.
5. If a migration issue appears, stop writes and restore from Supabase point-in-time backup according to the main rollback runbook.

## Known Limitations

- Reminder push delivery is not implemented. Current work is preference/copy/quiet-hours only.
- Family invite email delivery is not implemented. Invite links are generated for manual delivery and raw tokens are not stored.
- Doctor export supports JSON, copy text, and print-friendly HTML. Native PDF/DOCX generation is not implemented.
- Full production readiness still requires staging validation, real RLS verification after `027`, monitoring checks, and load testing.

## Vercel Env Separation

- Browser variables must use `NEXT_PUBLIC_*` and only contain public URL/anon/publishable values.
- Server-only credentials must never use `NEXT_PUBLIC_*`.
- Do not expose service-role, Stripe secret, webhook secret, AI provider key, tokens, or database URLs to the browser.
