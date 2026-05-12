import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getClientEnv } from "@/lib/env";

let browserClient: SupabaseClient | null = null;

export function hasSupabaseBrowserConfig() {
  return getBrowserEnv().isSupabaseConfigured;
}

export function getSupabaseBrowserClient() {
  const env = getBrowserEnv();

  if (!env.isSupabaseConfigured) {
    return null;
  }

  if (!browserClient) {
    browserClient = createBrowserClient(
      env.supabaseUrl!,
      env.supabaseAnonKey!,
    );
  }

  return browserClient;
}

export async function getSupabaseAccessToken(
  supabase = getSupabaseBrowserClient(),
) {
  if (!supabase) {
    return null;
  }

  try {
    const currentSession = await supabase.auth.getSession();
    const existingToken = currentSession.data.session?.access_token;

    if (existingToken) {
      return existingToken;
    }

    const anonymousSession = await supabase.auth.signInAnonymously();

    return anonymousSession.data.session?.access_token ?? null;
  } catch {
    return null;
  }
}

export async function getSupabaseRequestHeaders(headers?: HeadersInit) {
  const requestHeaders = new Headers(headers);
  const accessToken = await getSupabaseAccessToken();

  if (accessToken) {
    requestHeaders.set("Authorization", `Bearer ${accessToken}`);
  }

  return requestHeaders;
}

export function getAuthRedirectTo(path = "/auth/callback") {
  if (typeof window === "undefined") {
    return undefined;
  }

  return `${window.location.origin}${path}`;
}

function getBrowserEnv() {
  return getClientEnv({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_ANALYTICS_KEY: process.env.NEXT_PUBLIC_ANALYTICS_KEY,
    NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV,
  });
}
