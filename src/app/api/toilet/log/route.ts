import { analyzeToiletLog } from "@/lib/health-os/toilet";
import { toiletLogSchema } from "@/lib/health-os/validators";
import { getAuthenticatedSupabase, readValidatedJson } from "@/lib/server/persistence-auth";
import { getRequestId, jsonWithRequestId } from "@/lib/server/request-context";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  const parsed = await readValidatedJson(request, toiletLogSchema);

  if (!parsed.ok) {
    return parsed.response;
  }

  const auth = await getAuthenticatedSupabase(request);

  if (!auth.ok) {
    return auth.response;
  }

  const analysis = analyzeToiletLog({
    bowelMovement: parsed.data.bowelMovement,
    stoolType: parsed.data.stoolType,
    urineColor: parsed.data.urineColor,
    painFlag: parsed.data.painFlag,
    bloodFlag: parsed.data.bloodFlag,
    feverFlag: parsed.data.feverFlag,
    dehydrationConcern: parsed.data.dehydrationConcern,
    notes: parsed.data.notes,
  });
  const { data, error } = await auth.supabase
    .from("bowel_urine_logs")
    .insert({
      user_id: auth.user.id,
      logged_at: parsed.data.loggedAt,
      bowel_movement: parsed.data.bowelMovement,
      stool_type: parsed.data.stoolType,
      urine_color: parsed.data.urineColor,
      pain_flag: parsed.data.painFlag,
      blood_flag: parsed.data.bloodFlag,
      fever_flag: parsed.data.feverFlag,
      dehydration_concern: parsed.data.dehydrationConcern,
      notes: parsed.data.notes,
      safety_flag: analysis.safetyFlag,
    })
    .select("*")
    .single();

  if (error) {
    return jsonWithRequestId({ error: "暫時未能保存腸胃紀錄。" }, { status: 500 }, requestId);
  }

  return jsonWithRequestId({ log: data, analysis }, undefined, requestId);
}
