import { describe, expect, it } from "vitest";
import type { DailyCheckinRow } from "@/lib/health-data/types";
import { buildDailyHealthSummary } from "@/lib/health-os/daily-summary";
import { buildDailyQuestState, unlockQuests } from "../quest-engine";
import type { DailyQuest } from "../types";

const baseDate = "2026-05-14";

describe("health quest engine", () => {
  it("generates a normal daily quest path with 2-5 tiny quests", () => {
    const state = buildDailyQuestState({
      localDate: baseDate,
      todaySummary: buildDailyHealthSummary({ locale: "zh-Hant" }),
    });

    expect(state.mode).toBe("normal");
    expect(state.quests).toHaveLength(5);
    expect(state.quests.map((quest) => quest.type)).toEqual([
      "water",
      "mood",
      "meal",
      "movement",
      "sleep_prep",
    ]);
    expect(state.totalRequiredCount).toBe(3);
    expect(state.quests[0].status).toBe("active");
  });

  it("blocks gamification when Health OS reports urgent safety status", () => {
    const state = buildDailyQuestState({
      localDate: baseDate,
      safetyStatus: "red",
    });

    expect(state.mode).toBe("safety");
    expect(state.safetyMessage?.en).toContain("999");
    expect(state.quests.every((quest) => quest.status === "blocked_by_safety")).toBe(true);
    expect(state.quests.every((quest) => quest.xp === 0)).toBe(true);
  });

  it("marks completed quests from existing daily check-ins", () => {
    const checkins: DailyCheckinRow[] = [
      checkin("water"),
      checkin("meal"),
      checkin("health_review"),
    ];
    const state = buildDailyQuestState({
      localDate: baseDate,
      dailyCheckins: checkins,
    });

    expect(state.requiredCompletedCount).toBe(3);
    expect(state.streak.protectedToday).toBe(true);
    expect(state.coachNote.en).toContain("protected");
  });

  it("unlocks the next quest after dependencies are done", () => {
    const [first, second] = buildDailyQuestState({ localDate: baseDate }).quests;
    const quests = unlockQuests([
      { ...first, status: "done" },
      { ...second, status: "locked", unlocksAfter: [first.id] },
    ] as DailyQuest[]);

    expect(quests[1].status).toBe("active");
  });

  it("skipped optional quests do not break streak protection", () => {
    const state = buildDailyQuestState({
      localDate: baseDate,
      existingQuests: [
        done("water", 0, true),
        done("meal", 1, true),
        done("mood", 2, true),
        { ...done("movement", 3, false), status: "skipped", completedAt: null, skippedAt: `${baseDate}T01:00:00.000Z` },
      ],
    });

    expect(state.streak.protectedToday).toBe(true);
  });
});

function checkin(checkin_type: DailyCheckinRow["checkin_type"]): DailyCheckinRow {
  return {
    id: crypto.randomUUID(),
    user_id: "user-1",
    checkin_type,
    label: null,
    amount: null,
    unit: null,
    note: null,
    metadata: {},
    created_at: `${baseDate}T01:00:00.000Z`,
  };
}

function done(type: DailyQuest["type"], orderIndex: number, required: boolean): DailyQuest {
  const state = buildDailyQuestState({ localDate: baseDate });
  const quest = state.quests.find((item) => item.type === type);

  if (!quest) {
    throw new Error(`Missing quest ${type}`);
  }

  return {
    ...quest,
    required,
    orderIndex,
    status: "done",
    completedAt: `${baseDate}T01:00:00.000Z`,
  };
}
