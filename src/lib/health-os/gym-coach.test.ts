import { describe, expect, it } from "vitest";
import { analyzeGymWorkout } from "./gym-coach";

describe("health-os gym coach", () => {
  it("escalates deterministic workout red flags before training advice", () => {
    const result = analyzeGymWorkout({
      workoutType: "Treadmill run",
      notes: "severe dizziness and chest pain during set",
      sets: [{ exerciseName: "Treadmill run", setNumber: 1, completed: false }],
    });

    expect(result.safetyStatus).toBe("red");
    expect(result.recoveryRecommendation).toContain("999");
    expect(result.progressionInsight).toContain("不建議");
  });

  it("suggests lighter work for poor sleep and soreness", () => {
    const result = analyzeGymWorkout({
      workoutType: "Push",
      sleepMinutes: 280,
      sorenessBefore: 8,
      intensity: 7,
      sets: [{ exerciseName: "Bench press", setNumber: 1, reps: 8, weightKg: 60 }],
    });

    expect(result.safetyStatus).toBe("yellow");
    expect(result.safetyFlags).toContain("poor_sleep_high_soreness");
    expect(result.recoveryRecommendation).toContain("輕量");
  });
});
