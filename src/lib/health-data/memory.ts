import {
  assertUserId,
  normalizeLimit,
  throwIfSupabaseError,
  type HealthDataClient,
} from "./common";
import type { DateRange, HealthMemoryCategory, HealthMemoryRow } from "./types";
import { healthMemoryInputSchema, type HealthMemoryInput } from "./validation";

export async function getHealthMemory(
  supabase: HealthDataClient,
  userId: string,
  range: DateRange & { category?: HealthMemoryCategory } = {},
) {
  assertUserId(userId);

  let query = supabase
    .from("health_memory")
    .select("id,user_id,memory_type,content,source,consent_status,created_at,updated_at")
    .eq("user_id", userId)
    .neq("consent_status", "deleted")
    .order("updated_at", { ascending: false })
    .limit(normalizeLimit(range.limit, 50, 200));

  if (range.category) {
    query = query.eq("memory_type", range.category);
  }

  const { data, error } = await query;
  throwIfSupabaseError(error, "load health memory");

  return (data ?? []) as HealthMemoryRow[];
}

export async function createHealthMemory(
  supabase: HealthDataClient,
  userId: string,
  input: HealthMemoryInput,
) {
  assertUserId(userId);
  const payload = healthMemoryInputSchema.parse(input);

  const { data, error } = await supabase
    .from("health_memory")
    .insert({
      user_id: userId,
      ...payload,
      consent_status: "saved",
    })
    .select("*")
    .single();

  throwIfSupabaseError(error, "create health memory");

  return data as HealthMemoryRow;
}

export async function updateHealthMemory(
  supabase: HealthDataClient,
  userId: string,
  memoryId: string,
  input: Partial<HealthMemoryInput>,
) {
  assertUserId(userId);

  const { data, error } = await supabase
    .from("health_memory")
    .update({ ...input, consent_status: "edited" })
    .eq("id", memoryId)
    .eq("user_id", userId)
    .select("*")
    .single();

  throwIfSupabaseError(error, "update health memory");

  return data as HealthMemoryRow;
}

export async function deleteHealthMemory(
  supabase: HealthDataClient,
  userId: string,
  memoryId: string,
) {
  assertUserId(userId);

  const { error } = await supabase
    .from("health_memory")
    .update({ consent_status: "deleted" })
    .eq("id", memoryId)
    .eq("user_id", userId);

  throwIfSupabaseError(error, "delete health memory");
}
