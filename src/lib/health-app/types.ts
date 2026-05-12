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

export type HealthPage =
  | "landing"
  | "today"
  | "check-in"
  | "mood"
  | "food"
  | "hydration"
  | "toilet"
  | "gym-templates"
  | "reports"
  | "family"
  | "doctor"
  | "pricing"
  | "business"
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
  | "gbl"
  | "emotion"
  | "history"
  | "healthcare"
  | "symptom-routing"
  | "insurance"
  | "progress"
  | "goals"
  | "profile"
  | "memory"
  | "settings"
  | "auth"
  | "onboarding";

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
