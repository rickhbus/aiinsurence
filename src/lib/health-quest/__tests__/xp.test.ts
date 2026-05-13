import { describe, expect, it } from "vitest";
import { buildDailyQuestState } from "../quest-engine";
import { getCompletionXp, getQuestXp, sanitizeXPMetadata } from "../xp";

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
});
