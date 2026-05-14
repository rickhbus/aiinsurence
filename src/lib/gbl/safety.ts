import type { GblSafetyFlags } from "./types";

const emergencyPattern =
  /(胸痛|嚴重呼吸困難|中風|昏迷|大量出血|嚴重過敏|急症|call 999|999|a&e|emergency|stroke|chest pain|can't breathe|cannot breathe|severe bleeding)/iu;
const selfHarmPattern =
  /(自殺|想死|不想活|傷害自己|結束生命|suicide|kill myself|end my life|self-harm|hurt myself|do not want to live)/iu;
const diagnosisPattern =
  /(診斷|係咪.*病|diagnose|diagnosis|do i have|what disease)/iu;
const treatmentPattern =
  /(開藥|處方|食咩藥|dosage|prescribe|prescription|what medicine|treat me)/iu;
const guaranteePattern =
  /(保證|一定賠|一定批|guarantee|will be approved|must cover|definitely covered|claim approved)/iu;
const legalPattern =
  /(法律意見|合規|法規|起訴|sue|legal advice|compliance|liable|liability)/iu;

export function detectGblSafetyFlags(text: string): GblSafetyFlags {
  return {
    emergency: emergencyPattern.test(text),
    selfHarm: selfHarmPattern.test(text),
    possibleDiagnosisRequest: diagnosisPattern.test(text),
    possibleTreatmentRequest: treatmentPattern.test(text),
    insuranceGuaranteeRequest: guaranteePattern.test(text),
    legalOrComplianceRequest: legalPattern.test(text),
  };
}

export function safetyNextStep(flags: GblSafetyFlags, locale: "zh-Hant" | "en" = "en") {
  if (flags.selfHarm) {
    if (locale === "zh-Hant") {
      return "如有即時自傷或傷害他人的風險，請立即聯絡緊急服務，或請可信任的人留在你身邊。";
    }

    return "If there is any immediate risk of self-harm or harm to others, contact emergency services now or ask a trusted person to stay with you.";
  }

  if (flags.emergency) {
    if (locale === "zh-Hant") {
      return "請立即致電 999 或前往急症室。不要等待 AI 或保險確認。";
    }

    return "Please call 999 or go to A&E now. Do not wait for AI or insurance confirmation.";
  }

  if (flags.possibleDiagnosisRequest || flags.possibleTreatmentRequest) {
    if (locale === "zh-Hant") {
      return "只把這次分析用作照護導航和整理資料；症狀、診斷和治療必須由臨床專業人士確認。";
    }

    return "Use this as care-navigation support only, then confirm symptoms, diagnosis, and treatment with a clinician.";
  }

  if (flags.insuranceGuaranteeRequest || flags.legalOrComplianceRequest) {
    if (locale === "zh-Hant") {
      return "只把這次分析用作資料整理；請向保險公司、僱主福利管理員、持牌顧問、法律或合規專業人士核實。";
    }

    return "Use this as an organization aid only, then verify with the insurer, benefits administrator, licensed adviser, legal counsel, or compliance owner.";
  }

  if (locale === "zh-Hant") {
    return "繼續整理個案背景，並把不確定的資料交由合適專業人士核實。";
  }

  return "Continue organizing the case context and verify uncertain details with the right professional.";
}
