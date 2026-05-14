import type { EntitlementPlan } from "@/lib/payments/entitlements";
import type { HealthQuestFeature, HealthQuestPlanLevel } from "./types";

const safetyFeatures: HealthQuestFeature[] = ["safety_guidance", "recovery_mode"];

const planFeatures: Record<HealthQuestPlanLevel, HealthQuestFeature[]> = {
  free: [
    "daily_quest_path",
    "basic_streak",
    "basic_xp",
    "basic_lessons",
    "seven_day_progress",
    "safety_guidance",
    "recovery_mode",
    "basic_doctor_prep",
  ],
  plus: [
    "daily_quest_path",
    "basic_streak",
    "basic_xp",
    "basic_lessons",
    "seven_day_progress",
    "safety_guidance",
    "recovery_mode",
    "basic_doctor_prep",
    "custom_quest_path",
    "richer_weekly_review",
    "coach_explanations",
    "more_streak_freezes",
    "mood_pattern_insights",
    "food_pattern_insights",
    "more_lessons",
  ],
  pro: [
    "daily_quest_path",
    "basic_streak",
    "basic_xp",
    "basic_lessons",
    "seven_day_progress",
    "safety_guidance",
    "recovery_mode",
    "basic_doctor_prep",
    "custom_quest_path",
    "richer_weekly_review",
    "coach_explanations",
    "more_streak_freezes",
    "mood_pattern_insights",
    "food_pattern_insights",
    "more_lessons",
    "advanced_trends",
    "doctor_summary_export",
    "gym_progression_insights",
    "personalized_lesson_path",
    "long_range_reports",
  ],
  family: [
    "daily_quest_path",
    "basic_streak",
    "basic_xp",
    "basic_lessons",
    "seven_day_progress",
    "safety_guidance",
    "recovery_mode",
    "basic_doctor_prep",
    "custom_quest_path",
    "richer_weekly_review",
    "coach_explanations",
    "more_streak_freezes",
    "mood_pattern_insights",
    "food_pattern_insights",
    "more_lessons",
    "family_circles",
    "caregiver_sharing",
    "family_challenges",
    "family_weekly_summary",
  ],
  business: [
    "daily_quest_path",
    "basic_streak",
    "basic_xp",
    "basic_lessons",
    "seven_day_progress",
    "safety_guidance",
    "recovery_mode",
    "basic_doctor_prep",
    "advanced_trends",
    "family_weekly_summary",
  ],
};

export function normalizeHealthQuestPlan(plan: EntitlementPlan | string | null | undefined): HealthQuestPlanLevel {
  if (plan === "family") {
    return "family";
  }

  if (plan === "pro") {
    return "pro";
  }

  if (plan === "plus" || plan === "care") {
    return "plus";
  }

  if (plan === "business") {
    return "business";
  }

  return "free";
}

export function featuresForHealthQuestPlan(plan: HealthQuestPlanLevel) {
  return new Set([...planFeatures[plan], ...safetyFeatures]);
}

export function canUseHealthQuestFeature(plan: HealthQuestPlanLevel, feature: HealthQuestFeature) {
  if (safetyFeatures.includes(feature)) {
    return true;
  }

  return featuresForHealthQuestPlan(plan).has(feature);
}

export function assertSafetyNeverGated(plan: HealthQuestPlanLevel) {
  return safetyFeatures.every((feature) => canUseHealthQuestFeature(plan, feature));
}
