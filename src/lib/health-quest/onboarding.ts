import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { healthQuestProfileSchema } from "./profile";
import { questPreferencesSchema } from "./preferences";

export const HEALTH_QUEST_ONBOARDING_LOCAL_STORAGE_KEY = "health-quest:onboarding-completed-local:v1";

export const onboardingConsentSchema = z.object({
  saveToSupabase: z.boolean().default(true),
  reminders: z.boolean().default(false),
  familySharingLater: z.boolean().default(false),
  analyticsPrivacyNoticeAcknowledged: z.boolean().refine(Boolean, {
    message: "Privacy-safe analytics notice must be acknowledged.",
  }),
});

export const healthQuestOnboardingSchema = z.object({
  profile: healthQuestProfileSchema,
  preferences: questPreferencesSchema.pick({
    preferredQuestTime: true,
    reminderEnabled: true,
    reminderTime: true,
    minimumRequiredQuests: true,
    maxDailyQuests: true,
    preferredDifficulty: true,
  }).partial().default({}),
  consent: onboardingConsentSchema,
});

type OnboardingClient = Pick<SupabaseClient, "from">;

export async function saveOnboardingAnswers({
  supabase,
  userId,
  answers,
}: {
  supabase: OnboardingClient;
  userId: string;
  answers: z.infer<typeof healthQuestOnboardingSchema>;
}) {
  const rows = [
    ["primary_goal", answers.profile.primaryGoal],
    ["daily_time_budget", answers.profile.dailyTimeBudget],
    ["hardest_barrier", answers.profile.hardestBarrier ?? null],
    ["preferred_quest_time", answers.preferences.preferredQuestTime ?? "no_preference"],
    ["preferred_locale", answers.profile.preferredLocale],
    ["coach_style", answers.profile.coachStyle],
    ["starting_path", answers.profile.startingPath],
    ["consent", answers.consent],
  ].map(([questionKey, answerValue]) => ({
    user_id: userId,
    question_key: questionKey,
    answer_value: { value: answerValue },
  }));

  const { error } = await supabase.from("user_onboarding_answers").insert(rows);

  if (error) {
    throw new Error(`Could not save onboarding answers: ${error.message}`);
  }
}

export function shouldShowHealthQuestOnboarding(profile: { onboardingCompletedAt?: string | null } | null) {
  return !profile?.onboardingCompletedAt;
}

type LocalOnboardingPayloadInput = {
  profile: {
    primaryGoal: string;
    dailyTimeBudget: string;
    hardestBarrier?: string | null;
    startingPath: string;
    preferredLocale: string;
    coachStyle: string;
  };
  preferences: {
    preferredQuestTime?: string;
    reminderEnabled?: boolean;
    reminderTime?: string | null;
    minimumRequiredQuests?: number;
    maxDailyQuests?: number;
    preferredDifficulty?: string;
  };
  consent: {
    reminders: boolean;
    familySharingLater: boolean;
    analyticsPrivacyNoticeAcknowledged: boolean;
  };
};

export function buildOnboardingLocalStoragePayload(payload: LocalOnboardingPayloadInput) {
  return {
    version: 1,
    savedAt: new Date().toISOString(),
    profile: payload.profile,
    preferences: payload.preferences,
    consent: {
      reminders: payload.consent.reminders,
      familySharingLater: payload.consent.familySharingLater,
      analyticsPrivacyNoticeAcknowledged: payload.consent.analyticsPrivacyNoticeAcknowledged,
    },
  };
}

export function hasLocalOnboardingCompletion(
  storage: Pick<Storage, "getItem"> | null | undefined,
) {
  if (!storage) {
    return false;
  }

  try {
    const raw = storage.getItem(HEALTH_QUEST_ONBOARDING_LOCAL_STORAGE_KEY);

    if (!raw) {
      return false;
    }

    const parsed = JSON.parse(raw) as {
      version?: unknown;
      profile?: unknown;
      consent?: { analyticsPrivacyNoticeAcknowledged?: unknown };
    };

    return (
      parsed.version === 1 &&
      Boolean(parsed.profile) &&
      parsed.consent?.analyticsPrivacyNoticeAcknowledged === true
    );
  } catch {
    return false;
  }
}
