import { beforeEach, describe, expect, it, vi } from "vitest";
import { insertXPEvent } from "@/lib/health-quest/storage";
import { getAuthenticatedSupabase } from "@/lib/server/persistence-auth";
import { POST } from "./route";

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

vi.mock("@/lib/health-quest/storage", () => ({
  insertXPEvent: vi.fn(),
}));

describe("/api/health-quest/practice", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("marks persisted review items complete and awards practice XP once", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({
      data: {
        id: "11111111-1111-4111-8111-111111111111",
        item_type: "hydration_review",
        completed_at: "2026-05-14T00:00:00.000Z",
      },
      error: null,
    });
    const updateChain = {
      eq: vi.fn(),
      is: vi.fn(),
      select: vi.fn(),
    };
    updateChain.eq.mockReturnValue(updateChain);
    updateChain.is.mockReturnValue(updateChain);
    updateChain.select.mockReturnValue({ maybeSingle });
    const supabase = {
      from: vi.fn(() => ({
        update: vi.fn(() => updateChain),
      })),
    };
    vi.mocked(getAuthenticatedSupabase).mockResolvedValue({
      ok: true,
      user: { id: "user-123" } as never,
      supabase: supabase as never,
    });
    vi.mocked(insertXPEvent).mockResolvedValue({ id: "xp-1", amount: 5 } as never);

    const response = await POST(
      new Request("http://localhost/api/health-quest/practice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId: "11111111-1111-4111-8111-111111111111",
          itemType: "hydration_review",
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(insertXPEvent).toHaveBeenCalledWith(supabase, "user-123", expect.objectContaining({
      amount: 5,
      eventKey: expect.stringContaining("practice:user-123:hydration_review:"),
    }), expect.objectContaining({
      reviewType: "hydration_review",
    }));
    await expect(response.json()).resolves.toMatchObject({
      completed: true,
      completedNow: true,
      xp: 5,
    });
  });

  it("does not award XP again when a persisted review item was already completed", async () => {
    const updateMaybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    const selectMaybeSingle = vi.fn().mockResolvedValue({
      data: {
        id: "11111111-1111-4111-8111-111111111111",
        item_type: "hydration_review",
        completed_at: "2026-05-14T00:00:00.000Z",
      },
      error: null,
    });
    const updateChain = {
      eq: vi.fn(),
      is: vi.fn(),
      select: vi.fn(),
    };
    updateChain.eq.mockReturnValue(updateChain);
    updateChain.is.mockReturnValue(updateChain);
    updateChain.select.mockReturnValue({ maybeSingle: updateMaybeSingle });
    const selectChain = {
      eq: vi.fn(),
      maybeSingle: selectMaybeSingle,
    };
    selectChain.eq.mockReturnValue(selectChain);
    const supabase = {
      from: vi.fn(() => ({
        update: vi.fn(() => updateChain),
        select: vi.fn(() => selectChain),
      })),
    };
    vi.mocked(getAuthenticatedSupabase).mockResolvedValue({
      ok: true,
      user: { id: "user-123" } as never,
      supabase: supabase as never,
    });

    const response = await POST(
      new Request("http://localhost/api/health-quest/practice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId: "11111111-1111-4111-8111-111111111111",
          itemType: "hydration_review",
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(insertXPEvent).not.toHaveBeenCalled();
    await expect(response.json()).resolves.toMatchObject({
      completed: true,
      completedNow: false,
      xp: 0,
    });
  });
});
