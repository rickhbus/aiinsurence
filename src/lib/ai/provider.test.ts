import { describe, expect, it } from "vitest";
import { getGuideRuntimeConfig } from "./provider";

describe("AI provider config", () => {
  it("defaults to Groq and marks the provider unconfigured without a key", () => {
    expect(getGuideRuntimeConfig({})).toEqual({
      provider: "groq",
      model: "llama-3.3-70b-versatile",
      isConfigured: false,
    });
  });

  it("switches to OpenAI by environment without changing call sites", () => {
    expect(
      getGuideRuntimeConfig({
        AI_PROVIDER: "openai",
        OPENAI_API_KEY: "test-key",
        OPENAI_MODEL: "gpt-5-mini",
      }),
    ).toEqual({
      provider: "openai",
      model: "gpt-5-mini",
      isConfigured: true,
    });
  });

  it("allows a shared AI_MODEL override for either provider", () => {
    expect(
      getGuideRuntimeConfig({
        GROQ_API_KEY: "test-key",
        AI_MODEL: "openai/gpt-oss-20b",
      }),
    ).toEqual({
      provider: "groq",
      model: "openai/gpt-oss-20b",
      isConfigured: true,
    });
  });
});
