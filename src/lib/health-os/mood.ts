import { classifyEmotion } from "@/lib/emotion-engine/classifier";
import { HEALTH_OS_DISCLAIMERS, SMALL_ACTIONS } from "./constants";
import { detectCrisisFromText, emergencyGuidanceZh } from "./safety";
import type { LocaleCode, MoodAnalysis, MoodLogContext } from "./types";

export function analyzeMood(input: MoodLogContext & { locale?: LocaleCode }): MoodAnalysis {
  const locale = input.locale ?? "zh-Hant";
  const text = input.userText ?? "";
  const crisisFlags = detectCrisisFromText(text);
  const emotion = text.trim()
    ? classifyEmotion({ text, language: locale, save: false })
    : null;
  const distress = crisisFlags.length > 0
    ? "crisis"
    : emotion?.urgency_level ?? (input.stressScore && input.stressScore >= 8 ? "medium" : "low");
  const label = input.emotionLabel || emotion?.primary_emotion || inferEmotion(input);

  if (distress === "crisis" || emotion?.safety_flags.selfHarm) {
    return {
      emotionLabel: "urgent",
      userFacingReflection: "你的訊息聽起來可能有即時安全風險。我們先不處理普通情緒教練流程，請先確保你身邊有人陪伴。",
      distressLevel: "crisis",
      suggestedSmallAction: emergencyGuidanceZh(),
      safetyFlags: Array.from(new Set([...crisisFlags, "crisis_or_self_harm_language"])),
      disclaimers: HEALTH_OS_DISCLAIMERS,
    };
  }

  return {
    emotionLabel: label,
    userFacingReflection: `你的訊息聽起來像是 ${label}，可能和 ${input.triggerCategory ?? "今日壓力"} 有關。這不是心理健康診斷，我們先把下一步縮小。`,
    distressLevel: distress,
    suggestedSmallAction: chooseSmallAction(input),
    safetyFlags: emotion?.safety_flags.emergency ? ["emergency_language"] : [],
    disclaimers: HEALTH_OS_DISCLAIMERS,
  };
}

function inferEmotion(input: MoodLogContext) {
  if ((input.energyScore ?? 10) <= 3) {
    return "tired";
  }

  if ((input.stressScore ?? 0) >= 7) {
    return "stressed";
  }

  if ((input.moodScore ?? 6) >= 7) {
    return "hopeful";
  }

  return "neutral";
}

function chooseSmallAction(input: MoodLogContext) {
  if (input.bodyLinks?.includes("dehydration")) {
    return SMALL_ACTIONS[1];
  }

  if (input.bodyLinks?.includes("heavy_workout") || input.bodyLinks?.includes("pain")) {
    return SMALL_ACTIONS[9];
  }

  if ((input.stressScore ?? 0) >= 8) {
    return SMALL_ACTIONS[0];
  }

  if ((input.energyScore ?? 10) <= 4) {
    return SMALL_ACTIONS[7];
  }

  return SMALL_ACTIONS[8];
}
