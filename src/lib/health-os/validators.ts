import { z } from "zod";

const optionalText = (max = 1000) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .nullable()
    .transform((value) => value || null);

const scoreSchema = z.coerce.number().int().min(1).max(10).optional().nullable();
const dateSchema = z.string().date().optional().nullable();
const dateTimeSchema = z.string().datetime().optional().nullable();

export const healthOsLocaleSchema = z.enum(["zh-Hant", "en"]).default("zh-Hant");

export const dailyHealthCheckInSchema = z.object({
  logDate: dateSchema,
  wakeTime: dateTimeSchema,
  sleepMinutes: z.coerce.number().int().min(0).max(1440).optional().nullable(),
  sleepQuality: scoreSchema,
  energyScore: scoreSchema,
  moodScore: scoreSchema,
  stressScore: scoreSchema,
  bodyNotes: optionalText(1000),
  todayGoal: optionalText(240),
  consentToSave: z.boolean().default(false),
});

export const moodLogSchema = z.object({
  moodScore: scoreSchema,
  stressScore: scoreSchema,
  energyScore: scoreSchema,
  emotionLabel: z.enum([
    "neutral",
    "anxious",
    "frustrated",
    "angry",
    "overwhelmed",
    "sad",
    "hopeful",
    "relieved",
    "urgent",
    "confused",
    "tired",
    "stressed",
    "unknown",
  ]).optional().nullable(),
  triggerCategory: z.enum([
    "work",
    "family",
    "money",
    "health",
    "relationship",
    "study",
    "sleep",
    "body_image",
    "unknown",
  ]).default("unknown"),
  bodyLinks: z.array(z.enum([
    "poor_sleep",
    "low_food",
    "high_caffeine",
    "low_movement",
    "heavy_workout",
    "pain",
    "dehydration",
  ])).max(8).default([]),
  userText: optionalText(2000),
  consentToSave: z.boolean().default(false),
  language: healthOsLocaleSchema,
});

export const foodLogSchema = z.object({
  mealTime: dateTimeSchema,
  mealType: z.enum(["breakfast", "lunch", "dinner", "snack", "drink"]),
  imagePath: optionalText(500),
  description: optionalText(1000),
  estimatedCalories: z.coerce.number().int().min(0).max(5000).optional().nullable(),
  proteinG: z.coerce.number().min(0).max(500).optional().nullable(),
  carbsG: z.coerce.number().min(0).max(800).optional().nullable(),
  fatG: z.coerce.number().min(0).max(400).optional().nullable(),
  fiberG: z.coerce.number().min(0).max(200).optional().nullable(),
  waterMl: z.coerce.number().int().min(0).max(5000).optional().nullable(),
  caffeineMg: z.coerce.number().int().min(0).max(1200).optional().nullable(),
  alcoholUnits: z.coerce.number().min(0).max(30).optional().nullable(),
  highSugarFlag: z.boolean().default(false),
  highSodiumFlag: z.boolean().default(false),
  aiSummary: optionalText(1200),
  consentToSave: z.boolean().default(false),
});

export const hydrationLogSchema = z.object({
  loggedAt: dateTimeSchema,
  waterMl: z.coerce.number().int().min(0).max(5000).default(0),
  caffeineMg: z.coerce.number().int().min(0).max(1200).default(0),
  alcoholUnits: z.coerce.number().min(0).max(30).default(0),
  drinkType: optionalText(80),
  notes: optionalText(500),
});

export const toiletLogSchema = z.object({
  loggedAt: dateTimeSchema,
  bowelMovement: z.boolean().optional().nullable(),
  stoolType: z.coerce.number().int().min(1).max(7).optional().nullable(),
  urineColor: z.enum(["clear", "pale_yellow", "yellow", "dark_yellow", "brown_red_pink", "unknown"]).default("unknown"),
  painFlag: z.boolean().default(false),
  bloodFlag: z.boolean().default(false),
  feverFlag: z.boolean().default(false),
  dehydrationConcern: z.boolean().default(false),
  notes: optionalText(1000),
});

export const gymExerciseSetSchema = z.object({
  exerciseName: z.string().trim().min(1).max(120),
  muscleGroup: optionalText(80),
  setNumber: z.coerce.number().int().min(1).max(100),
  reps: z.coerce.number().int().min(0).max(300).optional().nullable(),
  weightKg: z.coerce.number().min(0).max(1000).optional().nullable(),
  rpe: scoreSchema,
  restSeconds: z.coerce.number().int().min(0).max(7200).optional().nullable(),
  painFlag: z.boolean().default(false),
  formNote: optionalText(500),
  unilateral: z.boolean().optional().nullable(),
  completed: z.boolean().default(true),
});

export const gymWorkoutSchema = z.object({
  workoutDate: dateSchema,
  startedAt: dateTimeSchema,
  endedAt: dateTimeSchema,
  durationMinutes: z.coerce.number().int().min(0).max(1440).optional().nullable(),
  workoutType: optionalText(120),
  targetMuscleGroups: z.array(z.string().trim().min(1).max(80)).max(12).default([]),
  intensity: scoreSchema,
  sorenessBefore: scoreSchema,
  sorenessAfter: scoreSchema,
  energyBefore: scoreSchema,
  moodBefore: scoreSchema,
  moodAfter: scoreSchema,
  painFlag: z.boolean().default(false),
  redFlagSymptoms: z.array(z.string().trim().max(120)).max(12).default([]),
  sleepMinutes: z.coerce.number().int().min(0).max(1440).optional().nullable(),
  stressScore: scoreSchema,
  notes: optionalText(1000),
  sets: z.array(gymExerciseSetSchema).max(120).default([]),
});

export const workoutTemplateInputSchema = z.object({
  name: z.string().trim().min(1).max(140),
  goal: optionalText(120),
  level: optionalText(80),
  daysPerWeek: z.coerce.number().int().min(1).max(7).optional().nullable(),
  templateJson: z.record(z.string(), z.unknown()).default({}),
});

export const dailyReportInputSchema = z.object({
  language: healthOsLocaleSchema,
  dailyLog: dailyHealthCheckInSchema.partial().optional(),
  moodLogs: z.array(moodLogSchema.partial()).max(20).default([]),
  meals: z.array(foodLogSchema.partial()).max(20).default([]),
  hydrationLogs: z.array(hydrationLogSchema.partial()).max(30).default([]),
  toiletLogs: z.array(toiletLogSchema.partial()).max(10).default([]),
  gymWorkouts: z.array(gymWorkoutSchema.partial()).max(10).default([]),
});

export const weeklyReportQuerySchema = z.object({
  weekStartDate: z.string().date().optional(),
  language: healthOsLocaleSchema,
});

export const businessLeadSchema = z.object({
  leadType: z.enum(["gym", "personal_trainer", "employer", "clinic", "insurance_adviser", "other"]),
  companyName: z.string().trim().min(1).max(160),
  contactName: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(200),
  phone: optionalText(40),
  message: optionalText(1500),
  consentToContact: z.literal(true),
});

export type DailyHealthCheckInInput = z.infer<typeof dailyHealthCheckInSchema>;
export type MoodLogInput = z.infer<typeof moodLogSchema>;
export type FoodLogInput = z.infer<typeof foodLogSchema>;
export type HydrationLogInput = z.infer<typeof hydrationLogSchema>;
export type ToiletLogInput = z.infer<typeof toiletLogSchema>;
export type GymWorkoutInput = z.infer<typeof gymWorkoutSchema>;
export type BusinessLeadInput = z.infer<typeof businessLeadSchema>;
