import {
  assertUserId,
  getDayBounds,
  normalizeLimit,
  throwIfSupabaseError,
  type HealthDataClient,
} from "./common";
import type { DailyCheckinRow } from "./types";
import {
  dailyCheckinInputSchema,
  type DailyCheckinInput,
} from "./validation";

export async function getDailyCheckins(
  supabase: HealthDataClient,
  userId: string,
  date = new Date(),
) {
  assertUserId(userId);
  const day = getDayBounds(date);

  const { data, error } = await supabase
    .from("daily_checkins")
    .select("id,user_id,checkin_type,label,amount,unit,note,metadata,created_at")
    .eq("user_id", userId)
    .gte("created_at", day.from)
    .lt("created_at", day.to)
    .order("created_at", { ascending: false })
    .limit(normalizeLimit(undefined, 40, 80));

  throwIfSupabaseError(error, "load daily check-ins");

  return (data ?? []) as DailyCheckinRow[];
}

export async function createDailyCheckin(
  supabase: HealthDataClient,
  userId: string,
  input: DailyCheckinInput,
) {
  assertUserId(userId);
  const payload = dailyCheckinInputSchema.parse(input);

  const { data, error } = await supabase
    .from("daily_checkins")
    .insert({
      user_id: userId,
      ...payload,
      metadata: {
        source: "everyday_loop",
        ...payload.metadata,
      },
    })
    .select("id,user_id,checkin_type,label,amount,unit,note,metadata,created_at")
    .single();

  throwIfSupabaseError(error, "create daily check-in");

  return data as DailyCheckinRow;
}
