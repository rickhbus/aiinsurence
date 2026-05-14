import { getAuthenticatedSupabase } from "@/lib/server/persistence-auth";
import { getRequestId, jsonWithRequestId } from "@/lib/server/request-context";
import { hasCompletedHealthQuestOnboarding, loadOrCreateTodayQuestState } from "@/lib/health-quest/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestId = getRequestId(request);
  const auth = await getAuthenticatedSupabase(request);

  if (!auth.ok) {
    return auth.response;
  }

  try {
    const onboardingCompleted = await hasCompletedHealthQuestOnboarding(auth.supabase, auth.user.id);

    if (!onboardingCompleted) {
      return jsonWithRequestId({ needsOnboarding: true }, { status: 428 }, requestId);
    }

    const state = await loadOrCreateTodayQuestState({
      supabase: auth.supabase,
      userId: auth.user.id,
    });

    return jsonWithRequestId({ state }, undefined, requestId);
  } catch {
    return jsonWithRequestId(
      { error: "Daily Health Quest is temporarily unavailable." },
      { status: 500 },
      requestId,
    );
  }
}
