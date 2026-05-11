import {
  getAuthenticatedSupabase,
  readJsonBody,
} from "@/lib/server/persistence-auth";
import {
  isRecommendationPayload,
  recommendationIsEmergency,
} from "@/lib/server/recommendation-payload";
import {
  getSafetyLevel,
  mapRecommendationMode,
  saveAuditLog,
  saveConsentEvent,
  saveConversationMessage,
  saveConversationSession,
  saveDepartmentRecommendation,
  saveInsuranceProfileSnapshot,
  saveInsuranceRecommendationDetail,
  saveTriageAssessment,
} from "@/lib/user-memory";

type SaveSessionRequest = {
  input?: unknown;
  language?: unknown;
  recommendation?: unknown;
  consentGranted?: unknown;
};

export async function POST(request: Request) {
  const body = await readJsonBody<SaveSessionRequest>(request);

  if (!body) {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (body.consentGranted !== true) {
    return Response.json(
      { error: "Explicit save consent is required." },
      { status: 400 },
    );
  }

  const input = typeof body.input === "string" ? body.input.trim() : "";

  if (!input || !isRecommendationPayload(body.recommendation)) {
    return Response.json(
      { error: "Input and recommendation are required." },
      { status: 400 },
    );
  }

  const recommendation = body.recommendation;

  if (recommendationIsEmergency(recommendation)) {
    return Response.json(
      { error: "Emergency guidance is not saved from this flow." },
      { status: 400 },
    );
  }

  const auth = await getAuthenticatedSupabase(request);

  if (!auth.ok) {
    return auth.response;
  }

  try {
    const language = typeof body.language === "string" ? body.language : "zh-Hant";
    const session = await saveConversationSession(
      auth.user.id,
      mapRecommendationMode(recommendation.mode),
      createSessionTitle(input),
      language,
      auth.supabase,
    );
    const safetyLevel = getSafetyLevel(recommendation);

    await Promise.all([
      saveConsentEvent(auth.user.id, "save_memory", true, auth.supabase),
      saveConversationMessage(
        session.id,
        auth.user.id,
        "user",
        input,
        safetyLevel,
        auth.supabase,
      ),
      saveConversationMessage(
        session.id,
        auth.user.id,
        "assistant",
        recommendation.assistantMessage || recommendation.nextAction,
        safetyLevel,
        auth.supabase,
      ),
      saveTriageAssessment(
        auth.user.id,
        session.id,
        input,
        recommendation,
        auth.supabase,
      ),
      saveAuditLog(
        auth.user.id,
        "conversation_saved",
        {
          requestType: recommendation.requestType,
          urgency: recommendation.urgency.label,
          safetyLevel,
        },
        auth.supabase,
      ),
    ]);

    if (recommendation.mode === "medical") {
      await saveDepartmentRecommendation(
        auth.user.id,
        session.id,
        recommendation,
        auth.supabase,
      );
    }

    if (recommendation.mode === "insurance" || recommendation.mode === "policy") {
      await Promise.all([
        saveInsuranceProfileSnapshot(
          auth.user.id,
          session.id,
          recommendation,
          auth.supabase,
        ),
        saveInsuranceRecommendationDetail(
          auth.user.id,
          session.id,
          recommendation,
          auth.supabase,
        ),
      ]);
    }

    return Response.json({ sessionId: session.id });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Could not save session." },
      { status: 500 },
    );
  }
}

function createSessionTitle(input: string) {
  return input.length > 42 ? `${input.slice(0, 42)}...` : input;
}
