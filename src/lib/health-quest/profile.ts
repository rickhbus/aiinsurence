import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { CoachStyle, QuestLocale, UserHealthQuestProfile } from "./types";

export const primaryGoalValues = [
  "better_sleep",
  "more_energy",
  "drink_more_water",
  "eat_better",
  "move_more",
  "reduce_stress",
  "mood_support",
  "doctor_prep",
  "family_care",
  "insurance_education",
] as const;

export const dailyTimeValues = [
  "thirty_seconds",
  "two_minutes",
  "five_minutes",
  "ten_minutes",
] as const;

export const barrierValues = [
  "i_forget",
  "too_tired",
  "dont_know_what_to_do",
  "lose_motivation",
  "symptoms_worry_me",
  "need_family_support",
  "too_busy",
  "privacy_concern",
] as const;

export const startingPathValues = [
  "easy_start",
  "energy_reset",
  "sleep_better",
  "stress_less",
  "move_gently",
  "food_awareness",
  "doctor_prep",
  "family_care",
] as const;

export const questLocaleValues = ["zh-Hant", "en", "bilingual"] as const;
export const coachStyleValues = ["gentle", "direct", "family_doctor", "gym", "calm", "bilingual"] as const;

export const healthQuestProfileSchema = z.object({
  primaryGoal: z.enum(primaryGoalValues).default("better_sleep"),
  dailyTimeBudget: z.enum(dailyTimeValues).default("two_minutes"),
  hardestBarrier: z.enum(barrierValues).nullable().optional(),
  startingPath: z.enum(startingPathValues).default("easy_start"),
  preferredLocale: z.enum(questLocaleValues).default("zh-Hant"),
  coachStyle: z.enum(coachStyleValues).default("gentle"),
});

type ProfileClient = Pick<SupabaseClient, "from">;

export async function loadHealthQuestProfile(
  supabase: ProfileClient,
  userId: string,
): Promise<UserHealthQuestProfile | null> {
  const { data, error } = await supabase
    .from("user_health_quest_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Could not load Health Quest profile: ${error.message}`);
  }

  return data ? mapHealthQuestProfile(data) : null;
}

export async function upsertHealthQuestProfile(
  supabase: ProfileClient,
  userId: string,
  profile: z.infer<typeof healthQuestProfileSchema> & { onboardingCompletedAt?: string | null },
) {
  const { data, error } = await supabase
    .from("user_health_quest_profiles")
    .upsert({
      user_id: userId,
      primary_goal: profile.primaryGoal,
      daily_time_budget: profile.dailyTimeBudget,
      hardest_barrier: profile.hardestBarrier ?? null,
      starting_path: profile.startingPath,
      preferred_locale: profile.preferredLocale,
      coach_style: profile.coachStyle,
      onboarding_completed_at: profile.onboardingCompletedAt ?? new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" })
    .select("*")
    .single();

  if (error) {
    throw new Error(`Could not save Health Quest profile: ${error.message}`);
  }

  return mapHealthQuestProfile(data);
}

export async function updateCoachStyle(
  supabase: ProfileClient,
  userId: string,
  coachStyle: CoachStyle,
) {
  const { data, error } = await supabase
    .from("user_health_quest_profiles")
    .upsert({
      user_id: userId,
      coach_style: coachStyle,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" })
    .select("*")
    .single();

  if (error) {
    throw new Error(`Could not update coach style: ${error.message}`);
  }

  return mapHealthQuestProfile(data);
}

export function mapHealthQuestProfile(row: Record<string, unknown>): UserHealthQuestProfile {
  return {
    userId: String(row.user_id),
    primaryGoal: String(row.primary_goal ?? "better_sleep"),
    dailyTimeBudget: String(row.daily_time_budget ?? "two_minutes") as UserHealthQuestProfile["dailyTimeBudget"],
    hardestBarrier: row.hardest_barrier ? String(row.hardest_barrier) : null,
    startingPath: String(row.starting_path ?? "easy_start"),
    preferredLocale: String(row.preferred_locale ?? "zh-Hant") as QuestLocale,
    coachStyle: String(row.coach_style ?? "gentle") as CoachStyle,
    onboardingCompletedAt: row.onboarding_completed_at ? String(row.onboarding_completed_at) : null,
  };
}
