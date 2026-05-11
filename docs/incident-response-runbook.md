# Incident Response Runbook

This runbook covers production 500s, dependency outages, rate-limit events, secret exposure, possible PHI/PII logging, and rollback for AI Health Guide / 智健導航.

## First 10 Minutes

1. Assign incident lead, comms lead, and operator.
2. Capture time, deployment id, commit sha, Vercel env, Supabase project, and request ids.
3. Check `/api/health` and `/api/readiness`.
4. Review Vercel runtime logs for structured errors.
5. Avoid pasting secrets, raw symptoms, policy text, claim text, prompts, tokens, cookies, HKID, phone numbers, or payment data into chat or tickets.

## Production 500 Response

- Check Vercel deployment status and runtime logs.
- Hit `/api/health`; if it fails, investigate Next.js runtime boot.
- Hit `/api/readiness`; if it is `not_ready`, fix missing env or Supabase connectivity first.
- Verify `NEXT_PUBLIC_SUPABASE_URL` and one of `NEXT_PUBLIC_SUPABASE_ANON_KEY` or `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- Confirm missing AI provider keys do not block root, dashboard shell, `/gbl`, `/emotion`, or `/history`.
- Roll back the Vercel deployment if the latest deploy introduced the 500.

## Supabase Outage Response

- Confirm Supabase status and project health.
- Check connection pool saturation, CPU, slow queries, and PostgREST errors.
- Reduce load by disabling provider-backed AI generation or non-critical background jobs if needed.
- Keep deterministic emergency guidance available.
- Do not weaken RLS or expose service-role credentials to work around the outage.

## AI Provider Outage Response

- Confirm provider status, timeout rate, and spend/quota state.
- Keep deterministic fallback/mock mode active for AI.GBL and Emotion Engine.
- Return clear JSON errors for provider-only paths if fallback is not possible.
- Do not retry aggressively in a way that increases cost or overloads functions.

## Elevated 429 Response

- Check if traffic is legitimate launch traffic, a client retry loop, or abuse.
- Confirm `Retry-After` is present on 429 responses.
- If Redis/Upstash shared rate limiting is configured, check store latency and errors.
- If only in-memory limiting is active, decide whether production deferral is still acceptable.
- Consider Vercel Firewall, WAF, bot rules, and per-route limits before raising limits.

## Suspected Secret Exposure

- Rotate pasted Supabase, Postgres, service-role, AI provider, Redis, and Vercel tokens.
- Remove exposed values from Vercel env vars and re-add rotated values.
- Re-pull local env only into ignored `.env.local` files.
- Audit logs for suspicious access after exposure.
- Do not commit `.env` or secret-containing files.

## Suspected PHI/PII Logging

- Stop the leaking code path or roll back immediately.
- Preserve logs for investigation according to retention policy.
- Identify affected request ids and log drains.
- Remove or redact downstream copies where supported.
- Update logger redaction tests before redeploying.

## Rollback Checklist

- Identify last known good deployment.
- Confirm migrations are compatible with the rollback.
- Roll back Vercel deployment or promote last good build.
- Verify `/`, `/gbl`, `/emotion`, `/history`, `/api/health`, and `/api/readiness`.
- Run a synthetic AI.GBL request with `save:false`.
- Document residual degraded dependencies.

## Postmortem Checklist

- Timeline with request ids and deployment ids.
- Customer impact and duration.
- Root cause and contributing factors.
- What detected the issue and what missed it.
- Follow-up owners, deadlines, and verification steps.
- Explicit note if 100k DAU readiness claims remain blocked.
