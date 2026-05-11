import { trackServerEvent } from "@/lib/analytics/events";
import { createGoal } from "@/lib/health-data/goals";
import { goalInputSchema } from "@/lib/health-data/validation";
import {
  getAuthenticatedSupabase,
  readValidatedJson,
} from "@/lib/server/persistence-auth";

export async function POST(request: Request) {
  const parsed = await readValidatedJson(request, goalInputSchema);

  if (!parsed.ok) {
    return parsed.response;
  }

  const auth = await getAuthenticatedSupabase(request);

  if (!auth.ok) {
    return auth.response;
  }

  try {
    const goal = await createGoal(auth.supabase, auth.user.id, parsed.data);

    void trackServerEvent({
      supabase: auth.supabase,
      userId: auth.user.id,
      event: "goal_created",
      metadata: { goalType: parsed.data.goal_type },
    });

    return Response.json({ goal });
  } catch {
    return Response.json({ error: "儲存失敗，請檢查網絡後再試。" }, { status: 500 });
  }
}
