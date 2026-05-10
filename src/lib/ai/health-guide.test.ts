import { describe, expect, it } from "vitest";
import { analyzeIntake } from "../navigation-engine";
import { createGuideFallbackMessage, getGuideEmotionPosture } from "./health-guide";

describe("health guide fallback voice", () => {
  it("uses the firm emergency instruction without model text", () => {
    const recommendation = analyzeIntake("medical", "我胸口痛，又呼吸困難");

    expect(createGuideFallbackMessage(recommendation)).toBe(
      "This may be urgent. Please call 999 or go to A&E now. Do not wait for AI or insurance confirmation.",
    );
  });

  it("uses calm non-urgent wording without claiming diagnosis", () => {
    const recommendation = analyzeIntake("medical", "皮膚痕咗兩個星期");

    expect(createGuideFallbackMessage(recommendation)).toContain(
      "Based on what you shared, this does not sound like an immediate emergency from the text alone, but a clinician should confirm.",
    );
  });

  it("sets a low-emotion posture for same-day and planning guidance", () => {
    const sameDay = analyzeIntake("medical", "高燒又持續嘔吐");
    const insurance = analyzeIntake("insurance", "我自僱，想買醫療保險");

    expect(getGuideEmotionPosture(sameDay)).toContain("concerned but composed");
    expect(getGuideEmotionPosture(insurance)).toContain("practical and neutral");
  });
});
