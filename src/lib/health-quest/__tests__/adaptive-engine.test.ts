import { describe, expect, it } from "vitest";
import { buildAdaptiveQuestPlan } from "../adaptive-engine";
import type { QuestAdaptationInput, QuestType } from "../types";

describe("adaptive Health Quest engine", () => {
  it("starts new users with tiny or easy required quests", () => {
    const plan = buildAdaptiveQuestPlan(input({ last7DaysCompletionRate: 0, last30DaysCompletionRate: 0, currentStreak: 0 }));

    expect(["tiny", "easy"]).toContain(plan.difficulty);
    expect(plan.minimumRequiredQuests).toBe(2);
    expect(plan.maxDailyQuests).toBeLessThanOrEqual(4);
    expect(plan.adaptationReasons).toContain("new_user");
  });

  it("low completion lowers difficulty and required count", () => {
    const plan = buildAdaptiveQuestPlan(input({ last7DaysCompletionRate: 0.25, last30DaysCompletionRate: 0.5 }));

    expect(plan.difficulty).toBe("tiny");
    expect(plan.minimumRequiredQuests).toBe(2);
    expect(plan.adaptationReasons).toContain("low_completion");
  });

  it("high completion offers optional challenge only", () => {
    const plan = buildAdaptiveQuestPlan(input({ last7DaysCompletionRate: 0.9, last30DaysCompletionRate: 0.9 }));

    expect(plan.offerChallengeQuest).toBe(true);
    expect(plan.minimumRequiredQuests).toBe(3);
  });

  it("repeated skips bias easier quest versions", () => {
    const plan = buildAdaptiveQuestPlan(input({
      repeatedSkipCounts: {
        ...counts(),
        movement: 3,
        meal: 3,
        mood: 3,
      },
    }));

    expect(plan.adaptationReasons).toContain("repeated_skip");
    expect(plan.questTypeBias).toEqual(expect.arrayContaining(["movement", "meal", "mood"]));
  });

  it("low mood, poor sleep, pain, and dehydration recommend recovery-safe plan", () => {
    const plan = buildAdaptiveQuestPlan(input({
      moodTrend: "down",
      sleepConsistency: 20,
      hydrationConsistency: 20,
      painOrSoreness: true,
    }));

    expect(plan.recoveryModeRecommended).toBe(true);
    expect(plan.adaptationReasons).toEqual(expect.arrayContaining(["low_mood", "poor_sleep", "pain_or_soreness", "dehydration_signal"]));
    expect(plan.offerChallengeQuest).toBe(false);
  });

  it("safety events block ordinary challenge mode", () => {
    const plan = buildAdaptiveQuestPlan(input({ safetyEventsLast30: 1, last7DaysCompletionRate: 0.95 }));

    expect(plan.adaptationReasons).toContain("safety_block");
    expect(plan.offerChallengeQuest).toBe(false);
    expect(plan.minimumRequiredQuests).toBe(0);
  });

  it("30 second preference keeps tiny actions only", () => {
    const plan = buildAdaptiveQuestPlan(input({
      profile: {
        userId: "u",
        primaryGoal: "better_sleep",
        dailyTimeBudget: "thirty_seconds",
        startingPath: "easy_start",
        preferredLocale: "zh-Hant",
        coachStyle: "gentle",
      },
    }));

    expect(plan.difficulty).toBe("tiny");
    expect(plan.minimumRequiredQuests).toBe(2);
    expect(plan.maxDailyQuests).toBe(3);
  });
});

function input(overrides: Partial<QuestAdaptationInput> = {}): QuestAdaptationInput {
  return {
    userId: "user-1",
    localDate: "2026-05-14",
    locale: "zh-Hant",
    last7DaysCompletionRate: 0.6,
    last30DaysCompletionRate: 0.6,
    last7DaysQuestTypes: [],
    skippedQuestTypes: [],
    repeatedSkipCounts: counts(),
    recoveryDaysLast7: 0,
    safetyEventsLast30: 0,
    preferredQuestTime: "no_preference",
    userGoal: "easy_start",
    energyTrend: "stable",
    moodTrend: "stable",
    hydrationConsistency: 70,
    movementConsistency: 70,
    sleepConsistency: 70,
    currentStreak: 3,
    streakAtRisk: false,
    ...overrides,
  };
}

function counts(): Record<QuestType, number> {
  return {
    wake: 0,
    water: 0,
    meal: 0,
    movement: 0,
    mood: 0,
    toilet_optional: 0,
    sleep_prep: 0,
    health_review: 0,
    doctor_prep: 0,
    recovery: 0,
    learn: 0,
  };
}
