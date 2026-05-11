import { describe, expect, it } from "vitest";
import {
  EnvValidationError,
  assertProductionEnv,
  getClientEnv,
  getEnvIssues,
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
});
