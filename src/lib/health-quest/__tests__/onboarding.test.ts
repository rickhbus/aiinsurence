import { describe, expect, it } from "vitest";
import { healthQuestOnboardingSchema, shouldShowHealthQuestOnboarding } from "../onboarding";

describe("Health Quest onboarding", () => {
  it("validates and saves preference-level answers", () => {
    const parsed = healthQuestOnboardingSchema.parse({
      profile: {
        primaryGoal: "better_sleep",
        dailyTimeBudget: "two_minutes",
        hardestBarrier: "i_forget",
        startingPath: "easy_start",
        preferredLocale: "zh-Hant",
        coachStyle: "gentle",
      },
      preferences: {
        preferredQuestTime: "morning",
        reminderEnabled: true,
      },
      consent: {
        saveToSupabase: true,
        reminders: true,
        familySharingLater: false,
        analyticsPrivacyNoticeAcknowledged: true,
      },
    });

    expect(parsed.profile.primaryGoal).toBe("better_sleep");
    expect(JSON.stringify(parsed)).not.toMatch(/hkid|policy number|diagnosis/i);
  });

  it("existing completed profile skips onboarding", () => {
    expect(shouldShowHealthQuestOnboarding(null)).toBe(true);
    expect(shouldShowHealthQuestOnboarding({ onboardingCompletedAt: "2026-05-14T00:00:00.000Z" })).toBe(false);
  });
});
