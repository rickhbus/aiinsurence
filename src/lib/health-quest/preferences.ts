import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { QuestDifficulty, UserQuestPreferences } from "./types";

export const preferredQuestTimeValues = ["morning", "midday", "evening", "no_preference"] as const;
export const questDifficultyValues = ["tiny", "easy", "normal", "challenge"] as const;

export const questPreferencesSchema = z.object({
  preferredQuestTime: z.enum(preferredQuestTimeValues).default("no_preference"),
  reminderEnabled: z.boolean().default(false),
  reminderTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/).nullable().optional(),
  recoveryModeDefault: z.boolean().default(false),
  minimumRequiredQuests: z.number().int().min(2).max(5).default(3),
  maxDailyQuests: z.number().int().min(2).max(5).default(5),
  preferredDifficulty: z.enum(questDifficultyValues).default("easy"),
  morningReminderEnabled: z.boolean().default(false),
  morningReminderTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/).nullable().optional(),
  waterReminderEnabled: z.boolean().default(false),
  eveningReviewEnabled: z.boolean().default(false),
  weeklyReviewEnabled: z.boolean().default(true),
  notificationQuietHoursStart: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/).nullable().optional(),
  notificationQuietHoursEnd: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/).nullable().optional(),
});

type PreferencesClient = Pick<SupabaseClient, "from">;

export async function loadQuestPreferences(
  supabase: PreferencesClient,
  userId: string,
): Promise<UserQuestPreferences | null> {
  const { data, error } = await supabase
    .from("user_quest_preferences")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Could not load quest preferences: ${error.message}`);
  }

  return data ? mapQuestPreferences(data) : null;
}

export async function upsertQuestPreferences(
  supabase: PreferencesClient,
  userId: string,
  preferences: z.infer<typeof questPreferencesSchema>,
) {
  const { data, error } = await supabase
    .from("user_quest_preferences")
    .upsert({
      user_id: userId,
      preferred_quest_time: preferences.preferredQuestTime,
      reminder_enabled: preferences.reminderEnabled,
      reminder_time: preferences.reminderTime ?? null,
      recovery_mode_default: preferences.recoveryModeDefault,
      minimum_required_quests: preferences.minimumRequiredQuests,
      max_daily_quests: preferences.maxDailyQuests,
      preferred_difficulty: preferences.preferredDifficulty,
      morning_reminder_enabled: preferences.morningReminderEnabled,
      morning_reminder_time: preferences.morningReminderTime ?? null,
      water_reminder_enabled: preferences.waterReminderEnabled,
      evening_review_enabled: preferences.eveningReviewEnabled,
      weekly_review_enabled: preferences.weeklyReviewEnabled,
      notification_quiet_hours_start: preferences.notificationQuietHoursStart ?? null,
      notification_quiet_hours_end: preferences.notificationQuietHoursEnd ?? null,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" })
    .select("*")
    .single();

  if (error) {
    throw new Error(`Could not save quest preferences: ${error.message}`);
  }

  return mapQuestPreferences(data);
}

export function mapQuestPreferences(row: Record<string, unknown>): UserQuestPreferences {
  return {
    userId: String(row.user_id),
    preferredQuestTime: String(row.preferred_quest_time ?? "no_preference") as UserQuestPreferences["preferredQuestTime"],
    reminderEnabled: Boolean(row.reminder_enabled ?? false),
    reminderTime: row.reminder_time ? String(row.reminder_time) : null,
    recoveryModeDefault: Boolean(row.recovery_mode_default ?? false),
    minimumRequiredQuests: Number(row.minimum_required_quests ?? 3),
    maxDailyQuests: Number(row.max_daily_quests ?? 5),
    preferredDifficulty: String(row.preferred_difficulty ?? "easy") as QuestDifficulty,
    morningReminderEnabled: Boolean(row.morning_reminder_enabled ?? false),
    morningReminderTime: row.morning_reminder_time ? String(row.morning_reminder_time) : null,
    waterReminderEnabled: Boolean(row.water_reminder_enabled ?? false),
    eveningReviewEnabled: Boolean(row.evening_review_enabled ?? false),
    weeklyReviewEnabled: row.weekly_review_enabled === undefined ? true : Boolean(row.weekly_review_enabled),
    notificationQuietHoursStart: row.notification_quiet_hours_start ? String(row.notification_quiet_hours_start) : null,
    notificationQuietHoursEnd: row.notification_quiet_hours_end ? String(row.notification_quiet_hours_end) : null,
  };
}
