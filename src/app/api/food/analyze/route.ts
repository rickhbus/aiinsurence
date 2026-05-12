import { analyzeMeal } from "@/lib/health-os/nutrition";
import { foodLogSchema } from "@/lib/health-os/validators";
import { readValidatedJson } from "@/lib/server/persistence-auth";
import { getRequestId, jsonWithRequestId } from "@/lib/server/request-context";

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  const parsed = await readValidatedJson(request, foodLogSchema);

  if (!parsed.ok) {
    return parsed.response;
  }

  return jsonWithRequestId({
    analysis: analyzeMeal({
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
    }),
  }, undefined, requestId);
}
