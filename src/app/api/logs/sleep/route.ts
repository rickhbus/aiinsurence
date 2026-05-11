import { trackServerEvent } from "@/lib/analytics/events";
import { createSleepLog } from "@/lib/health-data/sleep";
import { sleepInputSchema } from "@/lib/health-data/validation";
import {
  getAuthenticatedSupabase,
  readValidatedJson,
} from "@/lib/server/persistence-auth";

export async function POST(request: Request) {
  const parsed = await readValidatedJson(request, sleepInputSchema);

  if (!parsed.ok) {
    return parsed.response;
  }

  const auth = await getAuthenticatedSupabase(request);

  if (!auth.ok) {
    return auth.response;
  }

  try {
    const log = await createSleepLog(auth.supabase, auth.user.id, parsed.data);

    void trackServerEvent({
      supabase: auth.supabase,
      userId: auth.user.id,
      event: "sleep_logged",
      metadata: {
        hours: parsed.data.sleep_hours,
        quality: parsed.data.sleep_quality ?? null,
      },
    });

    return Response.json({ log });
  } catch {
    return Response.json({ error: "儲存失敗，請檢查網絡後再試。" }, { status: 500 });
  }
}
