import {
  assertUserId,
  normalizeLimit,
  throwIfSupabaseError,
  type HealthDataClient,
} from "./common";
import { upsertDailySummary } from "./summaries";
import type { DateRange, RunningLogRow } from "./types";
import { type RunningLogInput, runningLogInputSchema } from "./validation";

export async function getRunningLogs(
  supabase: HealthDataClient,
  userId: string,
  range: DateRange = {},
) {
  assertUserId(userId);

  let query = supabase
    .from("running_logs")
    .select("id,user_id,distance_km,duration_seconds,pace,heart_rate_avg,calories,rpe,route_notes,weather,shoe,notes,created_at")
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
  throwIfSupabaseError(error, "load running logs");

  return (data ?? []) as RunningLogRow[];
}

export async function createRunningLog(
  supabase: HealthDataClient,
  userId: string,
  input: RunningLogInput,
) {
  assertUserId(userId);
  const payload = runningLogInputSchema.parse(input);

  const { data, error } = await supabase
    .from("running_logs")
    .insert({
      user_id: userId,
      ...payload,
    })
    .select("*")
    .single();

  throwIfSupabaseError(error, "create running log");
  await upsertDailySummary(supabase, userId, new Date(payload.created_at ?? Date.now()));

  return data as RunningLogRow;
}
