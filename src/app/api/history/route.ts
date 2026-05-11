import { normalizeLimit } from "@/lib/health-data/common";
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
  const limit = normalizeLimit(Number(url.searchParams.get("limit")), 20, 50);

  const [gbl, emotion, insurance] = await Promise.all([
    auth.supabase
      .from("gbl_analysis_results")
      .select("id, case_id, analysis_type, status, user_visible_summary, safety_flags, created_at")
      .eq("user_id", auth.user.id)
      .order("created_at", { ascending: false })
      .limit(limit),
    auth.supabase
      .from("emotion_engine_results")
      .select("id, case_id, primary_emotion, urgency_level, user_visible_summary, created_at")
      .eq("user_id", auth.user.id)
      .order("created_at", { ascending: false })
      .limit(limit),
    auth.supabase
      .from("insurance_analyses")
      .select("id, case_id, analysis_type, status, result_summary, created_at")
      .eq("user_id", auth.user.id)
      .order("created_at", { ascending: false })
      .limit(limit),
  ]);

  const firstError = gbl.error || emotion.error || insurance.error;

  if (firstError) {
    return jsonWithRequestId(
      { error: "History is temporarily unavailable." },
      { status: 500 },
      requestId,
    );
  }

  const items = [
    ...(gbl.data ?? []).map((item) => ({
      id: item.id,
      kind: "AI.GBL",
      title: item.analysis_type,
      status: item.status,
      summary: item.user_visible_summary,
      createdAt: item.created_at,
    })),
    ...(emotion.data ?? []).map((item) => ({
      id: item.id,
      kind: "Emotion Engine",
      title: item.primary_emotion,
      status: item.urgency_level,
      summary: item.user_visible_summary,
      createdAt: item.created_at,
    })),
    ...(insurance.data ?? []).map((item) => ({
      id: item.id,
      kind: "Insurance Analysis",
      title: item.analysis_type,
      status: item.status,
      summary: item.result_summary,
      createdAt: item.created_at,
    })),
  ]
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .slice(0, limit);

  return jsonWithRequestId({ items, limit }, undefined, requestId);
}
