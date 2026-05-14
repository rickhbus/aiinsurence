import { analyticsEventSchema, trackHealthQuestEvent } from "@/lib/health-quest/analytics";
import { getAuthenticatedSupabase, getOptionalAuthenticatedSupabase, readValidatedJson } from "@/lib/server/persistence-auth";
import { getRequestId, jsonWithRequestId } from "@/lib/server/request-context";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  const parsed = await readValidatedJson(request, analyticsEventSchema);

  if (!parsed.ok) {
    return parsed.response;
  }

  const optional = await getOptionalAuthenticatedSupabase(request);

  if (!optional.supabase) {
    const auth = await getAuthenticatedSupabase(request);
    if (!auth.ok) {
      return auth.response;
    }
  }

  try {
    const supabase = optional.supabase;

    if (!supabase) {
      return jsonWithRequestId({ error: "Analytics persistence is unavailable." }, { status: 503 }, requestId);
    }

    await trackHealthQuestEvent(supabase, {
      userId: optional.user?.id ?? null,
      anonymousId: parsed.data.anonymousId ?? null,
      eventName: parsed.data.eventName,
      properties: parsed.data.properties,
    });

    return jsonWithRequestId({ saved: true }, undefined, requestId);
  } catch {
    return jsonWithRequestId({ error: "Analytics event could not be saved." }, { status: 500 }, requestId);
  }
}
