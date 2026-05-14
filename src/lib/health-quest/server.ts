import type { SupabaseClient } from "@supabase/supabase-js";
import { createDailyCheckin, getDailyCheckins } from "@/lib/health-data/daily-checkins";
import type { DailyCheckinInput } from "@/lib/health-data/validation";
import { buildDailyHealthSummary } from "@/lib/health-os/daily-summary";
import type { HealthContext } from "@/lib/health-os/types";
import { loadHealthQuestProfile } from "./profile";
import { loadQuestPreferences } from "./preferences";
import { buildDailyQuestState } from "./quest-engine";
import {
  insertGeneratedQuests,
  loadDailyQuests,
  loadHealthQuestStreak,
  loadXPEvents,
  upsertHealthQuestStreak,
} from "./storage";
import type { DailyQuest, DailyQuestMode, QuestType } from "./types";

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
  const [dailyCheckins, existingQuests, previousStreak, xpEvents, healthContext, profile, preferences, recentQuests] = await Promise.all([
    getDailyCheckins(supabase, userId, localDateToDate(localDate)),
    loadDailyQuests(supabase, userId, localDate),
    loadHealthQuestStreak(supabase, userId),
    loadXPEvents(supabase, userId, `${localDate}T00:00:00.000Z`),
    loadHealthContextForQuest(supabase, userId, localDate),
    loadHealthQuestProfile(supabase, userId),
    loadQuestPreferences(supabase, userId),
    loadRecentQuestHistory(supabase, userId, localDate),
  ]);
  const todaySummary = buildDailyHealthSummary(healthContext);
  const adaptationInput = buildAdaptationInputFromHistory(recentQuests);
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
    profile,
    preferences,
    adaptiveInput: adaptationInput,
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
      profile,
      preferences,
      adaptiveInput: adaptationInput,
    });
  }

  await upsertHealthQuestStreak(supabase, userId, state.streak);

  return state;
}

export async function hasCompletedHealthQuestOnboarding(supabase: SupabaseClient, userId: string) {
  const profile = await loadHealthQuestProfile(supabase, userId);
  return Boolean(profile?.onboardingCompletedAt);
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

async function loadRecentQuestHistory(
  supabase: SupabaseClient,
  userId: string,
  localDate: string,
): Promise<DailyQuest[]> {
  const since = shiftLocalDate(localDate, -30);
  const { data, error } = await supabase
    .from("daily_quests")
    .select("*")
    .eq("user_id", userId)
    .gte("local_date", since)
    .lte("local_date", localDate)
    .order("local_date", { ascending: false })
    .limit(250);

  if (error) {
    return [];
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    userId: row.user_id,
    localDate: row.local_date,
    type: row.quest_type as QuestType,
    title: row.title,
    description: row.description,
    actionLabel: row.action_label,
    completedLabel: row.completed_label,
    xp: row.xp,
    required: row.required,
    status: row.status,
    orderIndex: row.order_index,
    unlocksAfter: row.unlocks_after ?? [],
    safetyLevel: row.safety_level,
    source: row.source,
    metadata: row.metadata ?? {},
    completedAt: row.completed_at,
    skippedAt: row.skipped_at,
  }));
}

function buildAdaptationInputFromHistory(quests: DailyQuest[]) {
  const last7Start = shiftLocalDate(new Date().toISOString().slice(0, 10), -7);
  const last7 = quests.filter((quest) => quest.localDate >= last7Start);
  const required7 = last7.filter((quest) => quest.required);
  const required30 = quests.filter((quest) => quest.required);
  const skipped = quests.filter((quest) => quest.status === "skipped");
  const repeatedSkipCounts = skipped.reduce<Record<QuestType, number>>((counts, quest) => {
    counts[quest.type] = (counts[quest.type] ?? 0) + 1;
    return counts;
  }, emptyQuestTypeCounts());
  const completedTypes = last7.filter((quest) => quest.status === "done").map((quest) => quest.type);

  return {
    last7DaysCompletionRate: ratio(required7.filter((quest) => quest.status === "done").length, required7.length),
    last30DaysCompletionRate: ratio(required30.filter((quest) => quest.status === "done").length, required30.length),
    last7DaysQuestTypes: Array.from(new Set(completedTypes)),
    skippedQuestTypes: Array.from(new Set(skipped.map((quest) => quest.type))),
    repeatedSkipCounts,
    recoveryDaysLast7: new Set(last7.filter((quest) => quest.source === "recovery" || quest.type === "recovery").map((quest) => quest.localDate)).size,
    safetyEventsLast30: quests.filter((quest) => quest.safetyLevel === "urgent" || quest.status === "blocked_by_safety").length,
  };
}

function emptyQuestTypeCounts(): Record<QuestType, number> {
  return {
    wake: 0,
    water: 0,
    meal: 0,
    movement: 0,
    mood: 0,
    toilet_optional: 0,
    sleep_prep: 0,
    health_review: 0,
    doctor_prep: 0,
    recovery: 0,
    learn: 0,
  };
}

function ratio(numerator: number, denominator: number) {
  if (denominator <= 0) {
    return 0;
  }

  return numerator / denominator;
}

function shiftLocalDate(localDate: string, days: number) {
  const date = localDateToDate(localDate);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}
