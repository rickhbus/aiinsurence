import { buildWeeklyReport } from "@/lib/health-os/weekly-report";
import { getAuthenticatedSupabase } from "@/lib/server/persistence-auth";
import { getRequestId, jsonWithRequestId } from "@/lib/server/request-context";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestId = getRequestId(request);
  const auth = await getAuthenticatedSupabase(request);

  if (!auth.ok) {
    return auth.response;
  }

  const to = new Date();
  const from = new Date(to);
  from.setDate(to.getDate() - 7);

  const { data, error } = await auth.supabase
    .from("daily_health_logs")
    .select("*")
    .eq("user_id", auth.user.id)
    .gte("log_date", from.toISOString().slice(0, 10))
    .lte("log_date", to.toISOString().slice(0, 10))
    .order("log_date", { ascending: false })
    .limit(7);

  if (error) {
    return jsonWithRequestId({ error: "每週報告暫時未能載入。" }, { status: 500 }, requestId);
  }

  const report = buildWeeklyReport((data ?? []).map((row) => ({
    locale: "zh-Hant",
    dailyLog: {
      sleepMinutes: row.sleep_minutes,
      sleepQuality: row.sleep_quality,
      energyScore: row.energy_score,
      moodScore: row.mood_score,
      stressScore: row.stress_score,
      bodyNotes: row.body_notes,
      todayGoal: row.today_goal,
    },
  })));

  return jsonWithRequestId({ report }, undefined, requestId);
}
