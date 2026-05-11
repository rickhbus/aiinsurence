import { trackServerEvent } from "@/lib/analytics/events";
import { getDashboardData } from "@/lib/health-data/dashboard";
import { buildCoachResponse } from "@/lib/health-data/recommendations";
import { coachInputSchema } from "@/lib/health-data/validation";
import {
  getAuthenticatedSupabase,
  readValidatedJson,
} from "@/lib/server/persistence-auth";
import {
  checkUserAiRateLimit,
  recordAiUsageEvent,
} from "@/lib/server/rate-limit";

export async function POST(request: Request) {
  const parsed = await readValidatedJson(request, coachInputSchema);

  if (!parsed.ok) {
    return parsed.response;
  }

  const auth = await getAuthenticatedSupabase(request);

  if (!auth.ok) {
    return auth.response;
  }

  const limit = await checkUserAiRateLimit({
    supabase: auth.supabase,
    userId: auth.user.id,
    route: "/api/coach",
    dailyLimit: 40,
  });

  if (!limit.allowed) {
    return Response.json(
      { error: limit.message },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  try {
    const dashboardData = await getDashboardData(auth.supabase, auth.user.id);
    const response = await buildCoachResponse({
      message: parsed.data.message,
      dashboardData,
    });

    await recordAiUsageEvent({
      supabase: auth.supabase,
      userId: auth.user.id,
      route: "/api/coach",
      status: "generated",
      inputTokensEstimate: Math.ceil(parsed.data.message.length / 4),
      outputTokensEstimate: Math.ceil(response.answer.length / 4),
    });

    void trackServerEvent({
      supabase: auth.supabase,
      userId: auth.user.id,
      event: "coach_message_sent",
      metadata: {
        category: response.category,
        memorySuggested: response.memorySuggestion?.shouldSuggest ?? false,
      },
    });

    return Response.json(response);
  } catch {
    await recordAiUsageEvent({
      supabase: auth.supabase,
      userId: auth.user.id,
      route: "/api/coach",
      status: "failed",
    });

    return Response.json(
      { error: "AI 暫時未能回應，你仍可查看已儲存的紀錄和建議。" },
      { status: 500 },
    );
  }
}
