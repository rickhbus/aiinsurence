import { describe, expect, it } from "vitest";
import { buildDailyQuestState } from "../quest-engine";
import { recomputeUserStreak } from "../streaks";

describe("health quest streaks", () => {
  it("protects the normal streak after 3 required quests", () => {
    const state = buildDailyQuestState({
      localDate: "2026-05-14",
      dailyCheckins: [
        checkin("wake_up"),
        checkin("water"),
        checkin("meal"),
      ],
    });

    expect(state.requiredCompletedCount).toBe(3);
    expect(state.streak.protectedToday).toBe(true);
  });

  it("protects a recovery day with 2 gentle quests", () => {
    const state = buildDailyQuestState({
      localDate: "2026-05-14",
      healthContext: {
        locale: "zh-Hant",
        dailyLog: { energyScore: 2, sleepMinutes: 250 },
      },
      dailyCheckins: [
        checkin("health_review"),
        checkin("water"),
      ],
    });

    expect(state.mode).toBe("recovery");
    expect(state.streak.protectedToday).toBe(true);
  });

  it("uses a streak freeze for one missed day", () => {
    const streak = recomputeUserStreak({
      localDate: "2026-05-14",
      protectedToday: true,
      previous: {
        currentStreak: 5,
        longestStreak: 5,
        lastCompletedDate: "2026-05-12",
        streakFreezeCount: 1,
        protectedToday: false,
      },
    });

    expect(streak.currentStreak).toBe(6);
    expect(streak.streakFreezeCount).toBe(0);
  });
});

function checkin(checkin_type: "wake_up" | "water" | "meal" | "health_review") {
  return {
    id: crypto.randomUUID(),
    user_id: "u1",
    checkin_type,
    label: null,
    amount: null,
    unit: null,
    note: null,
    metadata: {},
    created_at: "2026-05-14T01:00:00.000Z",
  };
}
