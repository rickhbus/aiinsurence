import type { IntakeMode, Recommendation } from "../navigation-engine";

export type AiProviderName = "groq" | "openai";

export type GuideStatus =
  | "generated"
  | "safety_locked"
  | "unconfigured"
  | "failed";

export type GuideRuntimeInfo = {
  provider: AiProviderName;
  model: string;
  status: GuideStatus;
};

export type NavigationGuideRequest = {
  input: string;
  mode: IntakeMode;
};

export type NavigationGuideResponse = {
  recommendation: Recommendation;
  ai: GuideRuntimeInfo;
};
