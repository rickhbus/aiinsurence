import { describe, expect, it } from "vitest";
import { buildDailyQuestState } from "../quest-engine";
import {
  buildLessonEventKey,
  buildQuestCompletionEventKey,
  buildStreakFreezeEventKey,
  buildWeeklyReviewEventKey,
  getCompletionXp,
  getQuestXp,
  sanitizeXPMetadata,
} from "../xp";

describe("health quest XP", () => {
  it("uses fixed completion XP instead of good-looking health values", () => {
    const quest = buildDailyQuestState({ localDate: "2026-05-14" }).quests.find((item) => item.type === "movement");

    expect(quest).toBeDefined();
    expect(getQuestXp("movement")).toBe(15);
    expect(getCompletionXp({ ...quest!, metadata: { intensity: 1 } })).toBe(15);
    expect(getCompletionXp({ ...quest!, metadata: { intensity: 10 } })).toBe(15);
  });

  it("does not keep raw private details in XP metadata", () => {
    const metadata = sanitizeXPMetadata({
      questType: "water",
      symptomText: "private symptom",
      foodName: "private meal",
      source: "quest",
    });

    expect(metadata).toEqual({
      questType: "water",
      source: "quest",
    });
  });

  it("awards no XP for urgent safety-blocked quest nodes", () => {
    const quest = buildDailyQuestState({ localDate: "2026-05-14", safetyStatus: "red" }).quests[0];

    expect(getCompletionXp(quest)).toBe(0);
  });

  it("builds stable idempotency keys for retry-safe awards", () => {
    expect(buildQuestCompletionEventKey("quest-123")).toBe("quest:quest-123");
    expect(buildLessonEventKey("00000000-0000-0000-0000-000000000123")).toBe("lesson:00000000-0000-0000-0000-000000000123");
    expect(buildWeeklyReviewEventKey("2026-05-14")).toBe("weekly_review:2026-w20");
    expect(buildStreakFreezeEventKey({ plan: "plus", activeDays: 20, threshold: 10 })).toBe("streak_freeze:plus:2");
  });
});
