import type { DailyCheckinRow } from "@/lib/health-data/types";
import type { DailyHealthSummary, HealthContext, SafetyStatus } from "@/lib/health-os/types";

export type QuestLocale = "zh-Hant" | "en";

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
