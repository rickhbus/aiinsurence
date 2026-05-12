import { buildDailyHealthSummary } from "@/lib/health-os/daily-summary";
import { dailyReportInputSchema } from "@/lib/health-os/validators";
import { readValidatedJson } from "@/lib/server/persistence-auth";
import { getRequestId, jsonWithRequestId } from "@/lib/server/request-context";

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  const parsed = await readValidatedJson(request, dailyReportInputSchema);

  if (!parsed.ok) {
    return parsed.response;
  }

  const summary = buildDailyHealthSummary({
    locale: parsed.data.language,
    dailyLog: parsed.data.dailyLog,
    moodLogs: parsed.data.moodLogs,
    meals: parsed.data.meals.map((meal) => ({
      mealType: meal.mealType,
      description: meal.description,
      estimatedCalories: meal.estimatedCalories,
      proteinG: meal.proteinG,
      carbsG: meal.carbsG,
      fatG: meal.fatG,
      fiberG: meal.fiberG,
      waterMl: meal.waterMl,
      caffeineMg: meal.caffeineMg,
      alcoholUnits: meal.alcoholUnits,
      highSugarFlag: meal.highSugarFlag,
      highSodiumFlag: meal.highSodiumFlag,
      hasImage: Boolean(meal.imagePath),
    })),
    hydrationLogs: parsed.data.hydrationLogs,
    toiletLogs: parsed.data.toiletLogs,
    gymWorkouts: parsed.data.gymWorkouts,
  });

  return jsonWithRequestId({ summary }, undefined, requestId);
}
