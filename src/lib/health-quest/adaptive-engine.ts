import { uniqueAdaptationReasons } from "./adaptation-reasons";
import { clampQuestDifficulty, difficultyFromCompletionRate } from "./difficulty";
import type {
  AdaptationReason,
  AdaptiveQuestPlan,
  QuestAdaptationInput,
  QuestDifficulty,
  QuestType,
} from "./types";

const allQuestTypes: QuestType[] = [
  "water",
  "mood",
  "meal",
  "movement",
  "sleep_prep",
  "health_review",
  "doctor_prep",
  "learn",
];

const goalBias: Record<string, QuestType[]> = {
  better_sleep: ["sleep_prep", "mood", "water"],
  more_energy: ["water", "sleep_prep", "movement"],
  drink_more_water: ["water", "health_review", "learn"],
  eat_better: ["meal", "water", "learn"],
  move_more: ["movement", "water", "mood"],
  reduce_stress: ["mood", "sleep_prep", "movement"],
  mood_support: ["mood", "health_review", "sleep_prep"],
  doctor_prep: ["doctor_prep", "health_review", "mood"],
  family_care: ["health_review", "learn", "doctor_prep"],
  insurance_education: ["learn", "health_review", "doctor_prep"],
  easy_start: ["water", "mood", "meal"],
  energy_reset: ["water", "sleep_prep", "movement"],
  sleep_better: ["sleep_prep", "mood", "water"],
  stress_less: ["mood", "sleep_prep", "movement"],
  move_gently: ["movement", "water", "mood"],
  food_awareness: ["meal", "water", "learn"],
};

const defaultRepeatedSkipCounts = Object.fromEntries(
  [
    "wake",
    "water",
    "meal",
    "movement",
    "mood",
    "toilet_optional",
    "sleep_prep",
    "health_review",
    "doctor_prep",
    "recovery",
    "learn",
  ].map((type) => [type, 0]),
) as Record<QuestType, number>;

export function buildAdaptiveQuestPlan(input: QuestAdaptationInput): AdaptiveQuestPlan {
  const reasons: AdaptationReason[] = [];
  const repeatedSkipCounts = { ...defaultRepeatedSkipCounts, ...input.repeatedSkipCounts };
  const profileDifficulty = clampQuestDifficulty(input.preferences?.preferredDifficulty, "easy");
  const newUser = input.last30DaysCompletionRate === 0 && input.currentStreak === 0;
  let difficulty: QuestDifficulty = newUser ? "tiny" : difficultyFromCompletionRate(input.last7DaysCompletionRate);
  let minimumRequiredQuests = 3;
  let maxDailyQuests = 5;
  let offerChallengeQuest = false;
  let recoveryModeRecommended = false;
  const avoidQuestTypes: QuestType[] = [];
  const questTypeBias: QuestType[] = [];

  if (newUser) {
    reasons.push("new_user");
    difficulty = "tiny";
    minimumRequiredQuests = 2;
    maxDailyQuests = 4;
  }

  if (input.last7DaysCompletionRate < 0.4) {
    reasons.push("low_completion");
    difficulty = "tiny";
    minimumRequiredQuests = 2;
    maxDailyQuests = Math.min(maxDailyQuests, 4);
  } else if (input.last7DaysCompletionRate <= 0.7) {
    difficulty = "easy";
    minimumRequiredQuests = 3;
  } else {
    reasons.push("high_completion");
    difficulty = "normal";
    minimumRequiredQuests = 3;
    offerChallengeQuest = true;
  }

  if (input.last7DaysCompletionRate > 0.85 && input.recoveryDaysLast7 === 0 && input.safetyEventsLast30 === 0) {
    offerChallengeQuest = true;
  }

  if (input.safetyEventsLast30 > 0) {
    reasons.push("safety_block");
    difficulty = "tiny";
    minimumRequiredQuests = 0;
    maxDailyQuests = 1;
    offerChallengeQuest = false;
    recoveryModeRecommended = true;
  }

  if (repeatedSkipCounts.movement >= 3) {
    reasons.push("repeated_skip", "pain_or_soreness");
    questTypeBias.push("movement");
  }

  if (repeatedSkipCounts.meal >= 3) {
    reasons.push("repeated_skip");
    questTypeBias.push("meal");
  }

  if (repeatedSkipCounts.mood >= 3) {
    reasons.push("repeated_skip");
    questTypeBias.push("mood");
  }

  if (input.energyTrend === "down") {
    reasons.push("low_energy");
    recoveryModeRecommended = true;
    difficulty = difficulty === "tiny" ? "tiny" : "easy";
  }

  if (input.moodTrend === "down") {
    reasons.push("low_mood");
    questTypeBias.push("mood");
    avoidQuestTypes.push("movement");
    recoveryModeRecommended = true;
  }

  if (input.sleepConsistency < 40) {
    reasons.push("poor_sleep");
    questTypeBias.push("sleep_prep", "recovery");
    avoidQuestTypes.push("movement");
    recoveryModeRecommended = true;
  }

  if (input.hydrationConsistency < 40) {
    reasons.push("dehydration_signal");
    questTypeBias.push("water");
  }

  if (input.recoveryDaysLast7 > 0 || input.preferences?.recoveryModeDefault) {
    reasons.push("recovery_day");
    recoveryModeRecommended = true;
  }

  if (input.painOrSoreness) {
    reasons.push("pain_or_soreness");
    avoidQuestTypes.push("movement");
    questTypeBias.push("recovery");
    recoveryModeRecommended = true;
  }

  if (input.profile || input.preferences || input.userGoal) {
    reasons.push("user_preference");
  }

  if (input.profile?.dailyTimeBudget === "thirty_seconds") {
    reasons.push("time_budget");
    difficulty = "tiny";
    minimumRequiredQuests = 2;
    maxDailyQuests = 3;
    offerChallengeQuest = false;
  }

  if (input.profile?.dailyTimeBudget === "ten_minutes") {
    reasons.push("time_budget");
    minimumRequiredQuests = Math.max(minimumRequiredQuests, 3);
    maxDailyQuests = Math.max(maxDailyQuests, 5);
  }

  if (input.streakAtRisk) {
    reasons.push("streak_risk");
    questTypeBias.unshift("water", "mood");
    difficulty = difficulty === "tiny" ? "tiny" : "easy";
  }

  if (input.preferences) {
    minimumRequiredQuests = clampCount(input.preferences.minimumRequiredQuests, minimumRequiredQuests, 2, 5);
    maxDailyQuests = clampCount(input.preferences.maxDailyQuests, maxDailyQuests, minimumRequiredQuests, 5);
    if (input.preferences.preferredDifficulty === "tiny") {
      difficulty = "tiny";
    } else if (input.preferences.preferredDifficulty === "easy" && difficulty === "normal") {
      difficulty = "easy";
    } else if (profileDifficulty === "challenge" && input.last7DaysCompletionRate > 0.85) {
      offerChallengeQuest = true;
    }
  }

  const goal = input.userGoal ?? input.profile?.primaryGoal ?? input.profile?.startingPath ?? "easy_start";
  questTypeBias.push(...(goalBias[goal] ?? goalBias.easy_start));
  questTypeBias.push(...allQuestTypes);

  if (recoveryModeRecommended) {
    difficulty = difficulty === "tiny" ? "tiny" : "easy";
    offerChallengeQuest = false;
  }

  return {
    difficulty,
    minimumRequiredQuests,
    maxDailyQuests,
    adaptationReasons: uniqueAdaptationReasons(reasons),
    questTypeBias: uniqueQuestTypes(questTypeBias.filter((type) => !avoidQuestTypes.includes(type))),
    avoidQuestTypes: uniqueQuestTypes(avoidQuestTypes),
    offerChallengeQuest,
    recoveryModeRecommended,
    coachNote: buildCoachNote({ reasons, difficulty, recoveryModeRecommended }),
  };
}

export function buildDefaultAdaptationInput(
  input: Partial<QuestAdaptationInput> & Pick<QuestAdaptationInput, "localDate">,
): QuestAdaptationInput {
  return {
    userId: input.userId ?? "anonymous",
    localDate: input.localDate,
    locale: input.locale ?? input.profile?.preferredLocale ?? "zh-Hant",
    profile: input.profile ?? null,
    preferences: input.preferences ?? null,
    last7DaysCompletionRate: input.last7DaysCompletionRate ?? 0.7,
    last30DaysCompletionRate: input.last30DaysCompletionRate ?? 0.7,
    last7DaysQuestTypes: input.last7DaysQuestTypes ?? [],
    skippedQuestTypes: input.skippedQuestTypes ?? [],
    repeatedSkipCounts: { ...defaultRepeatedSkipCounts, ...input.repeatedSkipCounts },
    recoveryDaysLast7: input.recoveryDaysLast7 ?? 0,
    safetyEventsLast30: input.safetyEventsLast30 ?? 0,
    preferredQuestTime: input.preferredQuestTime ?? input.preferences?.preferredQuestTime ?? "no_preference",
    userGoal: input.userGoal ?? input.profile?.primaryGoal ?? input.profile?.startingPath,
    energyTrend: input.energyTrend ?? "unknown",
    moodTrend: input.moodTrend ?? "unknown",
    hydrationConsistency: input.hydrationConsistency ?? 70,
    movementConsistency: input.movementConsistency ?? 70,
    sleepConsistency: input.sleepConsistency ?? 70,
    currentStreak: input.currentStreak ?? 0,
    streakAtRisk: input.streakAtRisk ?? false,
    painOrSoreness: input.painOrSoreness ?? false,
  };
}

function buildCoachNote({
  reasons,
  difficulty,
  recoveryModeRecommended,
}: {
  reasons: AdaptationReason[];
  difficulty: QuestDifficulty;
  recoveryModeRecommended: boolean;
}) {
  if (reasons.includes("safety_block")) {
    return {
      zh: "安全提示優先。遇到緊急或嚴重情況，請立即致電 999 或前往急症室。",
      en: "Safety comes first. For urgent or severe symptoms, call 999 or go to Accident & Emergency now.",
    };
  }

  if (recoveryModeRecommended) {
    return {
      zh: "今日可以用恢復模式。休息、補水、輕量一步都算數。",
      en: "Recovery mode can help today. Rest, hydration, and one gentle step all count.",
    };
  }

  if (difficulty === "tiny") {
    return {
      zh: "今日用最細版本。完成一兩步已經足夠繼續前進。",
      en: "Today uses the smallest version. One or two steps are enough to keep moving.",
    };
  }

  return {
    zh: "保持簡單：先完成下一個最容易的小任務。",
    en: "Keep it simple: do the next easiest tiny quest first.",
  };
}

function uniqueQuestTypes(types: QuestType[]) {
  return Array.from(new Set(types));
}

function clampCount(value: number, fallback: number, min: number, max: number) {
  return Number.isFinite(value) ? Math.max(min, Math.min(max, Math.round(value))) : fallback;
}
