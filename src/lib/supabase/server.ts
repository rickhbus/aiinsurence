import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import {
  EnvValidationError,
  assertProductionEnvIfNeeded,
  getClientEnv,
} from "@/lib/env";
import { logError } from "@/lib/observability/logger";

export function hasSupabaseServerConfig() {
  readRuntimeEnv();

  return getClientEnv().isSupabaseConfigured;
}

export async function createClient() {
  const env = readRuntimeEnv();

  if (!env.isSupabaseConfigured) {
    return null;
  }

  const cookieStore = await cookies();

  return createServerClient(
    env.supabaseUrl!,
    env.supabaseAnonKey!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Server Components cannot set cookies. The proxy refresh path writes
            // refreshed session cookies before rendering.
          }
        },
      },
    },
  );
}

function readRuntimeEnv() {
  try {
    return assertProductionEnvIfNeeded();
  } catch (error) {
    const issues = error instanceof EnvValidationError
      ? error.issues.map((issue) => issue.key).join(",")
      : "unknown";

    logError("Supabase server runtime configuration failed", {
      error,
      issues,
    });

    throw error;
  }
}
