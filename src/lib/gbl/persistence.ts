import type { HealthDataClient } from "@/lib/health-data/common";
import type { EmotionAnalysisResult } from "@/lib/emotion-engine/types";
import type { GblAnalysisResult } from "./types";

export async function saveGblAnalysis({
  supabase,
  userId,
  result,
}: {
  supabase: HealthDataClient;
  userId: string;
  result: GblAnalysisResult;
}) {
  const { data: gblCase, error: caseError } = await supabase
    .from("gbl_cases")
    .insert({
      user_id: userId,
      title: result.caseContext.title,
      status: result.status,
      case_type: result.analysisType,
      summary: result.userVisibleSummary.slice(0, 1200),
      structured_context: safeJson(result.caseContext),
      safety_flags: safeJson(result.safetyFlags),
    })
    .select("id")
    .single();

  if (caseError) {
    throw new Error(`Could not save AI.GBL case: ${caseError.message}`);
  }

  const caseId = String(gblCase.id);
  const { data: analysis, error: analysisError } = await supabase
    .from("gbl_analysis_results")
    .insert({
      user_id: userId,
      case_id: caseId,
      request_id: result.requestId,
      analysis_type: result.analysisType,
      status: result.status,
      input_summary: result.caseContext.healthcare.concern?.slice(0, 500) ?? null,
      ai_ready_summary: result.aiReadySummary.slice(0, 2000),
      user_visible_summary: result.userVisibleSummary.slice(0, 2000),
      recommendations: safeJson(result.recommendations),
      disclaimers: safeJson(result.disclaimers),
      safety_flags: safeJson(result.safetyFlags),
      audit: safeJson(result.audit),
    })
    .select("id")
    .single();

  if (analysisError) {
    throw new Error(`Could not save AI.GBL analysis: ${analysisError.message}`);
  }

  if (result.analysisType === "insurance_analysis") {
    await supabase.from("insurance_analyses").insert({
      user_id: userId,
      case_id: caseId,
      analysis_type: result.analysisType,
      status: result.status,
      input_summary: result.caseContext.insurance.coverageQuestion?.slice(0, 500) ?? null,
      result_summary: result.userVisibleSummary.slice(0, 2000),
      recommendations: safeJson(result.recommendations),
      disclaimers: safeJson(result.disclaimers),
      safety_flags: safeJson(result.safetyFlags),
    });
  }

  return {
    caseId,
    analysisId: String(analysis.id),
  };
}

export async function saveEmotionAnalysis({
  supabase,
  userId,
  caseId,
  result,
}: {
  supabase: HealthDataClient;
  userId: string;
  caseId?: string | null;
  result: EmotionAnalysisResult;
}) {
  const { data, error } = await supabase
    .from("emotion_engine_results")
    .insert({
      user_id: userId,
      case_id: caseId ?? null,
      request_id: result.requestId,
      primary_emotion: result.primary_emotion,
      secondary_emotions: result.secondary_emotions,
      confidence: result.confidence,
      urgency_level: result.urgency_level,
      distress_indicators: result.distress_indicators,
      recommended_tone: result.recommended_tone,
      suggested_next_step: result.suggested_next_step,
      safety_flags: safeJson(result.safety_flags),
      user_visible_summary: result.user_visible_summary,
      internal_notes: result.internal_notes,
      disclaimer: result.disclaimer,
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(`Could not save Emotion Engine result: ${error.message}`);
  }

  return String(data.id);
}

function safeJson(value: unknown) {
  return JSON.parse(JSON.stringify(value)) as unknown;
}
