import { describe, expect, it } from "vitest";
import { buildCoachStyleResponse } from "../coach-style";
import type { CoachStyle } from "../types";

describe("coach style", () => {
  it("changes tone without changing safety boundaries", () => {
    const styles: CoachStyle[] = ["gentle", "direct", "family_doctor", "gym", "calm", "bilingual"];
    const responses = styles.map((style) => buildCoachStyleResponse(style));

    expect(new Set(responses.map((response) => response.encouragement.en)).size).toBeGreaterThan(1);
    expect(new Set(responses.map((response) => response.safetyNote.en)).size).toBe(1);
    expect(new Set(responses.map((response) => response.notDiagnosis.en)).size).toBe(1);
  });
});
