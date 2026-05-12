import { buildDailyHealthSummary } from "@/lib/health-os/daily-summary";
import type { HealthContext } from "@/lib/health-os/types";
import { getAuthenticatedSupabase } from "@/lib/server/persistence-auth";
import { getRequestId, jsonWithRequestId } from "@/lib/server/request-context";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestId = getRequestId(request);
  const auth = await getAuthenticatedSupabase(request);

  if (!auth.ok) {
    return auth.response;
  }

  const today = new Date().toISOString().slice(0, 10);
  const since = `${today}T00:00:00.000Z`;

  const [daily, moods, meals, hydration, toilet, workouts] = await Promise.all([
    auth.supabase.from("daily_health_logs").select("*").eq("user_id", auth.user.id).eq("log_date", today).maybeSingle(),
    auth.supabase.from("mood_logs").select("*").eq("user_id", auth.user.id).gte("logged_at", since).order("logged_at", { ascending: false }).limit(10),
    auth.supabase.from("meal_logs").select("*").eq("user_id", auth.user.id).gte("meal_time", since).order("meal_time", { ascending: false }).limit(10),
    auth.supabase.from("hydration_logs").select("*").eq("user_id", auth.user.id).gte("logged_at", since).order("logged_at", { ascending: false }).limit(20),
    auth.supabase.from("bowel_urine_logs").select("*").eq("user_id", auth.user.id).gte("logged_at", since).order("logged_at", { ascending: false }).limit(5),
    auth.supabase.from("gym_workouts").select("*, gym_exercise_sets(*)").eq("user_id", auth.user.id).gte("created_at", since).order("created_at", { ascending: false }).limit(5),
  ]);

  const failed = [daily.error, moods.error, meals.error, hydration.error, toilet.error, workouts.error].find(Boolean);

  if (failed) {
    return jsonWithRequestId({ error: "今日健康資料暫時未能載入。" }, { status: 500 }, requestId);
  }

  const context: HealthContext = {
    locale: "zh-Hant",
    dailyLog: daily.data ? {
      wakeTime: daily.data.wake_time,
      sleepMinutes: daily.data.sleep_minutes,
      sleepQuality: daily.data.sleep_quality,
      energyScore: daily.data.energy_score,
      moodScore: daily.data.mood_score,
      stressScore: daily.data.stress_score,
      bodyNotes: daily.data.body_notes,
      todayGoal: daily.data.today_goal,
    } : null,
    moodLogs: (moods.data ?? []).map((row) => ({
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
      waterMl: row.water_ml,
      caffeineMg: row.caffeine_mg,
      alcoholUnits: Number(row.alcohol_units ?? 0),
      drinkType: row.drink_type,
    })),
    toiletLogs: (toilet.data ?? []).map((row) => ({
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
      sets: (row.gym_exercise_sets ?? []).map((set: {
        exercise_name: string;
        muscle_group: string | null;
        set_number: number;
        reps: number | null;
        weight_kg: number | string | null;
        rpe: number | null;
        rest_seconds: number | null;
        pain_flag: boolean | null;
        form_note: string | null;
        completed: boolean | null;
      }) => ({
        exerciseName: set.exercise_name,
        muscleGroup: set.muscle_group,
        setNumber: set.set_number,
        reps: set.reps,
        weightKg: Number(set.weight_kg ?? 0),
        rpe: set.rpe,
        restSeconds: set.rest_seconds,
        painFlag: set.pain_flag,
        formNote: set.form_note,
        completed: set.completed,
      })),
    })),
  };
  const summary = buildDailyHealthSummary(context);

  return jsonWithRequestId({ date: today, context, summary }, undefined, requestId);
}
