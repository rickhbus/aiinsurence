import {
  getDayBounds,
  getWeekBounds,
  round,
  toNumber,
  type HealthDataClient,
} from "./common";
import { logWarn } from "@/lib/observability/logger";
import { calculateDailySummary, calculateWeeklySummary } from "./calculations";
import type {
  BodyMetricRow,
  DailyHealthSummary,
  DashboardData,
  GoalRow,
  GymLogRow,
  MealRow,
  RunningLogRow,
  SleepLogRow,
  WaterLogRow,
  WeeklyHealthSummary,
} from "./types";
import { buildTodayRecommendation } from "./recommendations";

export async function getDashboardData(
  supabase: HealthDataClient,
  userId: string,
  date = new Date(),
): Promise<DashboardData> {
  const day = getDayBounds(date);
  const week = getWeekBounds(date);
  const [
    profileResult,
    dailySummaryResult,
    weeklySummaryResult,
    runningResult,
    gymResult,
    mealsResult,
    waterResult,
    sleepResult,
    bodyResult,
    goalsResult,
    memoryResult,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name,preferred_language,care_preference,location_area")
      .eq("id", userId)
      .maybeSingle(),
    supabase
      .from("daily_health_summaries")
      .select("*")
      .eq("user_id", userId)
      .eq("summary_date", day.date)
      .maybeSingle(),
    supabase
      .from("weekly_health_summaries")
      .select("*")
      .eq("user_id", userId)
      .eq("week_start_date", week.weekStart)
      .maybeSingle(),
    supabase
      .from("running_logs")
      .select("id,user_id,distance_km,duration_seconds,pace,heart_rate_avg,calories,rpe,route_notes,weather,shoe,notes,created_at")
      .eq("user_id", userId)
      .gte("created_at", week.from)
      .lt("created_at", week.to)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("gym_logs")
      .select("id,user_id,workout_title,exercise_name,muscle_group,sets,reps,weight_kg,rest_seconds,rpe,notes,created_at")
      .eq("user_id", userId)
      .gte("created_at", week.from)
      .lt("created_at", week.to)
      .order("created_at", { ascending: false })
      .limit(40),
    supabase
      .from("meals")
      .select("id,user_id,meal_type,food_name,calories,protein_g,carbs_g,fat_g,fiber_g,sugar_g,sodium_mg,notes,created_at")
      .eq("user_id", userId)
      .gte("created_at", week.from)
      .lt("created_at", week.to)
      .order("created_at", { ascending: false })
      .limit(40),
    supabase
      .from("water_logs")
      .select("id,user_id,amount_ml,created_at")
      .eq("user_id", userId)
      .gte("created_at", week.from)
      .lt("created_at", week.to)
      .order("created_at", { ascending: false })
      .limit(80),
    supabase
      .from("sleep_logs")
      .select("id,user_id,sleep_hours,bedtime,wake_time,sleep_quality,notes,created_at")
      .eq("user_id", userId)
      .gte("created_at", week.from)
      .lt("created_at", week.to)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("body_metrics")
      .select("id,user_id,weight_kg,waist_cm,body_fat_percentage,notes,created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(12),
    supabase
      .from("goals")
      .select("id,user_id,title,goal_type,target_value,current_value,unit,deadline,weekly_action,status,created_at,updated_at")
      .eq("user_id", userId)
      .neq("status", "archived")
      .order("created_at", { ascending: false })
      .limit(6),
    supabase
      .from("health_memory")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("consent_status", "saved"),
  ]);

  const running = getDataOrFallback<RunningLogRow[]>(runningResult, [], "load dashboard running logs");
  const gym = getDataOrFallback<GymLogRow[]>(gymResult, [], "load dashboard gym logs");
  const meals = getDataOrFallback<MealRow[]>(mealsResult, [], "load dashboard meals");
  const water = getDataOrFallback<WaterLogRow[]>(waterResult, [], "load dashboard water logs");
  const sleep = getDataOrFallback<SleepLogRow[]>(sleepResult, [], "load dashboard sleep logs");
  const body = getDataOrFallback<BodyMetricRow[]>(bodyResult, [], "load dashboard body metrics");
  const goals = getDataOrFallback<GoalRow[]>(goalsResult, [], "load dashboard goals");
  const todayRaw = filterRowsByDay({ running, gym, meals, water, sleep }, day.date);
  const today =
    getDataOrFallback<DailyHealthSummary | null>(
      dailySummaryResult,
      null,
      "load daily summary",
    ) ??
    calculateDailySummary({
      userId,
      summaryDate: day.date,
      ...todayRaw,
    });
  const dailySummaries =
    today.summary_date === day.date ? [today] : [];
  const weekly =
    getDataOrFallback<WeeklyHealthSummary | null>(
      weeklySummaryResult,
      null,
      "load weekly summary",
    ) ??
    calculateWeeklySummary({
      userId,
      weekStartDate: week.weekStart,
      dailySummaries,
      runningLogs: running,
      gymLogs: gym,
    });
  const profile = getDataOrFallback<{
    display_name: string | null;
    preferred_language: string | null;
    care_preference: string | null;
    location_area: string | null;
  } | null>(profileResult, null, "load profile");
  const empty =
    running.length + gym.length + meals.length + water.length + sleep.length + body.length === 0;
  const baseData: Omit<DashboardData, "recommendation"> = {
    profile: {
      displayName: profile?.display_name || "匿名使用者",
      preferredLanguage: profile?.preferred_language === "en" ? "en" : "zh-Hant",
      memoryEnabled: getCountOrFallback(memoryResult, "load memory count") > 0,
      goal: goals[0]?.title || "",
      location: profile?.location_area || "",
      fitnessLevel: "",
    },
    today,
    weekly,
    recent: {
      running: running.slice(0, 6),
      gym: gym.slice(0, 8),
      meals: meals.slice(0, 8),
      sleep: sleep.slice(0, 7),
      body: body.slice(0, 12),
    },
    goals,
    memoryCount: getCountOrFallback(memoryResult, "load memory count"),
    charts: buildDashboardCharts({ running, gym, meals, water }),
    empty,
  };

  return {
    ...baseData,
    recommendation: buildTodayRecommendation(baseData as DashboardData),
  };
}

function getDataOrFallback<T>(
  result: { data: unknown; error: { message: string } | null },
  fallback: T,
  action: string,
) {
  if (result.error) {
    logWarn("Dashboard subsystem failed", {
      route: "/api/dashboard",
      status: result.error.message,
      action,
    });

    return fallback;
  }

  return result.data as T;
}

function getCountOrFallback(
  result: { count?: number | null; error: { message: string } | null },
  action: string,
) {
  if (result.error) {
    logWarn("Dashboard subsystem failed", {
      route: "/api/dashboard",
      status: result.error.message,
      action,
    });

    return 0;
  }

  return result.count ?? 0;
}

function filterRowsByDay({
  running,
  gym,
  meals,
  water,
  sleep,
}: {
  running: RunningLogRow[];
  gym: GymLogRow[];
  meals: MealRow[];
  water: WaterLogRow[];
  sleep: SleepLogRow[];
}, dateKey: string) {
  return {
    runningLogs: running.filter((row) => row.created_at.startsWith(dateKey)),
    gymLogs: gym.filter((row) => row.created_at.startsWith(dateKey)),
    meals: meals.filter((row) => row.created_at.startsWith(dateKey)),
    waterLogs: water.filter((row) => row.created_at.startsWith(dateKey)),
    sleepLogs: sleep.filter((row) => row.created_at.startsWith(dateKey)),
  };
}

function buildDashboardCharts({
  running,
  gym,
  meals,
  water,
}: {
  running: RunningLogRow[];
  gym: GymLogRow[];
  meals: MealRow[];
  water: WaterLogRow[];
}): DashboardData["charts"] {
  const dayLabels = getLastSevenDateKeys();

  return {
    activity: dayLabels.map(({ label, date }) => ({
      label,
      value:
        running
          .filter((run) => run.created_at.startsWith(date))
          .reduce((total, run) => total + toNumber(run.duration_seconds) / 60, 0) +
        gym.filter((entry) => entry.created_at.startsWith(date)).length * 45,
      secondary: running
        .filter((run) => run.created_at.startsWith(date))
        .reduce((total, run) => total + toNumber(run.calories), 0),
    })),
    runningDistance: dayLabels.map(({ label, date }) => ({
      label,
      value: round(
        running
          .filter((run) => run.created_at.startsWith(date))
          .reduce((total, run) => total + toNumber(run.distance_km), 0),
        2,
      ),
    })),
    water: dayLabels.map(({ label, date }) => ({
      label,
      value: water
        .filter((entry) => entry.created_at.startsWith(date))
        .reduce((total, entry) => total + toNumber(entry.amount_ml), 0),
    })),
    nutrition: dayLabels.map(({ label, date }) => ({
      label,
      value: meals
        .filter((meal) => meal.created_at.startsWith(date))
        .reduce((total, meal) => total + toNumber(meal.calories), 0),
      secondary: meals
        .filter((meal) => meal.created_at.startsWith(date))
        .reduce((total, meal) => total + toNumber(meal.protein_g), 0),
    })),
    gymVolume: buildGymVolume(gym),
  };
}

function buildGymVolume(gym: GymLogRow[]) {
  const groups = new Map<string, number>();

  gym.forEach((entry) => {
    const key = entry.muscle_group || "Other";
    const volume = toNumber(entry.sets) * toNumber(entry.reps) * toNumber(entry.weight_kg);
    groups.set(key, (groups.get(key) ?? 0) + volume);
  });

  return Array.from(groups.entries()).map(([label, value]) => ({
    label,
    value: Math.round(value),
  }));
}

function getLastSevenDateKeys() {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    const dateKey = date.toISOString().slice(0, 10);

    return {
      date: dateKey,
      label: date.toLocaleDateString("en", { weekday: "short" }),
    };
  });
}
