import {
  createFamilyInviteToken,
  familyInviteSchema,
  getFamilyInviteExpiry,
  hashFamilyInviteToken,
} from "@/lib/health-quest/family-circle";
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

  const token = createFamilyInviteToken();
  const tokenHash = hashFamilyInviteToken(token);
  const expiresAt = getFamilyInviteExpiry();
  const { data, error } = await auth.supabase
    .from("health_quest_family_members")
    .insert({
      circle_id: parsed.data.circleId,
      invited_email: parsed.data.email.toLowerCase(),
      display_name: parsed.data.displayName ?? null,
      role: "member",
      status: "pending",
      invite_token_hash: tokenHash,
      expires_at: expiresAt,
    })
    .select("id,circle_id,status,expires_at")
    .single();

  if (error) {
    return jsonWithRequestId({ error: "Invite could not be saved." }, { status: 500 }, requestId);
  }

  const inviteUrl = new URL(`/family/quest-circle/invite/${token}`, request.url);

  return jsonWithRequestId(
    {
      invite: {
        id: data.id,
        circleId: data.circle_id,
        status: data.status,
        expiresAt: data.expires_at,
        inviteUrl: inviteUrl.toString(),
        emailDelivery: "not_configured",
      },
    },
    undefined,
    requestId,
  );
}
