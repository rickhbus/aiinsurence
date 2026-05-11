import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import {
  assertProductionEnvIfNeeded,
  getClientEnv,
} from "@/lib/env";

export function hasSupabaseServerConfig() {
  assertProductionEnvIfNeeded();

  return getClientEnv().isSupabaseConfigured;
}

export async function createClient() {
  const env = assertProductionEnvIfNeeded();

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
