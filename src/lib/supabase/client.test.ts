import { describe, expect, it, vi } from "vitest";
import { getSupabaseAccessToken } from "./client";

function makeSupabaseAuthMock({
  session,
  refreshedSession,
  anonymousToken = "anonymous-token",
}: {
  session: Record<string, unknown> | null;
  refreshedSession?: Record<string, unknown> | null;
  anonymousToken?: string;
}) {
  return {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session }, error: null }),
      refreshSession: vi.fn().mockResolvedValue({
        data: { session: refreshedSession ?? null },
        error: refreshedSession ? null : new Error("refresh failed"),
      }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      signInAnonymously: vi.fn().mockResolvedValue({
        data: { session: { access_token: anonymousToken } },
        error: null,
      }),
    },
  };
}

describe("Supabase browser access token helper", () => {
  it("uses a fresh stored access token", async () => {
    const supabase = makeSupabaseAuthMock({
      session: {
        access_token: "stored-token",
        expires_at: Math.floor(Date.now() / 1000) + 300,
      },
    });

    await expect(getSupabaseAccessToken(supabase as never)).resolves.toBe("stored-token");
    expect(supabase.auth.refreshSession).not.toHaveBeenCalled();
    expect(supabase.auth.signInAnonymously).not.toHaveBeenCalled();
  });

  it("refreshes an expired stored session before protected writes", async () => {
    const supabase = makeSupabaseAuthMock({
      session: {
        access_token: "expired-token",
        refresh_token: "refresh-token",
        expires_at: Math.floor(Date.now() / 1000) - 10,
      },
      refreshedSession: {
        access_token: "refreshed-token",
        expires_at: Math.floor(Date.now() / 1000) + 300,
      },
    });

    await expect(getSupabaseAccessToken(supabase as never)).resolves.toBe("refreshed-token");
    expect(supabase.auth.refreshSession).toHaveBeenCalledTimes(1);
    expect(supabase.auth.signInAnonymously).not.toHaveBeenCalled();
  });

  it("replaces unusable browser auth state with a fresh anonymous session", async () => {
    const supabase = makeSupabaseAuthMock({
      session: {
        access_token: "expired-token",
        refresh_token: "refresh-token",
        expires_at: Math.floor(Date.now() / 1000) - 10,
      },
      refreshedSession: null,
      anonymousToken: "new-anonymous-token",
    });

    await expect(getSupabaseAccessToken(supabase as never)).resolves.toBe(
      "new-anonymous-token",
    );
    expect(supabase.auth.signOut).toHaveBeenCalledWith({ scope: "local" });
    expect(supabase.auth.signInAnonymously).toHaveBeenCalledTimes(1);
  });
});
