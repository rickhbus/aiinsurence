import type { Recommendation } from "@/lib/navigation-engine";

export function isRecommendationPayload(value: unknown): value is Recommendation {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<Recommendation>;

  return (
    typeof candidate.mode === "string" &&
    typeof candidate.requestType === "string" &&
    typeof candidate.classification === "string" &&
    typeof candidate.nextAction === "string" &&
    typeof candidate.careRoute === "string" &&
    typeof candidate.escalation === "string" &&
    typeof candidate.disclaimer === "string" &&
    Boolean(candidate.urgency) &&
    typeof candidate.urgency?.level === "number" &&
    Array.isArray(candidate.possibleDepartments) &&
    Array.isArray(candidate.insuranceCategories) &&
    Array.isArray(candidate.questions) &&
    Array.isArray(candidate.decisionChecklist) &&
    Array.isArray(candidate.audit)
  );
}

export function recommendationIsEmergency(recommendation: Recommendation) {
  return recommendation.urgency.level === 1;
}
