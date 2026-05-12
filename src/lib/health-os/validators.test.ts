import { describe, expect, it } from "vitest";
import {
  businessLeadSchema,
  dailyHealthCheckInSchema,
  gymWorkoutSchema,
} from "./validators";

describe("health-os validators", () => {
  it("accepts bounded daily check-in values", () => {
    const result = dailyHealthCheckInSchema.parse({
      sleepMinutes: "420",
      energyScore: "7",
      moodScore: "6",
      stressScore: "4",
      consentToSave: true,
    });

    expect(result.sleepMinutes).toBe(420);
  });

  it("rejects gym RPE outside 1-10", () => {
    expect(() =>
      gymWorkoutSchema.parse({
        sets: [{ exerciseName: "Squat", setNumber: 1, rpe: 12 }],
      }),
    ).toThrow();
  });

  it("requires explicit contact consent for business leads", () => {
    expect(() =>
      businessLeadSchema.parse({
        leadType: "gym",
        companyName: "Gym",
        contactName: "Lead",
        email: "lead@example.com",
        consentToContact: false,
      }),
    ).toThrow();
  });
});
