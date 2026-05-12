import { buildDoctorReport } from "@/lib/health-os/doctor-report";
import { getAuthenticatedSupabase } from "@/lib/server/persistence-auth";
import { getRequestId, jsonWithRequestId } from "@/lib/server/request-context";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestId = getRequestId(request);
  const auth = await getAuthenticatedSupabase(request);

  if (!auth.ok) {
    return auth.response;
  }

  const url = new URL(request.url);
  const days = Math.min(Math.max(Number(url.searchParams.get("days") ?? 14), 1), 60);
  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceDate = since.toISOString().slice(0, 10);
  const sinceDateTime = `${sinceDate}T00:00:00.000Z`;

  const [daily, moods, meals, hydration, toilet, workouts] = await Promise.all([
    auth.supabase.from("daily_health_logs").select("*").eq("user_id", auth.user.id).gte("log_date", sinceDate).order("log_date", { ascending: false }).limit(30),
    auth.supabase.from("mood_logs").select("*").eq("user_id", auth.user.id).gte("logged_at", sinceDateTime).order("logged_at", { ascending: false }).limit(30),
    auth.supabase.from("meal_logs").select("*").eq("user_id", auth.user.id).gte("meal_time", sinceDateTime).order("meal_time", { ascending: false }).limit(30),
    auth.supabase.from("hydration_logs").select("*").eq("user_id", auth.user.id).gte("logged_at", sinceDateTime).order("logged_at", { ascending: false }).limit(60),
    auth.supabase.from("bowel_urine_logs").select("*").eq("user_id", auth.user.id).gte("logged_at", sinceDateTime).order("logged_at", { ascending: false }).limit(30),
    auth.supabase.from("gym_workouts").select("*").eq("user_id", auth.user.id).gte("created_at", sinceDateTime).order("created_at", { ascending: false }).limit(30),
  ]);
  const error = daily.error ?? moods.error ?? meals.error ?? hydration.error ?? toilet.error ?? workouts.error;

  if (error) {
    return jsonWithRequestId({ error: "醫生摘要暫時未能載入。" }, { status: 500 }, requestId);
  }

  const report = buildDoctorReport({
    dailyLogs: (daily.data ?? []).map((row) => ({
      logDate: row.log_date,
      wakeTime: row.wake_time,
      sleepMinutes: row.sleep_minutes,
      sleepQuality: row.sleep_quality,
      energyScore: row.energy_score,
      moodScore: row.mood_score,
      stressScore: row.stress_score,
      bodyNotes: row.body_notes,
      todayGoal: row.today_goal,
    })),
    moodLogs: (moods.data ?? []).map((row) => ({
      loggedAt: row.logged_at,
      moodScore: row.mood_score,
      stressScore: row.stress_score,
      energyScore: row.energy_score,
      emotionLabel: row.emotion_label,
      triggerCategory: row.trigger_category,
      userText: row.user_text,
      bodyLinks: row.body_links,
      safetyFlag: row.safety_flag,
    })),
    meals: (meals.data ?? []).map((row) => ({
      mealTime: row.meal_time,
      mealType: row.meal_type,
      description: row.description,
      estimatedCalories: row.estimated_calories,
      proteinG: Number(row.protein_g ?? 0),
      carbsG: Number(row.carbs_g ?? 0),
      fatG: Number(row.fat_g ?? 0),
      fiberG: Number(row.fiber_g ?? 0),
      waterMl: row.water_ml,
      caffeineMg: row.caffeine_mg,
      alcoholUnits: Number(row.alcohol_units ?? 0),
      highSugarFlag: row.high_sugar_flag,
      highSodiumFlag: row.high_sodium_flag,
      hasImage: Boolean(row.image_path),
    })),
    hydrationLogs: (hydration.data ?? []).map((row) => ({
      loggedAt: row.logged_at,
      waterMl: row.water_ml,
      caffeineMg: row.caffeine_mg,
      alcoholUnits: Number(row.alcohol_units ?? 0),
      drinkType: row.drink_type,
    })),
    toiletLogs: (toilet.data ?? []).map((row) => ({
      loggedAt: row.logged_at,
      bowelMovement: row.bowel_movement,
      stoolType: row.stool_type,
      urineColor: row.urine_color,
      painFlag: row.pain_flag,
      bloodFlag: row.blood_flag,
      feverFlag: row.fever_flag,
      dehydrationConcern: row.dehydration_concern,
      notes: row.notes,
    })),
    gymWorkouts: (workouts.data ?? []).map((row) => ({
      createdAt: row.created_at,
      workoutDate: row.workout_date,
      startedAt: row.started_at,
      durationMinutes: row.duration_minutes,
      workoutType: row.workout_type,
      targetMuscleGroups: row.target_muscle_groups,
      intensity: row.intensity,
      sorenessBefore: row.soreness_before,
      sorenessAfter: row.soreness_after,
      energyBefore: row.energy_before,
      moodBefore: row.mood_before,
      moodAfter: row.mood_after,
      painFlag: row.pain_flag,
      notes: row.notes,
      redFlagSymptoms: row.safety_flag ? [row.safety_flag] : [],
    })),
  });

  if (url.searchParams.get("format") === "json") {
    return jsonWithRequestId({ report }, undefined, requestId);
  }

  return new Response(report.printableHtml, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "X-Request-Id": requestId,
    },
  });
}
