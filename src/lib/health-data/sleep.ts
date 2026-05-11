import {
  assertUserId,
  normalizeLimit,
  throwIfSupabaseError,
  type HealthDataClient,
} from "./common";
import { refreshAfterLogChange } from "./summary-refresh";
import type { DateRange, SleepLogRow } from "./types";
import { sleepInputSchema, type SleepInput } from "./validation";

export async function getSleepLogs(
  supabase: HealthDataClient,
  userId: string,
  range: DateRange = {},
) {
  assertUserId(userId);

  let query = supabase
    .from("sleep_logs")
    .select("id,user_id,sleep_hours,bedtime,wake_time,sleep_quality,notes,created_at")
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
  throwIfSupabaseError(error, "load sleep logs");

  return (data ?? []) as SleepLogRow[];
}

export async function createSleepLog(
  supabase: HealthDataClient,
  userId: string,
  input: SleepInput,
) {
  assertUserId(userId);
  const payload = sleepInputSchema.parse(input);

  const { data, error } = await supabase
    .from("sleep_logs")
    .insert({
      user_id: userId,
      ...payload,
    })
    .select("*")
    .single();

  throwIfSupabaseError(error, "create sleep log");
  await refreshAfterLogChange(
    supabase,
    userId,
    "sleep",
    new Date(payload.created_at ?? Date.now()),
  );

  return data as SleepLogRow;
}
