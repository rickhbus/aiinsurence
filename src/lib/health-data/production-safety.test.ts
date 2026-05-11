import { describe, expect, it } from "vitest";
import { checkIpRateLimit } from "@/lib/server/rate-limit";
import { buildInsuranceHelper } from "./insurance";
import { buildTodayRecommendation } from "./recommendations";
import { routeSymptoms } from "./symptoms";
import { EMERGENCY_COPY_ZH, INSURANCE_DISCLAIMER_ZH, type DashboardData } from "./types";
import {
  bodyMetricInputSchema,
  mealInputSchema,
  runningLogInputSchema,
  waterInputSchema,
} from "./validation";

describe("production health safety foundation", () => {
  it("rejects impossible tracking values", () => {
    expect(runningLogInputSchema.safeParse({ distance_km: -1, duration_seconds: 100, rpe: 5 }).success).toBe(false);
    expect(waterInputSchema.safeParse({ amount_ml: 0 }).success).toBe(false);
    expect(mealInputSchema.safeParse({ meal_type: "lunch", food_name: "", calories: 100 }).success).toBe(false);
    expect(bodyMetricInputSchema.safeParse({}).success).toBe(false);
  });

  it("escalates red flags to 999 and A&E without diagnosis language", () => {
    const response = routeSymptoms({
      input: "胸痛，而且嚴重呼吸困難",
      language: "zh-Hant",
    });

    expect(response.redFlagDetected).toBe(true);
    expect(response.careLevel).toBe("emergency");
    expect(response.nextStep).toContain("999");
    expect(response.nextStep).toContain("急症室");
    expect(response.notDiagnosis).toBe("這不是診斷。");
    expect(response.safetyNote).toBe(EMERGENCY_COPY_ZH);
  });

  it("keeps insurance helper educational and disclaimer-bound", () => {
    const response = buildInsuranceHelper({
      topic: "索償文件",
      text: "我想知道住院索償要準備甚麼",
      insurance_type: "hospital",
      language: "zh-Hant",
    });

    expect(response.documentsToPrepare.length).toBeGreaterThan(0);
    expect(response.questionsToAskInsurer.length).toBeGreaterThan(0);
    expect(response.disclaimer).toBe(INSURANCE_DISCLAIMER_ZH);
  });

  it("builds a deterministic daily recommendation without requiring AI", () => {
    const recommendation = buildTodayRecommendation({
      today: {
        user_id: "user",
        summary_date: "2026-05-11",
        calories_total: 1200,
        protein_total: 40,
        carbs_total: 150,
        fat_total: 35,
        water_total_ml: 900,
        sleep_hours: 6,
        sleep_quality: 6,
        running_distance_km: 0,
        active_minutes: 0,
        gym_sessions: 0,
        health_score: 50,
        activity_score: 0,
        nutrition_score: 45,
        sleep_score: 65,
        hydration_score: 36,
      },
      weekly: {
        user_id: "user",
        week_start_date: "2026-05-11",
        running_distance_km: 0,
        gym_sessions: 0,
        avg_sleep_hours: 6,
        protein_consistency_days: 0,
        water_goal_days: 0,
        workout_days: 0,
        health_score_avg: 50,
        ai_summary: null,
      },
      recent: { running: [], gym: [], meals: [], sleep: [], body: [] },
      profile: {
        displayName: "市民健康",
        preferredLanguage: "zh-Hant",
        memoryEnabled: false,
        goal: "減脂",
        location: "香港",
        fitnessLevel: "初級",
      },
      goals: [],
      memoryCount: 0,
      charts: { activity: [], runningDistance: [], water: [], nutrition: [], gymVolume: [] },
      empty: true,
      recommendation: {} as DashboardData["recommendation"],
    });

    expect(recommendation.nutrition.title).toContain("蛋白");
    expect(recommendation.safetyNote).toContain("胸痛");
  });

  it("rate-limits unauthenticated fallback requests in memory", () => {
    const first = checkIpRateLimit({
      ip: "203.0.113.10",
      route: "/api/test-rate-limit",
      limit: 1,
      windowMs: 60_000,
    });
    const second = checkIpRateLimit({
      ip: "203.0.113.10",
      route: "/api/test-rate-limit",
      limit: 1,
      windowMs: 60_000,
    });

    expect(first.allowed).toBe(true);
    expect(second.allowed).toBe(false);
  });
});
