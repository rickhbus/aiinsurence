import { describe, expect, it } from "vitest";
import {
  buildDoctorVisitPlainText,
  buildDoctorVisitPrintableHtml,
  buildDoctorVisitSummary,
  containsEmergencyRedFlag,
  doctorMissionDisclaimer,
} from "../doctor-mission";

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
    expect(summary.disclaimer.en).toContain("call 999");
    expect(summary.disclaimer.zh).toContain("唔係診斷");
    expect(summary.disclaimer.zh).toContain("999");
    expect(JSON.stringify(summary).toLowerCase()).not.toContain("you have");
    expect(doctorMissionDisclaimer.en).toContain("call 999");
  });

  it("detects urgent red flags before normal mission flow", () => {
    expect(containsEmergencyRedFlag("severe breathing difficulty")).toBe(true);
  });

  it("builds print and copy exports without diagnosis or treatment claims", () => {
    const answers = {
      what_changed: "Main concern",
      top_questions: "What should I ask?",
    };
    const html = buildDoctorVisitPrintableHtml(answers);
    const plainText = buildDoctorVisitPlainText(answers);

    expect(html).toContain("Print / Save as PDF");
    expect(plainText).toContain("not a diagnosis");
    expect(`${html}\n${plainText}`).not.toMatch(/diagnosed with|take this medication|treatment plan/iu);
  });
});
