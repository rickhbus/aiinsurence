export type EmotionLabel =
  | "neutral"
  | "confused"
  | "anxious"
  | "frustrated"
  | "angry"
  | "overwhelmed"
  | "sad"
  | "hopeful"
  | "relieved"
  | "urgent"
  | "unknown";

export type EmotionUrgencyLevel = "low" | "medium" | "high" | "crisis";

export type EmotionSafetyFlags = {
  emergency: boolean;
  selfHarm: boolean;
  abuseOrViolence: boolean;
  highDistress: boolean;
  sensitiveInsuranceDecision: boolean;
};

export type EmotionAnalysisRequest = {
  text: string;
  language: "zh-Hant" | "en";
  caseId?: string | null;
  save?: boolean;
};

export type EmotionAnalysisResult = {
  id?: string;
  requestId: string;
  primary_emotion: EmotionLabel;
  secondary_emotions: EmotionLabel[];
  confidence: number;
  urgency_level: EmotionUrgencyLevel;
  distress_indicators: string[];
  recommended_tone: string;
  suggested_next_step: string;
  safety_flags: EmotionSafetyFlags;
  user_visible_summary: string;
  internal_notes: string | null;
  disclaimer: string;
  created_at: string;
  persisted?: boolean;
};

export const EMOTION_ENGINE_DISCLAIMER =
  "Emotion Engine is an assistive signal, not a clinical assessment. It must not be used to diagnose mental health conditions or to decide insurance eligibility, pricing, access, coverage, or claim outcomes.";
