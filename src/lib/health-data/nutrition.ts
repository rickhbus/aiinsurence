import {
  assertUserId,
  normalizeLimit,
  throwIfSupabaseError,
  type HealthDataClient,
} from "./common";
import { upsertDailySummary } from "./summaries";
import type { DateRange, MealRow } from "./types";
import { mealInputSchema, type MealInput } from "./validation";

export async function getMeals(
  supabase: HealthDataClient,
  userId: string,
  range: DateRange = {},
) {
  assertUserId(userId);

  let query = supabase
    .from("meals")
    .select("id,user_id,meal_type,food_name,calories,protein_g,carbs_g,fat_g,fiber_g,sugar_g,sodium_mg,notes,created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(normalizeLimit(range.limit, 30, 120));

  if (range.from) {
    query = query.gte("created_at", range.from);
  }

  if (range.to) {
    query = query.lt("created_at", range.to);
  }

  const { data, error } = await query;
  throwIfSupabaseError(error, "load meals");

  return (data ?? []) as MealRow[];
}

export async function getNutritionToday(
  supabase: HealthDataClient,
  userId: string,
  range: DateRange,
) {
  return getMeals(supabase, userId, range);
}

export async function createMeal(
  supabase: HealthDataClient,
  userId: string,
  input: MealInput,
) {
  assertUserId(userId);
  const payload = mealInputSchema.parse(input);

  const { data, error } = await supabase
    .from("meals")
    .insert({
      user_id: userId,
      ...payload,
    })
    .select("*")
    .single();

  throwIfSupabaseError(error, "create meal");
  await upsertDailySummary(supabase, userId, new Date(payload.created_at ?? Date.now()));

  return data as MealRow;
}
