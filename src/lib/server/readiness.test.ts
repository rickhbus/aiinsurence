import { describe, expect, it } from "vitest";
import { buildReadinessReport, type ReadinessCheck } from "./readiness";

const baseEnv = {
  APP_ENV: "production",
  NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "publishable-key",
  UPSTASH_REDIS_REST_URL: "https://redis.example",
  UPSTASH_REDIS_REST_TOKEN: "server-token",
  MONITORING_ALERTS_ENABLED: "true",
  MONITORING_ALERT_WEBHOOK_URL: "https://alerts.example/webhook",
  SECRETS_ROTATED_AT: "2026-05-01T00:00:00.000Z",
  SECRETS_ROTATION_NEXT_DUE_AT: "2026-08-01T00:00:00.000Z",
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
      now: new Date("2026-05-11T00:00:00.000Z"),
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
      now: new Date("2026-05-11T00:00:00.000Z"),
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

  it("fails production readiness when shared rate limiting is not configured", async () => {
    const report = await buildReadinessReport({
      env: {
        ...baseEnv,
        UPSTASH_REDIS_REST_URL: "",
        UPSTASH_REDIS_REST_TOKEN: "",
      },
      requestId: "missing-redis",
      now: new Date("2026-05-11T00:00:00.000Z"),
      supabaseProbe: async () => [],
    });

    expect(report.status).toBe("not_ready");
    expect(report.checks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "shared_rate_limit_store",
          status: "fail",
        }),
      ]),
    );
  });

  it("fails production readiness when monitoring alerts are missing", async () => {
    const report = await buildReadinessReport({
      env: {
        ...baseEnv,
        MONITORING_ALERTS_ENABLED: "false",
        MONITORING_ALERT_WEBHOOK_URL: "",
      },
      requestId: "missing-alerts",
      now: new Date("2026-05-11T00:00:00.000Z"),
      supabaseProbe: async () => [],
    });

    expect(report.status).toBe("not_ready");
    expect(report.checks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "monitoring_alerts",
          status: "fail",
        }),
      ]),
    );
  });

  it("fails production readiness when secret rotation is overdue", async () => {
    const report = await buildReadinessReport({
      env: {
        ...baseEnv,
        SECRETS_ROTATION_NEXT_DUE_AT: "2026-05-01T00:00:00.000Z",
      },
      requestId: "overdue-secrets",
      now: new Date("2026-05-11T00:00:00.000Z"),
      supabaseProbe: async () => [],
    });

    expect(report.status).toBe("not_ready");
    expect(report.checks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "secret_rotation",
          status: "fail",
        }),
      ]),
    );
  });
});
