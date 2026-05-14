import { reminderPreferencesSchema } from "@/lib/health-quest/reminders";
import { loadQuestPreferences, questPreferencesSchema, upsertQuestPreferences } from "@/lib/health-quest/preferences";
import { getAuthenticatedSupabase, readValidatedJson } from "@/lib/server/persistence-auth";
import { getRequestId, jsonWithRequestId } from "@/lib/server/request-context";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestId = getRequestId(request);
  const auth = await getAuthenticatedSupabase(request);

  if (!auth.ok) {
    return auth.response;
  }

  try {
    const preferences = await loadQuestPreferences(auth.supabase, auth.user.id);
    return jsonWithRequestId({ preferences }, undefined, requestId);
  } catch {
    return jsonWithRequestId({ error: "Reminder preferences are temporarily unavailable." }, { status: 500 }, requestId);
  }
}

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  const parsed = await readValidatedJson(request, reminderPreferencesSchema.partial());

  if (!parsed.ok) {
    return parsed.response;
  }

  const auth = await getAuthenticatedSupabase(request);

  if (!auth.ok) {
    return auth.response;
  }

  try {
    const current = await loadQuestPreferences(auth.supabase, auth.user.id);
    const preferences = await upsertQuestPreferences(auth.supabase, auth.user.id, questPreferencesSchema.parse({
      preferredQuestTime: parsed.data.preferredQuestTime ?? current?.preferredQuestTime ?? "no_preference",
      reminderEnabled: parsed.data.reminderEnabled ?? current?.reminderEnabled ?? false,
      reminderTime: parsed.data.reminderTime ?? current?.reminderTime ?? null,
      recoveryModeDefault: current?.recoveryModeDefault ?? false,
      minimumRequiredQuests: current?.minimumRequiredQuests ?? 3,
      maxDailyQuests: current?.maxDailyQuests ?? 5,
      preferredDifficulty: current?.preferredDifficulty ?? "easy",
      morningReminderEnabled: parsed.data.morningReminderEnabled ?? current?.morningReminderEnabled ?? false,
      morningReminderTime: parsed.data.morningReminderTime ?? current?.morningReminderTime ?? null,
      waterReminderEnabled: parsed.data.waterReminderEnabled ?? current?.waterReminderEnabled ?? false,
      eveningReviewEnabled: parsed.data.eveningReviewEnabled ?? current?.eveningReviewEnabled ?? false,
      weeklyReviewEnabled: parsed.data.weeklyReviewEnabled ?? current?.weeklyReviewEnabled ?? true,
      notificationQuietHoursStart: parsed.data.notificationQuietHoursStart ?? current?.notificationQuietHoursStart ?? null,
      notificationQuietHoursEnd: parsed.data.notificationQuietHoursEnd ?? current?.notificationQuietHoursEnd ?? null,
    }));

    return jsonWithRequestId({ preferences }, undefined, requestId);
  } catch {
    return jsonWithRequestId({ error: "Reminder preferences could not be saved." }, { status: 500 }, requestId);
  }
}
