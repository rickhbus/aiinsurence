import type { EmotionSafetyFlags } from "./types";

const emergencyPattern =
  /(胸痛|嚴重呼吸困難|中風|昏迷|大量出血|嚴重過敏|急症|call 999|999|a&e|emergency|stroke|chest pain|can't breathe|cannot breathe|severe bleeding)/iu;
const selfHarmPattern =
  /(自殺|想死|不想活|傷害自己|結束生命|suicide|kill myself|end my life|self-harm|hurt myself|do not want to live)/iu;
const abusePattern =
  /(家暴|被打|被威脅|暴力|虐待|abuse|violence|assault|unsafe at home|threatened)/iu;
const highDistressPattern =
  /(崩潰|恐慌|驚恐|很害怕|頂唔順|受不了|overwhelmed|panic|terrified|desperate|breaking down|can't cope|cannot cope)/iu;
const sensitiveInsurancePattern =
  /(保費|拒保|加價|核保|索償|eligibility|premium|pricing|underwriting|deny coverage|coverage decision|claim|claim denial)/iu;

export function detectEmotionSafetyFlags(text: string): EmotionSafetyFlags {
  return {
    emergency: emergencyPattern.test(text),
    selfHarm: selfHarmPattern.test(text),
    abuseOrViolence: abusePattern.test(text),
    highDistress: highDistressPattern.test(text),
    sensitiveInsuranceDecision: sensitiveInsurancePattern.test(text),
  };
}

export function emotionSafetyIndicators(flags: EmotionSafetyFlags) {
  const indicators: string[] = [];

  if (flags.emergency) {
    indicators.push("possible_emergency_language");
  }

  if (flags.selfHarm) {
    indicators.push("possible_self_harm_or_crisis_language");
  }

  if (flags.abuseOrViolence) {
    indicators.push("possible_abuse_or_violence_language");
  }

  if (flags.highDistress) {
    indicators.push("high_distress_language");
  }

  if (flags.sensitiveInsuranceDecision) {
    indicators.push("emotion_must_not_affect_insurance_decisioning");
  }

  return indicators;
}
