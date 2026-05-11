import {
  assertUserId,
  getDayBounds,
  getWeekBounds,
  throwIfSupabaseError,
  type HealthDataClient,
} from "./common";
import {
  calculateDailySummary,
  calculateWeeklySummary,
} from "./calculations";
import type {
  DailyHealthSummary,
  GymLogRow,
  MealRow,
  RunningLogRow,
  SleepLogRow,
  WaterLogRow,
  WeeklyHealthSummary,
} from "./types";

export async function getDailySummary(
  supabase: HealthDataClient,
  userId: string,
  date: string,
) {
  assertUserId(userId);

  const { data, error } = await supabase
    .from("daily_health_summaries")
    .select("*")
    .eq("user_id", userId)
    .eq("summary_date", date)
    .maybeSingle();

  throwIfSupabaseError(error, "load daily summary");

  return data as DailyHealthSummary | null;
}

export async function getWeeklySummary(
  supabase: HealthDataClient,
  userId: string,
  weekStartDate: string,
) {
  assertUserId(userId);

  const { data, error } = await supabase
    .from("weekly_health_summaries")
    .select("*")
    .eq("user_id", userId)
    .eq("week_start_date", weekStartDate)
    .maybeSingle();

  throwIfSupabaseError(error, "load weekly summary");

  return data as WeeklyHealthSummary | null;
}

export async function upsertDailySummary(
  supabase: HealthDataClient,
  userId: string,
  date = new Date(),
) {
  assertUserId(userId);
  const bounds = getDayBounds(date);
  const raw = await loadDailyRawLogs(supabase, userId, bounds.from, bounds.to);
  const summary = calculateDailySummary({
    userId,
    summaryDate: bounds.date,
    ...raw,
  });

  const { data, error } = await supabase
    .from("daily_health_summaries")
    .upsert(summary, { onConflict: "user_id,summary_date" })
    .select("*")
    .single();

  throwIfSupabaseError(error, "upsert daily summary");

  return data as DailyHealthSummary;
}

export async function upsertWeeklySummary(
  supabase: HealthDataClient,
  userId: string,
  date = new Date(),
) {
  assertUserId(userId);
  const bounds = getWeekBounds(date);
  const [dailySummariesResult, runningResult, gymResult] = await Promise.all([
    supabase
      .from("daily_health_summaries")
      .select("*")
      .eq("user_id", userId)
      .gte("summary_date", bounds.weekStart)
      .lt("summary_date", bounds.to.slice(0, 10)),
    supabase
      .from("running_logs")
      .select("id,user_id,distance_km,duration_seconds,pace,heart_rate_avg,calories,rpe,route_notes,weather,shoe,notes,created_at")
      .eq("user_id", userId)
      .gte("created_at", bounds.from)
      .lt("created_at", bounds.to),
    supabase
      .from("gym_logs")
      .select("id,user_id,workout_title,exercise_name,muscle_group,sets,reps,weight_kg,rest_seconds,rpe,notes,created_at")
      .eq("user_id", userId)
      .gte("created_at", bounds.from)
      .lt("created_at", bounds.to),
  ]);

  throwIfSupabaseError(dailySummariesResult.error, "load daily summaries");
  throwIfSupabaseError(runningResult.error, "load weekly running logs");
  throwIfSupabaseError(gymResult.error, "load weekly gym logs");

  const summary = calculateWeeklySummary({
    userId,
    weekStartDate: bounds.weekStart,
    dailySummaries: (dailySummariesResult.data ?? []) as DailyHealthSummary[],
    runningLogs: (runningResult.data ?? []) as RunningLogRow[],
    gymLogs: (gymResult.data ?? []) as GymLogRow[],
  });

  const { data, error } = await supabase
    .from("weekly_health_summaries")
    .upsert(summary, { onConflict: "user_id,week_start_date" })
    .select("*")
    .single();

  throwIfSupabaseError(error, "upsert weekly summary");

  return data as WeeklyHealthSummary;
}

async function loadDailyRawLogs(
  supabase: HealthDataClient,
  userId: string,
  from: string,
  to: string,
) {
  const [runningResult, gymResult, mealsResult, waterResult, sleepResult] =
    await Promise.all([
      supabase
        .from("running_logs")
        .select("id,user_id,distance_km,duration_seconds,pace,heart_rate_avg,calories,rpe,route_notes,weather,shoe,notes,created_at")
        .eq("user_id", userId)
        .gte("created_at", from)
        .lt("created_at", to),
      supabase
        .from("gym_logs")
        .select("id,user_id,workout_title,exercise_name,muscle_group,sets,reps,weight_kg,rest_seconds,rpe,notes,created_at")
        .eq("user_id", userId)
        .gte("created_at", from)
        .lt("created_at", to),
      supabase
        .from("meals")
        .select("id,user_id,meal_type,food_name,calories,protein_g,carbs_g,fat_g,fiber_g,sugar_g,sodium_mg,notes,created_at")
        .eq("user_id", userId)
        .gte("created_at", from)
        .lt("created_at", to),
      supabase
        .from("water_logs")
        .select("id,user_id,amount_ml,created_at")
        .eq("user_id", userId)
        .gte("created_at", from)
        .lt("created_at", to),
      supabase
        .from("sleep_logs")
        .select("id,user_id,sleep_hours,bedtime,wake_time,sleep_quality,notes,created_at")
        .eq("user_id", userId)
        .gte("created_at", from)
        .lt("created_at", to),
    ]);

  throwIfSupabaseError(runningResult.error, "load daily running logs");
  throwIfSupabaseError(gymResult.error, "load daily gym logs");
  throwIfSupabaseError(mealsResult.error, "load daily meals");
  throwIfSupabaseError(waterResult.error, "load daily water logs");
  throwIfSupabaseError(sleepResult.error, "load daily sleep logs");

  return {
    runningLogs: (runningResult.data ?? []) as RunningLogRow[],
    gymLogs: (gymResult.data ?? []) as GymLogRow[],
    meals: (mealsResult.data ?? []) as MealRow[],
    waterLogs: (waterResult.data ?? []) as WaterLogRow[],
    sleepLogs: (sleepResult.data ?? []) as SleepLogRow[],
  };
}
