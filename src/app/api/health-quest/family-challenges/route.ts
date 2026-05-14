import { familyChallengeSchema, buildFamilyChallenge } from "@/lib/health-quest/family-challenges";
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
    .from("health_quest_family_members")
    .select("circle_id")
    .eq("user_id", auth.user.id)
    .eq("status", "active");

  if (error) {
    return jsonWithRequestId({ error: "Challenges are temporarily unavailable." }, { status: 500 }, requestId);
  }

  const circleIds = (data ?? []).map((row) => row.circle_id);
  const challenges = circleIds.length
    ? await auth.supabase.from("health_quest_family_challenges").select("*").in("circle_id", circleIds).order("created_at", { ascending: false })
    : { data: [], error: null };

  return jsonWithRequestId({ challenges: challenges.data ?? [] }, undefined, requestId);
}

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  const parsed = await readValidatedJson(request, familyChallengeSchema);

  if (!parsed.ok) {
    return parsed.response;
  }

  const auth = await getAuthenticatedSupabase(request);

  if (!auth.ok) {
    return auth.response;
  }

  const owner = await auth.supabase
    .from("health_quest_family_circles")
    .select("id")
    .eq("id", parsed.data.circleId)
    .eq("owner_user_id", auth.user.id)
    .maybeSingle();

  if (!owner.data) {
    return jsonWithRequestId(
      { error: "Only the circle owner can create challenges." },
      { status: 403 },
      requestId,
    );
  }

  const copy = buildFamilyChallenge(parsed.data.challengeType);
  const { data, error } = await auth.supabase
    .from("health_quest_family_challenges")
    .insert({
      circle_id: parsed.data.circleId,
      challenge_type: parsed.data.challengeType,
      title: copy.title,
      description: copy.description,
      target_count: copy.target,
      start_date: parsed.data.startDate,
      end_date: parsed.data.endDate,
    })
    .select("*")
    .single();

  if (error) {
    return jsonWithRequestId({ error: "Challenge could not be created." }, { status: 500 }, requestId);
  }

  await trackHealthQuestEvent(auth.supabase, {
    userId: auth.user.id,
    eventName: "family_challenge_started",
    properties: { challengeType: parsed.data.challengeType },
  }).catch(() => undefined);

  return jsonWithRequestId({ challenge: data }, undefined, requestId);
}
