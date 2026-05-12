import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { buildDailyCheckInStatus } from "@/lib/family/check-in-status";
import { defaultFamilyShareScopes, familyShareScopes, normalizeFamilyShareScopes } from "@/lib/family/sharing";
import { getAuthenticatedSupabase, readValidatedJson } from "@/lib/server/persistence-auth";
import { getRequestId, jsonWithRequestId } from "@/lib/server/request-context";

export const dynamic = "force-dynamic";

const familyActionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("create_group"),
    name: z.string().trim().min(1).max(120).default("My family"),
  }),
  z.object({
    action: z.literal("invite_member"),
    groupId: z.string().uuid(),
    email: z.string().trim().email().max(200),
  }),
  z.object({
    action: z.literal("set_consent"),
    groupId: z.string().uuid(),
    granteeEmail: z.string().trim().email().max(200).optional().nullable(),
    scopes: z.array(z.enum(familyShareScopes)).max(8).default(defaultFamilyShareScopes),
    emergencyContactInfo: z.string().trim().max(500).optional().nullable(),
  }),
  z.object({
    action: z.literal("revoke_consent"),
    consentId: z.string().uuid(),
  }),
]);

export async function GET(request: Request) {
  const requestId = getRequestId(request);
  const auth = await getAuthenticatedSupabase(request);

  if (!auth.ok) {
    return auth.response;
  }

  const today = new Date();
  const start = new Date(today);
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);

  const [memberships, invites, consents, checkins, alerts] = await Promise.all([
    auth.supabase
      .from("family_memberships")
      .select("*, family_groups(*)")
      .eq("user_id", auth.user.id)
      .order("created_at", { ascending: false }),
    auth.supabase
      .from("family_invites")
      .select("*")
      .eq("invited_by_user_id", auth.user.id)
      .order("created_at", { ascending: false }),
    auth.supabase
      .from("family_share_consents")
      .select("*")
      .eq("subject_user_id", auth.user.id)
      .order("created_at", { ascending: false }),
    auth.supabase
      .from("daily_checkins")
      .select("checkin_type,label,note,metadata,created_at")
      .eq("user_id", auth.user.id)
      .gte("created_at", start.toISOString())
      .lt("created_at", end.toISOString())
      .order("created_at", { ascending: false }),
    auth.supabase
      .from("family_alerts")
      .select("alert_type,created_at")
      .eq("user_id", auth.user.id)
      .gte("created_at", start.toISOString())
      .lt("created_at", end.toISOString())
      .order("created_at", { ascending: false }),
  ]);
  const error = memberships.error ?? invites.error ?? consents.error;

  if (error) {
    return jsonWithRequestId({ error: "家庭分享資料暫時未能載入。" }, { status: 500 }, requestId);
  }

  return jsonWithRequestId({
    memberships: memberships.data ?? [],
    invites: invites.data ?? [],
    consents: consents.data ?? [],
    defaultScopes: defaultFamilyShareScopes,
    checkInStatus: buildDailyCheckInStatus({
      checkins: checkins.data ?? [],
      alerts: alerts.data ?? [],
      now: today,
    }),
  }, undefined, requestId);
}

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  const parsed = await readValidatedJson(request, familyActionSchema);

  if (!parsed.ok) {
    return parsed.response;
  }

  const auth = await getAuthenticatedSupabase(request);

  if (!auth.ok) {
    return auth.response;
  }

  if (parsed.data.action === "create_group") {
    const { data: group, error: groupError } = await auth.supabase
      .from("family_groups")
      .insert({ owner_user_id: auth.user.id, name: parsed.data.name })
      .select("*")
      .single();

    if (groupError) {
      return jsonWithRequestId({ error: "暫時未能建立家庭群組。" }, { status: 500 }, requestId);
    }

    const { error: membershipError } = await auth.supabase
      .from("family_memberships")
      .insert({ group_id: group.id, user_id: auth.user.id, role: "owner", status: "active" });

    if (membershipError) {
      return jsonWithRequestId({ error: "暫時未能建立家庭成員關係。" }, { status: 500 }, requestId);
    }

    return jsonWithRequestId({ group }, undefined, requestId);
  }

  if (parsed.data.action === "invite_member") {
    const access = await ensureCanManageGroup(auth.supabase, parsed.data.groupId, auth.user.id);

    if (!access) {
      return jsonWithRequestId({ error: "未有權限邀請家庭成員。" }, { status: 403 }, requestId);
    }

    const { data, error } = await auth.supabase
      .from("family_invites")
      .insert({
        group_id: parsed.data.groupId,
        invited_email: parsed.data.email.toLowerCase(),
        invited_by_user_id: auth.user.id,
      })
      .select("*")
      .single();

    if (error) {
      return jsonWithRequestId({ error: "暫時未能送出邀請。" }, { status: 500 }, requestId);
    }

    return jsonWithRequestId({ invite: data }, undefined, requestId);
  }

  if (parsed.data.action === "set_consent") {
    const scopes = normalizeFamilyShareScopes(parsed.data.scopes);
    const { data, error } = await auth.supabase
      .from("family_share_consents")
      .insert({
        group_id: parsed.data.groupId,
        subject_user_id: auth.user.id,
        grantee_email: parsed.data.granteeEmail?.toLowerCase() ?? null,
        scopes,
        emergency_contact_info: parsed.data.emergencyContactInfo ?? null,
      })
      .select("*")
      .single();

    if (error) {
      return jsonWithRequestId({ error: "暫時未能保存分享同意。" }, { status: 500 }, requestId);
    }

    return jsonWithRequestId({ consent: data }, undefined, requestId);
  }

  const { data, error } = await auth.supabase
    .from("family_share_consents")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", parsed.data.consentId)
    .eq("subject_user_id", auth.user.id)
    .select("*")
    .single();

  if (error) {
    return jsonWithRequestId({ error: "暫時未能撤回同意。" }, { status: 500 }, requestId);
  }

  return jsonWithRequestId({ consent: data }, undefined, requestId);
}

async function ensureCanManageGroup(supabase: SupabaseClient, groupId: string, userId: string) {
  const { data } = await supabase
    .from("family_memberships")
    .select("role")
    .eq("group_id", groupId)
    .eq("user_id", userId)
    .eq("status", "active")
    .in("role", ["owner", "caregiver"])
    .maybeSingle();

  return Boolean(data);
}
