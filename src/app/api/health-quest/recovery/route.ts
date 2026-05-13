import { z } from "zod";
import { loadOrCreateTodayQuestState } from "@/lib/health-quest/server";
import {
  getAuthenticatedSupabase,
  readValidatedJson,
} from "@/lib/server/persistence-auth";
import { getRequestId, jsonWithRequestId } from "@/lib/server/request-context";

export const dynamic = "force-dynamic";

const recoverySchema = z.object({
  localDate: z.string().date().optional(),
});

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  const parsed = await readValidatedJson(request, recoverySchema);

  if (!parsed.ok) {
    return parsed.response;
  }

  const auth = await getAuthenticatedSupabase(request);

  if (!auth.ok) {
    return auth.response;
  }

  try {
    const state = await loadOrCreateTodayQuestState({
      supabase: auth.supabase,
      userId: auth.user.id,
      localDate: parsed.data.localDate ?? new Date().toISOString().slice(0, 10),
      forceMode: "recovery",
    });

    return jsonWithRequestId({ state }, undefined, requestId);
  } catch {
    return jsonWithRequestId(
      { error: "Recovery mode is temporarily unavailable." },
      { status: 500 },
      requestId,
    );
  }
}
