import { listLessonTracks } from "@/lib/health-quest/lessons";
import { getOptionalAuthenticatedSupabase } from "@/lib/server/persistence-auth";
import { getRequestId, jsonWithRequestId } from "@/lib/server/request-context";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestId = getRequestId(request);
  const optional = await getOptionalAuthenticatedSupabase(request);
  const progress = optional.supabase && optional.user
    ? await optional.supabase
      .from("user_lesson_progress")
      .select("status,completed_at,lesson_nodes(slug,lesson_tracks(slug))")
      .eq("user_id", optional.user.id)
      .then((result) => result.data ?? [])
    : [];

  return jsonWithRequestId({ tracks: listLessonTracks(), progress }, undefined, requestId);
}
