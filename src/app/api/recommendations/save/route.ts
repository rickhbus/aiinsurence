import {
  getAuthenticatedSupabase,
  readJsonBody,
} from "@/lib/server/persistence-auth";
import {
  isRecommendationPayload,
  recommendationIsEmergency,
} from "@/lib/server/recommendation-payload";
import {
  saveAuditLog,
  saveConsentEvent,
  saveRecommendation,
} from "@/lib/user-memory";

type SaveRecommendationRequest = {
  sessionId?: unknown;
  recommendation?: unknown;
  consentGranted?: unknown;
};

export async function POST(request: Request) {
  const body = await readJsonBody<SaveRecommendationRequest>(request);

  if (!body) {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (body.consentGranted !== true) {
    return Response.json(
      { error: "Explicit save consent is required." },
      { status: 400 },
    );
  }

  if (!isRecommendationPayload(body.recommendation)) {
    return Response.json(
      { error: "Recommendation is required." },
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

  const sessionId = typeof body.sessionId === "string" ? body.sessionId : null;

  try {
    const saved = await saveRecommendation(
      auth.user.id,
      sessionId,
      recommendation,
      auth.supabase,
    );

    await Promise.all([
      saveConsentEvent(auth.user.id, "save_memory", true, auth.supabase),
      saveAuditLog(
        auth.user.id,
        "recommendation_saved",
        {
          recommendationType: saved.recommendation_type,
          urgency: recommendation.urgency.label,
          requestType: recommendation.requestType,
        },
        auth.supabase,
      ),
    ]);

    return Response.json({ recommendationId: saved.id });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not save recommendation.",
      },
      { status: 500 },
    );
  }
}
