import { shouldFailFastForProduction } from "@/lib/env";
import { logError, logWarn, normalizeError } from "@/lib/observability/logger";
import {
  RATE_LIMIT_COPY_ZH,
  checkSubjectRateLimit,
  getRequestIp,
} from "@/lib/server/rate-limit";
import {
  getConfiguredRateLimitStore,
  hasSharedRateLimitStoreConfig,
} from "@/lib/server/rate-limit-store";
import {
  getRequestId,
  jsonWithRequestId,
} from "@/lib/server/request-context";

type ApiRateLimitPolicy = {
  name: "api_read" | "api_write" | "ai_api";
  routeKey: string;
  limit: number;
  windowMs: number;
};

const HEALTHCHECK_API_PATHS = new Set(["/api/health", "/api/readiness"]);
const AI_API_PATHS = new Set([
  "/api/coach",
  "/api/emotion/analyze",
  "/api/gbl/analyze",
  "/api/insurance-helper",
  "/api/memory/suggest",
  "/api/navigation/guide",
  "/api/recommendations/save",
  "/api/recommendations/today",
  "/api/symptom-routing",
  "/api/weekly-report",
]);

export async function enforceProductionApiRateLimit(
  request: Request,
  env: Record<string, string | undefined> = process.env,
): Promise<Response | null> {
  const policy = resolveProductionApiRateLimitPolicy(request, env);

  if (!policy) {
    return null;
  }

  const requestId = getRequestId(request);

  if (!hasSharedRateLimitStoreConfig(env)) {
    logError("production_api_rate_limit_store_missing", {
      route: getRequestPathname(request),
      requestId,
      policy: policy.name,
    });

    return jsonWithRequestId(
      {
        error: "Production API rate limiting is not configured.",
      },
      { status: 503 },
      requestId,
    );
  }

  try {
    const result = await checkSubjectRateLimit({
      subject: getRequestIp(request),
      route: policy.routeKey,
      limit: policy.limit,
      windowMs: policy.windowMs,
      store: getConfiguredRateLimitStore(env, { allowMemoryFallback: false }),
    });

    if (result.allowed) {
      return null;
    }

    logWarn("production_api_rate_limited", {
      route: getRequestPathname(request),
      requestId,
      policy: policy.name,
      retryAfterSeconds: result.retryAfterSeconds,
    });

    return jsonWithRequestId(
      { error: RATE_LIMIT_COPY_ZH },
      {
        status: 429,
        headers: { "Retry-After": String(result.retryAfterSeconds) },
      },
      requestId,
    );
  } catch (error) {
    logError("production_api_rate_limit_failed", {
      route: getRequestPathname(request),
      requestId,
      policy: policy.name,
      error: normalizeError(error),
    });

    return jsonWithRequestId(
      {
        error: "Production API rate limiting is temporarily unavailable.",
      },
      { status: 503 },
      requestId,
    );
  }
}

export function resolveProductionApiRateLimitPolicy(
  request: Request,
  env: Record<string, string | undefined> = process.env,
): ApiRateLimitPolicy | null {
  if (!isProductionApiRateLimitEnabled(env)) {
    return null;
  }

  const pathname = getRequestPathname(request);

  if (!pathname.startsWith("/api/") || HEALTHCHECK_API_PATHS.has(pathname)) {
    return null;
  }

  const windowMs = readPositiveInteger(
    env.PRODUCTION_API_RATE_LIMIT_WINDOW_SECONDS,
    60,
  ) * 1000;

  if (AI_API_PATHS.has(pathname)) {
    return {
      name: "ai_api",
      routeKey: "production-api:ai",
      limit: readPositiveInteger(env.PRODUCTION_AI_API_RATE_LIMIT_PER_WINDOW, 60),
      windowMs,
    };
  }

  if (!["GET", "HEAD", "OPTIONS"].includes(request.method.toUpperCase())) {
    return {
      name: "api_write",
      routeKey: "production-api:write",
      limit: readPositiveInteger(env.PRODUCTION_WRITE_API_RATE_LIMIT_PER_WINDOW, 120),
      windowMs,
    };
  }

  return {
    name: "api_read",
    routeKey: "production-api:read",
    limit: readPositiveInteger(env.PRODUCTION_API_RATE_LIMIT_PER_WINDOW, 300),
    windowMs,
  };
}

export function isProductionApiRateLimitEnabled(
  env: Record<string, string | undefined> = process.env,
) {
  const configured = clean(env.PRODUCTION_API_RATE_LIMIT_ENABLED)?.toLowerCase();

  if (configured === "true") {
    return true;
  }

  if (configured === "false") {
    return false;
  }

  return shouldFailFastForProduction(env);
}

function getRequestPathname(request: Request) {
  try {
    return new URL(request.url).pathname;
  } catch {
    return "unknown";
  }
}

function readPositiveInteger(value: string | undefined, fallback: number) {
  const parsed = Number(value);

  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function clean(value: string | undefined) {
  const trimmed = value?.trim();

  return trimmed ? trimmed : null;
}
