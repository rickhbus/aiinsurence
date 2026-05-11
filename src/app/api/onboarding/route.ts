import { trackServerEvent } from "@/lib/analytics/events";
import { onboardingInputSchema } from "@/lib/health-data/validation";
import {
  getAuthenticatedSupabase,
  readValidatedJson,
} from "@/lib/server/persistence-auth";
import { saveConsentEvent } from "@/lib/user-memory";

export async function GET() {
  const auth = await getAuthenticatedSupabase();

  if (!auth.ok) {
    return auth.response;
  }

  const { data, error } = await auth.supabase
    .from("profiles")
    .select("onboarding_completed_at,onboarding_answers,memory_consent_granted,first_action")
    .eq("id", auth.user.id)
    .maybeSingle();

  if (error) {
    return Response.json(
      { error: "Onboarding status is temporarily unavailable." },
      { status: 500 },
    );
  }

  return Response.json({
    completed: Boolean(data?.onboarding_completed_at),
    profile: data,
  });
}

export async function POST(request: Request) {
  const parsed = await readValidatedJson(request, onboardingInputSchema);

  if (!parsed.ok) {
    return parsed.response;
  }

  const auth = await getAuthenticatedSupabase();

  if (!auth.ok) {
    return auth.response;
  }

  const payload = parsed.data;
  const { data, error } = await auth.supabase
    .from("profiles")
    .update({
      preferred_language: payload.language,
      care_preference:
        payload.hk_care_preference === "not_sure"
          ? "either"
          : payload.hk_care_preference,
      onboarding_completed_at: new Date().toISOString(),
      onboarding_answers: {
        main_goal: payload.main_goal,
        fitness_level: payload.fitness_level,
        nutrition_preference: payload.nutrition_preference,
        hk_care_preference: payload.hk_care_preference,
        privacy_acknowledged: payload.privacy_acknowledged,
      },
      memory_consent_granted: payload.memory_consent_granted,
      first_action: payload.first_action,
    })
    .eq("id", auth.user.id)
    .select("*")
    .single();

  if (error) {
    return Response.json(
      { error: "Onboarding could not be saved." },
      { status: 500 },
    );
  }

  if (payload.memory_consent_granted) {
    await saveConsentEvent(auth.user.id, "save_memory", true, auth.supabase);
  }

  void trackServerEvent({
    supabase: auth.supabase,
    userId: auth.user.id,
    event: "onboarding_completed",
    metadata: {
      mainGoal: payload.main_goal,
      fitnessLevel: payload.fitness_level,
      nutritionPreference: payload.nutrition_preference,
      hkCarePreference: payload.hk_care_preference,
      memoryConsent: payload.memory_consent_granted,
      firstAction: payload.first_action,
    },
  });

  return Response.json({ profile: data });
}
