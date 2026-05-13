import { afterEach, describe, expect, it, vi } from "vitest";
import {
  enforceProductionApiRateLimit,
  isProductionApiRateLimitEnabled,
  resolveProductionApiRateLimitPolicy,
} from "./production-api-rate-limit";
import { resetRateLimitStoresForTests } from "./rate-limit-store";

describe("production API rate-limit gate", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    resetRateLimitStoresForTests();
  });

  it("is enabled by default only for production-like environments", () => {
    expect(isProductionApiRateLimitEnabled({ APP_ENV: "development" })).toBe(false);
    expect(isProductionApiRateLimitEnabled({ VERCEL_ENV: "production" })).toBe(true);
    expect(
      isProductionApiRateLimitEnabled({
        VERCEL_ENV: "production",
        PRODUCTION_API_RATE_LIMIT_ENABLED: "false",
      }),
    ).toBe(false);
  });

  it("exempts readiness healthcheck routes from proxy rate limiting", () => {
    const policy = resolveProductionApiRateLimitPolicy(
      new Request("https://app.example/api/readiness"),
      { APP_ENV: "production" },
    );

    expect(policy).toBeNull();
  });

  it("uses a shared AI route bucket for expensive API routes", () => {
    const policy = resolveProductionApiRateLimitPolicy(
      new Request("https://app.example/api/gbl/analyze", { method: "POST" }),
      { APP_ENV: "production", PRODUCTION_AI_API_RATE_LIMIT_PER_WINDOW: "7" },
    );

    expect(policy).toMatchObject({
      name: "ai_api",
      routeKey: "production-api:ai",
      limit: 7,
    });
  });

  it("fails closed in production when the shared store is missing", async () => {
    const response = await enforceProductionApiRateLimit(
      new Request("https://app.example/api/dashboard", {
        headers: { "x-forwarded-for": "203.0.113.99" },
      }),
      { APP_ENV: "production" },
    );

    expect(response?.status).toBe(503);
    await expect(response?.json()).resolves.toMatchObject({
      error: "Production API rate limiting is not configured.",
    });
  });

  it("accepts Vercel KV REST env names as a shared production store", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json({ result: 1 })),
    );

    const response = await enforceProductionApiRateLimit(
      new Request("https://app.example/api/life-tracker/log", {
        method: "POST",
        headers: { "x-forwarded-for": "203.0.113.101" },
      }),
      {
        APP_ENV: "production",
        KV_REST_API_URL: "https://kv.example",
        KV_REST_API_TOKEN: "server-token",
      },
    );

    expect(response).toBeNull();
  });

  it("returns 429 when the shared Redis bucket exceeds the policy limit", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: string | URL | Request) => {
        const url = String(input);

        if (url.includes("/incr/")) {
          return Response.json({ result: 2 });
        }

        return Response.json({ result: 60_000 });
      }),
    );

    const response = await enforceProductionApiRateLimit(
      new Request("https://app.example/api/dashboard", {
        headers: { "x-forwarded-for": "203.0.113.100" },
      }),
      {
        APP_ENV: "production",
        PRODUCTION_API_RATE_LIMIT_PER_WINDOW: "1",
        UPSTASH_REDIS_REST_URL: "https://redis.example",
        UPSTASH_REDIS_REST_TOKEN: "server-token",
      },
    );

    expect(response?.status).toBe(429);
    expect(response?.headers.get("Retry-After")).toBe("60");
  });
});
