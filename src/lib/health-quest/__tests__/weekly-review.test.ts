import { describe, expect, it } from "vitest";
import { buildWeeklyHealthQuestReview, weeklyReviewUnlocked } from "../weekly-review";
import type { DailyQuest, UserStreak } from "../types";

describe("weekly review", () => {
  it("summarizes patterns without raw symptom text", () => {
    const review = buildWeeklyHealthQuestReview({
      quests: [
        quest("water", "done", { rawText: "chest pain raw text must not leak" }),
        quest("mood", "skipped", { moodNote: "private note" }),
        quest("recovery", "done", {}),
      ],
      xpEvents: [{ id: "xp", amount: 5, reason: "quest_completed:water", createdAt: "2026-05-12T00:00:00.000Z" }],
      streak: streak(),
      weekStart: "2026-05-11",
      weekEnd: "2026-05-17",
    });

    expect(JSON.stringify(review)).not.toContain("chest pain raw text");
    expect(JSON.stringify(review)).not.toContain("private note");
    expect(review.disclaimers[0].en).toContain("not a medical score");
  });

  it("unlocks after five active days", () => {
    const quests = ["2026-05-11", "2026-05-12", "2026-05-13", "2026-05-14", "2026-05-15"].map((date) => quest("water", "done", {}, date));

    expect(weeklyReviewUnlocked(quests, new Date("2026-05-15T12:00:00.000Z"))).toBe(true);
  });
});

function quest(type: DailyQuest["type"], status: DailyQuest["status"], metadata: Record<string, unknown>, localDate = "2026-05-12"): DailyQuest {
  return {
    id: `${localDate}-${type}`,
    localDate,
    type,
    title: { zh: type, en: type },
    description: { zh: "", en: "" },
    actionLabel: { zh: "", en: "" },
    completedLabel: { zh: "", en: "" },
    xp: 5,
    required: true,
    status,
    orderIndex: 0,
    safetyLevel: "normal",
    source: type === "recovery" ? "recovery" : "generated",
    metadata,
  };
}

function streak(): UserStreak {
  return {
    currentStreak: 5,
    longestStreak: 7,
    lastCompletedDate: "2026-05-15",
    streakFreezeCount: 0,
    protectedToday: true,
  };
}
