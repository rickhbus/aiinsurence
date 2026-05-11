# Incident Response

Use this runbook for production incidents affecting AI Health Guide / 智健導航.

## First 10 Minutes

1. Confirm impact using Vercel logs, Supabase dashboard, `/api/health`, and `/api/readiness`.
2. Classify severity: safety escalation broken, auth/RLS/privacy risk, elevated 500s, AI outage, rate-limit abuse, or mobile sync failure.
3. Stop risky changes. Do not run migrations or deploy fixes until the failing surface is identified.
4. Preserve request ids and sanitized error categories. Do not copy symptoms, policy text, prompts, tokens, cookies, HKID, phone numbers, payment data, or raw health samples into the incident channel.

## Safety Escalation Incident

- If emergency routing is broken, disable affected AI/intake paths or roll back immediately.
- Verify deterministic red-flag routing before re-enabling traffic.
- Emergency copy must continue telling users to call 999 or go to A&E now.

## AI Provider Outage

- Keep deterministic fallback enabled.
- Confirm provider errors are categorized without raw prompts.
- Reduce AI rate limits if cost or retries spike.

## Abuse Or Spam

- Confirm 429 rate and route-level spikes.
- Tighten Vercel Firewall / WAF / shared Redis limits.
- Do not log raw IPs; use hashed identifiers and aggregated route metrics.

## Privacy Or Key Exposure

- Revoke and rotate leaked keys immediately.
- Remove the source of exposure, redeploy, and verify no `NEXT_PUBLIC_*` server secrets exist.
- Review logs for accidental PHI/PII or raw prompt leakage.

## Closeout

- Record timeline, impacted routes, request ids, mitigations, rollback/deploy ids, and remaining action items.
- Do not claim 100k DAU readiness until load tests, query plans, monitoring, quota checks, rollback, and incident drills have passed with evidence.
