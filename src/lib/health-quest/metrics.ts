import type { DailyQuest, QuestType, XPEvent } from "./types";

export type HealthQuestAggregateMetrics = {
  d1Retention: number;
  d7Retention: number;
  questCompletionRate: number;
  skipRateByQuestType: Partial<Record<QuestType, number>>;
  makeItEasierRate: number;
  recoveryModeRate: number;
  safetyBannerRate: number;
  lessonCompletionRate: number;
  streakProtectedRate: number;
  anonymousToSignedInConversion: number;
  freeToPlusConversion: number;
};

export function buildPrivacySafeMetrics({
  quests,
  xpEvents,
}: {
  quests: DailyQuest[];
  xpEvents: XPEvent[];
}): HealthQuestAggregateMetrics {
  const completed = quests.filter((quest) => quest.status === "done");
  const skipped = quests.filter((quest) => quest.status === "skipped");
  const skipRateByQuestType = skipped.reduce<Partial<Record<QuestType, number>>>((acc, quest) => {
    const totalForType = quests.filter((item) => item.type === quest.type).length || 1;
    acc[quest.type] = Math.round(((acc[quest.type] ?? 0) + 1 / totalForType) * 100) / 100;
    return acc;
  }, {});

  return {
    d1Retention: activeDayRate(quests, 1),
    d7Retention: activeDayRate(quests, 7),
    questCompletionRate: ratio(completed.length, quests.length),
    skipRateByQuestType,
    makeItEasierRate: ratio(quests.filter((quest) => quest.metadata?.madeEasier === true).length, quests.length),
    recoveryModeRate: ratio(quests.filter((quest) => quest.source === "recovery" || quest.type === "recovery").length, quests.length),
    safetyBannerRate: ratio(quests.filter((quest) => quest.status === "blocked_by_safety" || quest.safetyLevel === "urgent").length, quests.length),
    lessonCompletionRate: ratio(xpEvents.filter((event) => event.reason.startsWith("lesson_completed")).length, Math.max(1, xpEvents.length)),
    streakProtectedRate: ratio(new Set(completed.map((quest) => quest.localDate)).size, Math.max(1, new Set(quests.map((quest) => quest.localDate)).size)),
    anonymousToSignedInConversion: 0,
    freeToPlusConversion: 0,
  };
}

function activeDayRate(quests: DailyQuest[], days: number) {
  const activeDays = new Set(quests.filter((quest) => quest.status === "done").map((quest) => quest.localDate)).size;
  return ratio(activeDays, days);
}

function ratio(numerator: number, denominator: number) {
  return denominator <= 0 ? 0 : Math.round((numerator / denominator) * 100);
}
