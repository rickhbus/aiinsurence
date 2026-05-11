# Production Deployment Checklist

Use this before promoting AI Health Guide / 智健導航 to production.

## Data And Auth

- [ ] Supabase migrations `001` to `006` applied in order.
- [ ] RLS enabled on every user-owned table.
- [ ] Own-row select/insert/update/delete policies verified.
- [ ] No user-owned table grants public cross-user access.
- [ ] `health_lessons` remains public read-only.
- [ ] Supabase Auth redirect URLs configured for production, preview, and local callback URLs.
- [ ] Profile auto-creation trigger verified after first login.
- [ ] Sign out clears the browser session.

## Environment

- [ ] `NEXT_PUBLIC_SUPABASE_URL` configured.
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` or `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` configured.
- [ ] Server-only AI provider key configured or deterministic fallback mode explicitly accepted.
- [ ] Shared Redis/Upstash rate-limit store configured or production deferral explicitly accepted.
- [ ] Optional analytics key configured only if analytics is enabled.
- [ ] `APP_ENV=production` set only after env validation is green.
- [ ] No service-role key is exposed through `NEXT_PUBLIC_*`.
- [ ] Secrets pasted into chat have been rotated after deployment setup is stable.
- [ ] Redis/Upstash, AI provider, Supabase, Postgres, and Vercel secrets are server-only unless explicitly public-safe.

## Build And Tests

- [ ] `npm run typecheck` passes.
- [ ] `npm run lint` passes.
- [ ] `npm run test` passes.
- [ ] `npm run build` passes.
- [ ] Main route sweep passes without console errors.
- [ ] Root route no longer returns a raw 500 in production-like env.
- [ ] Vercel runtime logs reviewed for boot errors and request ids.

## Health And Readiness

- [ ] `GET /api/health` returns 200.
- [ ] `GET /api/readiness` returns structured JSON with `status`, `checks`, `requestId`, and `timestamp`.
- [ ] Readiness is `ready` or any `degraded` checks have named owners and dates.
- [ ] Missing AI provider keys do not break `/`, `/gbl`, `/emotion`, `/history`, or deterministic AI.GBL/Emotion fallback mode.
- [ ] Missing required Supabase public env vars fail clearly without logging secrets.

## Product Flows

- [ ] Dashboard real-data response works for an authenticated user.
- [ ] Dashboard demo/local fallback works when Supabase is unavailable locally.
- [ ] Quick Add saves work for run, gym, meal, water, sleep, and body metric.
- [ ] Quick Add buttons show pending state and prevent duplicate saves.
- [ ] Summary refresh updates daily summaries, weekly summaries, streaks, and goal progress after logs.
- [ ] Today recommendation is cached per user per day.
- [ ] Weekly report is cached per user per week.
- [ ] AI routes are rate-limited.
- [ ] AI routes record privacy-safe usage events.
- [ ] AI context uses summaries, not full raw history.
- [ ] AI.GBL analysis runs in mock/fallback mode when provider keys are absent.
- [ ] Emotion Engine analysis saves structured outputs only, not raw sensitive text.
- [ ] Analysis history loads with a bounded `limit`, not full history.
- [ ] 429 responses include `Retry-After` where appropriate.
- [ ] Mobile health sync requires auth, explicit consent, idempotency key, bounded batch size, and returns accepted/rejected/duplicate counts.

## Safety And Privacy

- [ ] Red-flag symptom route escalates to `999` / A&E without depending entirely on AI.
- [ ] Insurance helper includes the non-advice disclaimer.
- [ ] Memory suggestions are visible but not saved silently.
- [ ] User can save, decline, edit, and delete memory.
- [ ] Analytics payloads contain counts, categories, and booleans only.
- [ ] Logs do not include symptoms text, policy text, meal text, raw AI prompts, or medical notes.
- [ ] Logs do not include claim text, HKID, phone numbers, payment data, auth tokens, API keys, or session cookies.
- [ ] Mobile health data is not used for diagnosis or insurance decisioning and does not ingest clinical records, diagnoses, medications, glucose, or raw high-frequency heart streams.
- [ ] External monitoring configured or explicitly deferred.

## Scale Readiness

- [ ] Load-test baseline captured from `load-tests/` against preview or staging.
- [ ] Supabase query plans reviewed with `supabase/diagnostics/query-plan-validation.sql`.
- [ ] RLS and indexes reviewed with `supabase/diagnostics/rls-validation.sql` and `supabase/diagnostics/index-validation.sql`.
- [ ] Backup restore drill completed or scheduled.
- [ ] Incident response drill completed or scheduled.
- [ ] AI spend cap and provider quota reviewed.
- [ ] Vercel function usage, Supabase pool limits, and Redis/Upstash operation limits reviewed.
- [ ] Documentation still says the app is not proven for 100k DAU until load tests, query plans, monitoring, quota checks, and incident drills pass.

## Mobile QA

- [ ] Mobile dashboard screenshot captured.
- [ ] Mobile Quick Add screenshot captured.
- [ ] Mobile AI coach screenshot captured.
- [ ] Mobile memory consent screenshot captured.
- [ ] Mobile running page screenshot captured.
- [ ] Mobile nutrition page screenshot captured.
- [ ] No horizontal scroll on small iPhone width.
- [ ] Bottom nav and Quick Add are reachable.
- [ ] Forms and charts do not overflow.
- [ ] Tap targets are comfortable.
- [ ] Mobile health sync settings page works on mobile.

## Final Smoke Flow

- [ ] New user signs up or starts anonymously.
- [ ] Onboarding completes.
- [ ] User logs water.
- [ ] User logs meal.
- [ ] User logs run.
- [ ] User logs gym workout.
- [ ] Dashboard updates.
- [ ] Today recommendation loads.
- [ ] User asks AI coach.
- [ ] AI suggests memory.
- [ ] User approves memory.
- [ ] Memory appears on memory page.
- [ ] User edits memory.
- [ ] User deletes memory.
- [ ] User checks symptom routing.
- [ ] Red flag route escalates to `999` / A&E.
- [ ] User uses insurance helper.
- [ ] Insurance disclaimer appears.
- [ ] User creates an AI.GBL case.
- [ ] User runs Emotion Engine and sees optional, non-clinical wording.
- [ ] User opens analysis history.
- [ ] User views weekly progress.
- [ ] User opens mobile health sync settings.
- [ ] User sees Apple Health / Android Health Connect explanation.
- [ ] User grants sync consent or chooses not now.
- [ ] User signs out and signs back in.
