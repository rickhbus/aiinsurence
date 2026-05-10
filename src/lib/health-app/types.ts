import type { LucideIcon } from "lucide-react";

export type Locale = "zh-Hant" | "en";

export type LocalizedText = {
  zh: string;
  en: string;
};

export type MetricDatum = {
  label: string;
  value: number;
  secondary?: number;
};

export type MacroDatum = {
  name: string;
  value: number;
  fill: string;
};

export type HealthMetric = {
  label: LocalizedText;
  value: string;
  detail: LocalizedText;
  progress?: number;
  icon?: LucideIcon;
};

export type RunningLog = {
  id: string;
  date: string;
  distanceKm: number;
  durationSeconds: number;
  pace: string;
  calories: number;
  heartRateAvg: number;
  rpe: number;
  routeNotes: string;
  weather?: string;
  shoe?: string;
  notes: string;
};

export type GymLog = {
  id: string;
  date: string;
  workout: string;
  exerciseName: string;
  muscleGroup: string;
  sets: number;
  reps: number;
  weightKg: number;
  restSeconds: number;
  rpe: number;
  notes: string;
};

export type MealLog = {
  id: string;
  date: string;
  mealType: string;
  foodName: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  sugarG: number;
  sodiumMg: number;
  waterMl: number;
  notes: string;
};

export type SleepLog = {
  id: string;
  date: string;
  hours: number;
  quality: number;
  notes: string;
};

export type Goal = {
  id: string;
  type: LocalizedText;
  target: string;
  deadline: string;
  weeklyActions: LocalizedText[];
  progress: number;
  suggestion: LocalizedText;
};

export type Lesson = {
  slug: string;
  title: LocalizedText;
  category: LocalizedText;
  difficulty: LocalizedText;
  explanation: LocalizedText;
  example: LocalizedText;
  actionStep: LocalizedText;
  quizQuestion: LocalizedText;
  relatedTracker: LocalizedText;
};

export type MemoryCategory =
  | "profile"
  | "fitness"
  | "nutrition"
  | "healthcare"
  | "insurance"
  | "behavior";

export type MemoryItem = {
  id: string;
  category: MemoryCategory;
  title: LocalizedText;
  content: LocalizedText;
  source: LocalizedText;
  consentStatus: "saved" | "pending" | "off";
  updatedAt: string;
};

export type DemoUser = {
  displayName: string;
  goal: LocalizedText;
  location: LocalizedText;
  language: LocalizedText;
  fitnessLevel: LocalizedText;
  carePreference: LocalizedText;
  foodPreference: LocalizedText;
};

export type HealthPage =
  | "dashboard"
  | "coach"
  | "track"
  | "running"
  | "gym"
  | "walking"
  | "sports"
  | "body"
  | "sleep"
  | "water"
  | "nutrition"
  | "food-log"
  | "diet-plan"
  | "learn"
  | "lesson"
  | "healthcare"
  | "symptom-routing"
  | "insurance"
  | "progress"
  | "goals"
  | "profile"
  | "memory"
  | "settings"
  | "auth";

export type CoachMessage = {
  role: "assistant" | "user";
  content: LocalizedText;
};

export type HealthcareRouteLevel =
  | "self-care"
  | "gp"
  | "specialist"
  | "emergency";

export type InsuranceType =
  | "hospital"
  | "outpatient"
  | "critical-illness"
  | "accident"
  | "dental"
  | "travel";
