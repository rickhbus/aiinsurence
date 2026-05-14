import {
  familyInviteAcceptSchema,
  hashFamilyInviteToken,
} from "@/lib/health-quest/family-circle";
import {
  getAuthenticatedSupabase,
  readValidatedJson,
} from "@/lib/server/persistence-auth";
import { getRequestId, jsonWithRequestId } from "@/lib/server/request-context";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  const parsed = await readValidatedJson(request, familyInviteAcceptSchema);

  if (!parsed.ok) {
    return parsed.response;
  }

  const auth = await getAuthenticatedSupabase(request);

  if (!auth.ok) {
    return auth.response;
  }

  const { data, error } = await auth.supabase.rpc(
    "accept_health_quest_family_invite",
    { invite_hash: hashFamilyInviteToken(parsed.data.token) },
  );

  if (error) {
    return jsonWithRequestId(
      { error: "Invite is expired, revoked, or unavailable." },
      { status: 410 },
      requestId,
    );
  }

  return jsonWithRequestId({ membership: data }, undefined, requestId);
}
