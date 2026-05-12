import { safetyNextStep } from "./safety";
import type { GblCaseContext, GblRecommendation, GblSafetyFlags } from "./types";

export function buildDeterministicGblOutput({
  context,
  flags,
}: {
  context: GblCaseContext;
  flags: GblSafetyFlags;
}) {
  const summaryParts = [
    `Case: ${context.title}`,
    `Type: ${context.analysisType}`,
    context.healthcare.concern ? `Healthcare concern: ${context.healthcare.concern}` : null,
    context.insurance.coverageQuestion ? `Insurance context: ${context.insurance.coverageQuestion}` : null,
    context.emotion.analysis
      ? `Emotion signal: ${context.emotion.analysis.primary_emotion}, urgency ${context.emotion.analysis.urgency_level}`
      : null,
  ].filter(Boolean);

  return {
    aiReadySummary: summaryParts.join("\n"),
    userVisibleSummary: buildUserSummary(context, flags),
    recommendations: buildRecommendations(context, flags),
  };
}

function buildUserSummary(context: GblCaseContext, flags: GblSafetyFlags) {
  if (flags.selfHarm || flags.emergency) {
    return safetyNextStep(flags);
  }

  if (context.analysisType === "insurance_analysis") {
    return "AI.GBL organized your insurance and healthcare context into a reviewable case. It highlights likely questions, missing documents, and uncertainty without deciding eligibility or claim outcomes.";
  }

  if (context.analysisType === "emotion_context") {
    return "AI.GBL prepared the emotional context as an empathy and tone signal only. It is not a clinical assessment and must not change insurance reasoning.";
  }

  if (context.analysisType === "healthcare_navigation") {
    return "AI.GBL organized the care-navigation context and safety signals so the assistant can suggest a cautious next step without diagnosing.";
  }

  return "AI.GBL normalized the case into healthcare, insurance, emotion, and safety context for downstream assistants.";
}

function buildRecommendations(
  context: GblCaseContext,
  flags: GblSafetyFlags,
): GblRecommendation[] {
  const first: GblRecommendation = {
    label: flags.emergency || flags.selfHarm ? "Safety first" : "Verify the core facts",
    rationale: flags.emergency || flags.selfHarm
      ? "Potential urgent or crisis language must override normal workflows."
      : "Healthcare and insurance outcomes depend on exact facts, documents, and professional review.",
    nextStep: safetyNextStep(flags),
    humanReview: flags.emergency || flags.selfHarm || flags.possibleDiagnosisRequest || flags.insuranceGuaranteeRequest,
  };
  const second: GblRecommendation = {
    label: "Prepare documents and questions",
    rationale: "Structured inputs reduce back-and-forth and avoid unsupported conclusions.",
    nextStep:
      context.analysisType === "insurance_analysis"
        ? "Gather plan wording, claim forms, receipts, insurer messages, referral letters, and a concise timeline."
        : "Capture symptom timeline, care preference, key questions, and any clinician instructions already received.",
    humanReview: true,
  };
  const third: GblRecommendation = {
    label: "Use emotion only for tone",
    rationale: "Emotion signals can improve clarity and empathy, but must not drive eligibility, pricing, coverage, or access decisions.",
    nextStep: "Keep the next assistant response gentle, concrete, and optional for the user.",
    humanReview: false,
  };

  return [first, second, third];
}
