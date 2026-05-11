<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Repo Context

- Product: Hong Kong AI healthcare, fitness, nutrition, care-navigation, and insurance education app.
- Hosting target: Vercel.
- Backend/auth/database target: Supabase Auth + Postgres + RLS.
- Framework: verify before editing; current repo is Next.js 16 App Router with React 19.
- Use Traditional Chinese first and English second where bilingual copy appears.

# Core Product Contracts

- Preserve anonymous-first use. Users can start without creating a named account.
- Protected persistence must use Supabase sessions and RLS; browser code may use only anon/publishable Supabase keys.
- AI.GBL is the server-side global intelligence layer for normalizing healthcare, insurance, emotion, and safety case context.
- Emotion Engine is an assistive tone/distress signal only. It is not a clinical assessment and must not affect insurance eligibility, pricing, coverage, care access, or claim outcomes.
- The deterministic navigation engine remains the source of truth for emergency escalation before AI provider text.

# Safety And Security Rules

- Do not expose secrets.
- Do not log PHI/PII, raw symptoms, policy text, claim text, raw AI prompts, auth tokens, API keys, session data, HKID, phone numbers, or payment data.
- Do not add service-role keys to client code.
- Do not claim HIPAA compliance unless it is actually implemented and verified.
- Do not make medical, legal, insurance, claim, reimbursement, eligibility, coverage, or compliance guarantees.
- Emergency language must tell users to call 999 or go to A&E now and must not wait for AI or insurance confirmation.
- Self-harm or imminent danger language must show crisis/emergency guidance before normal workflows.

# Testing Commands

- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`

# Deployment Expectations

- Apply Supabase migrations in numeric order before production traffic.
- Verify RLS policies and indexes after migrations.
- Configure Supabase Auth callback URLs for local, Vercel preview, and production domains.
- Keep Vercel env vars separated into public browser vars and server-only secrets.
- Do not claim the app is production ready or 100k DAU ready unless build, tests, staging validation, RLS checks, monitoring, and load testing have actually passed.
