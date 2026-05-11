import { upsertDailySummary, upsertWeeklySummary } from "@/lib/health-data/summaries";
import { recalculateSummaryInputSchema } from "@/lib/health-data/validation";
import {
  getAuthenticatedSupabase,
  readValidatedJson,
} from "@/lib/server/persistence-auth";

export async function POST(request: Request) {
  const parsed = await readValidatedJson(request, recalculateSummaryInputSchema);

  if (!parsed.ok) {
    return parsed.response;
  }

  const auth = await getAuthenticatedSupabase(request);

  if (!auth.ok) {
    return auth.response;
  }

  try {
    const date = new Date(parsed.data.date);
    const daily = await upsertDailySummary(auth.supabase, auth.user.id, date);
    const weekly = await upsertWeeklySummary(auth.supabase, auth.user.id, date);

    return Response.json({ daily, weekly });
  } catch {
    return Response.json({ error: "Summary recalculation failed." }, { status: 500 });
  }
}
