# Production Deployment Checklist

Use this before promoting AI Health Guide / 智健導航 to production.

## Data And Auth

- [ ] Supabase migrations `001` to `004` applied in order.
- [ ] RLS enabled on every user-owned table.
- [ ] Own-row select/insert/update/delete policies verified.
- [ ] No user-owned table grants public cross-user access.
- [ ] `health_lessons` remains public read-only.
- [ ] Supabase Auth redirect URLs configured for production, preview, and local callback URLs.
- [ ] Profile auto-creation trigger verified after first login.
- [ ] Sign out clears the browser session.

## Environment

- [ ] `NEXT_PUBLIC_SUPABASE_URL` configured.
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` configured.
- [ ] Server-only AI provider key configured.
- [ ] Optional analytics key configured only if analytics is enabled.
- [ ] `APP_ENV=production` set only after env validation is green.
- [ ] No service-role key is exposed through `NEXT_PUBLIC_*`.

## Build And Tests

- [ ] `npx tsc --noEmit` passes.
- [ ] `npm run lint` passes.
- [ ] `npm run test` passes.
- [ ] `npm run build` passes.
- [ ] Main route sweep passes without console errors.

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

## Safety And Privacy

- [ ] Red-flag symptom route escalates to `999` / A&E without depending entirely on AI.
- [ ] Insurance helper includes the non-advice disclaimer.
- [ ] Memory suggestions are visible but not saved silently.
- [ ] User can save, decline, edit, and delete memory.
- [ ] Analytics payloads contain counts, categories, and booleans only.
- [ ] Logs do not include symptoms text, policy text, meal text, raw AI prompts, or medical notes.

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
- [ ] User views weekly progress.
- [ ] User signs out and signs back in.
