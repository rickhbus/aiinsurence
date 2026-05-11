import type { EmotionAnalysisResult } from "@/lib/emotion-engine/types";

export type GblAnalysisType =
  | "healthcare_navigation"
  | "insurance_analysis"
  | "emotion_context"
  | "general_case";

export type GblUserType =
  | "patient_member"
  | "provider_admin"
  | "broker_advisor"
  | "employer_hr"
  | "internal_admin"
  | "unknown";

export type GblUserContext = {
  userType: GblUserType;
  locale: "zh-Hant" | "en";
  region: string;
};

export type GblInsuranceContext = {
  insuranceType?: string | null;
  policyText?: string | null;
  claimContext?: string | null;
  coverageQuestion?: string | null;
};

export type GblHealthcareContext = {
  concern?: string | null;
  duration?: string | null;
  severity?: "mild" | "moderate" | "severe" | "unknown" | null;
  carePreference?: "public" | "private" | "either" | "not_sure" | null;
};

export type GblEmotionContext = {
  text?: string | null;
  analysis?: EmotionAnalysisResult | null;
};

export type GblCaseContext = {
  title: string;
  analysisType: GblAnalysisType;
  user: GblUserContext;
  healthcare: GblHealthcareContext;
  insurance: GblInsuranceContext;
  emotion: GblEmotionContext;
  previousSummary?: string | null;
};

export type GblAnalysisRequest = {
  title: string;
  analysisType: GblAnalysisType;
  userType: GblUserType;
  language: "zh-Hant" | "en";
  primaryConcern: string;
  healthcareContext?: string | null;
  insuranceContext?: string | null;
  emotionText?: string | null;
  previousSummary?: string | null;
  save?: boolean;
};

export type GblSafetyFlags = {
  emergency: boolean;
  selfHarm: boolean;
  possibleDiagnosisRequest: boolean;
  possibleTreatmentRequest: boolean;
  insuranceGuaranteeRequest: boolean;
  legalOrComplianceRequest: boolean;
};

export type GblRecommendation = {
  label: string;
  rationale: string;
  nextStep: string;
  humanReview: boolean;
};

export type GblAuditEvent = {
  requestId: string;
  event: string;
  status: "ok" | "warning" | "blocked" | "fallback";
  createdAt: string;
};

export type GblAnalysisResult = {
  id?: string;
  caseId?: string;
  requestId: string;
  analysisType: GblAnalysisType;
  status: "generated" | "fallback" | "safety_locked";
  caseContext: GblCaseContext;
  aiReadySummary: string;
  userVisibleSummary: string;
  recommendations: GblRecommendation[];
  safetyFlags: GblSafetyFlags;
  emotion?: EmotionAnalysisResult | null;
  disclaimers: string[];
  audit: GblAuditEvent[];
  createdAt: string;
  persisted?: boolean;
};

export const GBL_DISCLAIMERS = [
  "This is not medical advice and does not diagnose, prescribe, or replace a clinician.",
  "This is not legal or insurance advice and does not guarantee eligibility, coverage, reimbursement, claim approval, or pricing.",
  "Verify details with your insurer, employer benefits administrator, provider, or qualified professional.",
];
