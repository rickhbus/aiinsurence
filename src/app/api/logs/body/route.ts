import { trackServerEvent } from "@/lib/analytics/events";
import { createBodyMetric } from "@/lib/health-data/body";
import { bodyMetricInputSchema } from "@/lib/health-data/validation";
import {
  getAuthenticatedSupabase,
  readValidatedJson,
} from "@/lib/server/persistence-auth";

export async function POST(request: Request) {
  const parsed = await readValidatedJson(request, bodyMetricInputSchema);

  if (!parsed.ok) {
    return parsed.response;
  }

  const auth = await getAuthenticatedSupabase(request);

  if (!auth.ok) {
    return auth.response;
  }

  try {
    const metric = await createBodyMetric(auth.supabase, auth.user.id, parsed.data);

    void trackServerEvent({
      supabase: auth.supabase,
      userId: auth.user.id,
      event: "body_metric_logged",
      metadata: {
        hasWeight: parsed.data.weight_kg != null,
        hasWaist: parsed.data.waist_cm != null,
        hasBodyFat: parsed.data.body_fat_percentage != null,
      },
    });

    return Response.json({ metric });
  } catch {
    return Response.json({ error: "儲存失敗，請檢查網絡後再試。" }, { status: 500 });
  }
}
