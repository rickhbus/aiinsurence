import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { EnvValidationError, assertProductionEnvIfNeeded } from "@/lib/env";
import { logError } from "@/lib/observability/logger";
import { getRequestId } from "@/lib/server/request-context";

export async function updateSession(request: NextRequest) {
  const requestId = getRequestId(request);
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-request-id", requestId);

  const createNextResponse = () => {
    const nextResponse = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
    nextResponse.headers.set("x-request-id", requestId);
    return nextResponse;
  };

  let response = createNextResponse();

  if (request.nextUrl.pathname === "/api/health" || request.nextUrl.pathname === "/api/readiness") {
    return response;
  }

  let env: ReturnType<typeof assertProductionEnvIfNeeded>;

  try {
    env = assertProductionEnvIfNeeded();
  } catch (error) {
    const issues = error instanceof EnvValidationError
      ? error.issues.map((issue) => issue.key)
      : [];

    logError("Production Supabase environment validation failed", {
      route: request.nextUrl.pathname,
      requestId,
      error,
      issues: issues.join(","),
    });

    return new NextResponse("Production environment is missing required Supabase runtime configuration.", {
      status: 503,
      headers: {
        "content-type": "text/plain; charset=utf-8",
        "x-request-id": requestId,
      },
    });
  }

  if (!env.isSupabaseConfigured) {
    return response;
  }

  const supabase = createServerClient(
    env.supabaseUrl!,
    env.supabaseAnonKey!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          response = createNextResponse();

          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  await supabase.auth.getUser();

  return response;
}
