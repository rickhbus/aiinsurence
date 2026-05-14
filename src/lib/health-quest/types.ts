import type { DailyCheckinRow } from "@/lib/health-data/types";
import type { DailyHealthSummary, HealthContext, SafetyStatus } from "@/lib/health-os/types";

export type QuestLocale = "zh-Hant" | "en" | "bilingual";

export type LocalizedText = {
  en: string;
  zh: string;
};

export type QuestType =
  | "wake"
  | "water"
  | "meal"
  | "movement"
  | "mood"
  | "toilet_optional"
  | "sleep_prep"
  | "health_review"
  | "doctor_prep"
  | "recovery"
  | "learn";

export type QuestDifficulty = "tiny" | "easy" | "normal" | "challenge";

export type AdaptationReason =
  | "low_completion"
  | "high_completion"
  | "repeated_skip"
  | "low_energy"
  | "low_mood"
  | "poor_sleep"
  | "pain_or_soreness"
  | "dehydration_signal"
  | "recovery_day"
  | "safety_block"
  | "user_preference"
  | "time_budget"
  | "new_user"
  | "streak_risk";

export type CoachStyle =
  | "gentle"
  | "direct"
  | "family_doctor"
  | "gym"
  | "calm"
  | "bilingual";

export type HealthQuestPlanLevel = "free" | "plus" | "pro" | "family" | "business";

export type HealthQuestFeature =
  | "daily_quest_path"
  | "basic_streak"
  | "basic_xp"
  | "basic_lessons"
  | "seven_day_progress"
  | "safety_guidance"
  | "recovery_mode"
  | "basic_doctor_prep"
  | "custom_quest_path"
  | "richer_weekly_review"
  | "coach_explanations"
  | "more_streak_freezes"
  | "mood_pattern_insights"
  | "food_pattern_insights"
  | "more_lessons"
  | "advanced_trends"
  | "doctor_summary_export"
  | "gym_progression_insights"
  | "personalized_lesson_path"
  | "long_range_reports"
  | "family_circles"
  | "caregiver_sharing"
  | "family_challenges"
  | "family_weekly_summary";

export type QuestCoachResponse = {
  encouragement: LocalizedText;
  reason: LocalizedText;
  nextTinyStep: LocalizedText;
  safetyNote: LocalizedText;
  notDiagnosis: LocalizedText;
};

export type UserHealthQuestProfile = {
  userId: string;
  primaryGoal: string;
  dailyTimeBudget: "thirty_seconds" | "two_minutes" | "five_minutes" | "ten_minutes";
  hardestBarrier?: string | null;
  startingPath: string;
  preferredLocale: QuestLocale;
  coachStyle: CoachStyle;
  onboardingCompletedAt?: string | null;
};

export type UserQuestPreferences = {
  userId: string;
  preferredQuestTime: "morning" | "midday" | "evening" | "no_preference";
  reminderEnabled: boolean;
  reminderTime?: string | null;
  recoveryModeDefault: boolean;
  minimumRequiredQuests: number;
  maxDailyQuests: number;
  preferredDifficulty: QuestDifficulty;
  morningReminderEnabled?: boolean;
  morningReminderTime?: string | null;
  waterReminderEnabled?: boolean;
  eveningReviewEnabled?: boolean;
  weeklyReviewEnabled?: boolean;
  notificationQuietHoursStart?: string | null;
  notificationQuietHoursEnd?: string | null;
};

export type QuestAdaptationInput = {
  userId: string;
  localDate: string;
  locale: QuestLocale;
  profile?: UserHealthQuestProfile | null;
  preferences?: UserQuestPreferences | null;
  last7DaysCompletionRate: number;
  last30DaysCompletionRate: number;
  last7DaysQuestTypes: QuestType[];
  skippedQuestTypes: QuestType[];
  repeatedSkipCounts: Record<QuestType, number>;
  recoveryDaysLast7: number;
  safetyEventsLast30: number;
  preferredQuestTime?: "morning" | "midday" | "evening" | "no_preference";
  userGoal?: string;
  energyTrend: "down" | "stable" | "up" | "unknown";
  moodTrend: "down" | "stable" | "up" | "unknown";
  hydrationConsistency: number;
  movementConsistency: number;
  sleepConsistency: number;
  currentStreak: number;
  streakAtRisk: boolean;
  painOrSoreness?: boolean;
};

export type AdaptiveQuestPlan = {
  difficulty: QuestDifficulty;
  minimumRequiredQuests: number;
  maxDailyQuests: number;
  adaptationReasons: AdaptationReason[];
  questTypeBias: QuestType[];
  avoidQuestTypes: QuestType[];
  offerChallengeQuest: boolean;
  recoveryModeRecommended: boolean;
  coachNote: LocalizedText;
};

export type QuestStatus =
  | "locked"
  | "active"
  | "done"
  | "skipped"
  | "recovery"
  | "blocked_by_safety";

export type QuestSafetyLevel = "normal" | "caution" | "urgent";

export type DailyQuestSource = "generated" | "template" | "manual" | "recovery";

export type DailyQuest = {
  id: string;
  userId?: string;
  localDate: string;
  type: QuestType;
  title: LocalizedText;
  description: LocalizedText;
  actionLabel: LocalizedText;
  completedLabel: LocalizedText;
  xp: number;
  required: boolean;
  status: QuestStatus;
  orderIndex: number;
  unlocksAfter?: string[];
  safetyLevel: QuestSafetyLevel;
  source: DailyQuestSource;
  metadata: Record<string, unknown>;
  completedAt?: string | null;
  skippedAt?: string | null;
};

export type UserStreak = {
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate: string | null;
  streakFreezeCount: number;
  protectedToday: boolean;
  totalFreezesEarned?: number;
  totalFreezesConsumed?: number;
  lastFreezeEarnedAt?: string | null;
  lastFreezeConsumedAt?: string | null;
};

export type EnergyBattery = {
  score: number;
  label: "low" | "medium" | "high";
  recommendedIntensity: "rest" | "light" | "normal" | "challenge";
  reasons: string[];
};

export type XPEvent = {
  id: string;
  questId?: string;
  amount: number;
  reason: string;
  createdAt: string;
  eventKey?: string | null;
};

export type DailyQuestMode = "normal" | "recovery" | "safety";

export type DailyQuestState = {
  localDate: string;
  quests: DailyQuest[];
  completedCount: number;
  requiredCompletedCount: number;
  totalRequiredCount: number;
  earnedXpToday: number;
  streak: UserStreak;
  energyBattery: EnergyBattery;
  mode: DailyQuestMode;
  coachNote: LocalizedText;
  safetyMessage?: LocalizedText;
  adaptivePlan?: AdaptiveQuestPlan;
};

export type QuestBuildInput = {
  userId?: string;
  localDate: string;
  existingQuests?: DailyQuest[];
  todaySummary?: DailyHealthSummary | null;
  healthContext?: HealthContext | null;
  dailyCheckins?: DailyCheckinRow[];
  moodLogs?: unknown[];
  hydrationLogs?: unknown[];
  mealLogs?: unknown[];
  gymWorkouts?: unknown[];
  safetyStatus?: SafetyStatus | "urgent" | null;
  forceMode?: DailyQuestMode;
  locale?: QuestLocale;
  now?: string;
  previousStreak?: UserStreak | null;
  xpEvents?: XPEvent[];
  profile?: UserHealthQuestProfile | null;
  preferences?: UserQuestPreferences | null;
  adaptiveInput?: Partial<QuestAdaptationInput>;
};

export type QuestCompletionInput = {
  quest: DailyQuest;
  actionPayload?: Record<string, unknown>;
  now?: string;
};

export type QuestProgressSummary = {
  currentStreak: number;
  longestStreak: number;
  xpThisWeek: number;
  xpLast30Days: number;
  completedByType: Partial<Record<QuestType, number>>;
  hydrationConsistency: number;
  movementConsistency: number;
  moodConsistency: number;
  activeDays: number;
  recoveryDays: number;
  lessonsCompleted: number;
  weeklyReviewHref: string;
  weeklyReview: LocalizedText;
};

export type DailyQuestRow = {
  id: string;
  user_id: string;
  local_date: string;
  quest_type: QuestType;
  title: LocalizedText;
  description: LocalizedText;
  action_label: LocalizedText;
  completed_label: LocalizedText;
  xp: number;
  required: boolean;
  status: QuestStatus;
  order_index: number;
  unlocks_after: string[];
  safety_level: QuestSafetyLevel;
  source: DailyQuestSource;
  metadata: Record<string, unknown>;
  completed_at: string | null;
  skipped_at: string | null;
};
