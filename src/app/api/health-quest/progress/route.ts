import { buildQuestProgressSummary } from "@/lib/health-quest/progress";
import { loadHealthQuestStreak, loadXPEvents, mapQuestRow } from "@/lib/health-quest/storage";
import type { DailyQuestRow } from "@/lib/health-quest/types";
import { getAuthenticatedSupabase } from "@/lib/server/persistence-auth";
import { getRequestId, jsonWithRequestId } from "@/lib/server/request-context";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestId = getRequestId(request);
  const auth = await getAuthenticatedSupabase(request);

  if (!auth.ok) {
    return auth.response;
  }

  try {
    const since = new Date();
    since.setDate(since.getDate() - 30);
    const sinceIso = since.toISOString();
    const [streak, xpEvents, questRows] = await Promise.all([
      loadHealthQuestStreak(auth.supabase, auth.user.id),
      loadXPEvents(auth.supabase, auth.user.id, sinceIso),
      auth.supabase
        .from("daily_quests")
        .select("*")
        .eq("user_id", auth.user.id)
        .gte("local_date", sinceIso.slice(0, 10))
        .order("local_date", { ascending: false })
        .limit(200),
    ]);

    if (questRows.error) {
      throw new Error(questRows.error.message);
    }

    const progress = buildQuestProgressSummary({
      quests: (questRows.data ?? []).map((row) => mapQuestRow(row as DailyQuestRow)),
      xpEvents,
      currentStreak: streak.currentStreak,
      longestStreak: streak.longestStreak,
    });

    return jsonWithRequestId({ progress }, undefined, requestId);
  } catch {
    return jsonWithRequestId(
      { error: "Quest progress is temporarily unavailable." },
      { status: 500 },
      requestId,
    );
  }
}
