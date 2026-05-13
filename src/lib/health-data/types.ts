export type LocaleCode = "zh-Hant" | "en";

export type DateRange = {
  from?: string;
  to?: string;
  limit?: number;
};

export type HealthMemoryCategory =
  | "profile"
  | "fitness"
  | "nutrition"
  | "healthcare"
  | "insurance"
  | "behavior";

export type DailyCheckinType =
  | "wake_up"
  | "meal"
  | "water"
  | "exercise"
  | "health_review";

export type DailyCheckinRow = {
  id: string;
  user_id: string;
  checkin_type: DailyCheckinType;
  label: string | null;
  amount: number | string | null;
  unit: string | null;
  note: string | null;
  metadata: Record<string, string | number | boolean | null>;
  created_at: string;
};

export type RunningLogRow = {
  id: string;
  user_id: string;
  distance_km: number | string | null;
  duration_seconds: number | null;
  pace: string | null;
  heart_rate_avg: number | null;
  calories: number | null;
  rpe: number | null;
  route_notes: string | null;
  weather: string | null;
  shoe: string | null;
  notes: string | null;
  created_at: string;
};

export type GymLogRow = {
  id: string;
  user_id: string;
  workout_title: string | null;
  exercise_name: string;
  muscle_group: string | null;
  sets: number | null;
  reps: number | null;
  weight_kg: number | string | null;
  rest_seconds: number | null;
  rpe: number | null;
  notes: string | null;
  created_at: string;
};

export type MealRow = {
  id: string;
  user_id: string;
  meal_type: string;
  food_name: string;
  calories: number | null;
  protein_g: number | string | null;
  carbs_g: number | string | null;
  fat_g: number | string | null;
  fiber_g: number | string | null;
  sugar_g: number | string | null;
  sodium_mg: number | string | null;
  notes: string | null;
  created_at: string;
};

export type WaterLogRow = {
  id: string;
  user_id: string;
  amount_ml: number;
  created_at: string;
};

export type SleepLogRow = {
  id: string;
  user_id: string;
  sleep_hours: number | string | null;
  bedtime: string | null;
  wake_time: string | null;
  sleep_quality: number | null;
  notes: string | null;
  created_at: string;
};

export type BodyMetricRow = {
  id: string;
  user_id: string;
  weight_kg: number | string | null;
  waist_cm: number | string | null;
  body_fat_percentage: number | string | null;
  notes: string | null;
  created_at: string;
};

export type GoalRow = {
  id: string;
  user_id: string;
  title: string;
  goal_type: string;
  target_value: number | string | null;
  current_value: number | string | null;
  unit: string | null;
  deadline: string | null;
  weekly_action: string | null;
  status: "active" | "paused" | "completed" | "archived";
  created_at: string;
  updated_at: string;
};

export type HealthMemoryRow = {
  id: string;
  user_id: string;
  memory_type: HealthMemoryCategory;
  content: string;
  source: string;
  consent_status: "saved" | "declined" | "edited" | "deleted";
  created_at: string;
  updated_at: string;
};

export type DailyHealthSummary = {
  id?: string;
  user_id: string;
  summary_date: string;
  calories_total: number;
  protein_total: number;
  carbs_total: number;
  fat_total: number;
  water_total_ml: number;
  sleep_hours: number;
  sleep_quality: number;
  running_distance_km: number;
  active_minutes: number;
  gym_sessions: number;
  health_score: number;
  activity_score: number;
  nutrition_score: number;
  sleep_score: number;
  hydration_score: number;
  created_at?: string;
  updated_at?: string;
};

export type WeeklyHealthSummary = {
  id?: string;
  user_id: string;
  week_start_date: string;
  running_distance_km: number;
  gym_sessions: number;
  avg_sleep_hours: number;
  protein_consistency_days: number;
  water_goal_days: number;
  workout_days: number;
  health_score_avg: number;
  ai_summary: string | null;
  created_at?: string;
  updated_at?: string;
};

export type TodayRecommendation = {
  workout: RecommendationBlock;
  nutrition: RecommendationBlock;
  foodGaps: RecommendationBlock[];
  recovery: RecommendationBlock;
  learning: Omit<RecommendationBlock, "reason">;
  safetyNote: string;
};

export type RecommendationBlock = {
  title: string;
  summary: string;
  reason: string;
  action: string;
};

export type DashboardData = {
  profile: {
    displayName: string;
    preferredLanguage: LocaleCode;
    memoryEnabled: boolean;
    goal: string;
    location: string;
    fitnessLevel: string;
  };
  today: DailyHealthSummary;
  weekly: WeeklyHealthSummary;
  recent: {
    running: RunningLogRow[];
    gym: GymLogRow[];
    meals: MealRow[];
    sleep: SleepLogRow[];
    body: BodyMetricRow[];
    checkins: DailyCheckinRow[];
  };
  goals: GoalRow[];
  memoryCount: number;
  recommendation: TodayRecommendation;
  charts: {
    activity: Array<{ label: string; value: number; secondary?: number }>;
    runningDistance: Array<{ label: string; value: number }>;
    water: Array<{ label: string; value: number }>;
    nutrition: Array<{ label: string; value: number; secondary?: number }>;
    gymVolume: Array<{ label: string; value: number }>;
  };
  empty: boolean;
};

export type CoachResponse = {
  answer: string;
  reason: string;
  nextStep: string;
  safetyNote: string;
  category: "fitness" | "nutrition" | "healthcare" | "insurance" | "learning" | "general";
  memorySuggestion: {
    shouldSuggest: boolean;
    category: HealthMemoryCategory;
    content: string;
  } | null;
};

export type SymptomRoutingResponse = {
  redFlagDetected: boolean;
  careLevel: "emergency" | "gp" | "specialist" | "self-care-education";
  summary: string;
  reason: string;
  nextStep: string;
  safetyNote: string;
  notDiagnosis: "這不是診斷。";
};

export type InsuranceHelperResponse = {
  summary: string;
  possibleMeaning: string;
  questionsToAskInsurer: string[];
  documentsToPrepare: string[];
  disclaimer: string;
};

export const MEDICAL_DISCLAIMER_ZH =
  "這不是診斷。本應用只提供健康教育、生活方式建議、健身與營養方向、香港醫療導航及一般保險教育，不能取代醫生或持牌專業人士。";

export const EMERGENCY_COPY_ZH =
  "如有胸痛、嚴重呼吸困難、中風徵象、昏迷、嚴重出血、嚴重過敏反應或其他危急情況，請立即致電 999 或前往急症室。";

export const INSURANCE_DISCLAIMER_ZH =
  "本內容只屬一般保險教育，並非保險、法律或財務建議，亦不保證索償結果。請向你的保險公司、持牌保險中介或相關專業人士確認。";
