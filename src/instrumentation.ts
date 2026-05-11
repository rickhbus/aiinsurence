import type { Instrumentation } from "next";
import { logError, logInfo, normalizeError } from "@/lib/observability/logger";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    logInfo("observability_registered", {
      runtime: process.env.NEXT_RUNTIME,
      appEnv: process.env.APP_ENV ?? process.env.NEXT_PUBLIC_APP_ENV ?? null,
    });
  }
}

export const onRequestError: Instrumentation.onRequestError = async (
  error,
  request,
  context,
) => {
  logError("unhandled_server_request_error", {
    route: safePath(request.path),
    method: request.method,
    routeType: context.routeType,
    routePath: context.routePath,
    routerKind: context.routerKind,
    error: normalizeError(error),
    digest: getDigest(error),
  });
};

function safePath(path: string) {
  try {
    return new URL(path, "https://local.invalid").pathname;
  } catch {
    return path.split("?")[0]?.slice(0, 200) || "unknown";
  }
}

function getDigest(error: unknown) {
  if (error && typeof error === "object" && "digest" in error) {
    return String(error.digest);
  }

  return null;
}
