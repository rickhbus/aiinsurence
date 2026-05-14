import { healthQuestOnboardingSchema, saveOnboardingAnswers } from "@/lib/health-quest/onboarding";
import { upsertHealthQuestProfile } from "@/lib/health-quest/profile";
import { questPreferencesSchema, upsertQuestPreferences } from "@/lib/health-quest/preferences";
import { trackHealthQuestEvent } from "@/lib/health-quest/analytics";
import { getAuthenticatedSupabase, readValidatedJson } from "@/lib/server/persistence-auth";
import { getRequestId, jsonWithRequestId } from "@/lib/server/request-context";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestId = getRequestId(request);
  const auth = await getAuthenticatedSupabase(request);

  if (!auth.ok) {
    return auth.response;
  }

  const { data, error } = await auth.supabase
    .from("user_health_quest_profiles")
    .select("*")
    .eq("user_id", auth.user.id)
    .maybeSingle();

  if (error) {
    return jsonWithRequestId({ error: "Onboarding status is temporarily unavailable." }, { status: 500 }, requestId);
  }

  return jsonWithRequestId({
    completed: Boolean(data?.onboarding_completed_at),
    profile: data ?? null,
  }, undefined, requestId);
}

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  const parsed = await readValidatedJson(request, healthQuestOnboardingSchema);

  if (!parsed.ok) {
    return parsed.response;
  }

  const auth = await getAuthenticatedSupabase(request);

  if (!auth.ok) {
    return auth.response;
  }

  try {
    const profile = await upsertHealthQuestProfile(auth.supabase, auth.user.id, {
      ...parsed.data.profile,
      onboardingCompletedAt: new Date().toISOString(),
    });
    const preferences = await upsertQuestPreferences(auth.supabase, auth.user.id, questPreferencesSchema.parse({
      preferredQuestTime: parsed.data.preferences.preferredQuestTime ?? "no_preference",
      reminderEnabled: parsed.data.consent.reminders || parsed.data.preferences.reminderEnabled === true,
      reminderTime: parsed.data.preferences.reminderTime ?? null,
      recoveryModeDefault: false,
      minimumRequiredQuests: parsed.data.preferences.minimumRequiredQuests ?? 3,
      maxDailyQuests: parsed.data.preferences.maxDailyQuests ?? 5,
      preferredDifficulty: parsed.data.preferences.preferredDifficulty ?? "easy",
    }));

    await saveOnboardingAnswers({ supabase: auth.supabase, userId: auth.user.id, answers: parsed.data });
    await trackHealthQuestEvent(auth.supabase, {
      userId: auth.user.id,
      eventName: "onboarding_completed",
      properties: {
        primaryGoal: profile.primaryGoal,
        dailyTimeBudget: profile.dailyTimeBudget,
        preferredLocale: profile.preferredLocale,
        coachStyle: profile.coachStyle,
      },
    });

    return jsonWithRequestId({ profile, preferences }, undefined, requestId);
  } catch {
    return jsonWithRequestId({ error: "Onboarding could not be saved." }, { status: 500 }, requestId);
  }
}
