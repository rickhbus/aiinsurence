# Health Quest Staging QA

## Onboarding QA

- Traditional Chinese appears first where bilingual copy is paired.
- Anonymous-first auth flow establishes a Supabase session before saving.
- Invalid body data returns 400 without logging raw input.

## Today QA

- Daily quests load after onboarding.
- Make it easier does not expose private notes.
- Why this returns static explanatory copy.
- Safety mode blocks XP-first UI.

## Recovery QA

- Recovery mode says recovery counts.
- Skipping or reducing intensity does not shame the user.

## Safety QA

- Chest pain, breathing difficulty, self-harm, fainting, severe blood/pain, and stroke symptoms show 999/A&E guidance before normal flow.
- Emergency guidance is not premium-gated.

## Learn QA

- Skill tree loads.
- Lesson seeds exist.
- Completing the same lesson twice does not award duplicate XP.

## Weekly Review QA

- Opening the review twice does not award duplicate XP.
- Review copy says it is not a medical score, diagnosis, or treatment advice.

## Family QA

- Pending invites store token hashes only.
- Expired/revoked invite paths fail closed.
- Invite payload exposes no health details.
- Email delivery remains a documented limitation unless a provider is configured.

## Doctor Mission QA

- Urgent text blocks normal save and shows safety guidance.
- Export supports JSON, copy text, and print-friendly HTML.
- Disclaimer says it is not diagnosis, treatment, or medication advice.

## Insurance Mission QA

- Boundary banner is visible.
- No guarantee copy appears.
- Policy text and claim text are not stored in analytics.

## Reminders QA

- Reminder copy contains no private health detail.
- Quiet hours suppress delivery previews.
- Push delivery is not implemented.

## Mobile QA

- `/today`, `/learn`, `/weekly-review`, `/doctor/mission`, and `/settings/reminders` fit at 375px width.
- Buttons remain tappable and text does not overlap.

## Desktop QA

- `/dev/health-quest-qa` links every major surface when enabled.
- `/today/advanced` remains usable without hidden overflow.

## Bilingual QA

- User-facing paired copy is zh-Hant first and English second.
- Safety guidance includes 999 and Accident & Emergency.

## RLS QA

- Run `supabase/diagnostics/health-quest-rls-verification.sql` in staging with disposable users.
- Confirm user-owned rows are isolated and public lesson/template rows remain read-only.
