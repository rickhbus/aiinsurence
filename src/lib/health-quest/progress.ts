import type { DailyQuest, QuestProgressSummary, XPEvent } from "./types";

export function buildQuestProgressSummary({
  quests,
  xpEvents,
  currentStreak,
  longestStreak,
}: {
  quests: DailyQuest[];
  xpEvents: XPEvent[];
  currentStreak: number;
  longestStreak: number;
}): QuestProgressSummary {
  const completed = quests.filter((quest) => quest.status === "done");
  const completedByType = completed.reduce<QuestProgressSummary["completedByType"]>((counts, quest) => {
    counts[quest.type] = (counts[quest.type] ?? 0) + 1;
    return counts;
  }, {});
  const xpThisWeek = sumXpSince(xpEvents, daysAgo(7));
  const xpLast30Days = sumXpSince(xpEvents, daysAgo(30));
  const activeDays = new Set(completed.map((quest) => quest.localDate)).size;
  const recoveryDays = new Set(quests.filter((quest) => quest.source === "recovery" || quest.type === "recovery").map((quest) => quest.localDate)).size;
  const lessonsCompleted = xpEvents.filter((event) => event.reason.startsWith("lesson_completed")).length;

  return {
    currentStreak,
    longestStreak,
    xpThisWeek,
    xpLast30Days,
    completedByType,
    hydrationConsistency: ratio(completedByType.water ?? 0, 7),
    movementConsistency: ratio(completedByType.movement ?? 0, 7),
    moodConsistency: ratio(completedByType.mood ?? 0, 7),
    activeDays,
    recoveryDays,
    lessonsCompleted,
    weeklyReviewHref: "/weekly-review",
    weeklyReview: {
      zh: "本週重點係一致性，不係完美。飲水、心情同輕量郁動都會累積。",
      en: "This week is about consistency, not perfection. Water, mood, and gentle movement all add up.",
    },
  };
}

function sumXpSince(events: XPEvent[], since: Date) {
  return events
    .filter((event) => new Date(event.createdAt) >= since)
    .reduce((total, event) => total + Math.max(0, Math.min(100, Math.round(event.amount))), 0);
}

function daysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

function ratio(count: number, denominator: number) {
  return Math.round((Math.min(count, denominator) / denominator) * 100);
}
