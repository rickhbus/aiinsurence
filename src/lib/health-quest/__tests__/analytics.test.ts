import { describe, expect, it } from "vitest";
import { sanitizeAnalyticsProperties } from "../analytics";

describe("privacy-safe analytics", () => {
  it("strips unsafe PHI/PII and raw text fields", () => {
    const sanitized = sanitizeAnalyticsProperties({
      questType: "water",
      notes: "private",
      rawText: "private",
      symptom: "private",
      symptoms: "private",
      bodyNotes: "private",
      moodNote: "private",
      foodText: "private",
      doctorNotes: "private",
      policyText: "private",
      claimText: "private",
      phone: "private",
      email: "private",
      hkid: "private",
      token: "private",
      apiKey: "private",
      session: "private",
      prompt: "private",
    });

    expect(sanitized).toEqual({ questType: "water" });
  });
});
