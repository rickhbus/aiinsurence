import { describe, expect, it } from "vitest";
import {
  HEALTH_QUEST_ONBOARDING_LOCAL_STORAGE_KEY,
  buildOnboardingLocalStoragePayload,
  hasLocalOnboardingCompletion,
  healthQuestOnboardingSchema,
  shouldShowHealthQuestOnboarding,
} from "../onboarding";

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

  it("allows a privacy-acknowledged local onboarding fallback to start today", () => {
    const payload = buildOnboardingLocalStoragePayload({
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
        reminders: true,
        familySharingLater: false,
        analyticsPrivacyNoticeAcknowledged: true,
      },
    });
    const storage = {
      getItem: (key: string) =>
        key === HEALTH_QUEST_ONBOARDING_LOCAL_STORAGE_KEY ? JSON.stringify(payload) : null,
    };

    expect(hasLocalOnboardingCompletion(storage)).toBe(true);
  });

  it("does not treat unacknowledged local onboarding as complete", () => {
    const storage = {
      getItem: () => JSON.stringify({
        version: 1,
        profile: { primaryGoal: "better_sleep" },
        consent: { analyticsPrivacyNoticeAcknowledged: false },
      }),
    };

    expect(hasLocalOnboardingCompletion(storage)).toBe(false);
  });
});
