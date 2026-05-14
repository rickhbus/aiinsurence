import { describe, expect, it } from "vitest";
import { assertSafetyNeverGated, canUseHealthQuestFeature, normalizeHealthQuestPlan } from "../entitlements";

describe("Health Quest entitlements", () => {
  it("maps existing payment posture to Health Quest plans", () => {
    expect(normalizeHealthQuestPlan("care")).toBe("plus");
    expect(normalizeHealthQuestPlan("family")).toBe("family");
    expect(normalizeHealthQuestPlan(null)).toBe("free");
  });

  it("never gates safety guidance", () => {
    expect(assertSafetyNeverGated("free")).toBe(true);
    expect(canUseHealthQuestFeature("free", "safety_guidance")).toBe(true);
    expect(canUseHealthQuestFeature("free", "family_circles")).toBe(false);
  });
});
