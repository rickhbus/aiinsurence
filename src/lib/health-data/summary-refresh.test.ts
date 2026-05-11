import { describe, expect, it } from "vitest";
import { getWeekBounds } from "./common";
import {
  buildGoalProgressPayloads,
  buildStreakPayloads,
} from "./summary-refresh";
import type { DailyHealthSummary, GoalRow } from "./types";

const userId = "00000000-0000-4000-8000-000000000001";

function summary(date: string, overrides: Partial<DailyHealthSummary> = {}): DailyHealthSummary {
  return {
    user_id: userId,
    summary_date: date,
    calories_total: 0,
    protein_total: 0,
    carbs_total: 0,
    fat_total: 0,
    water_total_ml: 0,
    sleep_hours: 0,
    sleep_quality: 0,
    running_distance_km: 0,
    active_minutes: 0,
    gym_sessions: 0,
    health_score: 0,
    activity_score: 0,
    nutrition_score: 0,
    sleep_score: 0,
    hydration_score: 0,
    ...overrides,
  };
}

describe("summary refresh helpers", () => {
  it("computes streak payloads from daily summaries", () => {
    const streaks = buildStreakPayloads({
      userId,
      summaries: [
        summary("2026-05-09", { water_total_ml: 2200, sleep_hours: 7.5 }),
        summary("2026-05-10", { water_total_ml: 2100, sleep_hours: 6 }),
        summary("2026-05-11", { water_total_ml: 2300, active_minutes: 45, protein_total: 95 }),
      ],
      existingBest: { hydration: 5 },
    });

    expect(streaks.find((streak) => streak.streak_type === "hydration")).toMatchObject({
      current_count: 3,
      best_count: 5,
      last_logged_date: "2026-05-11",
    });
    expect(streaks.find((streak) => streak.streak_type === "workout")).toMatchObject({
      current_count: 1,
      best_count: 1,
    });
  });

  it("maps daily summaries into goal progress rows", () => {
    const goals: GoalRow[] = [
      {
        id: "goal-water",
        user_id: userId,
        title: "Drink water",
        goal_type: "drink_more_water",
        target_value: 2500,
        current_value: 0,
        unit: "ml",
        deadline: null,
        weekly_action: null,
        status: "active",
        created_at: "2026-05-11T00:00:00.000Z",
        updated_at: "2026-05-11T00:00:00.000Z",
      },
    ];

    const progress = buildGoalProgressPayloads({
      userId,
      progressDate: "2026-05-11",
      goals,
      dailySummary: summary("2026-05-11", { water_total_ml: 2000 }),
    });

    expect(progress[0]).toMatchObject({
      current_value: 2000,
      progress_percent: 80,
    });
  });

  it("uses Monday week boundaries across Sunday", () => {
    const sunday = getWeekBounds(new Date("2026-05-17T12:00:00.000Z"));

    expect(sunday.weekStart).toBe("2026-05-11");
  });
});
