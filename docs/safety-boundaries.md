# Safety Boundaries

The app provides health education, lifestyle guidance, fitness and nutrition ideas, Hong Kong care navigation, and general insurance education.

It does not provide medical diagnosis, medical advice, legal advice, regulated insurance advice, claim advice, reimbursement guarantees, eligibility guarantees, coverage guarantees, treatment guarantees, or exercise-safety guarantees.

## Emergency

Emergency language must say:

`如屬緊急情況，請立即致電 999 或前往急症室。`

The app must not wait for AI or insurance confirmation before emergency guidance.

## Privacy

Do not expose secrets. Do not log PHI/PII, raw symptoms, policy text, claim text, raw AI prompts, HKID, phone numbers, auth tokens, API keys, session data, payment data, or private credentials.

Any persistence must respect Supabase Auth and RLS.

Mobile health, gym, mood, food, and symptom data must not be used for insurance eligibility, pricing, coverage, claim outcomes, or care-access decisions.
