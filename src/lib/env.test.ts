import { describe, expect, it } from "vitest";
import {
  EnvValidationError,
  assertProductionEnv,
  getClientEnv,
  getEnvIssues,
  getServerEnv,
} from "./env";

describe("environment validation", () => {
  it("validates public Supabase config without exposing server-only keys", () => {
    const env = getClientEnv({
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
      NEXT_PUBLIC_ANALYTICS_KEY: "analytics-key",
      NEXT_PUBLIC_APP_ENV: "preview",
    });

    expect(env.isSupabaseConfigured).toBe(true);
    expect(env.supabaseAnonKey).toBe("anon-key");
    expect("DEEPSEEK_API_KEY" in env).toBe(false);
  });

  it("warns locally but fails production when required env vars are missing", () => {
    const localIssues = getEnvIssues("server", {
      APP_ENV: "development",
      AI_PROVIDER: "deepseek",
    });

    expect(localIssues.some((issue) => issue.severity === "warning")).toBe(true);

    expect(() =>
      assertProductionEnv({
        APP_ENV: "production",
        AI_PROVIDER: "deepseek",
      }),
    ).toThrow(EnvValidationError);
  });

  it("does not require an AI provider key for production boot", () => {
    expect(() =>
      assertProductionEnv({
        APP_ENV: "production",
        NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "publishable-key",
        AI_PROVIDER: "deepseek",
      }),
    ).not.toThrow();

    expect(
      getEnvIssues("production", {
        APP_ENV: "production",
        NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "publishable-key",
        AI_PROVIDER: "deepseek",
      }),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "DEEPSEEK_API_KEY",
          severity: "warning",
        }),
      ]),
    );
  });

  it("treats AI Gateway auth as configured for DeepSeek", () => {
    const env = getServerEnv({
      APP_ENV: "production",
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "publishable-key",
      AI_PROVIDER: "deepseek",
      AI_GATEWAY_API_KEY: "gateway-key",
    });

    expect(env.isAiConfigured).toBe(true);
    expect(
      getEnvIssues("production", {
        APP_ENV: "production",
        NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "publishable-key",
        AI_PROVIDER: "deepseek",
        AI_GATEWAY_API_KEY: "gateway-key",
      }).some((issue) => issue.key === "DEEPSEEK_API_KEY"),
    ).toBe(false);
  });

  it("rejects service-role shaped values in public env", () => {
    const issues = getEnvIssues("production", {
      APP_ENV: "production",
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "service_role.secret",
      DEEPSEEK_API_KEY: "server-key",
      AI_PROVIDER: "deepseek",
    });

    expect(issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "NEXT_PUBLIC_*",
          severity: "error",
        }),
      ]),
    );
  });

  it("detects public service-role leak attempts outside Supabase naming", () => {
    const issues = getEnvIssues("production", {
      APP_ENV: "production",
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
      NEXT_PUBLIC_REDIS_SERVICE_ROLE_KEY: "service_role.redis",
    });

    expect(issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "NEXT_PUBLIC_*",
          severity: "error",
        }),
      ]),
    );
  });

  it("warns on partial Stripe payment config without blocking app boot", () => {
    const issues = getEnvIssues("production", {
      APP_ENV: "production",
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
      STRIPE_SECRET_KEY: "sk_test_123",
    });

    expect(issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "STRIPE_WEBHOOK_SECRET",
          severity: "warning",
        }),
      ]),
    );
  });

  it("rejects public Stripe secret leak attempts", () => {
    const issues = getEnvIssues("production", {
      APP_ENV: "production",
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
      NEXT_PUBLIC_STRIPE_SECRET_KEY: "sk_test_public_leak",
    });

    expect(issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "NEXT_PUBLIC_STRIPE_*",
          severity: "error",
        }),
      ]),
    );
  });
});
