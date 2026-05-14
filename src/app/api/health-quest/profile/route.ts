import { healthQuestProfileSchema, loadHealthQuestProfile, upsertHealthQuestProfile } from "@/lib/health-quest/profile";
import { loadQuestPreferences, questPreferencesSchema, upsertQuestPreferences } from "@/lib/health-quest/preferences";
import { getAuthenticatedSupabase, readValidatedJson } from "@/lib/server/persistence-auth";
import { getRequestId, jsonWithRequestId } from "@/lib/server/request-context";

export const dynamic = "force-dynamic";

const profileUpdateSchema = healthQuestProfileSchema.partial().extend({
  preferences: questPreferencesSchema.partial().optional(),
});

export async function GET(request: Request) {
  const requestId = getRequestId(request);
  const auth = await getAuthenticatedSupabase(request);

  if (!auth.ok) {
    return auth.response;
  }

  try {
    const [profile, preferences] = await Promise.all([
      loadHealthQuestProfile(auth.supabase, auth.user.id),
      loadQuestPreferences(auth.supabase, auth.user.id),
    ]);

    return jsonWithRequestId({ profile, preferences }, undefined, requestId);
  } catch {
    return jsonWithRequestId({ error: "Profile is temporarily unavailable." }, { status: 500 }, requestId);
  }
}

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  const parsed = await readValidatedJson(request, profileUpdateSchema);

  if (!parsed.ok) {
    return parsed.response;
  }

  const auth = await getAuthenticatedSupabase(request);

  if (!auth.ok) {
    return auth.response;
  }

  try {
    const current = await loadHealthQuestProfile(auth.supabase, auth.user.id);
    const nextProfile = healthQuestProfileSchema.parse({
      primaryGoal: parsed.data.primaryGoal ?? current?.primaryGoal ?? "better_sleep",
      dailyTimeBudget: parsed.data.dailyTimeBudget ?? current?.dailyTimeBudget ?? "two_minutes",
      hardestBarrier: parsed.data.hardestBarrier ?? current?.hardestBarrier ?? null,
      startingPath: parsed.data.startingPath ?? current?.startingPath ?? "easy_start",
      preferredLocale: parsed.data.preferredLocale ?? current?.preferredLocale ?? "zh-Hant",
      coachStyle: parsed.data.coachStyle ?? current?.coachStyle ?? "gentle",
    });
    const profile = await upsertHealthQuestProfile(auth.supabase, auth.user.id, {
      ...nextProfile,
      onboardingCompletedAt: current?.onboardingCompletedAt ?? new Date().toISOString(),
    });
    const preferences = parsed.data.preferences
      ? await upsertQuestPreferences(auth.supabase, auth.user.id, questPreferencesSchema.parse({
        preferredQuestTime: parsed.data.preferences.preferredQuestTime ?? "no_preference",
        reminderEnabled: parsed.data.preferences.reminderEnabled ?? false,
        reminderTime: parsed.data.preferences.reminderTime ?? null,
        recoveryModeDefault: parsed.data.preferences.recoveryModeDefault ?? false,
        minimumRequiredQuests: parsed.data.preferences.minimumRequiredQuests ?? 3,
        maxDailyQuests: parsed.data.preferences.maxDailyQuests ?? 5,
        preferredDifficulty: parsed.data.preferences.preferredDifficulty ?? "easy",
        morningReminderEnabled: parsed.data.preferences.morningReminderEnabled ?? false,
        morningReminderTime: parsed.data.preferences.morningReminderTime ?? null,
        waterReminderEnabled: parsed.data.preferences.waterReminderEnabled ?? false,
        eveningReviewEnabled: parsed.data.preferences.eveningReviewEnabled ?? false,
        weeklyReviewEnabled: parsed.data.preferences.weeklyReviewEnabled ?? true,
        notificationQuietHoursStart: parsed.data.preferences.notificationQuietHoursStart ?? null,
        notificationQuietHoursEnd: parsed.data.preferences.notificationQuietHoursEnd ?? null,
      }))
      : await loadQuestPreferences(auth.supabase, auth.user.id);

    return jsonWithRequestId({ profile, preferences }, undefined, requestId);
  } catch {
    return jsonWithRequestId({ error: "Profile could not be saved." }, { status: 500 }, requestId);
  }
}
