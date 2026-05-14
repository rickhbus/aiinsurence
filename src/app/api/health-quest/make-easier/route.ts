import { z } from "zod";
import { makeQuestEasier } from "@/lib/health-quest/make-easier";
import { trackHealthQuestEvent } from "@/lib/health-quest/analytics";
import { loadOrCreateTodayQuestState } from "@/lib/health-quest/server";
import { loadQuestById } from "@/lib/health-quest/storage";
import { getAuthenticatedSupabase, readValidatedJson } from "@/lib/server/persistence-auth";
import { getRequestId, jsonWithRequestId } from "@/lib/server/request-context";

export const dynamic = "force-dynamic";

const makeEasierSchema = z.object({
  questId: z.string().trim().min(1),
});

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  const parsed = await readValidatedJson(request, makeEasierSchema);

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

    const easier = makeQuestEasier(quest);
    const { error } = await auth.supabase
      .from("daily_quests")
      .update({
        title: easier.title,
        description: easier.description,
        action_label: easier.actionLabel,
        xp: easier.xp,
        metadata: easier.metadata,
      })
      .eq("user_id", auth.user.id)
      .eq("id", quest.id);

    if (error) {
      throw new Error(error.message);
    }

    await trackHealthQuestEvent(auth.supabase, {
      userId: auth.user.id,
      eventName: "quest_made_easier",
      properties: { questType: quest.type },
    }).catch(() => undefined);

    const state = await loadOrCreateTodayQuestState({
      supabase: auth.supabase,
      userId: auth.user.id,
      localDate: quest.localDate,
    });

    return jsonWithRequestId({ quest: easier, state }, undefined, requestId);
  } catch {
    return jsonWithRequestId({ error: "Quest could not be made easier." }, { status: 500 }, requestId);
  }
}
