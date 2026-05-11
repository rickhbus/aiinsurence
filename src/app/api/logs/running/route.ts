import { trackServerEvent } from "@/lib/analytics/events";
import { createRunningLog } from "@/lib/health-data/running";
import { runningLogInputSchema } from "@/lib/health-data/validation";
import {
  getAuthenticatedSupabase,
  readValidatedJson,
} from "@/lib/server/persistence-auth";

export async function POST(request: Request) {
  const parsed = await readValidatedJson(request, runningLogInputSchema);

  if (!parsed.ok) {
    return parsed.response;
  }

  const auth = await getAuthenticatedSupabase();

  if (!auth.ok) {
    return auth.response;
  }

  try {
    const log = await createRunningLog(auth.supabase, auth.user.id, parsed.data);

    void trackServerEvent({
      supabase: auth.supabase,
      userId: auth.user.id,
      event: "run_logged",
      metadata: { distanceKm: parsed.data.distance_km, rpe: parsed.data.rpe },
    });

    return Response.json({ log });
  } catch {
    return Response.json({ error: "儲存失敗，請檢查網絡後再試。" }, { status: 500 });
  }
}
