import { describe, expect, it } from "vitest";
import {
  calculateDailySummary,
  calculateGoalProgress,
  calculateNutritionTotals,
  calculateRunningDistance,
  calculateSleepAverage,
  calculateWaterTotal,
  calculateWeeklySummary,
} from "./calculations";
import type { GymLogRow, MealRow, RunningLogRow, SleepLogRow, WaterLogRow } from "./types";

const userId = "00000000-0000-4000-8000-000000000001";

describe("health data calculations", () => {
  it("calculates daily summary from bounded raw logs", () => {
    const runningLogs: RunningLogRow[] = [
      {
        id: "run-1",
        user_id: userId,
        distance_km: 5,
        duration_seconds: 1800,
        pace: null,
        heart_rate_avg: 145,
        calories: 360,
        rpe: 7,
        route_notes: null,
        weather: null,
        shoe: null,
        notes: null,
        created_at: "2026-05-11T08:00:00.000Z",
      },
    ];
    const gymLogs: GymLogRow[] = [
      {
        id: "gym-1",
        user_id: userId,
        workout_title: "Upper",
        exercise_name: "Press",
        muscle_group: "Chest",
        sets: 3,
        reps: 10,
        weight_kg: 20,
        rest_seconds: 90,
        rpe: 7,
        notes: null,
        created_at: "2026-05-11T10:00:00.000Z",
      },
    ];
    const meals: MealRow[] = [
      {
        id: "meal-1",
        user_id: userId,
        meal_type: "lunch",
        food_name: "Chicken rice",
        calories: 650,
        protein_g: 45,
        carbs_g: 72,
        fat_g: 18,
        fiber_g: 5,
        sugar_g: 7,
        sodium_mg: 820,
        notes: null,
        created_at: "2026-05-11T12:00:00.000Z",
      },
    ];
    const waterLogs: WaterLogRow[] = [
      { id: "water-1", user_id: userId, amount_ml: 500, created_at: "2026-05-11T09:00:00.000Z" },
      { id: "water-2", user_id: userId, amount_ml: 750, created_at: "2026-05-11T14:00:00.000Z" },
    ];
    const sleepLogs: SleepLogRow[] = [
      {
        id: "sleep-1",
        user_id: userId,
        sleep_hours: 7.5,
        bedtime: "22:45",
        wake_time: "06:15",
        sleep_quality: 8,
        notes: null,
        created_at: "2026-05-11T06:20:00.000Z",
      },
    ];

    const summary = calculateDailySummary({
      userId,
      summaryDate: "2026-05-11",
      runningLogs,
      gymLogs,
      meals,
      waterLogs,
      sleepLogs,
    });

    expect(summary.running_distance_km).toBe(5);
    expect(summary.active_minutes).toBe(75);
    expect(summary.calories_total).toBe(650);
    expect(summary.protein_total).toBe(45);
    expect(summary.water_total_ml).toBe(1250);
    expect(summary.sleep_hours).toBe(7.5);
    expect(summary.gym_sessions).toBe(1);
    expect(summary.health_score).toBeGreaterThan(0);
  });

  it("calculates totals and goal progress safely", () => {
    expect(calculateNutritionTotals([])).toMatchObject({ calories: 0, protein: 0 });
    expect(calculateWaterTotal([{ id: "w", user_id: userId, amount_ml: 250, created_at: "2026-05-11T00:00:00.000Z" }])).toBe(250);
    expect(calculateRunningDistance([])).toBe(0);
    expect(calculateSleepAverage([])).toEqual({ hours: 0, quality: 0 });
    expect(calculateGoalProgress(120, 100)).toBe(100);
    expect(calculateGoalProgress(0, 0)).toBe(0);
  });

  it("calculates weekly summary without scanning unbounded history", () => {
    const weekly = calculateWeeklySummary({
      userId,
      weekStartDate: "2026-05-11",
      dailySummaries: [
        {
          user_id: userId,
          summary_date: "2026-05-11",
          calories_total: 1700,
          protein_total: 100,
          carbs_total: 180,
          fat_total: 60,
          water_total_ml: 2200,
          sleep_hours: 7,
          sleep_quality: 8,
          running_distance_km: 5,
          active_minutes: 75,
          gym_sessions: 1,
          health_score: 82,
          activity_score: 90,
          nutrition_score: 80,
          sleep_score: 78,
          hydration_score: 88,
        },
      ],
      runningLogs: [],
      gymLogs: [],
    });

    expect(weekly.protein_consistency_days).toBe(1);
    expect(weekly.water_goal_days).toBe(1);
    expect(weekly.health_score_avg).toBe(82);
  });
});
