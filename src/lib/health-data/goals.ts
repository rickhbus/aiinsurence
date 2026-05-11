import {
  assertUserId,
  normalizeLimit,
  throwIfSupabaseError,
  type HealthDataClient,
} from "./common";
import { refreshGoalProgress } from "./summary-refresh";
import type { DateRange, GoalRow } from "./types";
import { goalInputSchema, type GoalInput } from "./validation";

export async function getGoals(
  supabase: HealthDataClient,
  userId: string,
  range: DateRange = {},
) {
  assertUserId(userId);

  const { data, error } = await supabase
    .from("goals")
    .select("id,user_id,title,goal_type,target_value,current_value,unit,deadline,weekly_action,status,created_at,updated_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(normalizeLimit(range.limit, 20, 100));

  throwIfSupabaseError(error, "load goals");

  return (data ?? []) as GoalRow[];
}

export async function createGoal(
  supabase: HealthDataClient,
  userId: string,
  input: GoalInput,
) {
  assertUserId(userId);
  const payload = goalInputSchema.parse(input);

  const { data, error } = await supabase
    .from("goals")
    .insert({
      user_id: userId,
      ...payload,
    })
    .select("*")
    .single();

  throwIfSupabaseError(error, "create goal");
  await refreshGoalProgress(supabase, userId);

  return data as GoalRow;
}

export async function updateGoal(
  supabase: HealthDataClient,
  userId: string,
  goalId: string,
  input: Partial<GoalInput>,
) {
  assertUserId(userId);

  const { data, error } = await supabase
    .from("goals")
    .update(input)
    .eq("id", goalId)
    .eq("user_id", userId)
    .select("*")
    .single();

  throwIfSupabaseError(error, "update goal");
  await refreshGoalProgress(supabase, userId);

  return data as GoalRow;
}
