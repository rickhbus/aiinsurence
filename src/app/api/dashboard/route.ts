import { trackServerEvent } from "@/lib/analytics/events";
import { getDashboardData } from "@/lib/health-data/dashboard";
import { getAuthenticatedSupabase } from "@/lib/server/persistence-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await getAuthenticatedSupabase();

  if (!auth.ok) {
    return auth.response;
  }

  try {
    const dashboard = await getDashboardData(auth.supabase, auth.user.id);

    void trackServerEvent({
      supabase: auth.supabase,
      userId: auth.user.id,
      event: "dashboard_viewed",
      metadata: {
        empty: dashboard.empty,
        healthScore: dashboard.today.health_score,
      },
    });

    return Response.json(dashboard);
  } catch {
    return Response.json(
      { error: "Dashboard data is temporarily unavailable." },
      { status: 500 },
    );
  }
}
