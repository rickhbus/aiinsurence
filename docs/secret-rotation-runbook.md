# Secret Rotation Runbook

Use this when any Supabase, Redis/Upstash, AI provider, Vercel, webhook, database, or auth secret may have been exposed or is due for scheduled rotation. Do not paste secret values into issues, commits, docs, logs, screenshots, or chat.

## Rotation Order

1. Create the replacement secret in the provider dashboard.
2. Add the replacement to Vercel production and preview environment variables.
3. Redeploy or promote a deployment that reads the replacement value.
4. Verify `/api/health` and `/api/readiness`.
5. Revoke the old secret in the provider dashboard.
6. Re-run `/api/readiness` and the relevant smoke flow.
7. Set `SECRETS_ROTATED_AT` to the rotation completion timestamp and `SECRETS_ROTATION_NEXT_DUE_AT` to the next scheduled date.

## Secret Groups

- Supabase: anon/publishable key, service-role key if ever used, database password, project JWT settings.
- Redis/Upstash: REST URL and REST token.
- AI providers: DeepSeek, Groq, OpenAI, and any future provider keys.
- Monitoring: alert webhooks, Sentry DSN when private, OTLP exporter credentials.
- Vercel/GitHub: deploy tokens, integration tokens, and any local CLI tokens.

## Verification

- `git ls-files .env` must stay empty.
- Secret values must not appear in tracked files, build output, or logs.
- `/api/readiness` must show `secret_rotation` as `pass` before production traffic.
- If a secret was pasted into chat or shared outside the provider dashboard, rotate it even if it was not committed.
