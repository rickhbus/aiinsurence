import { getAuthenticatedSupabase } from "@/lib/server/persistence-auth";
import {
  getRequestId,
  jsonWithRequestId,
  withRequestIdHeaders,
} from "@/lib/server/request-context";

export const dynamic = "force-dynamic";

const supportedDataTypes = [
  "steps",
  "active_energy",
  "workouts/runs",
  "sleep_sessions",
  "body_weight",
  "heart_rate_summary",
  "mindful_minutes_optional",
  "mood_optional_non_clinical",
];

export async function GET(request: Request) {
  const requestId = getRequestId(request);
  const auth = await getAuthenticatedSupabase();

  if (!auth.ok) {
    return auth.response;
  }

  try {
    const [consentResult, batchResult] = await Promise.all([
      auth.supabase
        .from("consent_events")
        .select("granted,created_at")
        .eq("user_id", auth.user.id)
        .eq("consent_type", "mobile_health_sync")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      auth.supabase
        .from("mobile_health_sync_batches")
        .select("source_platform,completed_at,status")
        .eq("user_id", auth.user.id)
        .eq("status", "completed")
        .order("completed_at", { ascending: false })
        .limit(20),
    ]);

    if (consentResult.error || batchResult.error) {
      return jsonWithRequestId(
        { error: "Mobile health sync status is temporarily unavailable." },
        { status: 503 },
        requestId,
      );
    }

    const completedBatches = (batchResult.data ?? []) as Array<{
      source_platform: string;
      completed_at: string | null;
      status: string;
    }>;
    const connectedPlatforms = Array.from(
      new Set(completedBatches.map((batch) => batch.source_platform)),
    );
    const lastSuccessfulSync =
      completedBatches.find((batch) => batch.completed_at)?.completed_at ?? null;

    return Response.json(
      {
        consent: {
          mobileHealthSync: Boolean(consentResult.data?.granted),
          updatedAt: consentResult.data?.created_at ?? null,
        },
        connectedPlatforms,
        lastSuccessfulSync,
        supportedDataTypes,
        notes: {
          zh: "瀏覽器不能直接讀取 Apple Health 或 Android Health Connect；需要原生 App 明確授權後同步摘要。",
          en: "A browser cannot directly read Apple Health or Android Health Connect; a native app must request permission and sync summaries.",
        },
        requestId,
      },
      withRequestIdHeaders(undefined, requestId),
    );
  } catch {
    return jsonWithRequestId(
      { error: "Mobile health sync status is temporarily unavailable." },
      { status: 503 },
      requestId,
    );
  }
}
