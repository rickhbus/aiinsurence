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

## Persistence

The MVP uses Supabase Auth and RLS-protected tables for profiles, preferences,
household members, conversations, saved recommendations, consent events, triage
assessments, department recommendations, insurance recommendations, escalation
cases, and audit logs.

Server routes fail closed when Supabase is not configured or when the user has
not granted explicit save or adviser-handoff consent.

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
npm run build
```

## Source Notes

The prototype copy uses the product brief plus official Hong Kong reference points:

- Hong Kong emergency assistance: 999.
- Hospital Authority public healthcare context: A&E and general out-patient clinics.
- VHIS as a Health Bureau policy initiative regulating individual indemnity hospital insurance plans.
- GovHK notes qualifying VHIS premiums may be tax deductible subject to rules and limits.
