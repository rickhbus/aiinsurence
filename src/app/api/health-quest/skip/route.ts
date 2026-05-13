import { z } from "zod";
import { loadOrCreateTodayQuestState } from "@/lib/health-quest/server";
import { loadQuestById, markQuestSkipped } from "@/lib/health-quest/storage";
import {
  getAuthenticatedSupabase,
  readValidatedJson,
} from "@/lib/server/persistence-auth";
import { getRequestId, jsonWithRequestId } from "@/lib/server/request-context";

export const dynamic = "force-dynamic";

const skipQuestSchema = z.object({
  questId: z.string().trim().min(1),
});

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  const parsed = await readValidatedJson(request, skipQuestSchema);

  if (!parsed.ok) {
    return parsed.response;
  }

  const auth = await getAuthenticatedSupabase(request);

  if (!auth.ok) {
    return auth.response;
  }

  try {
    const quest = await loadQuestById(auth.supabase, auth.user.id, parsed.data.questId);

    if (!quest) {
      return jsonWithRequestId({ error: "Quest not found." }, { status: 404 }, requestId);
    }

    if (!quest.required) {
      await markQuestSkipped(auth.supabase, auth.user.id, quest.id, new Date().toISOString());
    }

    const state = await loadOrCreateTodayQuestState({
      supabase: auth.supabase,
      userId: auth.user.id,
      localDate: quest.localDate,
      forceMode: quest.required ? "recovery" : undefined,
    });

    return jsonWithRequestId({ state }, undefined, requestId);
  } catch {
    return jsonWithRequestId(
      { error: "Quest skip is temporarily unavailable." },
      { status: 500 },
      requestId,
    );
  }
}
