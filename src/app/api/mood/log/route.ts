import { analyzeMood } from "@/lib/health-os/mood";
import { moodLogSchema } from "@/lib/health-os/validators";
import { getAuthenticatedSupabase, readValidatedJson } from "@/lib/server/persistence-auth";
import { getRequestId, jsonWithRequestId } from "@/lib/server/request-context";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  const parsed = await readValidatedJson(request, moodLogSchema);

  if (!parsed.ok) {
    return parsed.response;
  }

  const analysis = analyzeMood({ ...parsed.data, locale: parsed.data.language });

  if (!parsed.data.consentToSave) {
    return jsonWithRequestId({ saved: false, analysis }, undefined, requestId);
  }

  const auth = await getAuthenticatedSupabase(request);

  if (!auth.ok) {
    return auth.response;
  }

  const { data, error } = await auth.supabase
    .from("mood_logs")
    .insert({
      user_id: auth.user.id,
      mood_score: parsed.data.moodScore,
      stress_score: parsed.data.stressScore,
      energy_score: parsed.data.energyScore,
      emotion_label: analysis.emotionLabel,
      trigger_category: parsed.data.triggerCategory,
      body_links: parsed.data.bodyLinks,
      user_text: parsed.data.userText,
      ai_reflection: analysis.userFacingReflection,
      suggested_action: analysis.suggestedSmallAction,
      safety_flag: analysis.safetyFlags[0] ?? null,
    })
    .select("*")
    .single();

  if (error) {
    return jsonWithRequestId({ error: "暫時未能保存 mood log。" }, { status: 500 }, requestId);
  }

  return jsonWithRequestId({ saved: true, log: data, analysis }, undefined, requestId);
}
