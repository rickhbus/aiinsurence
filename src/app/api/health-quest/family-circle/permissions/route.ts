import { familyPermissionSchema } from "@/lib/health-quest/family-circle";
import { getAuthenticatedSupabase, readValidatedJson } from "@/lib/server/persistence-auth";
import { getRequestId, jsonWithRequestId } from "@/lib/server/request-context";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  const parsed = await readValidatedJson(request, familyPermissionSchema);

  if (!parsed.ok) {
    return parsed.response;
  }

  const auth = await getAuthenticatedSupabase(request);

  if (!auth.ok) {
    return auth.response;
  }

  const member = await auth.supabase
    .from("health_quest_family_members")
    .select("id")
    .eq("circle_id", parsed.data.circleId)
    .eq("user_id", auth.user.id)
    .eq("status", "active")
    .maybeSingle();

  if (!member.data) {
    return jsonWithRequestId(
      { error: "Only active circle members can change sharing permissions." },
      { status: 403 },
      requestId,
    );
  }

  const { data, error } = await auth.supabase
    .from("health_quest_family_permissions")
    .upsert({
      circle_id: parsed.data.circleId,
      user_id: auth.user.id,
      sharing_level: parsed.data.sharingLevel,
      allow_challenge_invites: parsed.data.allowChallengeInvites,
      allow_doctor_summary_share: parsed.data.allowDoctorSummaryShare,
      updated_at: new Date().toISOString(),
    }, { onConflict: "circle_id,user_id" })
    .select("*")
    .single();

  if (error) {
    return jsonWithRequestId({ error: "Permissions could not be saved." }, { status: 500 }, requestId);
  }

  return jsonWithRequestId({ permissions: data }, undefined, requestId);
}
