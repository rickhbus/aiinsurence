import { trackServerEvent } from "@/lib/analytics/events";
import { createMeal } from "@/lib/health-data/nutrition";
import { mealInputSchema } from "@/lib/health-data/validation";
import {
  getAuthenticatedSupabase,
  readValidatedJson,
} from "@/lib/server/persistence-auth";

export async function POST(request: Request) {
  const parsed = await readValidatedJson(request, mealInputSchema);

  if (!parsed.ok) {
    return parsed.response;
  }

  const auth = await getAuthenticatedSupabase();

  if (!auth.ok) {
    return auth.response;
  }

  try {
    const meal = await createMeal(auth.supabase, auth.user.id, parsed.data);

    void trackServerEvent({
      supabase: auth.supabase,
      userId: auth.user.id,
      event: "meal_logged",
      metadata: {
        mealType: parsed.data.meal_type,
        calories: parsed.data.calories ?? null,
        protein: parsed.data.protein_g ?? null,
      },
    });

    return Response.json({ meal });
  } catch {
    return Response.json({ error: "儲存失敗，請檢查網絡後再試。" }, { status: 500 });
  }
}
