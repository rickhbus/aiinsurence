import { afterEach, describe, expect, it, vi } from "vitest";
import { buildRateLimitKey, checkAnonymousRateLimit } from "./rate-limit";
import {
  MemoryRateLimitStore,
  RedisRateLimitStore,
  getConfiguredRateLimitStore,
  resetRateLimitStoresForTests,
} from "./rate-limit-store";

describe("shared rate-limit store abstraction", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
    resetRateLimitStoresForTests();
  });

  it("allows requests below the configured limit", async () => {
    const store = new MemoryRateLimitStore();
    const result = await checkAnonymousRateLimit({
      ip: "203.0.113.20",
      route: "/api/test",
      limit: 2,
      windowMs: 60_000,
      store,
    });

    expect(result.allowed).toBe(true);
    if (result.allowed) {
      expect(result.remaining).toBe(1);
    }
  });

  it("blocks requests above the configured limit with retryAfter", async () => {
    const store = new MemoryRateLimitStore();

    await checkAnonymousRateLimit({
      ip: "203.0.113.21",
      route: "/api/test",
      limit: 1,
      windowMs: 60_000,
      store,
    });
    const blocked = await checkAnonymousRateLimit({
      ip: "203.0.113.21",
      route: "/api/test",
      limit: 1,
      windowMs: 60_000,
      store,
    });

    expect(blocked.allowed).toBe(false);
    if (!blocked.allowed) {
      expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
    }
  });

  it("resets after the window expires", async () => {
    vi.useFakeTimers();
    const store = new MemoryRateLimitStore();

    await checkAnonymousRateLimit({
      ip: "203.0.113.22",
      route: "/api/test",
      limit: 1,
      windowMs: 1_000,
      store,
    });
    vi.advanceTimersByTime(1_001);
    const result = await checkAnonymousRateLimit({
      ip: "203.0.113.22",
      route: "/api/test",
      limit: 1,
      windowMs: 1_000,
      store,
    });

    expect(result.allowed).toBe(true);
  });

  it("uses memory store when Redis env vars are absent", () => {
    expect(getConfiguredRateLimitStore({}).name).toBe("memory");
  });

  it("does not include the raw IP address in shared store keys", async () => {
    const keys: string[] = [];
    const store = {
      name: "memory" as const,
      async increment(key: string, windowMs: number) {
        keys.push(key);
        return { count: 1, resetAt: Date.now() + windowMs };
      },
    };

    await checkAnonymousRateLimit({
      ip: "203.0.113.23",
      route: "/api/test",
      limit: 2,
      windowMs: 60_000,
      store,
    });

    expect(keys[0]).not.toContain("203.0.113.23");
    expect(buildRateLimitKey("/api/test", "203.0.113.23")).toBe(keys[0]);
  });

  it("falls back to memory when Redis is configured but unreachable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network")));
    const fallback = new MemoryRateLimitStore();
    const store = new RedisRateLimitStore("https://redis.example", "server-token", fallback);

    const first = await store.increment("key", 60_000);
    const second = await store.increment("key", 60_000);

    expect(first.count).toBe(1);
    expect(second.count).toBe(2);
  });
});
