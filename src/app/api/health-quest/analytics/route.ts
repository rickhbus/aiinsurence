import { analyticsEventSchema, trackHealthQuestEvent } from "@/lib/health-quest/analytics";
import { getOptionalAuthenticatedSupabase, readValidatedJson } from "@/lib/server/persistence-auth";
import { getRequestId, jsonWithRequestId } from "@/lib/server/request-context";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  const parsed = await readValidatedJson(request, analyticsEventSchema);

  if (!parsed.ok) {
    return parsed.response;
  }

  const optional = await getOptionalAuthenticatedSupabase(request);

  if (!optional.supabase || !optional.user) {
    return jsonWithRequestId(
      {
        saved: false,
        reason: "authenticated_session_required_for_persistence",
      },
      { status: 202 },
      requestId,
    );
  }

  try {
    const supabase = optional.supabase;

    await trackHealthQuestEvent(supabase, {
      userId: optional.user.id,
      anonymousId: parsed.data.anonymousId ?? null,
      eventName: parsed.data.eventName,
      properties: parsed.data.properties,
    });

    return jsonWithRequestId({ saved: true }, undefined, requestId);
  } catch {
    return jsonWithRequestId({ error: "Analytics event could not be saved." }, { status: 500 }, requestId);
  }
}
