import { describe, expect, it } from "vitest";
import { applyMissedDayFreeze, earnStreakFreeze, shouldEarnStreakFreeze } from "../streak-freezes";
import type { UserStreak } from "../types";

describe("streak freeze economy", () => {
  it("earns one free freeze after seven active days with max one", () => {
    const streak = baseStreak({ streakFreezeCount: 0, totalFreezesEarned: 0 });

    expect(shouldEarnStreakFreeze({ activeDays: 7, streak, plan: "free" })).toBe(true);
    expect(earnStreakFreeze({ streak, plan: "free" }).streakFreezeCount).toBe(1);
    expect(shouldEarnStreakFreeze({ activeDays: 14, streak: baseStreak({ streakFreezeCount: 1, totalFreezesEarned: 1 }), plan: "free" })).toBe(false);
  });

  it("allows plus/pro/family to hold more freezes", () => {
    expect(earnStreakFreeze({ streak: baseStreak({ streakFreezeCount: 2 }), plan: "plus" }).streakFreezeCount).toBe(3);
    expect(earnStreakFreeze({ streak: baseStreak({ streakFreezeCount: 4 }), plan: "pro" }).streakFreezeCount).toBe(5);
  });

  it("consumes a freeze after one missed day", () => {
    const result = applyMissedDayFreeze({
      streak: baseStreak({ lastCompletedDate: "2026-05-12", streakFreezeCount: 1 }),
      localDate: "2026-05-14",
    });

    expect(result.consumed).toBe(true);
    expect(result.streak.streakFreezeCount).toBe(0);
    expect(result.message.en).not.toMatch(/failed|lost health/i);
  });

  it("resets gracefully when no freeze exists", () => {
    const result = applyMissedDayFreeze({
      streak: baseStreak({ lastCompletedDate: "2026-05-12", streakFreezeCount: 0 }),
      localDate: "2026-05-14",
    });

    expect(result.consumed).toBe(false);
    expect(result.streak.currentStreak).toBe(0);
  });
});

function baseStreak(overrides: Partial<UserStreak> = {}): UserStreak {
  return {
    currentStreak: 7,
    longestStreak: 7,
    lastCompletedDate: "2026-05-13",
    streakFreezeCount: 0,
    protectedToday: true,
    totalFreezesEarned: 0,
    totalFreezesConsumed: 0,
    ...overrides,
  };
}
