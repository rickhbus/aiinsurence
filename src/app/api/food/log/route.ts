import { analyzeMeal } from "@/lib/health-os/nutrition";
import { foodLogSchema } from "@/lib/health-os/validators";
import { getAuthenticatedSupabase, readValidatedJson } from "@/lib/server/persistence-auth";
import { getRequestId, jsonWithRequestId } from "@/lib/server/request-context";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  const parsed = await readValidatedJson(request, foodLogSchema);

  if (!parsed.ok) {
    return parsed.response;
  }

  const analysis = analyzeMeal({
    mealType: parsed.data.mealType,
    description: parsed.data.description,
    estimatedCalories: parsed.data.estimatedCalories,
    proteinG: parsed.data.proteinG,
    carbsG: parsed.data.carbsG,
    fatG: parsed.data.fatG,
    fiberG: parsed.data.fiberG,
    waterMl: parsed.data.waterMl,
    caffeineMg: parsed.data.caffeineMg,
    alcoholUnits: parsed.data.alcoholUnits,
    highSugarFlag: parsed.data.highSugarFlag,
    highSodiumFlag: parsed.data.highSodiumFlag,
    hasImage: Boolean(parsed.data.imagePath),
  });

  if (!parsed.data.consentToSave) {
    return jsonWithRequestId({ saved: false, analysis }, undefined, requestId);
  }

  const auth = await getAuthenticatedSupabase(request);

  if (!auth.ok) {
    return auth.response;
  }

  const { data, error } = await auth.supabase
    .from("meal_logs")
    .insert({
      user_id: auth.user.id,
      meal_time: parsed.data.mealTime,
      meal_type: parsed.data.mealType,
      image_path: parsed.data.imagePath,
      description: parsed.data.description,
      estimated_calories: parsed.data.estimatedCalories,
      protein_g: parsed.data.proteinG,
      carbs_g: parsed.data.carbsG,
      fat_g: parsed.data.fatG,
      fiber_g: parsed.data.fiberG,
      water_ml: parsed.data.waterMl,
      caffeine_mg: parsed.data.caffeineMg,
      alcohol_units: parsed.data.alcoholUnits,
      high_sugar_flag: parsed.data.highSugarFlag,
      high_sodium_flag: parsed.data.highSodiumFlag,
      ai_summary: parsed.data.aiSummary ?? analysis.summary,
    })
    .select("*")
    .single();

  if (error) {
    return jsonWithRequestId({ error: "暫時未能保存飲食紀錄。" }, { status: 500 }, requestId);
  }

  return jsonWithRequestId({ saved: true, meal: data, analysis }, undefined, requestId);
}
