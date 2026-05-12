import { z } from "zod";

const optionalText = (max = 1000) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .nullable()
    .transform((value) => (value ? value : null));

const createdAtSchema = z
  .string()
  .datetime()
  .optional();

export const localeSchema = z.enum(["zh-Hant", "en"]).default("zh-Hant");

export const runningLogInputSchema = z.object({
  distance_km: z.coerce.number().positive().max(100),
  duration_seconds: z.coerce.number().int().positive().max(86400),
  pace: optionalText(24),
  heart_rate_avg: z.coerce.number().int().min(30).max(240).optional().nullable(),
  calories: z.coerce.number().int().min(0).max(5000).optional().nullable(),
  rpe: z.coerce.number().int().min(1).max(10),
  route_notes: optionalText(500),
  weather: optionalText(80),
  shoe: optionalText(80),
  notes: optionalText(1000),
  created_at: createdAtSchema,
});

export const gymLogInputSchema = z.object({
  workout_title: optionalText(120),
  exercise_name: z.string().trim().min(1).max(120),
  muscle_group: optionalText(60),
  sets: z.coerce.number().int().min(1).max(60),
  reps: z.coerce.number().int().min(1).max(300),
  weight_kg: z.coerce.number().min(0).max(1000).optional().nullable(),
  rest_seconds: z.coerce.number().int().min(0).max(7200).optional().nullable(),
  rpe: z.coerce.number().int().min(1).max(10).optional().nullable(),
  notes: optionalText(1000),
  created_at: createdAtSchema,
});

export const mealInputSchema = z.object({
  meal_type: z.enum(["breakfast", "lunch", "dinner", "snack", "other"]),
  food_name: z.string().trim().min(1).max(160),
  calories: z.coerce.number().int().min(0).max(5000).optional().nullable(),
  protein_g: z.coerce.number().min(0).max(500).optional().nullable(),
  carbs_g: z.coerce.number().min(0).max(800).optional().nullable(),
  fat_g: z.coerce.number().min(0).max(400).optional().nullable(),
  fiber_g: z.coerce.number().min(0).max(200).optional().nullable(),
  sugar_g: z.coerce.number().min(0).max(400).optional().nullable(),
  sodium_mg: z.coerce.number().min(0).max(20000).optional().nullable(),
  notes: optionalText(1000),
  created_at: createdAtSchema,
});

export const waterInputSchema = z.object({
  amount_ml: z.coerce.number().int().min(1).max(5000),
  created_at: createdAtSchema,
});

export const sleepInputSchema = z.object({
  sleep_hours: z.coerce.number().min(0).max(24),
  bedtime: optionalText(16),
  wake_time: optionalText(16),
  sleep_quality: z.coerce.number().int().min(1).max(10).optional().nullable(),
  notes: optionalText(1000),
  created_at: createdAtSchema,
});

export const bodyMetricInputSchema = z.object({
  weight_kg: z.coerce.number().min(1).max(500).optional().nullable(),
  waist_cm: z.coerce.number().min(1).max(300).optional().nullable(),
  body_fat_percentage: z.coerce.number().min(1).max(80).optional().nullable(),
  notes: optionalText(1000),
  created_at: createdAtSchema,
}).refine(
  (value) =>
    value.weight_kg != null ||
    value.waist_cm != null ||
    value.body_fat_percentage != null,
  { message: "At least one body metric is required." },
);

export const dailyCheckinInputSchema = z.object({
  checkin_type: z.enum(["wake_up", "meal", "water", "exercise", "health_review"]),
  label: optionalText(120),
  amount: z.coerce.number().min(0).max(100000).optional().nullable(),
  unit: optionalText(40),
  note: optionalText(240),
  metadata: z
    .record(z.string(), z.union([z.string().max(120), z.number(), z.boolean(), z.null()]))
    .optional()
    .default({}),
  created_at: createdAtSchema,
});

export const goalInputSchema = z.object({
  title: z.string().trim().min(1).max(140),
  goal_type: z.enum([
    "lose_fat",
    "build_muscle",
    "run_5k",
    "run_10k",
    "build_gym_habit",
    "drink_more_water",
    "improve_sleep",
    "eat_more_protein",
    "learn_health_basics",
  ]),
  target_value: z.coerce.number().min(0).max(100000).optional().nullable(),
  current_value: z.coerce.number().min(0).max(100000).optional().nullable(),
  unit: optionalText(40),
  deadline: z.string().date().optional().nullable(),
  weekly_action: optionalText(240),
  status: z.enum(["active", "paused", "completed", "archived"]).default("active"),
});

export const healthMemoryInputSchema = z.object({
  memory_type: z.enum(["profile", "fitness", "nutrition", "healthcare", "insurance", "behavior"]),
  content: z.string().trim().min(1).max(600),
  source: z.string().trim().min(1).max(80).default("user_confirmed"),
});

export const healthMemoryUpdateSchema = z.object({
  id: z.string().trim().min(1),
  memory_type: z
    .enum(["profile", "fitness", "nutrition", "healthcare", "insurance", "behavior"])
    .optional(),
  content: z.string().trim().min(1).max(600).optional(),
});

export const healthMemoryDeleteSchema = z.object({
  id: z.string().trim().min(1),
});

export const memorySuggestInputSchema = z.object({
  message: z.string().trim().min(1).max(2000),
  language: localeSchema,
});

export const coachInputSchema = z.object({
  message: z.string().trim().min(1).max(2000),
  language: localeSchema,
  category: z.enum(["fitness", "nutrition", "healthcare", "insurance", "learning", "general"]).optional(),
});

export const todayRecommendationInputSchema = z.object({
  force: z.boolean().optional().default(false),
  language: localeSchema,
});

export const symptomRoutingInputSchema = z.object({
  input: z.string().trim().min(1).max(2000),
  duration: optionalText(120),
  severity: z.enum(["mild", "moderate", "severe"]).optional().nullable(),
  carePreference: z.enum(["public", "private", "either", "not_sure"]).optional().nullable(),
  language: localeSchema,
});

export const insuranceHelperInputSchema = z.object({
  topic: z.string().trim().min(1).max(160),
  text: z.string().trim().min(1).max(3000),
  insurance_type: z.enum([
    "hospital",
    "outpatient",
    "critical_illness",
    "accident",
    "dental",
    "travel",
    "other",
  ]).default("other"),
  language: localeSchema,
});

export const weeklyReportInputSchema = z.object({
  week_start_date: z.string().date().optional(),
  force: z.boolean().optional().default(false),
  language: localeSchema,
});

export const recalculateSummaryInputSchema = z.object({
  date: z.string().date(),
});

export const onboardingInputSchema = z.object({
  language: z.enum(["zh-Hant", "en", "bilingual"]).default("zh-Hant"),
  user_type: z.enum(["patient_member", "provider_admin", "broker_benefits_adviser", "employer_hr"]),
  main_goal: z.enum([
    "lose_fat",
    "build_muscle",
    "run_5k",
    "sleep_better",
    "eat_better",
    "hk_care_navigation",
  ]),
  fitness_level: z.enum(["beginner", "returning", "consistent", "advanced"]),
  nutrition_preference: z.enum([
    "balanced",
    "high_protein",
    "lower_sugar",
    "vegetarian",
    "no_preference",
  ]),
  hk_care_preference: z.enum(["public", "private", "either", "not_sure"]),
  insurance_interests: z.array(z.enum([
    "inpatient_vhis",
    "outpatient",
    "dental",
    "maternity",
    "travel",
    "critical_illness",
    "life_income_protection",
    "claims_explanation",
  ])).max(8).default([]),
  health_tracking_interests: z.array(z.enum([
    "running",
    "gym",
    "meals",
    "water",
    "sleep",
    "body_metrics",
  ])).max(6).default([]),
  mobile_health_sync_interest: z
    .enum(["apple_health", "android_health_connect", "not_now"])
    .default("not_now"),
  save_profile_preferences: z.boolean().default(false),
  save_health_logs: z.boolean().default(false),
  save_ai_history: z.boolean().default(false),
  adviser_handoff_consent: z.boolean().default(false),
  analytics_consent: z.boolean().default(false),
  memory_consent_granted: z.boolean(),
  privacy_acknowledged: z.literal(true),
  first_action: z.enum(["water", "run", "gym", "meal", "goal"]),
});

export function getValidationError(error: z.ZodError) {
  const first = error.issues[0];

  return first?.message || "請輸入有效數值。";
}

export type RunningLogInput = z.infer<typeof runningLogInputSchema>;
export type GymLogInput = z.infer<typeof gymLogInputSchema>;
export type MealInput = z.infer<typeof mealInputSchema>;
export type WaterInput = z.infer<typeof waterInputSchema>;
export type SleepInput = z.infer<typeof sleepInputSchema>;
export type BodyMetricInput = z.infer<typeof bodyMetricInputSchema>;
export type DailyCheckinInput = z.infer<typeof dailyCheckinInputSchema>;
export type GoalInput = z.infer<typeof goalInputSchema>;
export type HealthMemoryInput = z.infer<typeof healthMemoryInputSchema>;
export type HealthMemoryUpdateInput = z.infer<typeof healthMemoryUpdateSchema>;
export type OnboardingInput = z.infer<typeof onboardingInputSchema>;
