import { buildDailyHealthSummary } from "@/lib/health-os/daily-summary";
import { buildDailyQuestState } from "./quest-engine";
import type { DailyQuestState } from "./types";

export function buildMockDailyQuestState(localDate = new Date().toISOString().slice(0, 10)): DailyQuestState {
  const summary = buildDailyHealthSummary({
    locale: "zh-Hant",
    dailyLog: {
      sleepMinutes: 420,
      sleepQuality: 7,
      energyScore: 7,
      moodScore: 6,
      stressScore: 5,
    },
    meals: [],
    hydrationLogs: [],
    toiletLogs: [],
    gymWorkouts: [],
  });

  return buildDailyQuestState({
    localDate,
    todaySummary: summary,
    previousStreak: {
      currentStreak: 6,
      longestStreak: 12,
      lastCompletedDate: previousDate(localDate),
      streakFreezeCount: 1,
      protectedToday: false,
    },
  });
}

function previousDate(localDate: string) {
  const [year = "1970", month = "1", day = "1"] = localDate.split("-");
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  date.setDate(date.getDate() - 1);

  return date.toISOString().slice(0, 10);
}
