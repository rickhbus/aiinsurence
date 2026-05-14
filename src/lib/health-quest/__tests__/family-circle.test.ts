import { describe, expect, it } from "vitest";
import { canShareRawHealthDetails, privacySafeFamilyActivity, stripUnsafeFamilyPayload } from "../family-circle";

describe("family circle privacy", () => {
  it("defaults to streak-only progress copy", () => {
    expect(privacySafeFamilyActivity({
      displayName: "Rick",
      questsCompleted: 3,
      streakProtected: true,
      sharingLevel: "streak_only",
    })).toBe("Rick protected streak today");
  });

  it("does not allow raw details by default", () => {
    expect(canShareRawHealthDetails("streak_only")).toBe(false);
    expect(canShareRawHealthDetails("doctor_prep_summary")).toBe(true);
  });

  it("strips unsafe family payload fields", () => {
    const safe = stripUnsafeFamilyPayload({
      questsCompleted: 3,
      symptomText: "private",
      moodNote: "private",
      diagnosis: "private",
    });

    expect(safe).toEqual({ questsCompleted: 3 });
  });
});
