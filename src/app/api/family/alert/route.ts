import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { buildFamilyAlertMessageZh, familyAlertTypes } from "@/lib/family/alerts";
import { getAuthenticatedSupabase, readValidatedJson } from "@/lib/server/persistence-auth";
import { getRequestId, jsonWithRequestId } from "@/lib/server/request-context";

export const dynamic = "force-dynamic";

const familyAlertSchema = z.object({
  alertType: z.enum(familyAlertTypes).default("check_in_help"),
  messageZh: z.string().trim().max(240).optional().nullable(),
});

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  const parsed = await readValidatedJson(request, familyAlertSchema);

  if (!parsed.ok) {
    return parsed.response;
  }

  const auth = await getAuthenticatedSupabase(request);

  if (!auth.ok) {
    return auth.response;
  }

  const groupId = await findFamilyAlertGroupId(auth.supabase, auth.user.id);

  if (!groupId) {
    return jsonWithRequestId(
      {
        code: "no_family_caregiver",
        error: "未設定屋企人。你可以去家庭分享加入照顧者。",
      },
      { status: 404 },
      requestId,
    );
  }

  const { data, error } = await auth.supabase
    .from("family_alerts")
    .insert({
      user_id: auth.user.id,
      group_id: groupId,
      alert_type: parsed.data.alertType,
      message_zh: buildFamilyAlertMessageZh(parsed.data.alertType, parsed.data.messageZh),
      status: "created",
    })
    .select("id,alert_type,status,created_at")
    .single();

  if (error) {
    return jsonWithRequestId({ error: "暫時未能建立家庭提示。" }, { status: 500 }, requestId);
  }

  return jsonWithRequestId({ alert: data }, undefined, requestId);
}

async function findFamilyAlertGroupId(supabase: SupabaseClient, userId: string) {
  const [ownedGroups, memberships] = await Promise.all([
    supabase
      .from("family_groups")
      .select("id")
      .eq("owner_user_id", userId),
    supabase
      .from("family_memberships")
      .select("group_id")
      .eq("user_id", userId)
      .eq("status", "active"),
  ]);

  if (ownedGroups.error || memberships.error) {
    return null;
  }

  const groupIds = Array.from(new Set([
    ...(ownedGroups.data ?? []).map((group) => group.id),
    ...(memberships.data ?? []).map((membership) => membership.group_id),
  ]));

  if (groupIds.length === 0) {
    return null;
  }
  const consent = await supabase
    .from("family_share_consents")
    .select("group_id")
    .in("group_id", groupIds)
    .eq("subject_user_id", userId)
    .is("revoked_at", null)
    .limit(1)
    .maybeSingle();

  if (!consent.error && consent.data?.group_id) {
    return consent.data.group_id;
  }

  const caregiverMember = await supabase
    .from("family_memberships")
    .select("group_id")
    .in("group_id", groupIds)
    .eq("status", "active")
    .neq("user_id", userId)
    .limit(1)
    .maybeSingle();

  return caregiverMember.error ? null : caregiverMember.data?.group_id ?? null;
}
