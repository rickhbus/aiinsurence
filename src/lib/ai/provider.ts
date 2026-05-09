import { groq } from "@ai-sdk/groq";
import { openai } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";
import type { AiProviderName } from "./types";

const DEFAULT_PROVIDER: AiProviderName = "groq";
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
    (provider === "openai"
      ? env.OPENAI_MODEL?.trim() || DEFAULT_OPENAI_MODEL
      : env.GROQ_MODEL?.trim() || DEFAULT_GROQ_MODEL);
  const isConfigured =
    provider === "openai"
      ? Boolean(env.OPENAI_API_KEY?.trim())
      : Boolean(env.GROQ_API_KEY?.trim());

  return { provider, model, isConfigured };
}

export function getGuideModel(config = getGuideRuntimeConfig()): LanguageModel {
  return config.provider === "openai" ? openai(config.model) : groq(config.model);
}

function normalizeProvider(value: string | undefined): AiProviderName {
  return value?.trim().toLowerCase() === "openai" ? "openai" : DEFAULT_PROVIDER;
}
