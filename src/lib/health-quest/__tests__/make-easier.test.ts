import { describe, expect, it } from "vitest";
import { makeEasierMap, makeQuestEasier } from "../make-easier";
import type { DailyQuest, QuestType } from "../types";

describe("make it easier", () => {
  it("maps every quest type", () => {
    const types: QuestType[] = ["wake", "water", "meal", "movement", "mood", "toilet_optional", "sleep_prep", "health_review", "doctor_prep", "recovery", "learn"];

    expect(types.every((type) => Boolean(makeEasierMap[type]))).toBe(true);
  });

  it("marks quest metadata and keeps XP completion-based", () => {
    const easier = makeQuestEasier(quest("movement"));

    expect(easier.metadata.madeEasier).toBe(true);
    expect(easier.xp).toBeLessThanOrEqual(5);
  });
});

function quest(type: QuestType): DailyQuest {
  return {
    id: "q",
    localDate: "2026-05-14",
    type,
    title: { zh: "", en: "" },
    description: { zh: "", en: "" },
    actionLabel: { zh: "", en: "" },
    completedLabel: { zh: "", en: "" },
    xp: 15,
    required: true,
    status: "active",
    orderIndex: 0,
    safetyLevel: "normal",
    source: "generated",
    metadata: {},
  };
}
