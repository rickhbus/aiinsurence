import { clamp, round, toNumber } from "./common";
import type {
  BodyMetricRow,
  DailyHealthSummary,
  GymLogRow,
  MealRow,
  RunningLogRow,
  SleepLogRow,
  WaterLogRow,
  WeeklyHealthSummary,
} from "./types";

export type DailySummaryInput = {
  userId: string;
  summaryDate: string;
  runningLogs: RunningLogRow[];
  gymLogs: GymLogRow[];
  meals: MealRow[];
  waterLogs: WaterLogRow[];
  sleepLogs: SleepLogRow[];
};

export type WeeklySummaryInput = {
  userId: string;
  weekStartDate: string;
  dailySummaries: DailyHealthSummary[];
  runningLogs: RunningLogRow[];
  gymLogs: GymLogRow[];
};

export function calculateNutritionTotals(meals: MealRow[]) {
  return meals.reduce(
    (totals, meal) => ({
      calories: totals.calories + toNumber(meal.calories),
      protein: totals.protein + toNumber(meal.protein_g),
      carbs: totals.carbs + toNumber(meal.carbs_g),
      fat: totals.fat + toNumber(meal.fat_g),
      fiber: totals.fiber + toNumber(meal.fiber_g),
      sugar: totals.sugar + toNumber(meal.sugar_g),
      sodium: totals.sodium + toNumber(meal.sodium_mg),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 },
  );
}

export function calculateWaterTotal(waterLogs: WaterLogRow[]) {
  return waterLogs.reduce((total, log) => total + toNumber(log.amount_ml), 0);
}

export function calculateRunningDistance(runningLogs: RunningLogRow[]) {
  return round(
    runningLogs.reduce((total, log) => total + toNumber(log.distance_km), 0),
    2,
  );
}

export function calculateActiveMinutes(runningLogs: RunningLogRow[], gymLogs: GymLogRow[]) {
  const runMinutes = runningLogs.reduce(
    (total, log) => total + toNumber(log.duration_seconds) / 60,
    0,
  );
  const gymMinutes = gymLogs.length * 45;

  return Math.round(runMinutes + gymMinutes);
}

export function calculateGymSessions(gymLogs: GymLogRow[]) {
  const days = new Set(gymLogs.map((log) => log.created_at.slice(0, 10)));

  return days.size;
}

export function calculateSleepAverage(sleepLogs: SleepLogRow[]) {
  if (sleepLogs.length === 0) {
    return { hours: 0, quality: 0 };
  }

  return {
    hours: round(
      sleepLogs.reduce((total, log) => total + toNumber(log.sleep_hours), 0) /
        sleepLogs.length,
      1,
    ),
    quality: round(
      sleepLogs.reduce((total, log) => total + toNumber(log.sleep_quality), 0) /
        sleepLogs.length,
      1,
    ),
  };
}

export function calculateGoalProgress(current: number, target: number) {
  if (target <= 0) {
    return 0;
  }

  return clamp(Math.round((current / target) * 100));
}

export function calculateHealthScore({
  runningDistanceKm,
  activeMinutes,
  caloriesTotal,
  proteinTotal,
  sleepHours,
  sleepQuality,
  waterTotalMl,
}: {
  runningDistanceKm: number;
  activeMinutes: number;
  caloriesTotal: number;
  proteinTotal: number;
  sleepHours: number;
  sleepQuality: number;
  waterTotalMl: number;
}) {
  const activityScore = clamp((activeMinutes / 45) * 70 + (runningDistanceKm / 5) * 30);
  const proteinScore = clamp((proteinTotal / 100) * 80);
  const calorieSignal = caloriesTotal > 0 ? 20 : 0;
  const nutritionScore = clamp(proteinScore + calorieSignal);
  const sleepScore = clamp((sleepHours / 8) * 75 + (sleepQuality / 10) * 25);
  const hydrationScore = clamp((waterTotalMl / 2500) * 100);
  const healthScore = Math.round(
    activityScore * 0.28 +
      nutritionScore * 0.27 +
      sleepScore * 0.25 +
      hydrationScore * 0.2,
  );

  return {
    healthScore,
    activityScore: Math.round(activityScore),
    nutritionScore: Math.round(nutritionScore),
    sleepScore: Math.round(sleepScore),
    hydrationScore: Math.round(hydrationScore),
  };
}

export function calculateDailySummary({
  userId,
  summaryDate,
  runningLogs,
  gymLogs,
  meals,
  waterLogs,
  sleepLogs,
}: DailySummaryInput): DailyHealthSummary {
  const nutrition = calculateNutritionTotals(meals);
  const waterTotalMl = calculateWaterTotal(waterLogs);
  const sleep = calculateSleepAverage(sleepLogs);
  const runningDistanceKm = calculateRunningDistance(runningLogs);
  const activeMinutes = calculateActiveMinutes(runningLogs, gymLogs);
  const gymSessions = calculateGymSessions(gymLogs);
  const scores = calculateHealthScore({
    runningDistanceKm,
    activeMinutes,
    caloriesTotal: nutrition.calories,
    proteinTotal: nutrition.protein,
    sleepHours: sleep.hours,
    sleepQuality: sleep.quality,
    waterTotalMl,
  });

  return {
    user_id: userId,
    summary_date: summaryDate,
    calories_total: Math.round(nutrition.calories),
    protein_total: round(nutrition.protein),
    carbs_total: round(nutrition.carbs),
    fat_total: round(nutrition.fat),
    water_total_ml: Math.round(waterTotalMl),
    sleep_hours: sleep.hours,
    sleep_quality: sleep.quality,
    running_distance_km: runningDistanceKm,
    active_minutes: activeMinutes,
    gym_sessions: gymSessions,
    health_score: scores.healthScore,
    activity_score: scores.activityScore,
    nutrition_score: scores.nutritionScore,
    sleep_score: scores.sleepScore,
    hydration_score: scores.hydrationScore,
  };
}

export function calculateWeeklySummary({
  userId,
  weekStartDate,
  dailySummaries,
  runningLogs,
  gymLogs,
}: WeeklySummaryInput): WeeklyHealthSummary {
  const sleepDays = dailySummaries.filter((summary) => summary.sleep_hours > 0);
  const healthScoreDays = dailySummaries.filter((summary) => summary.health_score > 0);
  const workoutDays = new Set([
    ...runningLogs.map((log) => log.created_at.slice(0, 10)),
    ...gymLogs.map((log) => log.created_at.slice(0, 10)),
  ]).size;

  return {
    user_id: userId,
    week_start_date: weekStartDate,
    running_distance_km: calculateRunningDistance(runningLogs),
    gym_sessions: calculateGymSessions(gymLogs),
    avg_sleep_hours:
      sleepDays.length > 0
        ? round(
            sleepDays.reduce((total, summary) => total + summary.sleep_hours, 0) /
              sleepDays.length,
            1,
          )
        : 0,
    protein_consistency_days: dailySummaries.filter((summary) => summary.protein_total >= 90).length,
    water_goal_days: dailySummaries.filter((summary) => summary.water_total_ml >= 2000).length,
    workout_days: workoutDays,
    health_score_avg:
      healthScoreDays.length > 0
        ? Math.round(
            healthScoreDays.reduce((total, summary) => total + summary.health_score, 0) /
              healthScoreDays.length,
          )
        : 0,
    ai_summary: null,
  };
}

export function getLatestBodyMetric(bodyMetrics: BodyMetricRow[]) {
  return bodyMetrics[0] ?? null;
}
