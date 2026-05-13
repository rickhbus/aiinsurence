import { createBrowserClient } from "@supabase/ssr";
import type { Session } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getClientEnv } from "@/lib/env";

let browserClient: SupabaseClient | null = null;
const SESSION_REFRESH_BUFFER_SECONDS = 60;

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
  options: { forceNewSession?: boolean } = {},
) {
  if (!supabase) {
    return null;
  }

  try {
    if (options.forceNewSession) {
      return signInWithFreshAnonymousSession(supabase);
    }

    const currentSession = await supabase.auth.getSession();
    const existingSession = currentSession.data.session;

    if (isSessionUsable(existingSession)) {
      return existingSession?.access_token ?? null;
    }

    if (existingSession?.refresh_token) {
      const refreshedSession = await supabase.auth.refreshSession();
      const refreshed = refreshedSession.data.session;

      if (isSessionUsable(refreshed)) {
        return refreshed?.access_token ?? null;
      }
    }

    return signInWithFreshAnonymousSession(supabase);
  } catch {
    return null;
  }
}

export async function getSupabaseRequestHeaders(
  headers?: HeadersInit,
  options: { forceNewSession?: boolean } = {},
) {
  const requestHeaders = new Headers(headers);
  const accessToken = await getSupabaseAccessToken(undefined, options);

  if (accessToken) {
    requestHeaders.set("Authorization", `Bearer ${accessToken}`);
  } else {
    requestHeaders.delete("Authorization");
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

function isSessionUsable(session: Session | null) {
  if (!session?.access_token) {
    return false;
  }

  if (!session.expires_at) {
    return true;
  }

  return session.expires_at > Math.floor(Date.now() / 1000) + SESSION_REFRESH_BUFFER_SECONDS;
}

async function signInWithFreshAnonymousSession(supabase: SupabaseClient) {
  await supabase.auth.signOut({ scope: "local" }).catch(() => undefined);
  const anonymousSession = await supabase.auth.signInAnonymously();

  return anonymousSession.data.session?.access_token ?? null;
}
