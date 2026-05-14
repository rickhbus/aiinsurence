import { describe, expect, it } from "vitest";
import { buildDoctorVisitSummary, containsEmergencyRedFlag, doctorMissionDisclaimer } from "../doctor-mission";

describe("doctor prep mission", () => {
  it("exports preparation summary with disclaimer and no diagnosis claim", () => {
    const summary = buildDoctorVisitSummary({
      what_changed: "Main concern as user-entered",
      when_started: "Started yesterday",
      better_or_worse: "Worse at night",
      tried: "Rest",
      top_questions: "What should I watch for?\nWhen should I follow up?",
    });

    expect(summary.disclaimer.en).toContain("not a diagnosis");
    expect(JSON.stringify(summary).toLowerCase()).not.toContain("you have");
    expect(doctorMissionDisclaimer.en).toContain("call 999");
  });

  it("detects urgent red flags before normal mission flow", () => {
    expect(containsEmergencyRedFlag("severe breathing difficulty")).toBe(true);
  });
});
