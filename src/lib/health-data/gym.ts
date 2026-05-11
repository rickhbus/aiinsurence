import {
  assertUserId,
  normalizeLimit,
  throwIfSupabaseError,
  type HealthDataClient,
} from "./common";
import { upsertDailySummary } from "./summaries";
import type { DateRange, GymLogRow } from "./types";
import { type GymLogInput, gymLogInputSchema } from "./validation";

export async function getGymLogs(
  supabase: HealthDataClient,
  userId: string,
  range: DateRange = {},
) {
  assertUserId(userId);

  let query = supabase
    .from("gym_logs")
    .select("id,user_id,workout_title,exercise_name,muscle_group,sets,reps,weight_kg,rest_seconds,rpe,notes,created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(normalizeLimit(range.limit, 40, 200));

  if (range.from) {
    query = query.gte("created_at", range.from);
  }

  if (range.to) {
    query = query.lt("created_at", range.to);
  }

  const { data, error } = await query;
  throwIfSupabaseError(error, "load gym logs");

  return (data ?? []) as GymLogRow[];
}

export async function createGymLog(
  supabase: HealthDataClient,
  userId: string,
  input: GymLogInput,
) {
  assertUserId(userId);
  const payload = gymLogInputSchema.parse(input);

  const { data, error } = await supabase
    .from("gym_logs")
    .insert({
      user_id: userId,
      ...payload,
    })
    .select("*")
    .single();

  throwIfSupabaseError(error, "create gym log");
  await upsertDailySummary(supabase, userId, new Date(payload.created_at ?? Date.now()));

  return data as GymLogRow;
}
