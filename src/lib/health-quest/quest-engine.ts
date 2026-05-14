import type { DailyCheckinRow, DailyCheckinType } from "@/lib/health-data/types";
import { buildAdaptiveQuestPlan, buildDefaultAdaptationInput } from "./adaptive-engine";
import { healthQuestCopy, coachNotes, questTypeCopy } from "./copy";
import { buildEnergyBattery, shouldUseRecoveryMode } from "./recovery-mode";
import { evaluateQuestSafety } from "./safety-gates";
import { countRequiredCompletions, emptyStreak, isStreakProtected, recomputeUserStreak } from "./streaks";
import { getQuestXp, sumEarnedXpToday } from "./xp";
import type {
  DailyQuest,
  DailyQuestMode,
  DailyQuestState,
  AdaptiveQuestPlan,
  QuestBuildInput,
  QuestSafetyLevel,
  QuestStatus,
  QuestType,
} from "./types";

const normalQuestTypes: QuestType[] = ["water", "mood", "meal", "movement", "health_review"];
const simpleQuestTypes: QuestType[] = ["mood", "water", "meal", "movement"];
const recoveryQuestTypes: QuestType[] = ["recovery", "water", "movement", "mood", "doctor_prep"];

const requiredNormal = new Set<QuestType>(["water", "meal", "mood"]);
const requiredRecovery = new Set<QuestType>(["recovery", "water", "mood"]);

export function buildDailyQuestState(input: QuestBuildInput): DailyQuestState {
  const now = input.now ?? new Date().toISOString();
  const safetyGate = evaluateQuestSafety({
    todaySummary: input.todaySummary,
    healthContext: input.healthContext,
    safetyStatus: input.safetyStatus,
  });
  const energyBattery = buildEnergyBattery({
    todaySummary: input.todaySummary,
    healthContext: input.healthContext,
    dailyCheckins: input.dailyCheckins,
  });
  const previousStreak = input.previousStreak ?? emptyStreak;
  const adaptivePlan = buildAdaptiveQuestPlan(buildDefaultAdaptationInput({
    userId: input.userId,
    localDate: input.localDate,
    locale: input.locale ?? input.profile?.preferredLocale ?? "zh-Hant",
    profile: input.profile,
    preferences: input.preferences,
    currentStreak: previousStreak.currentStreak,
    streakAtRisk: Boolean(previousStreak.lastCompletedDate && previousStreak.lastCompletedDate !== input.localDate),
    energyTrend: energyBattery.label === "low" ? "down" : "stable",
    moodTrend: energyBattery.reasons.includes("low_mood") ? "down" : "stable",
    hydrationConsistency: deriveHydrationConsistency(input.hydrationLogs, input.dailyCheckins),
    movementConsistency: deriveMovementConsistency(input.gymWorkouts, input.dailyCheckins),
    sleepConsistency: energyBattery.reasons.includes("low_sleep") || energyBattery.reasons.includes("poor_sleep_quality") ? 30 : 70,
    recoveryDaysLast7: input.forceMode === "recovery" ? 1 : 0,
    safetyEventsLast30: safetyGate.urgent ? 1 : 0,
    painOrSoreness: energyBattery.reasons.includes("body_caution_signal"),
    ...input.adaptiveInput,
  }));
  const mode: DailyQuestMode = safetyGate.urgent
    ? "safety"
    : input.forceMode === "recovery"
      ? "recovery"
      : adaptivePlan.recoveryModeRecommended
        ? "recovery"
      : shouldUseRecoveryMode({
      todaySummary: input.todaySummary,
      healthContext: input.healthContext,
      dailyCheckins: input.dailyCheckins,
      energyBattery,
    })
      ? "recovery"
      : "normal";
  const generated = generateQuestPath({
    mode,
    localDate: input.localDate,
    userId: input.userId,
    adaptivePlan,
  });
  const questBase = mergeExistingQuests(generated, input.existingQuests ?? []);
  const completedFromLogs = markCompletedFromLogs(questBase, input.dailyCheckins ?? [], now);
  const quests = unlockQuests(mode === "safety" ? blockForSafety(completedFromLogs) : completedFromLogs);
  const completedCount = quests.filter((quest) => quest.status === "done").length;
  const { requiredCompletedCount, totalRequiredCount } = countRequiredCompletions(quests);
  const protectedToday = isStreakProtected({ quests, mode });
  const streak = recomputeUserStreak({
    previous: input.previousStreak ?? emptyStreak,
    localDate: input.localDate,
    protectedToday,
  });

  return {
    localDate: input.localDate,
    quests,
    completedCount,
    requiredCompletedCount,
    totalRequiredCount,
    earnedXpToday: sumEarnedXpToday(quests, input.xpEvents),
    streak,
    energyBattery,
    mode,
    coachNote: buildCoachNote(mode, protectedToday, adaptivePlan),
    safetyMessage: safetyGate.message,
    adaptivePlan,
  };
}

export function generateQuestPath({
  mode,
  localDate,
  userId,
  adaptivePlan,
}: {
  mode: DailyQuestMode;
  localDate: string;
  userId?: string;
  adaptivePlan?: AdaptiveQuestPlan;
}): DailyQuest[] {
  if (mode === "safety") {
    return [
      buildQuest({
        type: "doctor_prep",
        localDate,
        userId,
        orderIndex: 0,
        required: true,
        status: "blocked_by_safety",
        safetyLevel: "urgent",
        metadata: { emergencyGuidanceFirst: true },
      }),
    ];
  }

  const types = selectQuestTypes(mode, adaptivePlan);
  const requiredCount = mode === "recovery"
    ? Math.min(types.length, adaptivePlan?.minimumRequiredQuests ?? 2)
    : Math.min(types.length, adaptivePlan?.minimumRequiredQuests ?? 3);
  const unlockChainRemoved = adaptivePlan?.adaptationReasons.some((reason) =>
    ["low_completion", "new_user", "time_budget"].includes(reason),
  ) ?? false;

  return types.map((type, index) => buildQuest({
    type,
    localDate,
    userId,
    orderIndex: index,
    required: index < requiredCount && (mode === "recovery" ? requiredRecovery.has(type) || index < requiredCount : requiredNormal.has(type) || index < requiredCount),
    status: unlockChainRemoved ? (mode === "recovery" && index === 0 ? "recovery" : "active") : index === 0 ? (mode === "recovery" ? "recovery" : "active") : "locked",
    safetyLevel: mode === "recovery" && type === "doctor_prep" ? "caution" : "normal",
    source: mode === "recovery" ? "recovery" : "generated",
    unlocksAfter: unlockChainRemoved ? [] : index > 0 ? [`${localDate}-${types[index - 1]}`] : [],
    metadata: {
      difficulty: adaptivePlan?.difficulty ?? "easy",
      adaptationReasons: adaptivePlan?.adaptationReasons ?? [],
      unlockChainRemoved,
      offerChallengeQuest: adaptivePlan?.offerChallengeQuest ?? false,
    },
  }));
}

export function buildSimpleQuestPath(localDate: string, userId?: string): DailyQuest[] {
  return simpleQuestTypes.map((type, index) => buildQuest({
    type,
    localDate,
    userId,
    orderIndex: index,
    required: index < 3,
    status: index === 0 ? "active" : "locked",
    safetyLevel: "normal",
    source: "generated",
    unlocksAfter: index > 0 ? [`${localDate}-${simpleQuestTypes[index - 1]}`] : [],
  }));
}

export function unlockQuests(quests: DailyQuest[]): DailyQuest[] {
  const doneIds = new Set(quests.filter((quest) => quest.status === "done").map((quest) => quest.id));
  let hasActive = quests.some((quest) => quest.status === "active" || quest.status === "recovery");
  const sorted = [...quests].sort((a, b) => a.orderIndex - b.orderIndex);

  return sorted.map((quest, index) => {
    if (["done", "skipped", "blocked_by_safety", "recovery"].includes(quest.status)) {
      if (quest.status === "recovery") {
        hasActive = true;
      }

      return quest;
    }

    if (quest.metadata?.unlockChainRemoved === true && quest.status === "active") {
      return quest;
    }

    const dependencies = quest.unlocksAfter ?? [];
    const dependenciesDone = dependencies.length === 0 || dependencies.every((id) => doneIds.has(id));
    const previousDone = index === 0 || sorted[index - 1]?.status === "done" || sorted[index - 1]?.status === "skipped";

    if (!hasActive && dependenciesDone && previousDone) {
      hasActive = true;
      return { ...quest, status: "active" as QuestStatus };
    }

    return {
      ...quest,
      status: dependenciesDone && previousDone ? "active" : "locked",
    };
  });
}

export function questTypeToLifeTrackerAction(type: QuestType) {
  switch (type) {
    case "wake":
      return "wake";
    case "water":
      return "water";
    case "meal":
      return "meal";
    case "movement":
      return "move";
    case "mood":
      return "mood";
    case "toilet_optional":
      return "toilet";
    case "health_review":
    case "sleep_prep":
    case "doctor_prep":
    case "recovery":
    case "learn":
      return null;
  }
}

function buildQuest({
  type,
  localDate,
  orderIndex,
  userId,
  required,
  status,
  safetyLevel,
  source = "generated",
  metadata = {},
  unlocksAfter = [],
}: {
  type: QuestType;
  localDate: string;
  orderIndex: number;
  userId?: string;
  required: boolean;
  status: QuestStatus;
  safetyLevel: QuestSafetyLevel;
  source?: DailyQuest["source"];
  metadata?: Record<string, unknown>;
  unlocksAfter?: string[];
}): DailyQuest {
  const copy = questTypeCopy[type];

  return {
    id: `${localDate}-${type}`,
    userId,
    localDate,
    type,
    title: copy.title,
    description: copy.description,
    actionLabel: copy.actionLabel,
    completedLabel: copy.completedLabel,
    xp: getQuestXp(type),
    required,
    status,
    orderIndex,
    unlocksAfter,
    safetyLevel,
    source,
    metadata,
    completedAt: null,
    skippedAt: null,
  };
}

function mergeExistingQuests(generated: DailyQuest[], existing: DailyQuest[]): DailyQuest[] {
  if (existing.length === 0) {
    return generated;
  }

  const existingByType = new Map(existing.map((quest) => [quest.type, quest]));

  return generated.map((quest) => {
    const saved = existingByType.get(quest.type);

    return saved
      ? {
        ...quest,
        ...saved,
        title: saved.title ?? quest.title,
        description: saved.description ?? quest.description,
        actionLabel: saved.actionLabel ?? quest.actionLabel,
        completedLabel: saved.completedLabel ?? quest.completedLabel,
      }
      : quest;
  });
}

function markCompletedFromLogs(quests: DailyQuest[], checkins: DailyCheckinRow[], now: string): DailyQuest[] {
  const completedTypes = new Set(checkins.flatMap((checkin) => mapCheckinToQuestTypes(checkin.checkin_type)));

  return quests.map((quest) => {
    if (quest.status === "done" || quest.status === "skipped" || quest.status === "blocked_by_safety") {
      return quest;
    }

    if (!completedTypes.has(quest.type)) {
      return quest;
    }

    return {
      ...quest,
      status: "done" as QuestStatus,
      completedAt: quest.completedAt ?? now,
    };
  });
}

function mapCheckinToQuestTypes(type: DailyCheckinType): QuestType[] {
  switch (type) {
    case "wake_up":
      return ["wake"];
    case "water":
      return ["water"];
    case "meal":
      return ["meal"];
    case "exercise":
      return ["movement"];
    case "health_review":
      return ["mood", "health_review", "recovery"];
  }
}

function blockForSafety(quests: DailyQuest[]): DailyQuest[] {
  return quests.map((quest) => ({
    ...quest,
    status: quest.status === "done" ? quest.status : "blocked_by_safety" as QuestStatus,
    safetyLevel: "urgent" as QuestSafetyLevel,
    xp: 0,
    metadata: {
      ...quest.metadata,
      emergencyGuidanceFirst: true,
    },
  }));
}

function buildCoachNote(mode: DailyQuestMode, protectedToday: boolean, adaptivePlan?: AdaptiveQuestPlan) {
  if (mode === "safety") {
    return coachNotes.safety;
  }

  if (protectedToday) {
    return coachNotes.protected;
  }

  if (mode === "recovery") {
    return adaptivePlan?.coachNote ?? healthQuestCopy.recoveryMode;
  }

  return adaptivePlan?.coachNote ?? coachNotes.normal;
}

function selectQuestTypes(mode: DailyQuestMode, adaptivePlan?: AdaptiveQuestPlan): QuestType[] {
  if (mode === "recovery") {
    return limitQuests(uniqueTypes([...recoveryQuestTypes, ...(adaptivePlan?.questTypeBias ?? [])]), adaptivePlan?.maxDailyQuests ?? 5);
  }

  const preferred = adaptivePlan?.questTypeBias.length
    ? adaptivePlan.questTypeBias
    : normalQuestTypes;
  const withoutAvoided = preferred.filter((type) => !(adaptivePlan?.avoidQuestTypes ?? []).includes(type));
  const base = uniqueTypes([...withoutAvoided, ...normalQuestTypes]);
  const max = adaptivePlan?.maxDailyQuests ?? 5;

  return limitQuests(base, max);
}

function limitQuests(types: QuestType[], max: number) {
  return types.filter((type) => type !== "wake" && type !== "toilet_optional").slice(0, Math.max(2, Math.min(5, max)));
}

function uniqueTypes(types: QuestType[]) {
  return Array.from(new Set(types));
}

function deriveHydrationConsistency(hydrationLogs?: unknown[], dailyCheckins?: DailyCheckinRow[]) {
  const hasWater = (hydrationLogs?.length ?? 0) > 0 || (dailyCheckins ?? []).some((checkin) => checkin.checkin_type === "water");
  return hasWater ? 80 : 55;
}

function deriveMovementConsistency(gymWorkouts?: unknown[], dailyCheckins?: DailyCheckinRow[]) {
  const hasMovement = (gymWorkouts?.length ?? 0) > 0 || (dailyCheckins ?? []).some((checkin) => checkin.checkin_type === "exercise");
  return hasMovement ? 80 : 55;
}
