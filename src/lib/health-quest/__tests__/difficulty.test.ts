import { describe, expect, it } from "vitest";
import { difficultyFromCompletionRate, easierDifficulty, harderDifficulty } from "../difficulty";

describe("quest difficulty helpers", () => {
  it("maps completion rates conservatively", () => {
    expect(difficultyFromCompletionRate(0.2)).toBe("tiny");
    expect(difficultyFromCompletionRate(0.5)).toBe("easy");
    expect(difficultyFromCompletionRate(0.8)).toBe("normal");
  });

  it("steps difficulty without going out of range", () => {
    expect(easierDifficulty("tiny")).toBe("tiny");
    expect(easierDifficulty("normal")).toBe("easy");
    expect(harderDifficulty("challenge")).toBe("challenge");
    expect(harderDifficulty("easy")).toBe("normal");
  });
});
