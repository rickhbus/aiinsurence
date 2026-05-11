import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/server/persistence-auth", async () => {
  const actual =
    await vi.importActual<typeof import("@/lib/server/persistence-auth")>(
      "@/lib/server/persistence-auth",
    );

  return {
    ...actual,
    getAuthenticatedSupabase: vi.fn(),
  };
});

describe("/api/mobile-health/sync", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("rejects malformed payloads before persistence", async () => {
    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/mobile-health/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourcePlatform: "apple_healthkit",
          idempotencyKey: "short",
          consentGranted: true,
          records: [],
        }),
      }),
    );

    expect(response.status).toBe(400);
  });

  it("requires explicit mobile health sync consent", async () => {
    const { getAuthenticatedSupabase } = await import("@/lib/server/persistence-auth");
    vi.mocked(getAuthenticatedSupabase).mockResolvedValue({
      ok: true,
      user: { id: "user-123" } as never,
      supabase: {} as never,
    });
    const { POST } = await import("./route");

    const response = await POST(
      new Request("http://localhost/api/mobile-health/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourcePlatform: "apple_healthkit",
          idempotencyKey: "sync-2026-05-11",
          consentGranted: false,
          records: [
            {
              type: "steps",
              startTime: "2026-05-11T00:00:00.000Z",
              value: 1000,
              unit: "count",
            },
          ],
        }),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: "Explicit mobile health sync consent is required.",
    });
  });
});
