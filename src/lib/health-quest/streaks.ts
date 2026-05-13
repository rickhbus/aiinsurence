import type { DailyQuest, DailyQuestMode, UserStreak } from "./types";

export const DEFAULT_REQUIRED_MINIMUM = 3;
export const RECOVERY_REQUIRED_MINIMUM = 2;

export const emptyStreak: UserStreak = {
  currentStreak: 0,
  longestStreak: 0,
  lastCompletedDate: null,
  streakFreezeCount: 0,
  protectedToday: false,
};

export function countRequiredCompletions(quests: DailyQuest[]) {
  const required = quests.filter((quest) => quest.required);
  const completed = required.filter((quest) => quest.status === "done");

  return {
    requiredCompletedCount: completed.length,
    totalRequiredCount: required.length,
  };
}

export function isStreakProtected({
  quests,
  mode,
}: {
  quests: DailyQuest[];
  mode: DailyQuestMode;
}) {
  const { requiredCompletedCount } = countRequiredCompletions(quests);

  if (mode === "safety") {
    return quests.some((quest) => quest.status === "done" && quest.safetyLevel === "urgent");
  }

  const minimum = mode === "recovery" ? RECOVERY_REQUIRED_MINIMUM : DEFAULT_REQUIRED_MINIMUM;

  return requiredCompletedCount >= minimum;
}

export function recomputeUserStreak({
  previous,
  localDate,
  protectedToday,
}: {
  previous?: UserStreak | null;
  localDate: string;
  protectedToday: boolean;
}): UserStreak {
  const base = previous ?? emptyStreak;

  if (!protectedToday) {
    return {
      ...base,
      protectedToday: false,
    };
  }

  if (base.lastCompletedDate === localDate) {
    return {
      ...base,
      protectedToday: true,
      longestStreak: Math.max(base.longestStreak, base.currentStreak),
    };
  }

  const gap = getDateGapDays(base.lastCompletedDate, localDate);
  const canUseFreeze = gap === 2 && base.streakFreezeCount > 0;
  const currentStreak =
    gap === 1 || canUseFreeze
      ? Math.max(1, base.currentStreak + 1)
      : 1;
  const streakFreezeCount = canUseFreeze
    ? Math.max(0, base.streakFreezeCount - 1)
    : base.streakFreezeCount;

  return {
    currentStreak,
    longestStreak: Math.max(base.longestStreak, currentStreak),
    lastCompletedDate: localDate,
    streakFreezeCount,
    protectedToday: true,
  };
}

export function getDateGapDays(previousDate: string | null, nextDate: string) {
  if (!previousDate) {
    return Number.POSITIVE_INFINITY;
  }

  const previous = parseLocalDate(previousDate);
  const next = parseLocalDate(nextDate);
  const milliseconds = next.getTime() - previous.getTime();

  return Math.round(milliseconds / 86_400_000);
}

function parseLocalDate(value: string) {
  const [year = "1970", month = "1", day = "1"] = value.split("-");

  return new Date(Number(year), Number(month) - 1, Number(day));
}
