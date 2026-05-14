import { familyCircleSchema } from "@/lib/health-quest/family-circle";
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
    .select("*, circle:health_quest_family_circles(*)")
    .eq("user_id", auth.user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return jsonWithRequestId({ error: "Family circle is temporarily unavailable." }, { status: 500 }, requestId);
  }

  return jsonWithRequestId({ memberships: data ?? [] }, undefined, requestId);
}

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  const parsed = await readValidatedJson(request, familyCircleSchema);

  if (!parsed.ok) {
    return parsed.response;
  }

  const auth = await getAuthenticatedSupabase(request);

  if (!auth.ok) {
    return auth.response;
  }

  try {
    const { data: circle, error } = await auth.supabase
      .from("health_quest_family_circles")
      .insert({ owner_user_id: auth.user.id, name: parsed.data.name })
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    await auth.supabase.from("health_quest_family_members").insert({
      circle_id: circle.id,
      user_id: auth.user.id,
      display_name: "You",
      role: "owner",
      status: "active",
    });
    await auth.supabase.from("health_quest_family_permissions").insert({
      circle_id: circle.id,
      user_id: auth.user.id,
      sharing_level: "streak_only",
    });

    return jsonWithRequestId({ circle }, undefined, requestId);
  } catch {
    return jsonWithRequestId({ error: "Family circle could not be created." }, { status: 500 }, requestId);
  }
}
