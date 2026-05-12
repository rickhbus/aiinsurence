import { describe, expect, it } from "vitest";
import { buildDailyHealthSummary, calculateLifestyleScores } from "./index";

describe("health-os lifestyle scoring", () => {
  it("keeps scores as lifestyle readiness signals", () => {
    const scores = calculateLifestyleScores({
      locale: "zh-Hant",
      dailyLog: {
        sleepMinutes: 450,
        sleepQuality: 8,
        energyScore: 8,
        moodScore: 7,
        stressScore: 3,
      },
      meals: [{ proteinG: 35, fiberG: 8, waterMl: 300 }],
      hydrationLogs: [{ waterMl: 1500 }],
      gymWorkouts: [{ durationMinutes: 45, intensity: 6, sorenessAfter: 3 }],
      toiletLogs: [{ bowelMovement: true, stoolType: 4, urineColor: "pale_yellow" }],
    });

    expect(scores.safetyStatus).toBe("green");
    expect(scores.energyScore).toBeGreaterThan(60);
    expect(scores.recoveryScore).toBeGreaterThan(50);
    expect(scores.nutritionScore).toBeGreaterThan(50);
  });

  it("prioritizes red safety status over normal daily summary", () => {
    const summary = buildDailyHealthSummary({
      locale: "zh-Hant",
      dailyLog: { sleepMinutes: 420, energyScore: 7 },
      gymWorkouts: [{ notes: "chest pain during treadmill run", intensity: 8 }],
    });

    expect(summary.safetyStatus).toBe("red");
    expect(summary.summaryZh).toContain("紅旗");
    expect(summary.nextActions[0]).toContain("999");
  });
});
