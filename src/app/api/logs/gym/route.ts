import { trackServerEvent } from "@/lib/analytics/events";
import { createGymLog } from "@/lib/health-data/gym";
import { gymLogInputSchema } from "@/lib/health-data/validation";
import {
  getAuthenticatedSupabase,
  readValidatedJson,
} from "@/lib/server/persistence-auth";

export async function POST(request: Request) {
  const parsed = await readValidatedJson(request, gymLogInputSchema);

  if (!parsed.ok) {
    return parsed.response;
  }

  const auth = await getAuthenticatedSupabase(request);

  if (!auth.ok) {
    return auth.response;
  }

  try {
    const log = await createGymLog(auth.supabase, auth.user.id, parsed.data);

    void trackServerEvent({
      supabase: auth.supabase,
      userId: auth.user.id,
      event: "gym_logged",
      metadata: { muscleGroup: parsed.data.muscle_group, rpe: parsed.data.rpe ?? null },
    });

    return Response.json({ log });
  } catch {
    return Response.json({ error: "儲存失敗，請檢查網絡後再試。" }, { status: 500 });
  }
}
