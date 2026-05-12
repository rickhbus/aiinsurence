import { WORKOUT_TEMPLATES } from "@/lib/health-os/constants";
import { workoutTemplateInputSchema } from "@/lib/health-os/validators";
import { getAuthenticatedSupabase, readValidatedJson } from "@/lib/server/persistence-auth";
import { getRequestId, jsonWithRequestId } from "@/lib/server/request-context";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestId = getRequestId(request);

  return jsonWithRequestId({ templates: WORKOUT_TEMPLATES }, undefined, requestId);
}

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  const parsed = await readValidatedJson(request, workoutTemplateInputSchema);

  if (!parsed.ok) {
    return parsed.response;
  }

  const auth = await getAuthenticatedSupabase(request);

  if (!auth.ok) {
    return auth.response;
  }

  const { data, error } = await auth.supabase
    .from("workout_templates")
    .insert({
      user_id: auth.user.id,
      name: parsed.data.name,
      goal: parsed.data.goal,
      level: parsed.data.level,
      days_per_week: parsed.data.daysPerWeek,
      template_json: parsed.data.templateJson,
      is_system: false,
    })
    .select("*")
    .single();

  if (error) {
    return jsonWithRequestId({ error: "暫時未能保存訓練模板。" }, { status: 500 }, requestId);
  }

  return jsonWithRequestId({ template: data }, undefined, requestId);
}
