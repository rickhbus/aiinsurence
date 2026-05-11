import { emotionSafetyIndicators, detectEmotionSafetyFlags } from "./safety";
import {
  EMOTION_ENGINE_DISCLAIMER,
  type EmotionAnalysisRequest,
  type EmotionAnalysisResult,
  type EmotionLabel,
  type EmotionSafetyFlags,
  type EmotionUrgencyLevel,
} from "./types";

type EmotionScore = {
  label: EmotionLabel;
  patterns: RegExp[];
};

const emotionScores: EmotionScore[] = [
  {
    label: "urgent",
    patterns: [/急|urgent|emergency|now|立即|馬上|999|a&e/iu],
  },
  {
    label: "anxious",
    patterns: [/擔心|焦慮|害怕|驚|worr|anxious|scared|afraid|nervous/iu],
  },
  {
    label: "confused",
    patterns: [/唔明|不明白|混亂|confus|unclear|not sure|不知道|唔知|do not understand|don't understand/iu],
  },
  {
    label: "frustrated",
    patterns: [/煩|挫敗|麻煩|frustrat|stuck|annoyed|fed up/iu],
  },
  {
    label: "angry",
    patterns: [/嬲|生氣|憤怒|angry|mad|furious|outraged/iu],
  },
  {
    label: "overwhelmed",
    patterns: [/崩潰|受不了|頂唔順|太多|overwhelmed|can't cope|cannot cope/iu],
  },
  {
    label: "sad",
    patterns: [/傷心|難過|灰心|sad|hopeless|upset|depressed/iu],
  },
  {
    label: "hopeful",
    patterns: [/希望|想改善|hope|hopefully|better|improve/iu],
  },
  {
    label: "relieved",
    patterns: [/放心|安心|鬆一口氣|relieved|reassured/iu],
  },
];

export function classifyEmotion(
  input: EmotionAnalysisRequest,
  requestId = crypto.randomUUID(),
): EmotionAnalysisResult {
  const text = input.text.trim();
  const flags = detectEmotionSafetyFlags(text);
  const scores = scoreEmotions(text, flags);
  const primary = scores[0]?.label ?? "neutral";
  const secondary = scores
    .slice(1, 4)
    .map((score) => score.label)
    .filter((label) => label !== primary);
  const urgency = deriveUrgency(flags, primary);

  return {
    requestId,
    primary_emotion: primary,
    secondary_emotions: secondary,
    confidence: deriveConfidence(scores.length, flags),
    urgency_level: urgency,
    distress_indicators: emotionSafetyIndicators(flags),
    recommended_tone: recommendedTone(urgency, primary),
    suggested_next_step: suggestedNextStep(urgency, flags, input.language),
    safety_flags: flags,
    user_visible_summary: userVisibleSummary(primary, secondary, urgency, input.language),
    internal_notes: internalNotes(flags),
    disclaimer: EMOTION_ENGINE_DISCLAIMER,
    created_at: new Date().toISOString(),
  };
}

function scoreEmotions(text: string, flags: EmotionSafetyFlags) {
  const scores = emotionScores
    .map((candidate) => ({
      label: candidate.label,
      score: candidate.patterns.reduce(
        (total, pattern) => total + (pattern.test(text) ? 1 : 0),
        0,
      ),
    }))
    .filter((candidate) => candidate.score > 0)
    .sort((a, b) => b.score - a.score);

  if ((flags.emergency || flags.selfHarm) && !scores.some((item) => item.label === "urgent")) {
    scores.unshift({ label: "urgent", score: 2 });
  }

  return scores;
}

function deriveUrgency(
  flags: EmotionSafetyFlags,
  primary: EmotionLabel,
): EmotionUrgencyLevel {
  if (flags.selfHarm) {
    return "crisis";
  }

  if (flags.emergency) {
    return "high";
  }

  if (flags.abuseOrViolence || flags.highDistress || primary === "overwhelmed") {
    return "medium";
  }

  return "low";
}

function deriveConfidence(scoreCount: number, flags: EmotionSafetyFlags) {
  const base = scoreCount === 0 ? 0.34 : scoreCount === 1 ? 0.58 : 0.72;
  const safetyBoost = flags.emergency || flags.selfHarm || flags.highDistress ? 0.08 : 0;

  return Math.min(0.88, Number((base + safetyBoost).toFixed(2)));
}

function recommendedTone(urgency: EmotionUrgencyLevel, primary: EmotionLabel) {
  if (urgency === "crisis") {
    return "supportive, direct, crisis-aware, and brief";
  }

  if (urgency === "high") {
    return "urgent, direct, and non-diagnostic";
  }

  if (primary === "angry" || primary === "frustrated") {
    return "calm, validating, concrete, and non-defensive";
  }

  if (primary === "confused") {
    return "plain-language, structured, and step-by-step";
  }

  if (primary === "anxious" || primary === "overwhelmed") {
    return "steady, reassuring, and low cognitive load";
  }

  return "warm, neutral, and practical";
}

function suggestedNextStep(
  urgency: EmotionUrgencyLevel,
  flags: EmotionSafetyFlags,
  language: EmotionAnalysisRequest["language"],
) {
  if (flags.selfHarm) {
    return language === "zh-Hant"
      ? "如果你可能會傷害自己或他人，請立即致電 999、前往急症室，或聯絡身邊可信任的人陪伴你。"
      : "If you may hurt yourself or someone else, call emergency services now, go to A&E, or contact a trusted person to stay with you.";
  }

  if (flags.emergency) {
    return language === "zh-Hant"
      ? "請立即致電 999 或前往急症室，不要等待 AI 或保險確認。"
      : "Call emergency services or go to A&E now. Do not wait for AI or insurance confirmation.";
  }

  if (urgency === "medium") {
    return language === "zh-Hant"
      ? "先確認最重要的一個問題，然後選擇醫療、保險或照護導航的下一步。"
      : "Start with the single most important concern, then choose the next healthcare, insurance, or care-navigation step.";
  }

  return language === "zh-Hant"
    ? "可以繼續整理背景資料；情緒訊號只用來調整語氣，不會用作保險決策。"
    : "You can continue organizing context; emotion signals adjust tone only and are not used for insurance decisions.";
}

function userVisibleSummary(
  primary: EmotionLabel,
  secondary: EmotionLabel[],
  urgency: EmotionUrgencyLevel,
  language: EmotionAnalysisRequest["language"],
) {
  const secondaryText = secondary.length > 0 ? secondary.join(", ") : "none";

  if (language === "zh-Hant") {
    return `你的訊息聽起來偏向 ${primary}，可能還帶有 ${secondaryText}。這只是輔助訊號，不是臨床評估。緊急程度：${urgency}。`;
  }

  return `Your message sounds ${primary}, with possible secondary signals: ${secondaryText}. This is an assistive signal, not a clinical assessment. Urgency: ${urgency}.`;
}

function internalNotes(flags: EmotionSafetyFlags) {
  if (flags.sensitiveInsuranceDecision) {
    return "Do not use emotion output for eligibility, pricing, coverage, claim, or care-access decisions.";
  }

  return null;
}
