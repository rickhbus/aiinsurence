import { trackServerEvent } from "@/lib/analytics/events";
import { createHealthMemory } from "@/lib/health-data/memory";
import { healthMemoryInputSchema } from "@/lib/health-data/validation";
import {
  getAuthenticatedSupabase,
  readValidatedJson,
} from "@/lib/server/persistence-auth";
import { saveConsentEvent } from "@/lib/user-memory";

export async function POST(request: Request) {
  const parsed = await readValidatedJson(request, healthMemoryInputSchema);

  if (!parsed.ok) {
    return parsed.response;
  }

  const auth = await getAuthenticatedSupabase();

  if (!auth.ok) {
    return auth.response;
  }

  try {
    const memory = await createHealthMemory(auth.supabase, auth.user.id, parsed.data);

    await saveConsentEvent(auth.user.id, "save_memory", true, auth.supabase);
    void trackServerEvent({
      supabase: auth.supabase,
      userId: auth.user.id,
      event: "memory_saved",
      metadata: { category: parsed.data.memory_type },
    });

    return Response.json({ memory });
  } catch {
    return Response.json({ error: "儲存失敗，請檢查網絡後再試。" }, { status: 500 });
  }
}
