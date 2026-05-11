import { trackServerEvent } from "@/lib/analytics/events";
import { upsertWeeklySummary } from "@/lib/health-data/summaries";
import { weeklyReportInputSchema } from "@/lib/health-data/validation";
import {
  getAuthenticatedSupabase,
  readValidatedJson,
} from "@/lib/server/persistence-auth";
import {
  checkUserAiRateLimit,
  recordAiUsageEvent,
} from "@/lib/server/rate-limit";

export async function POST(request: Request) {
  const parsed = await readValidatedJson(request, weeklyReportInputSchema);

  if (!parsed.ok) {
    return parsed.response;
  }

  const auth = await getAuthenticatedSupabase();

  if (!auth.ok) {
    return auth.response;
  }

  try {
    const date = parsed.data.week_start_date
      ? new Date(parsed.data.week_start_date)
      : new Date();
    const summary = await upsertWeeklySummary(auth.supabase, auth.user.id, date);

    if (summary.ai_summary && !parsed.data.force) {
      await recordAiUsageEvent({
        supabase: auth.supabase,
        userId: auth.user.id,
        route: "/api/weekly-report",
        status: "cached",
      });

      return Response.json({ summary, cached: true });
    }

    const limit = await checkUserAiRateLimit({
      supabase: auth.supabase,
      userId: auth.user.id,
      route: "/api/weekly-report",
      dailyLimit: 3,
    });

    if (!limit.allowed) {
      return Response.json(
        { error: limit.message },
        { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
      );
    }

    const aiSummary =
      summary.ai_summary ||
      `本週跑步 ${summary.running_distance_km}km，健身 ${summary.gym_sessions} 次，平均睡眠 ${summary.avg_sleep_hours} 小時。下週先守住睡眠、蛋白質和飲水，再小幅調整跑量。`;

    await auth.supabase
      .from("weekly_health_summaries")
      .update({ ai_summary: aiSummary })
      .eq("user_id", auth.user.id)
      .eq("week_start_date", summary.week_start_date);

    await recordAiUsageEvent({
      supabase: auth.supabase,
      userId: auth.user.id,
      route: "/api/weekly-report",
      status: "generated",
      outputTokensEstimate: Math.ceil(aiSummary.length / 4),
    });

    void trackServerEvent({
      supabase: auth.supabase,
      userId: auth.user.id,
      event: "weekly_report_viewed",
      metadata: { healthScoreAvg: summary.health_score_avg },
    });

    return Response.json({ summary: { ...summary, ai_summary: aiSummary }, cached: false });
  } catch {
    await recordAiUsageEvent({
      supabase: auth.supabase,
      userId: auth.user.id,
      route: "/api/weekly-report",
      status: "failed",
    });

    return Response.json(
      { error: "AI 暫時未能回應，你仍可查看已儲存的紀錄和建議。" },
      { status: 500 },
    );
  }
}
