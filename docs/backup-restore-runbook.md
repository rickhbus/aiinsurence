# Backup And Restore Runbook

Use this runbook for Supabase Postgres backup planning, restore drills, and post-restore validation for AI Health Guide / 智健導航.

## Backup Expectations

- Confirm the Supabase project plan supports the required backup retention and point-in-time recovery window.
- Keep migrations in numeric order and treat migrations as the source of schema truth.
- Never store database passwords, service-role keys, or backup artifacts in the repository.
- Keep production and staging projects separate.

## Point-In-Time Recovery Considerations

- Record the incident start time in UTC and Hong Kong time.
- Identify whether the restore target must be before a bad migration, bad deploy, accidental delete, or data corruption event.
- Restore into staging first unless production is unavailable and leadership approves direct recovery.
- Confirm Auth, Storage, Edge Functions, and Postgres assumptions separately; a database restore does not automatically prove app-level health.

## Migration Rollback Principles

- Prefer forward-fix migrations over destructive rollback migrations.
- If a rollback is unavoidable, write a reviewed rollback migration and test it on staging.
- Do not drop columns or tables until dependent app code has been removed and a backup has been verified.
- Preserve RLS and grants during any rollback.

## Staging Restore Test Procedure

1. Restore a recent backup or PITR snapshot into staging.
2. Apply any newer migrations in numeric order if the snapshot predates them.
3. Run `supabase/diagnostics/query-plan-validation.sql` one section at a time.
4. Run the app against staging env vars.
5. Run `npm run typecheck`, `npm run lint`, `npm run test`, and `npm run build`.
6. Run low-rate k6 smoke tests from `load-tests/`.

## Verify After Restore

- `/api/health` returns 200.
- `/api/readiness` returns `ready` or a documented `degraded` state.
- Auth callback URLs work for local, preview, staging, and production domains.
- Dashboard, history, AI.GBL, Emotion Engine, and memory pages load without raw 500s.
- AI.GBL and Emotion Engine return deterministic fallback/mock output when provider keys are absent.
- Synthetic authenticated history reads return only the signed-in user's rows.

## RLS Verification After Restore

- Confirm RLS is enabled on user-owned tables.
- Confirm anon role cannot read protected tables.
- Confirm authenticated own-row select/insert/update/delete policies still exist.
- Confirm `health_lessons` remains public read-only.
- Confirm service-role keys are not present in any `NEXT_PUBLIC_*` env var.
