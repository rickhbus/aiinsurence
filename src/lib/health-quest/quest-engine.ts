import type { DailyCheckinRow, DailyCheckinType } from "@/lib/health-data/types";
import { healthQuestCopy, coachNotes, questTypeCopy } from "./copy";
import { buildEnergyBattery, shouldUseRecoveryMode } from "./recovery-mode";
import { evaluateQuestSafety } from "./safety-gates";
import { countRequiredCompletions, emptyStreak, isStreakProtected, recomputeUserStreak } from "./streaks";
import { getQuestXp, sumEarnedXpToday } from "./xp";
import type {
  DailyQuest,
  DailyQuestMode,
  DailyQuestState,
  QuestBuildInput,
  QuestSafetyLevel,
  QuestStatus,
  QuestType,
} from "./types";

const normalQuestTypes: QuestType[] = ["wake", "water", "meal", "movement", "mood", "health_review"];
const simpleQuestTypes: QuestType[] = ["mood", "water", "meal", "movement"];
const recoveryQuestTypes: QuestType[] = ["recovery", "water", "movement", "mood", "doctor_prep"];

const requiredNormal = new Set<QuestType>(["wake", "water", "meal", "mood"]);
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
  const mode: DailyQuestMode = safetyGate.urgent
    ? "safety"
    : input.forceMode === "recovery"
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
    coachNote: buildCoachNote(mode, protectedToday),
    safetyMessage: safetyGate.message,
  };
}

export function generateQuestPath({
  mode,
  localDate,
  userId,
}: {
  mode: DailyQuestMode;
  localDate: string;
  userId?: string;
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

  const types = mode === "recovery" ? recoveryQuestTypes : normalQuestTypes;

  return types.map((type, index) => buildQuest({
    type,
    localDate,
    userId,
    orderIndex: index,
    required: mode === "recovery" ? requiredRecovery.has(type) : requiredNormal.has(type),
    status: index === 0 ? (mode === "recovery" ? "recovery" : "active") : "locked",
    safetyLevel: mode === "recovery" && type === "doctor_prep" ? "caution" : "normal",
    source: mode === "recovery" ? "recovery" : "generated",
    unlocksAfter: index > 0 ? [`${localDate}-${types[index - 1]}`] : [],
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

function buildCoachNote(mode: DailyQuestMode, protectedToday: boolean) {
  if (mode === "safety") {
    return coachNotes.safety;
  }

  if (protectedToday) {
    return coachNotes.protected;
  }

  if (mode === "recovery") {
    return healthQuestCopy.recoveryMode;
  }

  return coachNotes.normal;
}
