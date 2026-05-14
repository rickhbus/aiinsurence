import { doctorMissionSchema } from "@/lib/health-quest/doctor-mission";
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
    .from("doctor_prep_missions")
    .select("*")
    .eq("user_id", auth.user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    return jsonWithRequestId({ error: "Doctor missions are temporarily unavailable." }, { status: 500 }, requestId);
  }

  return jsonWithRequestId({ missions: data ?? [] }, undefined, requestId);
}

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  const parsed = await readValidatedJson(request, doctorMissionSchema);

  if (!parsed.ok) {
    return parsed.response;
  }

  const auth = await getAuthenticatedSupabase(request);

  if (!auth.ok) {
    return auth.response;
  }

  try {
    const { data: mission, error } = await auth.supabase
      .from("doctor_prep_missions")
      .upsert({
        id: parsed.data.missionId,
        user_id: auth.user.id,
        title: parsed.data.title ?? "Doctor prep",
        concern_summary: parsed.data.answers.find((answer) => answer.stepKey === "what_changed")?.answerText.slice(0, 500) ?? null,
        status: "draft",
        updated_at: new Date().toISOString(),
      })
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    if (parsed.data.answers.length > 0) {
      await auth.supabase.from("doctor_prep_answers").insert(parsed.data.answers.map((answer) => ({
        mission_id: mission.id,
        user_id: auth.user.id,
        step_key: answer.stepKey,
        answer_text: answer.answerText,
      })));
    }

    return jsonWithRequestId({ mission }, undefined, requestId);
  } catch {
    return jsonWithRequestId({ error: "Doctor mission could not be saved." }, { status: 500 }, requestId);
  }
}
