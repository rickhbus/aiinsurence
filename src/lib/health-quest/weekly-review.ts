import type { DailyQuest, LocalizedText, QuestType, UserStreak, XPEvent } from "./types";

export type WeeklyHealthQuestReview = {
  weekStart: string;
  weekEnd: string;
  xpEarned: number;
  questsCompleted: number;
  requiredQuestCompletionRate: number;
  mostConsistentHabit?: QuestType;
  mostSkippedHabit?: QuestType;
  makeEasierSuggestion?: LocalizedText;
  recoveryDays: number;
  safetyEventCount: number;
  streakSummary: LocalizedText;
  nextTinyGoal: LocalizedText;
  doctorPrepPrompt?: LocalizedText | null;
  disclaimers: LocalizedText[];
};

export function buildWeeklyHealthQuestReview({
  quests,
  xpEvents,
  streak,
  weekStart,
  weekEnd,
}: {
  quests: DailyQuest[];
  xpEvents: XPEvent[];
  streak: UserStreak;
  weekStart: string;
  weekEnd: string;
}): WeeklyHealthQuestReview {
  const weekQuests = quests.filter((quest) => quest.localDate >= weekStart && quest.localDate <= weekEnd);
  const completed = weekQuests.filter((quest) => quest.status === "done");
  const required = weekQuests.filter((quest) => quest.required);
  const skipped = weekQuests.filter((quest) => quest.status === "skipped");
  const safetyEventCount = weekQuests.filter((quest) => quest.safetyLevel === "urgent" || quest.status === "blocked_by_safety").length;
  const recoveryDays = new Set(weekQuests.filter((quest) => quest.type === "recovery" || quest.source === "recovery").map((quest) => quest.localDate)).size;
  const mostSkippedHabit = topQuestType(skipped);
  const mostConsistentHabit = topQuestType(completed);

  return {
    weekStart,
    weekEnd,
    xpEarned: xpEvents
      .filter((event) => event.createdAt.slice(0, 10) >= weekStart && event.createdAt.slice(0, 10) <= weekEnd)
      .reduce((total, event) => total + Math.max(0, Math.min(100, Math.round(event.amount))), 0),
    questsCompleted: completed.length,
    requiredQuestCompletionRate: required.length === 0 ? 0 : Math.round((completed.filter((quest) => quest.required).length / required.length) * 100),
    mostConsistentHabit,
    mostSkippedHabit,
    makeEasierSuggestion: mostSkippedHabit ? makeEasierSuggestion(mostSkippedHabit) : undefined,
    recoveryDays,
    safetyEventCount,
    streakSummary: {
      zh: `你而家連續 ${streak.currentStreak} 日。最長紀錄 ${streak.longestStreak} 日。`,
      en: `Current streak: ${streak.currentStreak} days. Longest streak: ${streak.longestStreak} days.`,
    },
    nextTinyGoal: nextTinyGoal(mostSkippedHabit, recoveryDays),
    doctorPrepPrompt: safetyEventCount > 0 || recoveryDays >= 2 ? {
      zh: "如果有嚴重、持續或令你擔心的情況，可以準備一條問題俾醫生。",
      en: "If anything is severe, persistent, or worrying, prepare one question for a doctor.",
    } : null,
    disclaimers: [
      {
        zh: "呢個係一致性回顧，不是醫療分數、診斷或治療建議。",
        en: "This is a consistency review, not a medical score, diagnosis, or treatment advice.",
      },
      {
        zh: "健康紀錄不會用作保險資格、定價、保障、索償結果或醫療服務取用決定。",
        en: "Health logs are not used for insurance eligibility, pricing, coverage, claim outcomes, or care-access decisions.",
      },
    ],
  };
}

export function getCurrentWeekRange(now = new Date()) {
  const start = new Date(now);
  const day = start.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + diff);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);

  return {
    weekStart: start.toISOString().slice(0, 10),
    weekEnd: end.toISOString().slice(0, 10),
  };
}

export function weeklyReviewUnlocked(quests: DailyQuest[], now = new Date()) {
  const { weekStart, weekEnd } = getCurrentWeekRange(now);
  const activeDays = new Set(
    quests
      .filter((quest) => quest.localDate >= weekStart && quest.localDate <= weekEnd && quest.status === "done")
      .map((quest) => quest.localDate),
  ).size;

  return activeDays >= 5 || now.getDay() === 0;
}

function topQuestType(quests: DailyQuest[]) {
  const counts = quests.reduce<Partial<Record<QuestType, number>>>((acc, quest) => {
    acc[quest.type] = (acc[quest.type] ?? 0) + 1;
    return acc;
  }, {});

  return Object.entries(counts).sort(([, a], [, b]) => b - a)[0]?.[0] as QuestType | undefined;
}

function makeEasierSuggestion(type: QuestType): LocalizedText {
  const suggestions: Partial<Record<QuestType, LocalizedText>> = {
    water: { zh: "下週先做一杯水就夠。", en: "Next week, one glass is enough." },
    meal: { zh: "下週只點餐類型，不寫細節。", en: "Next week, tap meal type only." },
    movement: { zh: "下週改成站起身伸展 30 秒。", en: "Next week, use a 30-second stretch." },
    mood: { zh: "下週只點一個表情符號。", en: "Next week, tap one emoji only." },
    doctor_prep: { zh: "下週只寫一條想問的問題。", en: "Next week, write one question only." },
  };

  return suggestions[type] ?? {
    zh: "下週用最細版本開始。",
    en: "Next week, start with the smallest version.",
  };
}

function nextTinyGoal(mostSkippedHabit: QuestType | undefined, recoveryDays: number): LocalizedText {
  if (recoveryDays > 0) {
    return {
      zh: "下一步：保留一個恢復日，完成兩個輕量任務。",
      en: "Next: keep one recovery day and complete two gentle quests.",
    };
  }

  if (mostSkippedHabit) {
    return makeEasierSuggestion(mostSkippedHabit);
  }

  return {
    zh: "下一步：每日完成兩個最容易任務。",
    en: "Next: complete the two easiest quests each day.",
  };
}
