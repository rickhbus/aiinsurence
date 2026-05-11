# Security Notes

This app handles health-adjacent and insurance-adjacent context. Treat the data as sensitive even though the app does not claim HIPAA, medical-device, legal, insurance-advice, or regulated intermediary compliance.

## Hard Rules

- Do not expose secrets. Server-only keys must never use `NEXT_PUBLIC_`.
- Do not log PHI/PII, symptoms, policy text, claim text, raw prompts, auth tokens, API keys, session cookies, HKID, phone numbers, or payment data.
- Do not use a Supabase service-role key in browser code.
- Keep RLS enabled for all user-owned tables.
- Users can access only their own records unless a specific consent-backed policy exists.
- Do not claim medical, legal, insurance, claim, eligibility, reimbursement, or compliance certainty.
- Do not claim HIPAA compliance unless a real compliance program, BAAs, policies, audits, and production controls are in place.

## Current Security Work Completed

- Supabase client code uses public anon/publishable keys only.
- Server routes use request IDs and sanitized logging helpers.
- Auth callback redirects are restricted to same-origin relative paths.
- AI.GBL and Emotion Engine run server-side through route handlers.
- AI.GBL and Emotion Engine store structured outputs and summaries rather than unrestricted raw prompts.
- `005_gbl_emotion_engine.sql` adds RLS and own-row policies for AI.GBL, Emotion Engine, insurance analysis, and analysis-job tables.
- AI usage events track feature/status/token estimates without raw content.

## Remaining Production Validation

- Run Supabase policy tests against a real staging project.
- Verify Vercel production env vars contain no service-role public leaks.
- Add external error monitoring before production traffic.
- Add WAF/rate-limit review at the Vercel/project edge.
- Run dependency audit and patch non-breaking advisories.
- Perform load testing before making any 100k DAU readiness claim.
