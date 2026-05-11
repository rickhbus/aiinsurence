import {
  assertUserId,
  normalizeLimit,
  throwIfSupabaseError,
  type HealthDataClient,
} from "./common";
import type { BodyMetricRow, DateRange } from "./types";
import { bodyMetricInputSchema, type BodyMetricInput } from "./validation";

export async function getBodyMetrics(
  supabase: HealthDataClient,
  userId: string,
  range: DateRange = {},
) {
  assertUserId(userId);

  let query = supabase
    .from("body_metrics")
    .select("id,user_id,weight_kg,waist_cm,body_fat_percentage,notes,created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(normalizeLimit(range.limit, 20, 100));

  if (range.from) {
    query = query.gte("created_at", range.from);
  }

  if (range.to) {
    query = query.lt("created_at", range.to);
  }

  const { data, error } = await query;
  throwIfSupabaseError(error, "load body metrics");

  return (data ?? []) as BodyMetricRow[];
}

export async function createBodyMetric(
  supabase: HealthDataClient,
  userId: string,
  input: BodyMetricInput,
) {
  assertUserId(userId);
  const payload = bodyMetricInputSchema.parse(input);

  const { data, error } = await supabase
    .from("body_metrics")
    .insert({
      user_id: userId,
      ...payload,
    })
    .select("*")
    .single();

  throwIfSupabaseError(error, "create body metric");

  return data as BodyMetricRow;
}
