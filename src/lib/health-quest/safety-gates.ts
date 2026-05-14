import { detectCrisisFromText, detectEmergencyFromText, emergencyGuidanceEn, emergencyGuidanceZh } from "@/lib/health-os/safety";
import type { DailyHealthSummary, HealthContext, SafetyStatus } from "@/lib/health-os/types";
import type { LocalizedText, QuestCompletionInput } from "./types";

export type QuestSafetyGateResult = {
  urgent: boolean;
  caution: boolean;
  message?: LocalizedText;
  matchedSignals: string[];
};

export function evaluateQuestSafety({
  todaySummary,
  healthContext,
  safetyStatus,
  text,
}: {
  todaySummary?: DailyHealthSummary | null;
  healthContext?: HealthContext | null;
  safetyStatus?: SafetyStatus | "urgent" | null;
  text?: string | null;
}): QuestSafetyGateResult {
  const explicitUrgent = safetyStatus === "red" || safetyStatus === "urgent" || todaySummary?.safetyStatus === "red";
  const crisis = detectCrisisFromText(text);
  const emergency = detectEmergencyFromText(text);
  const contextFlags = healthContext?.safetyFlags ?? [];
  const urgentFlags = [...crisis, ...emergency, ...contextFlags].filter((flag) =>
    /999|emergency|urgent|crisis|self|suicid|chest|stroke|breath|blood|severe|faint|collapse|自殺|自殘|胸|中風|呼吸|出血|嚴重|暈倒|昏厥|急/iu.test(flag),
  );
  const urgent = explicitUrgent || urgentFlags.length > 0;

  return {
    urgent,
    caution: !urgent && (safetyStatus === "yellow" || todaySummary?.safetyStatus === "yellow"),
    message: urgent ? urgentSafetyMessage() : undefined,
    matchedSignals: Array.from(new Set([...crisis, ...emergency, ...contextFlags])),
  };
}

export function runCompletionSafetyGate(input: QuestCompletionInput): QuestSafetyGateResult {
  const payloadText = stringifyPayloadForSafety(input.actionPayload);
  const gate = evaluateQuestSafety({
    safetyStatus: input.quest.safetyLevel === "urgent" ? "urgent" : input.quest.safetyLevel === "caution" ? "yellow" : "green",
    text: payloadText,
  });

  if (input.quest.status === "blocked_by_safety" && input.actionPayload?.acknowledgeSafety === true) {
    return {
      urgent: false,
      caution: false,
      matchedSignals: gate.matchedSignals,
    };
  }

  return gate;
}

export function urgentSafetyMessage(): LocalizedText {
  return {
    zh: emergencyGuidanceZh(),
    en: emergencyGuidanceEn(),
  };
}

function stringifyPayloadForSafety(payload?: Record<string, unknown>) {
  if (!payload) {
    return "";
  }

  return Object.entries(payload)
    .filter(([, value]) => typeof value === "string")
    .map(([, value]) => value)
    .join(" ")
    .slice(0, 2000);
}
