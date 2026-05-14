import { analyzeIntake } from "@/lib/navigation-engine";
import { classifyEmotion } from "@/lib/emotion-engine/classifier";
import { detectGblSafetyFlags } from "./safety";
import { buildDeterministicGblOutput } from "./deterministic-output";
import { generateProviderGblSummary } from "./provider";
import {
  GBL_DISCLAIMERS,
  type GblAnalysisRequest,
  type GblAnalysisResult,
  type GblAuditEvent,
  type GblCaseContext,
} from "./types";

export async function runGblAnalysis(
  request: GblAnalysisRequest,
  requestId = crypto.randomUUID(),
): Promise<GblAnalysisResult> {
  const context = buildCaseContext(request);
  const combinedText = [
    request.primaryConcern,
    request.healthcareContext,
    request.insuranceContext,
    request.emotionText,
  ]
    .filter(Boolean)
    .join("\n\n");
  const safetyFlags = detectGblSafetyFlags(combinedText);
  const deterministic = buildDeterministicGblOutput({ context, flags: safetyFlags });
  const provider = safetyFlags.emergency || safetyFlags.selfHarm
    ? { status: "unconfigured" as const, summary: null }
    : await generateProviderGblSummary({ context, flags: safetyFlags });
  const status = safetyFlags.emergency || safetyFlags.selfHarm
    ? "safety_locked"
    : provider.status === "generated"
      ? "generated"
      : "fallback";

  return {
    requestId,
    analysisType: request.analysisType,
    status,
    caseContext: context,
    aiReadySummary: deterministic.aiReadySummary,
    userVisibleSummary: provider.summary ?? deterministic.userVisibleSummary,
    workflowPlan: deterministic.workflowPlan,
    recommendations: deterministic.recommendations,
    safetyFlags,
    emotion: context.emotion.analysis,
    disclaimers: GBL_DISCLAIMERS,
    audit: buildAudit(requestId, status, provider.status),
    createdAt: new Date().toISOString(),
  };
}

export function buildCaseContext(request: GblAnalysisRequest): GblCaseContext {
  const emotionText = request.emotionText || request.primaryConcern;
  const emotion = emotionText
    ? classifyEmotion({
        text: emotionText,
        language: request.language,
        save: false,
      })
    : null;
  const navigationMode = request.analysisType === "insurance_analysis"
    ? "insurance"
    : request.analysisType === "healthcare_navigation"
      ? "medical"
      : null;
  const navigation = navigationMode
    ? analyzeIntake(navigationMode, request.primaryConcern)
    : null;

  return {
    title: request.title,
    analysisType: request.analysisType,
    user: {
      userType: request.userType,
      locale: request.language,
      region: "Hong Kong",
    },
    healthcare: {
      concern: request.healthcareContext || request.primaryConcern,
      duration: null,
      severity: null,
      carePreference: null,
    },
    insurance: {
      insuranceType: request.analysisType === "insurance_analysis" ? "health" : null,
      policyText: request.insuranceContext ?? null,
      claimContext: navigation?.requestType === "policy_explanation" ? request.primaryConcern : null,
      coverageQuestion: request.analysisType === "insurance_analysis"
        ? request.primaryConcern
        : request.insuranceContext ?? null,
    },
    emotion: {
      text: emotionText,
      analysis: emotion,
    },
    previousSummary: request.previousSummary ?? null,
  };
}

function buildAudit(
  requestId: string,
  status: GblAnalysisResult["status"],
  providerStatus: "generated" | "unconfigured" | "failed",
): GblAuditEvent[] {
  const createdAt = new Date().toISOString();

  return [
    {
      requestId,
      event: "validated_input",
      status: "ok",
      createdAt,
    },
    {
      requestId,
      event: "classified_safety",
      status: status === "safety_locked" ? "blocked" : "ok",
      createdAt,
    },
    {
      requestId,
      event: "provider_enrichment",
      status: providerStatus === "generated" ? "ok" : "fallback",
      createdAt,
    },
  ];
}
