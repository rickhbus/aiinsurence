import { describe, expect, it } from "vitest";
import { analyzeMeal, analyzeToiletLog } from "./index";

describe("health-os food and toilet safety", () => {
  it("marks food photo analysis as pending instead of pretending to recognize images", () => {
    const result = analyzeMeal({
      hasImage: true,
      mealType: "lunch",
      description: "rice and chicken",
    });

    expect(result.imageAnalysisPending).toBe(true);
    expect(result.summary).toContain("待供應商實作");
  });

  it("routes blood flag to medical assessment wording", () => {
    const result = analyzeToiletLog({
      bowelMovement: true,
      stoolType: 3,
      urineColor: "brown_red_pink",
      bloodFlag: true,
    });

    expect(result.safetyStatus).toBe("red");
    expect(result.nextAction).toContain("醫療評估");
  });
});
