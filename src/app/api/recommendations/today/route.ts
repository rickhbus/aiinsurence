import { trackServerEvent } from "@/lib/analytics/events";
import { getDashboardData } from "@/lib/health-data/dashboard";
import {
  buildTodayRecommendation,
  getCachedTodayRecommendation,
  upsertTodayRecommendation,
} from "@/lib/health-data/recommendations";
import { toDateKey } from "@/lib/health-data/common";
import { todayRecommendationInputSchema } from "@/lib/health-data/validation";
import {
  getAuthenticatedSupabase,
  readValidatedJson,
} from "@/lib/server/persistence-auth";
import {
  checkUserAiRateLimit,
  recordAiUsageEvent,
} from "@/lib/server/rate-limit";

export async function POST(request: Request) {
  const parsed = await readValidatedJson(request, todayRecommendationInputSchema);

  if (!parsed.ok) {
    return parsed.response;
  }

  const auth = await getAuthenticatedSupabase(request);

  if (!auth.ok) {
    return auth.response;
  }

  const dateKey = toDateKey();

  try {
    if (!parsed.data.force) {
      const cached = await getCachedTodayRecommendation(auth.supabase, auth.user.id, dateKey);

      if (cached) {
        await recordAiUsageEvent({
          supabase: auth.supabase,
          userId: auth.user.id,
          route: "/api/recommendations/today",
          status: "cached",
        });

        return Response.json({ recommendation: cached, cached: true });
      }
    }

    const limit = await checkUserAiRateLimit({
      supabase: auth.supabase,
      userId: auth.user.id,
      route: "/api/recommendations/today",
      dailyLimit: 3,
    });

    if (!limit.allowed) {
      return Response.json(
        { error: limit.message },
        {
          status: 429,
          headers: { "Retry-After": String(limit.retryAfterSeconds) },
        },
      );
    }

    const dashboard = await getDashboardData(auth.supabase, auth.user.id);
    const recommendation = buildTodayRecommendation(dashboard);
    await upsertTodayRecommendation(auth.supabase, auth.user.id, dateKey, recommendation);
    await recordAiUsageEvent({
      supabase: auth.supabase,
      userId: auth.user.id,
      route: "/api/recommendations/today",
      status: "generated",
      outputTokensEstimate: 240,
    });

    void trackServerEvent({
      supabase: auth.supabase,
      userId: auth.user.id,
      event: "recommendation_viewed",
      metadata: { cached: false },
    });

    return Response.json({ recommendation, cached: false });
  } catch {
    return Response.json(
      { error: "AI 暫時未能回應，你仍可查看已儲存的紀錄和建議。" },
      { status: 500 },
    );
  }
}
