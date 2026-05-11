import {
  assertUserId,
  normalizeLimit,
  throwIfSupabaseError,
  type HealthDataClient,
} from "./common";
import { refreshAfterLogChange } from "./summary-refresh";
import type { DateRange, WaterLogRow } from "./types";
import { type WaterInput, waterInputSchema } from "./validation";

export async function getWaterLogs(
  supabase: HealthDataClient,
  userId: string,
  range: DateRange = {},
) {
  assertUserId(userId);

  let query = supabase
    .from("water_logs")
    .select("id,user_id,amount_ml,created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(normalizeLimit(range.limit, 30, 200));

  if (range.from) {
    query = query.gte("created_at", range.from);
  }

  if (range.to) {
    query = query.lt("created_at", range.to);
  }

  const { data, error } = await query;
  throwIfSupabaseError(error, "load water logs");

  return (data ?? []) as WaterLogRow[];
}

export async function createWaterLog(
  supabase: HealthDataClient,
  userId: string,
  input: WaterInput,
) {
  assertUserId(userId);
  const payload = waterInputSchema.parse(input);

  const { data, error } = await supabase
    .from("water_logs")
    .insert({
      user_id: userId,
      ...payload,
    })
    .select("*")
    .single();

  throwIfSupabaseError(error, "create water log");
  await refreshAfterLogChange(
    supabase,
    userId,
    "water",
    new Date(payload.created_at ?? Date.now()),
  );

  return data as WaterLogRow;
}
