import { familyInviteSchema } from "@/lib/health-quest/family-circle";
import { getAuthenticatedSupabase, readValidatedJson } from "@/lib/server/persistence-auth";
import { getRequestId, jsonWithRequestId } from "@/lib/server/request-context";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  const parsed = await readValidatedJson(request, familyInviteSchema);

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
    return jsonWithRequestId({ error: "Only the circle owner can invite members." }, { status: 403 }, requestId);
  }

  const { data, error } = await auth.supabase
    .from("health_quest_family_members")
    .insert({
      circle_id: parsed.data.circleId,
      invited_email: parsed.data.email.toLowerCase(),
      display_name: parsed.data.displayName ?? null,
      role: "member",
      status: "pending",
    })
    .select("*")
    .single();

  if (error) {
    return jsonWithRequestId({ error: "Invite could not be saved." }, { status: 500 }, requestId);
  }

  return jsonWithRequestId({ invite: data }, undefined, requestId);
}
