import { describe, expect, it } from "vitest";
import { analyzeIntake } from "../navigation-engine";
import { createGuideFallbackMessage } from "./health-guide";

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
});
