import { buildDoctorVisitSummary } from "@/lib/health-quest/doctor-mission";
import { getAuthenticatedSupabase } from "@/lib/server/persistence-auth";
import { getRequestId, jsonWithRequestId } from "@/lib/server/request-context";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestId = getRequestId(request);
  const auth = await getAuthenticatedSupabase(request);

  if (!auth.ok) {
    return auth.response;
  }

  const url = new URL(request.url);
  const missionId = url.searchParams.get("missionId");

  if (!missionId) {
    return jsonWithRequestId({ error: "missionId is required." }, { status: 400 }, requestId);
  }

  const { data, error } = await auth.supabase
    .from("doctor_prep_answers")
    .select("step_key,answer_text")
    .eq("user_id", auth.user.id)
    .eq("mission_id", missionId);

  if (error) {
    return jsonWithRequestId({ error: "Doctor summary is temporarily unavailable." }, { status: 500 }, requestId);
  }

  const answers = Object.fromEntries((data ?? []).map((row) => [row.step_key, row.answer_text]));
  return jsonWithRequestId({ summary: buildDoctorVisitSummary(answers) }, undefined, requestId);
}
