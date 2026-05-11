# Rollback

## Vercel Deployment Rollback

1. Open the Vercel project deployments list.
2. Select the last known-good production deployment.
3. Promote or roll back to that deployment.
4. Verify `/`, `/dashboard`, `/gbl`, `/emotion`, `/history`, `/settings`, `/api/health`, and `/api/readiness`.
5. Check Vercel runtime logs for request ids and sanitized error categories.

## Disable Provider-Backed AI

1. Remove or blank the active provider key in Vercel env vars, or set the provider to a deterministic-fallback posture.
2. Redeploy because env var changes require a new deployment.
3. Verify AI.GBL and Emotion Engine return safe fallback or deterministic classifier output.

## Degraded Mode

- Keep public pages, dashboard reads, emergency routing, and auth available where possible.
- Temporarily disable expensive AI or mobile sync writes if they are the failing surface.
- `/api/readiness` should report `degraded` or `not_ready` with named blockers and no secret leakage.

## Supabase Migration Rollback

- Prefer forward fixes for already-applied migrations.
- If data-destructive rollback is unavoidable, restore from a tested backup into staging first.
- Re-run `supabase/diagnostics/rls-validation.sql`, `index-validation.sql`, and `query-plan-validation.sql` before production traffic.

## Secret Rotation

1. Revoke the leaked key at the provider.
2. Add the replacement to Vercel as server-only unless it is explicitly a browser-safe `NEXT_PUBLIC_*` key.
3. Redeploy.
4. Confirm the leaked value is not in tracked files, build output, browser bundles, or logs.
