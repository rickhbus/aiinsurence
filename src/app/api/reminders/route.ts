import { buildReminderInsert, reminderInputSchema } from "@/lib/reminders";
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
    .from("reminders")
    .select("id,reminder_type,title_zh,time_of_day,enabled,notes,created_at,updated_at")
    .eq("user_id", auth.user.id)
    .order("time_of_day", { ascending: true });

  if (error) {
    return jsonWithRequestId({ error: "暫時未能載入提醒。" }, { status: 500 }, requestId);
  }

  return jsonWithRequestId({ reminders: data ?? [] }, undefined, requestId);
}

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  const parsed = await readValidatedJson(request, reminderInputSchema);

  if (!parsed.ok) {
    return parsed.response;
  }

  const auth = await getAuthenticatedSupabase(request);

  if (!auth.ok) {
    return auth.response;
  }

  const { data, error } = await auth.supabase
    .from("reminders")
    .insert({
      user_id: auth.user.id,
      ...buildReminderInsert(parsed.data),
    })
    .select("id,reminder_type,title_zh,time_of_day,enabled,notes,created_at,updated_at")
    .single();

  if (error) {
    return jsonWithRequestId({ error: "暫時未能保存提醒。" }, { status: 500 }, requestId);
  }

  return jsonWithRequestId({ reminder: data }, undefined, requestId);
}
