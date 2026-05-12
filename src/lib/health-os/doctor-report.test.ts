import { describe, expect, it } from "vitest";
import { buildDoctorReport } from "./doctor-report";

describe("doctor report export", () => {
  it("includes red flags and emergency guidance", () => {
    const report = buildDoctorReport({
      generatedAt: "2026-05-13T00:00:00.000Z",
      toiletLogs: [
        {
          loggedAt: "2026-05-12T08:00:00.000Z",
          bowelMovement: true,
          urineColor: "brown_red_pink",
          bloodFlag: true,
        },
      ],
      gymWorkouts: [{ painFlag: true, workoutType: "legs" }],
    });

    expect(report.redFlags.join(" ")).toContain("血尿");
    expect(report.printableHtml).toContain("999");
  });

  it("does not make diagnosis claims", () => {
    const report = buildDoctorReport({
      dailyLogs: [{ bodyNotes: "頭痛兩日", logDate: "2026-05-12" }],
    });

    expect(report.printableHtml).not.toContain("診斷為");
    expect(report.printableHtml.toLowerCase()).not.toContain("diagnosed with");
  });
});
