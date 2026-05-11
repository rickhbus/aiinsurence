import { describe, expect, it } from "vitest";
import { classifyEmotion } from "./classifier";

describe("Emotion Engine classifier", () => {
  it("summarizes anxious insurance language without making decisioning claims", () => {
    const result = classifyEmotion({
      text: "I am worried the insurer will deny my claim and I do not understand the documents.",
      language: "en",
    }, "00000000-0000-4000-8000-000000000001");

    expect(result.primary_emotion).toBe("anxious");
    expect(result.secondary_emotions).toContain("confused");
    expect(result.safety_flags.sensitiveInsuranceDecision).toBe(true);
    expect(result.internal_notes).toContain("Do not use emotion output");
    expect(result.disclaimer).toContain("not a clinical assessment");
  });

  it("escalates self-harm language to crisis guidance", () => {
    const result = classifyEmotion({
      text: "我不想活，可能會傷害自己。",
      language: "zh-Hant",
    }, "00000000-0000-4000-8000-000000000002");

    expect(result.urgency_level).toBe("crisis");
    expect(result.safety_flags.selfHarm).toBe(true);
    expect(result.suggested_next_step).toContain("999");
  });
});
