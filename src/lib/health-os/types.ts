export type LocaleCode = "zh-Hant" | "en";

export type SafetyStatus = "green" | "yellow" | "red";

export type LifestyleScores = {
  energyScore: number;
  recoveryScore: number;
  nutritionScore: number;
  stressScore: number;
  movementScore: number;
  digestiveScore: number;
  safetyStatus: SafetyStatus;
};

export type DailyLogContext = {
  wakeTime?: string | null;
  sleepMinutes?: number | null;
  sleepQuality?: number | null;
  energyScore?: number | null;
  moodScore?: number | null;
  stressScore?: number | null;
  bodyNotes?: string | null;
  todayGoal?: string | null;
};

export type MoodLogContext = {
  moodScore?: number | null;
  stressScore?: number | null;
  energyScore?: number | null;
  emotionLabel?: string | null;
  triggerCategory?: string | null;
  userText?: string | null;
  bodyLinks?: string[];
  safetyFlag?: string | null;
};

export type MealContext = {
  mealType?: string | null;
  description?: string | null;
  estimatedCalories?: number | null;
  proteinG?: number | null;
  carbsG?: number | null;
  fatG?: number | null;
  fiberG?: number | null;
  waterMl?: number | null;
  caffeineMg?: number | null;
  alcoholUnits?: number | null;
  highSugarFlag?: boolean | null;
  highSodiumFlag?: boolean | null;
  hasImage?: boolean;
};

export type HydrationContext = {
  waterMl?: number | null;
  caffeineMg?: number | null;
  alcoholUnits?: number | null;
  drinkType?: string | null;
};

export type ToiletContext = {
  bowelMovement?: boolean | null;
  stoolType?: number | null;
  urineColor?: string | null;
  painFlag?: boolean | null;
  bloodFlag?: boolean | null;
  feverFlag?: boolean | null;
  dehydrationConcern?: boolean | null;
  notes?: string | null;
};

export type GymExerciseSet = {
  exerciseName: string;
  muscleGroup?: string | null;
  setNumber: number;
  reps?: number | null;
  weightKg?: number | null;
  rpe?: number | null;
  restSeconds?: number | null;
  painFlag?: boolean | null;
  formNote?: string | null;
  unilateral?: boolean | null;
  completed?: boolean | null;
};

export type GymWorkoutContext = {
  workoutDate?: string | null;
  startedAt?: string | null;
  durationMinutes?: number | null;
  workoutType?: string | null;
  targetMuscleGroups?: string[];
  intensity?: number | null;
  sorenessBefore?: number | null;
  sorenessAfter?: number | null;
  energyBefore?: number | null;
  moodBefore?: number | null;
  moodAfter?: number | null;
  painFlag?: boolean | null;
  notes?: string | null;
  redFlagSymptoms?: string[];
  sets?: GymExerciseSet[];
  sleepMinutes?: number | null;
  stressScore?: number | null;
};

export type HealthContext = {
  locale: LocaleCode;
  dailyLog?: DailyLogContext | null;
  moodLogs?: MoodLogContext[];
  meals?: MealContext[];
  hydrationLogs?: HydrationContext[];
  toiletLogs?: ToiletContext[];
  gymWorkouts?: GymWorkoutContext[];
  mobileHealthSummary?: {
    steps?: number | null;
    activeEnergyKcal?: number | null;
    workouts?: number | null;
    sleepMinutes?: number | null;
    bodyWeightKg?: number | null;
    heartRateAvg?: number | null;
  } | null;
  safetyFlags?: string[];
};

export type DailyHealthSummary = LifestyleScores & {
  summaryZh: string;
  summaryEn: string;
  nextActions: string[];
  disclaimers: string[];
};

export type GymAnalysis = {
  workoutSummary: string;
  progressionInsight: string;
  recoveryRecommendation: string;
  nutritionLink: string;
  moodLink: string;
  nextWorkoutSuggestion: string;
  safetyFlags: string[];
  safetyStatus: SafetyStatus;
  disclaimers: string[];
};

export type MoodAnalysis = {
  emotionLabel: string;
  userFacingReflection: string;
  distressLevel: "low" | "medium" | "high" | "crisis";
  suggestedSmallAction: string;
  safetyFlags: string[];
  disclaimers: string[];
};

export type FoodAnalysis = {
  summary: string;
  estimated: boolean;
  imageAnalysisPending: boolean;
  recoveryNote: string;
  hydrationNote: string;
  digestionNote: string;
  safetyFlags: string[];
  disclaimers: string[];
};

export type ToiletAnalysis = {
  summary: string;
  hydrationHint: string;
  safetyFlag: string | null;
  safetyStatus: SafetyStatus;
  nextAction: string;
  disclaimers: string[];
};

export type HydrationAnalysis = {
  summary: string;
  sleepMoodHint: string;
  nextAction: string;
  safetyStatus: SafetyStatus;
  disclaimers: string[];
};

export type WeeklyReport = {
  overview: string;
  trends: string[];
  warnings: string[];
  nextWeekActions: string[];
  doctorPrep: string | null;
  gymAdjustment: string;
  disclaimers: string[];
};
