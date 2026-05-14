import { trackHealthQuestEvent } from "@/lib/health-quest/analytics";
import { loadHealthQuestStreak, loadXPEvents, mapQuestRow, insertXPEvent } from "@/lib/health-quest/storage";
import type { DailyQuestRow, XPEvent } from "@/lib/health-quest/types";
import { buildWeeklyHealthQuestReview, getCurrentWeekRange } from "@/lib/health-quest/weekly-review";
import { buildWeeklyReviewEventKey } from "@/lib/health-quest/xp";
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
    const { weekStart, weekEnd } = getCurrentWeekRange();
    const sinceIso = `${weekStart}T00:00:00.000Z`;
    const [streak, xpEvents, quests] = await Promise.all([
      loadHealthQuestStreak(auth.supabase, auth.user.id),
      loadXPEvents(auth.supabase, auth.user.id, sinceIso),
      auth.supabase
        .from("daily_quests")
        .select("*")
        .eq("user_id", auth.user.id)
        .gte("local_date", weekStart)
        .lte("local_date", weekEnd)
        .order("local_date", { ascending: true }),
    ]);

    if (quests.error) {
      throw new Error(quests.error.message);
    }

    const reason = `weekly_review_completed:${weekStart}`;
    const eventKey = buildWeeklyReviewEventKey(weekStart);
    let nextXpEvents: XPEvent[] = xpEvents;

    if (!xpEvents.some((event) => event.eventKey === eventKey || event.reason === reason)) {
      const event: XPEvent = {
        id: `weekly-${weekStart}`,
        amount: 10,
        reason,
        createdAt: new Date().toISOString(),
        eventKey,
      };
      const insertedOrExisting = await insertXPEvent(auth.supabase, auth.user.id, event, {
        source: "health_quest",
        reviewWeekStart: weekStart,
      }).catch(() => null);
      nextXpEvents = insertedOrExisting && !xpEvents.some((xpEvent) => xpEvent.id === insertedOrExisting.id)
        ? [insertedOrExisting, ...xpEvents]
        : xpEvents;
      await trackHealthQuestEvent(auth.supabase, {
        userId: auth.user.id,
        eventName: "weekly_review_completed",
        properties: { weekStart },
      }).catch(() => undefined);
    } else {
      await trackHealthQuestEvent(auth.supabase, {
        userId: auth.user.id,
        eventName: "weekly_review_opened",
        properties: { weekStart },
      }).catch(() => undefined);
    }

    const review = buildWeeklyHealthQuestReview({
      quests: (quests.data ?? []).map((row) => mapQuestRow(row as DailyQuestRow)),
      xpEvents: nextXpEvents,
      streak,
      weekStart,
      weekEnd,
    });

    return jsonWithRequestId({ review }, undefined, requestId);
  } catch {
    return jsonWithRequestId({ error: "Weekly review is temporarily unavailable." }, { status: 500 }, requestId);
  }
}
