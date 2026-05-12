import { describe, expect, it } from "vitest";
import { analyzeMood } from "./mood";

describe("health-os mood coach", () => {
  it("uses crisis guidance before ordinary mood reflection", () => {
    const result = analyzeMood({
      userText: "I might hurt myself tonight",
      moodScore: 1,
      stressScore: 10,
      energyScore: 1,
      locale: "en",
    });

    expect(result.distressLevel).toBe("crisis");
    expect(result.suggestedSmallAction).toContain("999");
  });

  it("does not diagnose psychiatric conditions", () => {
    const result = analyzeMood({
      userText: "我好攰，工作壓力好大",
      stressScore: 8,
      energyScore: 3,
      locale: "zh-Hant",
    });

    expect(result.userFacingReflection).toContain("聽起來像是");
    expect(result.userFacingReflection).not.toContain("患有");
  });
});
