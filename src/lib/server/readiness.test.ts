import { describe, expect, it } from "vitest";
import { buildReadinessReport, type ReadinessCheck } from "./readiness";

const baseEnv = {
  APP_ENV: "production",
  NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "publishable-key",
};

describe("readiness report builder", () => {
  it("does not mark missing AI provider keys as not_ready", async () => {
    const checks: ReadinessCheck[] = [
      {
        name: "supabase_connectivity",
        status: "pass",
        message: "ok",
      },
    ];

    const report = await buildReadinessReport({
      env: baseEnv,
      requestId: "ready-1",
      supabaseProbe: async () => checks,
    });

    expect(report.status).toBe("degraded");
    expect(report.checks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "ai_provider",
          status: "warn",
        }),
      ]),
    );
  });

  it("marks missing required Supabase production config as not_ready", async () => {
    const report = await buildReadinessReport({
      env: { APP_ENV: "production" },
      requestId: "not-ready-1",
      supabaseProbe: async () => [],
    });

    expect(report.status).toBe("not_ready");
    expect(report.checks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "runtime_config",
          status: "fail",
        }),
      ]),
    );
  });
});
