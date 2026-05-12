import { buildDailyHealthSummary } from "@/lib/health-os/daily-summary";
import { dailyHealthCheckInSchema } from "@/lib/health-os/validators";
import { getAuthenticatedSupabase, readValidatedJson } from "@/lib/server/persistence-auth";
import { getRequestId, jsonWithRequestId } from "@/lib/server/request-context";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  const parsed = await readValidatedJson(request, dailyHealthCheckInSchema);

  if (!parsed.ok) {
    return parsed.response;
  }

  const summary = buildDailyHealthSummary({
    locale: "zh-Hant",
    dailyLog: parsed.data,
  });

  if (!parsed.data.consentToSave) {
    return jsonWithRequestId({ saved: false, summary }, undefined, requestId);
  }

  const auth = await getAuthenticatedSupabase(request);

  if (!auth.ok) {
    return auth.response;
  }

  const logDate = parsed.data.logDate ?? new Date().toISOString().slice(0, 10);
  const { data, error } = await auth.supabase
    .from("daily_health_logs")
    .upsert({
      user_id: auth.user.id,
      log_date: logDate,
      wake_time: parsed.data.wakeTime,
      sleep_minutes: parsed.data.sleepMinutes,
      sleep_quality: parsed.data.sleepQuality,
      energy_score: parsed.data.energyScore,
      mood_score: parsed.data.moodScore,
      stress_score: parsed.data.stressScore,
      body_notes: parsed.data.bodyNotes,
      today_goal: parsed.data.todayGoal,
    }, { onConflict: "user_id,log_date" })
    .select("*")
    .single();

  if (error) {
    return jsonWithRequestId({ error: "暫時未能保存 check-in。" }, { status: 500 }, requestId);
  }

  return jsonWithRequestId({ saved: true, log: data, summary }, undefined, requestId);
}
