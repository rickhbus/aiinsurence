# Hong Kong AI Healthcare & Insurance Navigation

A Hong Kong-focused virtual AI doctor and insurance navigation prototype.

The product posture is intentionally narrow: it helps users understand next steps,
possible care routes, insurance coverage categories, and escalation points. It is
not a doctor, insurer, broker, or licensed insurance intermediary.

## MVP Surface

- Bilingual Traditional Chinese-first intake for medical routing, insurance planning, and policy explanation.
- shadcn/ui and Tailwind v4 app shell with tabs, cards, alerts, sheets, dialogs, drawers, and consent-first controls.
- Safety-first triage with deterministic emergency red-flag handling before any future AI orchestration.
- Department and first-step routing with safe wording such as "possible department" and "if referred".
- Insurance guidance at coverage-category level only, with licensed-adviser escalation.
- 3D virtual AI adviser state UI for idle, listening, analyzing, explaining, reassurance, and emergency states.
- Anonymous-first entry points with account-upgrade and memory-consent copy; no login is required before first use.
- Consent-based session, recommendation, escalation, and audit route handlers backed by Supabase RLS migrations.
- AI.GBL global intelligence layer at `/gbl` for normalized healthcare, insurance, emotion, and safety case context.
- Emotion Engine at `/emotion` for optional tone and distress signals that are not clinical assessments and are not insurance decision inputs.
- Saved analysis history at `/history` with bounded recent-item loading.
- Backend-first mobile health sync contract for native Apple HealthKit and Android Health Connect integrations.

## Product Contract

The app helps users organize healthcare and insurance context, understand possible next questions, and prepare safer conversations with clinicians, insurers, employer benefits administrators, or qualified professionals.

It does not provide medical advice, legal advice, insurance advice, guaranteed eligibility, guaranteed reimbursement, guaranteed coverage, or guaranteed claim approval.

Primary user types supported by the AI.GBL contract:

- Patient/member.
- Provider/admin.
- Broker/benefits adviser.
- Employer/HR benefits user.
- Internal admin only where a future admin surface explicitly implements role checks.

## AI.GBL

AI.GBL is implemented as a server-side intelligence layer under `src/lib/gbl/` with:

- Typed case context, safety flags, recommendations, audit events, and disclaimers.
- Zod validation in `src/lib/gbl/validators.ts`.
- Emergency, self-harm, diagnosis, treatment, insurance-guarantee, and legal/compliance safety detection.
- Deterministic fallback output when provider keys are missing.
- Optional provider enrichment through the existing AI provider abstraction.
- API route: `src/app/api/gbl/analyze/route.ts`.
- UI route: `/gbl`.
- Supabase persistence: `gbl_cases`, `gbl_analysis_results`, and `insurance_analyses`.

Provider calls never happen from client components, and model/provider internals are not exposed to the browser.

## Emotion Engine

Emotion Engine is implemented under `src/lib/emotion-engine/` with:

- Labels such as neutral, confused, anxious, frustrated, angry, overwhelmed, sad, hopeful, relieved, urgent, and unknown.
- Safety escalation for emergency, self-harm/crisis, abuse/violence, high distress, and sensitive insurance decisioning language.
- User-facing phrasing like "your message sounds..." rather than harsh labels.
- API route: `src/app/api/emotion/analyze/route.ts`.
- UI route: `/emotion`.
- Supabase persistence: `emotion_engine_results`.

Emotion output is only an empathy and clarity signal. It must not diagnose mental health conditions or affect insurance eligibility, pricing, coverage, care access, or claim outcomes.

## Safety Rules

- Level 1 emergency signals stop intake and escalate to 999 or Accident & Emergency.
- Level 2 same-day signals recommend same-day medical assessment.
- Level 3 non-urgent symptoms route to GP or family doctor first, with possible specialist follow-up.
- Level 4 planning questions cover prevention, insurance, claims, and document explanation.

The rule engine lives in `src/lib/navigation-engine.ts` and is covered by
`src/lib/navigation-engine.test.ts`.

## Local Development

```bash
npm install
npm run dev
```

Open http://localhost:3000.
If port 3000 is already in use, Next.js will print the alternate local URL.

## Local Supabase

The repo includes Supabase CLI config and numeric migrations. To boot a local
Supabase stack, Docker must be running:

```bash
npx supabase start
npx supabase status
```

Copy the local API URL and anon key from `supabase status` into `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Reset local data and reapply migrations with:

```bash
npm run supabase:reset
```

For a remote project, link it with the Supabase CLI, then apply migrations:

```bash
npx supabase link --project-ref <project-ref>
npm run supabase:push
```

Do not put service-role keys in browser env vars. Configure Supabase Auth
redirect URLs for `http://localhost:3000/auth/callback`, Vercel preview
callbacks, and the production callback before enabling production traffic.

## Persistence

The MVP uses Supabase Auth and RLS-protected tables for profiles, preferences,
household members, conversations, saved recommendations, consent events, triage
assessments, department recommendations, insurance recommendations, escalation
cases, audit logs, health tracking, AI.GBL cases, Emotion Engine results,
insurance analyses, AI usage events, and privacy-safe analytics.

Server routes fail closed when Supabase is not configured or when the user has
not granted explicit save or adviser-handoff consent.

Apply migrations in order:

1. `supabase/migrations/001_auth_memory.sql`
2. `supabase/migrations/002_mvp_audit_tables.sql`
3. `supabase/migrations/003_health_os_data_foundation.sql`
4. `supabase/migrations/004_production_readiness.sql`
5. `supabase/migrations/005_gbl_emotion_engine.sql`
6. `supabase/migrations/006_mobile_health_sync.sql`
7. `supabase/migrations/007_daily_checkins.sql`

## AI Provider

The app keeps deterministic safety triage first, then asks the configured model
for the short guide message. DeepSeek V4 Flash is the default provider:

```bash
DEEPSEEK_API_KEY=...
AI_PROVIDER=deepseek
DEEPSEEK_MODEL=deepseek-v4-flash
```

To switch to Groq without changing call sites:

```bash
GROQ_API_KEY=...
AI_PROVIDER=groq
GROQ_MODEL=llama-3.3-70b-versatile
```

To switch to OpenAI without changing call sites:

```bash
OPENAI_API_KEY=...
AI_PROVIDER=openai
OPENAI_MODEL=gpt-5-mini
```

`AI_MODEL` can override the provider-specific model variable for any
provider. If no key is configured, the UI falls back to the safe rule-based
recommendation.

## Verification

```bash
npm run lint
npm run test
npm run typecheck
npm run build
```

## Deployment

Target hosting is Vercel. Required setup:

- Configure Supabase Auth callback URLs for local, preview, and production domains.
- Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Keep `SUPABASE_SERVICE_ROLE_KEY`, `DEEPSEEK_API_KEY`, `GROQ_API_KEY`, and `OPENAI_API_KEY` server-only.
- Configure `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` or compatible Redis REST vars before production-scale rate limiting; readiness is degraded without a shared store in production.
- Set `APP_ENV=production` only after env validation, migrations, RLS, and build checks are green.
- Use `docs/production-deployment-checklist.md` and `docs/supabase-production-checklist.md` before promotion.

## Mobile Health

The web app cannot read Apple Health or Android Health Connect directly. Native iOS/Android clients must request per-data-type permission on device, normalize summaries, and call `/api/mobile-health/sync` with explicit user consent and an idempotency key. See `docs/mobile-health-integration.md`.

## Security And Scale

- See `SECURITY_NOTES.md` for privacy/security rules and remaining production validation.
- See `SCALE_100K_DAU.md` for the architecture path toward 100k DAU.
- The app is not proven for 100k DAU until load testing, query-plan validation, production monitoring, and incident drills are completed.

## Source Notes

The prototype copy uses the product brief plus official Hong Kong reference points:

- Hong Kong emergency assistance: 999.
- Hospital Authority public healthcare context: A&E and general out-patient clinics.
- VHIS as a Health Bureau policy initiative regulating individual indemnity hospital insurance plans.
- GovHK notes qualifying VHIS premiums may be tax deductible subject to rules and limits.
