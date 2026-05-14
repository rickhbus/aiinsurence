import type { HealthQuestPlanLevel, LocalizedText, UserStreak } from "./types";
import { getDateGapDays } from "./streaks";

export const breakCopy: LocalizedText = {
  en: "You took a break. Your progress still matters.",
  zh: "你休息咗一日，你嘅進度仍然重要。",
};

export function maxFreezesForPlan(plan: HealthQuestPlanLevel) {
  if (plan === "business" || plan === "family") {
    return 5;
  }

  if (plan === "pro") {
    return 5;
  }

  if (plan === "plus") {
    return 3;
  }

  return 1;
}

export function activeDaysPerFreeze(plan: HealthQuestPlanLevel) {
  return plan === "free" ? 7 : 10;
}

export function shouldEarnStreakFreeze({
  activeDays,
  streak,
  plan,
}: {
  activeDays: number;
  streak: UserStreak;
  plan: HealthQuestPlanLevel;
}) {
  const threshold = activeDaysPerFreeze(plan);
  const max = maxFreezesForPlan(plan);
  const earned = streak.totalFreezesEarned ?? 0;

  return activeDays >= threshold && Math.floor(activeDays / threshold) > earned && streak.streakFreezeCount < max;
}

export function earnStreakFreeze({
  streak,
  plan,
  now = new Date().toISOString(),
}: {
  streak: UserStreak;
  plan: HealthQuestPlanLevel;
  now?: string;
}) {
  const max = maxFreezesForPlan(plan);
  const nextCount = Math.min(max, streak.streakFreezeCount + 1);

  return {
    ...streak,
    streakFreezeCount: nextCount,
    totalFreezesEarned: (streak.totalFreezesEarned ?? 0) + (nextCount > streak.streakFreezeCount ? 1 : 0),
    lastFreezeEarnedAt: now,
  };
}

export function applyMissedDayFreeze({
  streak,
  localDate,
  now = new Date().toISOString(),
}: {
  streak: UserStreak;
  localDate: string;
  now?: string;
}) {
  const gap = getDateGapDays(streak.lastCompletedDate, localDate);

  if (gap !== 2 || streak.streakFreezeCount <= 0) {
    return {
      streak: {
        ...streak,
        currentStreak: gap > 1 ? 0 : streak.currentStreak,
        protectedToday: false,
      },
      consumed: false,
      message: breakCopy,
    };
  }

  return {
    streak: {
      ...streak,
      streakFreezeCount: Math.max(0, streak.streakFreezeCount - 1),
      totalFreezesConsumed: (streak.totalFreezesConsumed ?? 0) + 1,
      lastFreezeConsumedAt: now,
      protectedToday: true,
    },
    consumed: true,
    message: breakCopy,
  };
}

export function canFamilyRestoreMissedDay({
  consent,
  restoresThisMonth,
}: {
  consent: boolean;
  restoresThisMonth: number;
}) {
  return consent && restoresThisMonth < 1;
}
