import { z } from "zod";
import { activeDaysPerFreeze, earnStreakFreeze, shouldEarnStreakFreeze } from "@/lib/health-quest/streak-freezes";
import { trackHealthQuestEvent } from "@/lib/health-quest/analytics";
import { insertStreakFreezeAward, loadHealthQuestStreak, upsertHealthQuestStreak } from "@/lib/health-quest/storage";
import { buildStreakFreezeEventKey } from "@/lib/health-quest/xp";
import { getAuthenticatedSupabase, readValidatedJson } from "@/lib/server/persistence-auth";
import { getRequestId, jsonWithRequestId } from "@/lib/server/request-context";

export const dynamic = "force-dynamic";

const streakFreezeSchema = z.object({
  activeDays: z.number().int().min(0).max(366).default(0),
  plan: z.enum(["free", "plus", "pro", "family", "business"]).default("free"),
});

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  const parsed = await readValidatedJson(request, streakFreezeSchema);

  if (!parsed.ok) {
    return parsed.response;
  }

  const auth = await getAuthenticatedSupabase(request);

  if (!auth.ok) {
    return auth.response;
  }

  try {
    const streak = await loadHealthQuestStreak(auth.supabase, auth.user.id);
    const earned = shouldEarnStreakFreeze({
      activeDays: parsed.data.activeDays,
      streak,
      plan: parsed.data.plan,
    });
    const nextStreak = earned ? earnStreakFreeze({ streak, plan: parsed.data.plan }) : streak;
    let responseStreak = nextStreak;
    let responseEarned = earned;

    if (earned) {
      const threshold = activeDaysPerFreeze(parsed.data.plan);
      const award = await insertStreakFreezeAward({
        supabase: auth.supabase,
        userId: auth.user.id,
        localDate: new Date().toISOString().slice(0, 10),
        eventKey: buildStreakFreezeEventKey({
          plan: parsed.data.plan,
          activeDays: parsed.data.activeDays,
          threshold,
        }),
        reason: `earned:${parsed.data.plan}:${Math.floor(parsed.data.activeDays / threshold)}`,
      });

      if (award.inserted) {
        await upsertHealthQuestStreak(auth.supabase, auth.user.id, nextStreak);
        await trackHealthQuestEvent(auth.supabase, {
          userId: auth.user.id,
          eventName: "streak_freeze_earned",
          properties: { plan: parsed.data.plan },
        });
      } else {
        responseStreak = streak;
        responseEarned = false;
      }
    }

    return jsonWithRequestId({ streak: responseStreak, earned: responseEarned }, undefined, requestId);
  } catch {
    return jsonWithRequestId({ error: "Streak freeze is temporarily unavailable." }, { status: 500 }, requestId);
  }
}
