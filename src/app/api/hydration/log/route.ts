import { analyzeHydration } from "@/lib/health-os/hydration";
import { hydrationLogSchema } from "@/lib/health-os/validators";
import { getAuthenticatedSupabase, readValidatedJson } from "@/lib/server/persistence-auth";
import { getRequestId, jsonWithRequestId } from "@/lib/server/request-context";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  const parsed = await readValidatedJson(request, hydrationLogSchema);

  if (!parsed.ok) {
    return parsed.response;
  }

  const auth = await getAuthenticatedSupabase(request);

  if (!auth.ok) {
    return auth.response;
  }

  const analysis = analyzeHydration({
    waterMl: parsed.data.waterMl,
    caffeineMg: parsed.data.caffeineMg,
    alcoholUnits: parsed.data.alcoholUnits,
    drinkType: parsed.data.drinkType,
  });
  const { data, error } = await auth.supabase
    .from("hydration_logs")
    .insert({
      user_id: auth.user.id,
      logged_at: parsed.data.loggedAt,
      water_ml: parsed.data.waterMl,
      caffeine_mg: parsed.data.caffeineMg,
      alcohol_units: parsed.data.alcoholUnits,
      drink_type: parsed.data.drinkType,
      notes: parsed.data.notes,
    })
    .select("*")
    .single();

  if (error) {
    return jsonWithRequestId({ error: "暫時未能保存補水紀錄。" }, { status: 500 }, requestId);
  }

  return jsonWithRequestId({ log: data, analysis }, undefined, requestId);
}
