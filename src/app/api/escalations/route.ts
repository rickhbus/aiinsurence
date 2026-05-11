import {
  getAuthenticatedSupabase,
  readJsonBody,
} from "@/lib/server/persistence-auth";
import { isRecommendationPayload } from "@/lib/server/recommendation-payload";
import {
  saveAuditLog,
  saveConsentEvent,
  saveEscalationCase,
} from "@/lib/user-memory";

type EscalationRequest = {
  sessionId?: unknown;
  recommendation?: unknown;
  reason?: unknown;
  consentGranted?: unknown;
};

export async function POST(request: Request) {
  const body = await readJsonBody<EscalationRequest>(request);

  if (!body) {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (body.consentGranted !== true) {
    return Response.json(
      { error: "Explicit handoff consent is required." },
      { status: 400 },
    );
  }

  if (!isRecommendationPayload(body.recommendation)) {
    return Response.json(
      { error: "Recommendation is required for handoff." },
      { status: 400 },
    );
  }

  const auth = await getAuthenticatedSupabase(request);

  if (!auth.ok) {
    return auth.response;
  }

  const recommendation = body.recommendation;
  const sessionId = typeof body.sessionId === "string" ? body.sessionId : null;
  const reason =
    typeof body.reason === "string" && body.reason.trim()
      ? body.reason.trim()
      : recommendation.escalation;

  try {
    await saveConsentEvent(auth.user.id, "adviser_handoff", true, auth.supabase);

    const escalation = await saveEscalationCase(
      auth.user.id,
      sessionId,
      recommendation,
      reason,
      auth.supabase,
    );

    await saveAuditLog(
      auth.user.id,
      "escalation_requested",
      {
        caseType: escalation.case_type,
        requestType: recommendation.requestType,
        urgency: recommendation.urgency.label,
      },
      auth.supabase,
    );

    return Response.json({ escalationId: escalation.id });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Could not save escalation." },
      { status: 500 },
    );
  }
}
