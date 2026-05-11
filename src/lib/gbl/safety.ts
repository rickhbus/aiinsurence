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

export function safetyNextStep(flags: GblSafetyFlags) {
  if (flags.selfHarm) {
    return "If there is any immediate risk of self-harm or harm to others, contact emergency services now or ask a trusted person to stay with you.";
  }

  if (flags.emergency) {
    return "Please call 999 or go to A&E now. Do not wait for AI or insurance confirmation.";
  }

  if (flags.possibleDiagnosisRequest || flags.possibleTreatmentRequest) {
    return "Use this as care-navigation support only, then confirm symptoms, diagnosis, and treatment with a clinician.";
  }

  if (flags.insuranceGuaranteeRequest || flags.legalOrComplianceRequest) {
    return "Use this as an organization aid only, then verify with the insurer, benefits administrator, licensed adviser, legal counsel, or compliance owner.";
  }

  return "Continue organizing the case context and verify uncertain details with the right professional.";
}
