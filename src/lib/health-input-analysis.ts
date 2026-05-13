import { z } from "zod";
import { getGuideRuntimeConfig } from "@/lib/ai/provider";
import type { GuideRuntimeInfo } from "@/lib/ai/types";
import { createGuideFallbackMessage } from "@/lib/ai/health-guide";
import { classifyEmotion } from "@/lib/emotion-engine/classifier";
import type { EmotionAnalysisResult } from "@/lib/emotion-engine/types";
import { detectGblSafetyFlags, safetyNextStep } from "@/lib/gbl/safety";
import type { GblSafetyFlags } from "@/lib/gbl/types";
import {
  analyzeIntake,
  type IntakeMode,
  type Recommendation,
  type UrgencyLevel,
} from "@/lib/navigation-engine";

export type HealthInputLanguage = "zh-Hant" | "en";

export type HealthInputAnalysisMode = "auto" | IntakeMode;

export type HealthInputDomain =
  | "emergency"
  | "self_harm"
  | "symptom"
  | "insurance"
  | "policy"
  | "fitness"
  | "nutrition"
  | "general";

export type HealthInputSafetyLevel =
  | "emergency"
  | "crisis"
  | "caution"
  | "normal";

export type HealthInputSafety = {
  safetyLocked: boolean;
  level: HealthInputSafetyLevel;
  action: string;
  reasons: string[];
  disallowedUses: string[];
};

export type HealthInputAnalysisCore = {
  requestId: string;
  language: HealthInputLanguage;
  requestedMode: HealthInputAnalysisMode;
  intakeMode: IntakeMode;
  detectedDomain: HealthInputDomain;
  navigation: Recommendation;
  emotion: EmotionAnalysisResult;
  gblSafetyFlags: GblSafetyFlags;
  safety: HealthInputSafety;
  audit: string[];
};

export type HealthInputAssistant = {
  message: string;
  ai: GuideRuntimeInfo;
};

export type HealthInputAnalysisResponse = {
  requestId: string;
  language: HealthInputLanguage;
  requestedMode: HealthInputAnalysisMode;
  intakeMode: IntakeMode;
  detectedDomain: HealthInputDomain;
  summary: {
    classification: string;
    urgencyLevel: UrgencyLevel;
    urgencyLabel: string;
    urgencyTone: Recommendation["urgency"]["tone"];
    userVisibleSummary: string;
    nextAction: string;
    careRoute: string;
  };
  safety: HealthInputSafety;
  assistant: HealthInputAssistant;
  navigation: Recommendation;
  emotion: EmotionAnalysisResult;
  gbl: {
    safetyFlags: GblSafetyFlags;
    nextStep: string;
  };
  followUpQuestions: string[];
  decisionChecklist: string[];
  memoryProposal: Recommendation["memoryProposal"];
  disclaimers: string[];
  audit: string[];
};

const intakeModeSchema = z.enum(["medical", "insurance", "policy"]);

export const healthInputAnalysisInputSchema = z.object({
  input: z.string().trim().min(1).max(3000),
  language: z.enum(["zh-Hant", "en"]).optional(),
  mode: z.union([z.literal("auto"), intakeModeSchema]).optional().default("auto"),
});

export type HealthInputAnalysisInput = z.infer<typeof healthInputAnalysisInputSchema>;

const policyPattern =
  /(保單|索償|拒賠|不保|等候期|自付額|共同保險|保障表|policy|claim|exclusion|waiting period|deductible|co-?insurance|coverage table)/iu;
const insurancePattern =
  /(保險|投保|醫療保|自願醫保|危疾|人壽|門診|住院保障|保費|核保|insurance|vhis|critical illness|life insurance|premium|underwriting|health cover)/iu;
const nutritionPattern =
  /(飲食|營養|餐單|蛋白|卡路里|糖|減脂|增肌|nutrition|meal|diet|protein|calorie|sugar|macros?)/iu;
const fitnessPattern =
  /(跑步|健身|運動|訓練|肌肉|拉傷|workout|training|running|gym|exercise|fitness|sprain)/iu;

export function analyzeHealthInputCore(
  input: HealthInputAnalysisInput,
  requestId = crypto.randomUUID(),
): HealthInputAnalysisCore {
  const language = input.language ?? detectInputLanguage(input.input);
  const requestedMode = input.mode;
  const intakeMode = requestedMode === "auto"
    ? inferIntakeMode(input.input)
    : requestedMode;
  const navigation = analyzeIntake(intakeMode, input.input);
  const emotion = classifyEmotion({
    text: input.input,
    language,
    save: false,
  }, requestId);
  const gblSafetyFlags = detectGblSafetyFlags(input.input);
  const detectedDomain = detectHealthInputDomain({
    input: input.input,
    intakeMode,
    navigation,
    emotion,
    gblSafetyFlags,
  });
  const safety = buildHealthInputSafety({
    language,
    navigation,
    emotion,
    gblSafetyFlags,
  });

  return {
    requestId,
    language,
    requestedMode,
    intakeMode,
    detectedDomain,
    navigation,
    emotion,
    gblSafetyFlags,
    safety,
    audit: [
      `Detected domain: ${detectedDomain}.`,
      `Selected intake mode: ${intakeMode}.`,
      `Safety locked: ${safety.safetyLocked ? "yes" : "no"}.`,
      "Emotion Engine used for tone and distress context only.",
      "No raw user input was logged or persisted by the input analysis system.",
    ],
  };
}

export function buildHealthInputAnalysisResponse(
  core: HealthInputAnalysisCore,
  assistant: HealthInputAssistant,
): HealthInputAnalysisResponse {
  const nextAction = core.safety.safetyLocked
    ? core.safety.action
    : core.navigation.nextAction;
  const memoryProposal = core.safety.safetyLocked
    ? {
        canOffer: false,
        candidates: [],
        blockedReason: "安全鎖定情況不應保存或延長流程，先處理即時安全。",
      }
    : core.navigation.memoryProposal;
  const urgency = core.safety.safetyLocked
    ? {
        level: 1 as const,
        label: "Level 1 緊急",
        tone: "danger" as const,
        summary: core.safety.action,
      }
    : core.navigation.urgency;
  const careRoute = core.safety.safetyLocked
    ? safetyLockedCareRoute(core.language, core.safety.level)
    : core.navigation.careRoute;
  const navigation: Recommendation = {
    ...core.navigation,
    urgency,
    nextAction,
    careRoute,
    questions: core.safety.safetyLocked ? [] : core.navigation.questions,
    memoryProposal,
    assistantMessage: assistant.message,
    ai: assistant.ai,
    audit: [
      ...core.navigation.audit,
      ...core.audit,
      `AI guide status: ${assistant.ai.status}.`,
    ],
  };

  return {
    requestId: core.requestId,
    language: core.language,
    requestedMode: core.requestedMode,
    intakeMode: core.intakeMode,
    detectedDomain: core.detectedDomain,
    summary: {
      classification: core.navigation.classification,
      urgencyLevel: urgency.level,
      urgencyLabel: urgency.label,
      urgencyTone: urgency.tone,
      userVisibleSummary: core.safety.safetyLocked
        ? core.safety.action
        : urgency.summary,
      nextAction,
      careRoute,
    },
    safety: core.safety,
    assistant,
    navigation,
    emotion: core.emotion,
    gbl: {
      safetyFlags: core.gblSafetyFlags,
      nextStep: safetyNextStep(core.gblSafetyFlags),
    },
    followUpQuestions: core.safety.safetyLocked
      ? []
      : core.navigation.questions.slice(0, 3),
    decisionChecklist: core.safety.safetyLocked
      ? [core.safety.action]
      : core.navigation.decisionChecklist,
    memoryProposal,
    disclaimers: unique([
      core.navigation.disclaimer,
      core.emotion.disclaimer,
      "Emotion signals must not affect insurance eligibility, pricing, coverage, care access, or claim outcomes.",
    ]),
    audit: [
      ...core.audit,
      ...core.navigation.audit,
    ],
  };
}

function safetyLockedCareRoute(
  language: HealthInputLanguage,
  level: HealthInputSafetyLevel,
) {
  if (level === "crisis") {
    return language === "zh-Hant"
      ? "即時安全支援：致電 999、前往急症室，或請可信任的人陪伴你。不要等待 AI 或保險確認。"
      : "Immediate safety support: call 999, go to A&E, or ask a trusted person to stay with you. Do not wait for AI or insurance confirmation.";
  }

  return language === "zh-Hant"
    ? "香港急症室 / A&E 優先；如情況危急，立即致電 999。不要等待 AI 或保險確認。"
    : "A&E first; call 999 if there is immediate danger. Do not wait for AI or insurance confirmation.";
}

export function createSafetyLockedAssistant(
  core: HealthInputAnalysisCore,
): HealthInputAssistant {
  const config = getGuideRuntimeConfig();

  return {
    message: core.safety.action,
    ai: {
      provider: config.provider,
      model: config.model,
      status: "safety_locked",
    },
  };
}

export function createFallbackAssistant(core: HealthInputAnalysisCore): HealthInputAssistant {
  const config = getGuideRuntimeConfig();

  return {
    message: core.safety.safetyLocked
      ? core.safety.action
      : createGuideFallbackMessage(core.navigation),
    ai: {
      provider: config.provider,
      model: config.model,
      status: core.safety.safetyLocked ? "safety_locked" : "unconfigured",
    },
  };
}

export function detectInputLanguage(input: string): HealthInputLanguage {
  return /[\u3400-\u9fff]/u.test(input) ? "zh-Hant" : "en";
}

export function inferIntakeMode(input: string): IntakeMode {
  if (policyPattern.test(input)) {
    return "policy";
  }

  if (insurancePattern.test(input)) {
    return "insurance";
  }

  return "medical";
}

function detectHealthInputDomain({
  input,
  intakeMode,
  navigation,
  emotion,
  gblSafetyFlags,
}: {
  input: string;
  intakeMode: IntakeMode;
  navigation: Recommendation;
  emotion: EmotionAnalysisResult;
  gblSafetyFlags: GblSafetyFlags;
}): HealthInputDomain {
  if (emotion.safety_flags.selfHarm || gblSafetyFlags.selfHarm) {
    return "self_harm";
  }

  if (
    navigation.urgency.level === 1 ||
    emotion.safety_flags.emergency ||
    gblSafetyFlags.emergency
  ) {
    return "emergency";
  }

  if (intakeMode === "policy") {
    return "policy";
  }

  if (intakeMode === "insurance") {
    return "insurance";
  }

  if (nutritionPattern.test(input)) {
    return "nutrition";
  }

  if (fitnessPattern.test(input)) {
    return "fitness";
  }

  if (
    navigation.requestType === "symptom_navigation" ||
    navigation.requestType === "same_day_medical"
  ) {
    return "symptom";
  }

  return "general";
}

function buildHealthInputSafety({
  language,
  navigation,
  emotion,
  gblSafetyFlags,
}: {
  language: HealthInputLanguage;
  navigation: Recommendation;
  emotion: EmotionAnalysisResult;
  gblSafetyFlags: GblSafetyFlags;
}): HealthInputSafety {
  const selfHarm = emotion.safety_flags.selfHarm || gblSafetyFlags.selfHarm;
  const emergency =
    navigation.urgency.level === 1 ||
    emotion.safety_flags.emergency ||
    gblSafetyFlags.emergency;
  const caution =
    gblSafetyFlags.possibleDiagnosisRequest ||
    gblSafetyFlags.possibleTreatmentRequest ||
    gblSafetyFlags.insuranceGuaranteeRequest ||
    gblSafetyFlags.legalOrComplianceRequest ||
    emotion.safety_flags.abuseOrViolence ||
    emotion.safety_flags.highDistress ||
    emotion.safety_flags.sensitiveInsuranceDecision;
  const reasons = buildSafetyReasons({
    selfHarm,
    emergency,
    caution,
    emotion,
    gblSafetyFlags,
  });

  if (selfHarm) {
    return {
      safetyLocked: true,
      level: "crisis",
      action: selfHarmAction(language),
      reasons,
      disallowedUses: disallowedUses(emotion),
    };
  }

  if (emergency) {
    return {
      safetyLocked: true,
      level: "emergency",
      action: emergencyAction(language),
      reasons,
      disallowedUses: disallowedUses(emotion),
    };
  }

  return {
    safetyLocked: false,
    level: caution ? "caution" : "normal",
    action: caution
      ? cautionAction(language, gblSafetyFlags)
      : normalAction(language),
    reasons,
    disallowedUses: disallowedUses(emotion),
  };
}

function buildSafetyReasons({
  selfHarm,
  emergency,
  caution,
  emotion,
  gblSafetyFlags,
}: {
  selfHarm: boolean;
  emergency: boolean;
  caution: boolean;
  emotion: EmotionAnalysisResult;
  gblSafetyFlags: GblSafetyFlags;
}) {
  const reasons: string[] = [];

  if (selfHarm) {
    reasons.push("possible_self_harm_or_crisis_language");
  }

  if (emergency) {
    reasons.push("possible_emergency_language");
  }

  if (gblSafetyFlags.possibleDiagnosisRequest) {
    reasons.push("diagnosis_request_boundary");
  }

  if (gblSafetyFlags.possibleTreatmentRequest) {
    reasons.push("treatment_or_prescription_boundary");
  }

  if (gblSafetyFlags.insuranceGuaranteeRequest) {
    reasons.push("insurance_guarantee_boundary");
  }

  if (gblSafetyFlags.legalOrComplianceRequest) {
    reasons.push("legal_or_compliance_boundary");
  }

  if (emotion.safety_flags.sensitiveInsuranceDecision) {
    reasons.push("emotion_must_not_affect_insurance_decisioning");
  }

  if (reasons.length === 0 && caution) {
    reasons.push("use_professional_review_for_uncertain_details");
  }

  return reasons.length > 0 ? reasons : ["no_immediate_safety_boundary_detected"];
}

function disallowedUses(emotion: EmotionAnalysisResult) {
  return unique([
    "diagnosis",
    "prescription",
    "medical_guarantee",
    "insurance_eligibility_or_pricing",
    "coverage_or_claim_decision",
    "care_access_decision",
    ...(emotion.safety_flags.sensitiveInsuranceDecision
      ? ["emotion_based_insurance_decisioning"]
      : []),
  ]);
}

function emergencyAction(language: HealthInputLanguage) {
  if (language === "zh-Hant") {
    return "這可能是緊急情況。請立即致電 999 或前往急症室。不要等待 AI 或保險確認。 / This may be urgent. Please call 999 or go to A&E now. Do not wait for AI or insurance confirmation.";
  }

  return "This may be urgent. Please call 999 or go to A&E now. Do not wait for AI or insurance confirmation.";
}

function selfHarmAction(language: HealthInputLanguage) {
  if (language === "zh-Hant") {
    return "如果你可能會傷害自己或他人，請立即致電 999、前往急症室，或聯絡身邊可信任的人陪伴你。不要等待 AI 或保險確認。";
  }

  return "If you may hurt yourself or someone else, call emergency services now, go to A&E, or contact a trusted person to stay with you. Do not wait for AI or insurance confirmation.";
}

function cautionAction(
  language: HealthInputLanguage,
  flags: GblSafetyFlags,
) {
  if (flags.possibleDiagnosisRequest || flags.possibleTreatmentRequest) {
    return language === "zh-Hant"
      ? "我可以協助整理照護方向和需要問醫生的問題，但不能診斷、處方或保證治療結果。"
      : "I can help organize care-navigation next steps and clinician questions, but cannot diagnose, prescribe, or guarantee treatment outcomes.";
  }

  if (flags.insuranceGuaranteeRequest || flags.legalOrComplianceRequest) {
    return language === "zh-Hant"
      ? "我可以協助整理保險或文件問題，但不能保證承保、索償、合規或法律結果。"
      : "I can help organize insurance or document questions, but cannot guarantee underwriting, claims, compliance, or legal outcomes.";
  }

  return language === "zh-Hant"
    ? "我會保持語氣簡短清晰；如有不安全或高壓情況，請先找可信任的人或專業人士支援。"
    : "I will keep the response brief and clear; if the situation feels unsafe or high-pressure, involve a trusted person or professional support first.";
}

function normalAction(language: HealthInputLanguage) {
  return language === "zh-Hant"
    ? "可以繼續整理背景，系統會先檢查緊急警號，再建議安全下一步。"
    : "You can continue organizing context; the system checks urgent warning signs first, then suggests a safe next step.";
}

function unique<T>(items: T[]) {
  return Array.from(new Set(items));
}
