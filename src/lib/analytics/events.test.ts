import { describe, expect, it } from "vitest";
import { scrubAnalyticsMetadata } from "./events";

describe("analytics event scrubbing", () => {
  it("redacts sensitive free-text fields while keeping safe metadata", () => {
    expect(
      scrubAnalyticsMetadata({
        symptomText: "胸痛和呼吸困難",
        mealNotes: "private meal note",
        category: "healthcare",
        redFlag: true,
        count: 2,
      }),
    ).toEqual({
      symptomText: "[redacted]",
      mealNotes: "[redacted]",
      category: "healthcare",
      redFlag: true,
      count: 2,
    });
  });
});
