import type { SupabaseClient } from "@supabase/supabase-js";
import { createDailyCheckin, getDailyCheckins } from "@/lib/health-data/daily-checkins";
import type { DailyCheckinInput } from "@/lib/health-data/validation";
import { buildDailyHealthSummary } from "@/lib/health-os/daily-summary";
import type { HealthContext } from "@/lib/health-os/types";
import { buildDailyQuestState } from "./quest-engine";
import {
  insertGeneratedQuests,
  loadDailyQuests,
  loadHealthQuestStreak,
  loadXPEvents,
  upsertHealthQuestStreak,
} from "./storage";
import type { DailyQuestMode } from "./types";

export async function loadOrCreateTodayQuestState({
  supabase,
  userId,
  localDate = new Date().toISOString().slice(0, 10),
  forceMode,
  persistGenerated = true,
}: {
  supabase: SupabaseClient;
  userId: string;
  localDate?: string;
  forceMode?: DailyQuestMode;
  persistGenerated?: boolean;
}) {
  const [dailyCheckins, existingQuests, previousStreak, xpEvents, healthContext] = await Promise.all([
    getDailyCheckins(supabase, userId, localDateToDate(localDate)),
    loadDailyQuests(supabase, userId, localDate),
    loadHealthQuestStreak(supabase, userId),
    loadXPEvents(supabase, userId, `${localDate}T00:00:00.000Z`),
    loadHealthContextForQuest(supabase, userId, localDate),
  ]);
  const todaySummary = buildDailyHealthSummary(healthContext);
  let state = buildDailyQuestState({
    userId,
    localDate,
    existingQuests,
    todaySummary,
    healthContext,
    dailyCheckins,
    previousStreak,
    xpEvents,
    forceMode,
  });

  const hasMissingPersistedQuests = state.quests.some((quest) =>
    !existingQuests.some((existing) =>
      existing.type === quest.type && existing.orderIndex === quest.orderIndex,
    ),
  );

  if (persistGenerated && hasMissingPersistedQuests && state.mode !== "safety") {
    const persisted = await insertGeneratedQuests(supabase, userId, state.quests);
    state = buildDailyQuestState({
      userId,
      localDate,
      existingQuests: persisted,
      todaySummary,
      healthContext,
      dailyCheckins,
      previousStreak,
      xpEvents,
      forceMode,
    });
  }

  await upsertHealthQuestStreak(supabase, userId, state.streak);

  return state;
}

export async function logQuestReviewCheckin({
  supabase,
  userId,
  questType,
  occurredAt,
}: {
  supabase: SupabaseClient;
  userId: string;
  questType: string;
  occurredAt: string;
}) {
  const input: DailyCheckinInput = {
    checkin_type: "health_review",
    label: questType === "learn" ? "學習 / Learn" : "健康任務 / Health Quest",
    note: null,
    amount: null,
    unit: null,
    created_at: occurredAt,
    metadata: {
      source: "health_quest",
      questType,
    },
  };

  return createDailyCheckin(supabase, userId, input);
}

async function loadHealthContextForQuest(
  supabase: SupabaseClient,
  userId: string,
  localDate: string,
): Promise<HealthContext> {
  const since = `${localDate}T00:00:00.000Z`;
  const [daily, moods, meals, hydration, toilet, workouts] = await Promise.all([
    supabase.from("daily_health_logs").select("*").eq("user_id", userId).eq("log_date", localDate).maybeSingle(),
    supabase.from("mood_logs").select("*").eq("user_id", userId).gte("logged_at", since).order("logged_at", { ascending: false }).limit(10),
    supabase.from("meal_logs").select("*").eq("user_id", userId).gte("meal_time", since).order("meal_time", { ascending: false }).limit(10),
    supabase.from("hydration_logs").select("*").eq("user_id", userId).gte("logged_at", since).order("logged_at", { ascending: false }).limit(20),
    supabase.from("bowel_urine_logs").select("*").eq("user_id", userId).gte("logged_at", since).order("logged_at", { ascending: false }).limit(5),
    supabase.from("gym_workouts").select("*, gym_exercise_sets(*)").eq("user_id", userId).gte("created_at", since).order("created_at", { ascending: false }).limit(5),
  ]);
  const failed = [daily.error, moods.error, meals.error, hydration.error, toilet.error, workouts.error].find(Boolean);

  if (failed) {
    return { locale: "zh-Hant" };
  }

  return {
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
}

function localDateToDate(localDate: string) {
  const [year = "1970", month = "1", day = "1"] = localDate.split("-");

  return new Date(Number(year), Number(month) - 1, Number(day));
}
