import { deepseek } from "@ai-sdk/deepseek";
import { groq } from "@ai-sdk/groq";
import { openai } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";
import type { AiProviderName } from "./types";

const DEFAULT_PROVIDER: AiProviderName = "deepseek";
const DEFAULT_DEEPSEEK_MODEL = "deepseek-v4-flash";
const DEFAULT_GROQ_MODEL = "llama-3.3-70b-versatile";
const DEFAULT_OPENAI_MODEL = "gpt-5-mini";

export type GuideRuntimeConfig = {
  provider: AiProviderName;
  model: string;
  isConfigured: boolean;
};

export function getGuideRuntimeConfig(
  env: Record<string, string | undefined> = process.env,
): GuideRuntimeConfig {
  const provider = normalizeProvider(env.AI_PROVIDER);
  const model =
    env.AI_MODEL?.trim() ||
    getProviderModel(provider, env);
  const isConfigured = Boolean(getProviderKey(provider, env)?.trim());

  return { provider, model, isConfigured };
}

export function getGuideModel(config = getGuideRuntimeConfig()): LanguageModel {
  if (config.provider === "openai") {
    return openai(config.model);
  }

  if (config.provider === "groq") {
    return groq(config.model);
  }

  return deepseek(config.model);
}

function normalizeProvider(value: string | undefined): AiProviderName {
  const provider = value?.trim().toLowerCase();

  if (provider === "openai" || provider === "groq") {
    return provider;
  }

  return DEFAULT_PROVIDER;
}

function getProviderModel(
  provider: AiProviderName,
  env: Record<string, string | undefined>,
) {
  if (provider === "openai") {
    return env.OPENAI_MODEL?.trim() || DEFAULT_OPENAI_MODEL;
  }

  if (provider === "groq") {
    return env.GROQ_MODEL?.trim() || DEFAULT_GROQ_MODEL;
  }

  return env.DEEPSEEK_MODEL?.trim() || DEFAULT_DEEPSEEK_MODEL;
}

function getProviderKey(
  provider: AiProviderName,
  env: Record<string, string | undefined>,
) {
  if (provider === "openai") {
    return env.OPENAI_API_KEY;
  }

  if (provider === "groq") {
    return env.GROQ_API_KEY;
  }

  return env.DEEPSEEK_API_KEY;
}
