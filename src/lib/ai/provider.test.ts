import { describe, expect, it } from "vitest";
import { getGuideRuntimeConfig } from "./provider";

describe("AI provider config", () => {
  it("defaults to DeepSeek V4 Flash and marks the provider unconfigured without a key", () => {
    expect(getGuideRuntimeConfig({})).toEqual({
      provider: "deepseek",
      model: "deepseek-v4-flash",
      isConfigured: false,
    });
  });

  it("uses the DeepSeek key and provider-specific model when configured", () => {
    expect(
      getGuideRuntimeConfig({
        DEEPSEEK_API_KEY: "test-key",
        DEEPSEEK_MODEL: "deepseek-v4-flash",
      }),
    ).toEqual({
      provider: "deepseek",
      model: "deepseek-v4-flash",
      isConfigured: true,
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
        DEEPSEEK_API_KEY: "test-key",
        AI_MODEL: "deepseek-chat",
      }),
    ).toEqual({
      provider: "deepseek",
      model: "deepseek-chat",
      isConfigured: true,
    });
  });
});
