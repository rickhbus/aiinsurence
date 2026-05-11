import {
  assertUserId,
  getDayBounds,
  getWeekBounds,
  throwIfSupabaseError,
  toDateKey,
  toNumber,
  type HealthDataClient,
} from "./common";
import { calculateGoalProgress } from "./calculations";
import {
  upsertDailySummary,
  upsertWeeklySummary,
} from "./summaries";
import type {
  DailyHealthSummary,
  GoalRow,
} from "./types";

export type HealthLogType =
  | "run"
  | "gym"
  | "meal"
  | "water"
  | "sleep"
  | "body_metric"
  | "goal";

export type StreakPayload = {
  user_id: string;
  streak_type: string;
  current_count: number;
  best_count: number;
  last_logged_date: string | null;
};

export type GoalProgressPayload = {
  user_id: string;
  goal_id: string;
  progress_date: string;
  current_value: number;
  progress_percent: number;
};

export async function refreshDailySummary(
  supabase: HealthDataClient,
  userId: string,
  date: string | Date,
) {
  assertUserId(userId);

  return upsertDailySummary(supabase, userId, normalizeDate(date));
}

export async function refreshWeeklySummary(
  supabase: HealthDataClient,
  userId: string,
  weekStartDate: string | Date,
) {
  assertUserId(userId);

  return upsertWeeklySummary(supabase, userId, normalizeDate(weekStartDate));
}

export async function refreshUserStreaks(
  supabase: HealthDataClient,
  userId: string,
  date: string | Date = new Date(),
) {
  assertUserId(userId);
  const end = getDayBounds(normalizeDate(date));
  const start = new Date(end.from);
  start.setDate(start.getDate() - 90);

  const [summariesResult, existingResult] = await Promise.all([
    supabase
      .from("daily_health_summaries")
      .select("*")
      .eq("user_id", userId)
      .gte("summary_date", toDateKey(start))
      .lte("summary_date", end.date)
      .order("summary_date", { ascending: true }),
    supabase
      .from("user_streaks")
      .select("streak_type,best_count")
      .eq("user_id", userId),
  ]);

  throwIfSupabaseError(summariesResult.error, "load streak summaries");
  throwIfSupabaseError(existingResult.error, "load existing streaks");

  const payloads = buildStreakPayloads({
    userId,
    summaries: (summariesResult.data ?? []) as DailyHealthSummary[],
    existingBest: Object.fromEntries(
      ((existingResult.data ?? []) as Array<{ streak_type: string; best_count: number }>)
        .map((row) => [row.streak_type, toNumber(row.best_count)]),
    ),
  });

  if (payloads.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("user_streaks")
    .upsert(payloads, { onConflict: "user_id,streak_type" })
    .select("*");

  throwIfSupabaseError(error, "refresh user streaks");

  return data ?? [];
}

export async function refreshGoalProgress(
  supabase: HealthDataClient,
  userId: string,
  date: string | Date = new Date(),
) {
  assertUserId(userId);
  const day = getDayBounds(normalizeDate(date));
  const [goalsResult, dailySummaryResult] = await Promise.all([
    supabase
      .from("goals")
      .select("id,user_id,title,goal_type,target_value,current_value,unit,deadline,weekly_action,status,created_at,updated_at")
      .eq("user_id", userId)
      .in("status", ["active", "paused"]),
    supabase
      .from("daily_health_summaries")
      .select("*")
      .eq("user_id", userId)
      .eq("summary_date", day.date)
      .maybeSingle(),
  ]);

  throwIfSupabaseError(goalsResult.error, "load goals for progress");
  throwIfSupabaseError(dailySummaryResult.error, "load daily summary for progress");

  const payloads = buildGoalProgressPayloads({
    userId,
    progressDate: day.date,
    goals: (goalsResult.data ?? []) as GoalRow[],
    dailySummary: dailySummaryResult.data as DailyHealthSummary | null,
  });

  if (payloads.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("user_goal_progress")
    .upsert(payloads, { onConflict: "user_id,goal_id,progress_date" })
    .select("*");

  throwIfSupabaseError(error, "refresh goal progress");

  return data ?? [];
}

export async function refreshAfterLogChange(
  supabase: HealthDataClient,
  userId: string,
  logType: HealthLogType,
  date: string | Date,
) {
  assertUserId(userId);
  const normalizedDate = normalizeDate(date);
  const daily = await refreshDailySummary(supabase, userId, normalizedDate);
  const week = getWeekBounds(normalizedDate);
  const [weekly, streaks, goalProgress] = await Promise.all([
    refreshWeeklySummary(supabase, userId, week.weekStart),
    refreshUserStreaks(supabase, userId, normalizedDate),
    refreshGoalProgress(supabase, userId, normalizedDate),
  ]);

  return {
    logType,
    daily,
    weekly,
    streaks,
    goalProgress,
  };
}

export function buildStreakPayloads({
  userId,
  summaries,
  existingBest = {},
}: {
  userId: string;
  summaries: DailyHealthSummary[];
  existingBest?: Record<string, number>;
}): StreakPayload[] {
  const sorted = [...summaries].sort((a, b) =>
    a.summary_date.localeCompare(b.summary_date),
  );

  return [
    buildOneStreak({
      userId,
      summaries: sorted,
      streakType: "hydration",
      existingBest: existingBest.hydration,
      qualifies: (summary) => summary.water_total_ml >= 2000,
    }),
    buildOneStreak({
      userId,
      summaries: sorted,
      streakType: "workout",
      existingBest: existingBest.workout,
      qualifies: (summary) =>
        summary.active_minutes > 0 ||
        summary.running_distance_km > 0 ||
        summary.gym_sessions > 0,
    }),
    buildOneStreak({
      userId,
      summaries: sorted,
      streakType: "sleep",
      existingBest: existingBest.sleep,
      qualifies: (summary) => summary.sleep_hours >= 7,
    }),
    buildOneStreak({
      userId,
      summaries: sorted,
      streakType: "protein",
      existingBest: existingBest.protein,
      qualifies: (summary) => summary.protein_total >= 90,
    }),
  ];
}

export function buildGoalProgressPayloads({
  userId,
  progressDate,
  goals,
  dailySummary,
}: {
  userId: string;
  progressDate: string;
  goals: GoalRow[];
  dailySummary: DailyHealthSummary | null;
}): GoalProgressPayload[] {
  return goals
    .filter((goal) => goal.status !== "archived")
    .map((goal) => {
      const currentValue = getGoalCurrentValue(goal, dailySummary);
      const targetValue = toNumber(goal.target_value);

      return {
        user_id: userId,
        goal_id: goal.id,
        progress_date: progressDate,
        current_value: currentValue,
        progress_percent: calculateGoalProgress(currentValue, targetValue),
      };
    });
}

function buildOneStreak({
  userId,
  summaries,
  streakType,
  existingBest = 0,
  qualifies,
}: {
  userId: string;
  summaries: DailyHealthSummary[];
  streakType: string;
  existingBest?: number;
  qualifies: (summary: DailyHealthSummary) => boolean;
}): StreakPayload {
  let current = 0;
  let best = Math.max(0, existingBest);
  let running = 0;
  let lastLoggedDate: string | null = null;

  for (const summary of summaries) {
    if (qualifies(summary)) {
      running += 1;
      best = Math.max(best, running);
      lastLoggedDate = summary.summary_date;
      current = running;
    } else {
      running = 0;
      current = 0;
    }
  }

  return {
    user_id: userId,
    streak_type: streakType,
    current_count: current,
    best_count: best,
    last_logged_date: lastLoggedDate,
  };
}

function getGoalCurrentValue(
  goal: GoalRow,
  dailySummary: DailyHealthSummary | null,
) {
  if (!dailySummary) {
    return toNumber(goal.current_value);
  }

  switch (goal.goal_type) {
    case "drink_more_water":
      return dailySummary.water_total_ml;
    case "improve_sleep":
      return dailySummary.sleep_hours;
    case "eat_more_protein":
      return dailySummary.protein_total;
    case "run_5k":
    case "run_10k":
      return dailySummary.running_distance_km;
    case "build_gym_habit":
      return dailySummary.gym_sessions;
    case "build_muscle":
      return dailySummary.active_minutes;
    case "lose_fat":
    case "learn_health_basics":
    default:
      return toNumber(goal.current_value);
  }
}

function normalizeDate(date: string | Date) {
  return typeof date === "string" ? new Date(`${date}T00:00:00.000Z`) : date;
}
