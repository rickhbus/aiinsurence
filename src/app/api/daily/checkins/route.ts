import { trackServerEvent } from "@/lib/analytics/events";
import {
  createDailyCheckin,
  getDailyCheckins,
} from "@/lib/health-data/daily-checkins";
import { dailyCheckinInputSchema } from "@/lib/health-data/validation";
import {
  getAuthenticatedSupabase,
  readValidatedJson,
} from "@/lib/server/persistence-auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await getAuthenticatedSupabase(request);

  if (!auth.ok) {
    return auth.response;
  }

  try {
    const checkins = await getDailyCheckins(auth.supabase, auth.user.id);

    return Response.json({ checkins });
  } catch {
    return Response.json(
      { error: "Daily check-ins are temporarily unavailable." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const parsed = await readValidatedJson(request, dailyCheckinInputSchema);

  if (!parsed.ok) {
    return parsed.response;
  }

  const auth = await getAuthenticatedSupabase(request);

  if (!auth.ok) {
    return auth.response;
  }

  try {
    const checkin = await createDailyCheckin(auth.supabase, auth.user.id, parsed.data);

    void trackServerEvent({
      supabase: auth.supabase,
      userId: auth.user.id,
      event: "daily_checkin_logged",
      metadata: {
        checkinType: parsed.data.checkin_type,
        amount: parsed.data.amount ?? null,
      },
    });

    return Response.json({ checkin });
  } catch {
    return Response.json({ error: "儲存失敗，請檢查網絡後再試。" }, { status: 500 });
  }
}
