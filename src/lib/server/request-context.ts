import { getClientEnv } from "@/lib/env";

const REQUEST_ID_HEADER = "x-request-id";

export function getRequestId(request?: Request | null) {
  const fromRequest =
    request?.headers.get(REQUEST_ID_HEADER) ||
    request?.headers.get("x-vercel-id") ||
    request?.headers.get("x-correlation-id");

  return sanitizeRequestId(fromRequest) || crypto.randomUUID();
}

export function withRequestIdHeaders(
  init: ResponseInit | undefined,
  requestId: string,
): ResponseInit {
  const headers = new Headers(init?.headers);
  headers.set(REQUEST_ID_HEADER, requestId);

  return {
    ...init,
    headers,
  };
}

export function jsonWithRequestId(
  body: object | unknown[],
  init: ResponseInit | undefined,
  requestId: string,
) {
  const payload = Array.isArray(body) ? { data: body, requestId } : { ...body, requestId };

  return Response.json(payload, withRequestIdHeaders(init, requestId));
}

export function getDeploymentMetadata(env: Record<string, string | undefined> = process.env) {
  const appEnv = getClientEnv(env).appEnv;

  return {
    appEnv,
    vercelEnv: env.VERCEL_ENV ?? null,
    region: env.VERCEL_REGION ?? env.AWS_REGION ?? null,
    deploymentId: env.VERCEL_DEPLOYMENT_ID ?? null,
    git: {
      provider: env.VERCEL_GIT_PROVIDER ?? null,
      repo: env.VERCEL_GIT_REPO_SLUG ?? null,
      commitSha: shortSha(env.VERCEL_GIT_COMMIT_SHA),
      commitRef: env.VERCEL_GIT_COMMIT_REF ?? null,
    },
  };
}

function sanitizeRequestId(value: string | null | undefined) {
  const trimmed = value?.trim();

  if (!trimmed) {
    return null;
  }

  return trimmed.replace(/[^a-zA-Z0-9._:/-]/g, "").slice(0, 160) || null;
}

function shortSha(value: string | undefined) {
  const trimmed = value?.trim();

  return trimmed ? trimmed.slice(0, 12) : null;
}
