import { beforeEach, describe, expect, it, vi } from "vitest";
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

describe("/api/health-quest/rewards", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("claims daily chest rewards through the atomic idempotent RPC", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: [{
        wallet_gems: 4,
        wallet_lifetime_gems: 14,
        reward_id: "reward-1",
        reward_event_type: "gems_awarded",
        reward_amount: 4,
        reward_source: "chest_opened",
        reward_event_key: "reward:daily_chest:2026-05-14",
        reward_created_at: "2026-05-14T00:00:00.000Z",
        duplicate: false,
      }],
      error: null,
    });
    vi.mocked(getAuthenticatedSupabase).mockResolvedValue({
      ok: true,
      user: { id: "01234567-89ab-cdef-0123-456789abcdef" } as never,
      supabase: { rpc } as never,
    });

    const response = await POST(
      new Request("http://localhost/api/health-quest/rewards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "open_daily_chest", localDate: "2026-05-14" }),
      }),
    );

    expect(response.status).toBe(200);
    expect(rpc).toHaveBeenCalledWith("claim_health_quest_reward", expect.objectContaining({
      p_source: "chest_opened",
      p_event_key: "reward:daily_chest:2026-05-14",
      p_metadata: { rewardKind: "daily_chest" },
    }));
    await expect(response.json()).resolves.toMatchObject({
      wallet: { gems: 4, lifetimeGems: 14 },
      reward: {
        amount: 4,
        source: "chest_opened",
        event_key: "reward:daily_chest:2026-05-14",
      },
      duplicate: false,
    });
  });

  it("returns duplicate reward claims without re-crediting gems", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: [{
        wallet_gems: 4,
        wallet_lifetime_gems: 14,
        reward_id: "reward-1",
        reward_event_type: "gems_awarded",
        reward_amount: 4,
        reward_source: "chest_opened",
        reward_event_key: "reward:daily_chest:2026-05-14",
        reward_created_at: "2026-05-14T00:00:00.000Z",
        duplicate: true,
      }],
      error: null,
    });
    vi.mocked(getAuthenticatedSupabase).mockResolvedValue({
      ok: true,
      user: { id: "01234567-89ab-cdef-0123-456789abcdef" } as never,
      supabase: { rpc } as never,
    });

    const response = await POST(
      new Request("http://localhost/api/health-quest/rewards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "open_daily_chest", localDate: "2026-05-14" }),
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      wallet: { gems: 4, lifetimeGems: 14 },
      duplicate: true,
    });
  });
});
