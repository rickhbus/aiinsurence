import { buildLeagueStandings, getLeagueForXp, getWeekStart, sanitizeLeagueMember } from "@/lib/health-quest/leagues";
import { loadXPEvents } from "@/lib/health-quest/storage";
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
    const weekStart = getWeekStart();
    const sinceIso = `${weekStart}T00:00:00.000Z`;
    const xpEvents = await loadXPEvents(auth.supabase, auth.user.id, sinceIso);
    const weeklyXp = xpEvents.reduce((total, event) => total + Math.max(0, event.amount), 0);
    const leagueName = getLeagueForXp(weeklyXp);

    const membership = await auth.supabase
      .from("health_quest_league_memberships")
      .upsert({
        user_id: auth.user.id,
        league_name: leagueName,
        week_start: weekStart,
        xp: weeklyXp,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id,week_start" });

    if (membership.error) {
      throw new Error(membership.error.message);
    }

    const { data, error } = await auth.supabase
      .from("health_quest_league_memberships")
      .select("user_id,display_name,league_name,week_start,xp,rank")
      .eq("week_start", weekStart)
      .eq("league_name", leagueName)
      .order("xp", { ascending: false })
      .limit(30);

    if (error) {
      throw new Error(error.message);
    }

    const members = (data ?? []).map((row) => sanitizeLeagueMember(row as Record<string, unknown>));
    const standings = buildLeagueStandings(members.length ? members : [
      {
        userId: auth.user.id,
        displayName: "Health Player",
        leagueName,
        weekStart,
        xp: weeklyXp,
      },
    ]);

    return jsonWithRequestId({ league: leagueName, weeklyXp, weekStart, standings }, undefined, requestId);
  } catch {
    return jsonWithRequestId({ error: "Health Leagues are temporarily unavailable." }, { status: 500 }, requestId);
  }
}
