import type { SupabaseClient } from "@supabase/supabase-js";
import type { LifeTrackerLogInput } from "@/lib/health-data/life-tracker";
import { saveLifeTrackerLog } from "@/lib/health-data/life-tracker";
import type { DailyQuest, DailyQuestRow, UserStreak, XPEvent } from "./types";
import { sanitizeXPMetadata } from "./xp";

const HEALTH_QUEST_STREAK_TYPE = "daily_health_quest";

type QuestDataClient = Pick<SupabaseClient, "from">;

export async function loadDailyQuests(
  supabase: QuestDataClient,
  userId: string,
  localDate: string,
) {
  const { data, error } = await supabase
    .from("daily_quests")
    .select("*")
    .eq("user_id", userId)
    .eq("local_date", localDate)
    .order("order_index", { ascending: true });

  if (error) {
    throw new Error(`Could not load daily quests: ${error.message}`);
  }

  return (data ?? []).map(mapQuestRow);
}

export async function insertGeneratedQuests(
  supabase: QuestDataClient,
  userId: string,
  quests: DailyQuest[],
) {
  if (quests.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("daily_quests")
    .upsert(
      quests.map((quest) => toQuestInsert(userId, quest)),
      { onConflict: "user_id,local_date,quest_type,order_index" },
    )
    .select("*")
    .order("order_index", { ascending: true });

  if (error) {
    throw new Error(`Could not create daily quests: ${error.message}`);
  }

  return (data ?? []).map(mapQuestRow);
}

export async function loadQuestById(
  supabase: QuestDataClient,
  userId: string,
  questId: string,
) {
  const { data, error } = await supabase
    .from("daily_quests")
    .select("*")
    .eq("user_id", userId)
    .eq("id", questId)
    .maybeSingle();

  if (error) {
    throw new Error(`Could not load quest: ${error.message}`);
  }

  return data ? mapQuestRow(data as DailyQuestRow) : null;
}

export async function markQuestDone(
  supabase: QuestDataClient,
  userId: string,
  questId: string,
  completedAt: string,
) {
  const { data, error } = await supabase
    .from("daily_quests")
    .update({
      status: "done",
      completed_at: completedAt,
      skipped_at: null,
    })
    .eq("user_id", userId)
    .eq("id", questId)
    .select("*")
    .single();

  if (error) {
    throw new Error(`Could not complete quest: ${error.message}`);
  }

  return mapQuestRow(data as DailyQuestRow);
}

export async function markQuestSkipped(
  supabase: QuestDataClient,
  userId: string,
  questId: string,
  skippedAt: string,
) {
  const { data, error } = await supabase
    .from("daily_quests")
    .update({
      status: "skipped",
      skipped_at: skippedAt,
    })
    .eq("user_id", userId)
    .eq("id", questId)
    .select("*")
    .single();

  if (error) {
    throw new Error(`Could not skip quest: ${error.message}`);
  }

  return mapQuestRow(data as DailyQuestRow);
}

export async function convertTodayToRecovery(
  supabase: QuestDataClient,
  userId: string,
  localDate: string,
) {
  const { error } = await supabase
    .from("daily_quests")
    .update({
      source: "recovery",
      safety_level: "caution",
      metadata: { recoveryMode: true },
    })
    .eq("user_id", userId)
    .eq("local_date", localDate)
    .in("quest_type", ["movement", "doctor_prep", "recovery"]);

  if (error) {
    throw new Error(`Could not switch to recovery mode: ${error.message}`);
  }
}

export async function insertXPEvent(
  supabase: QuestDataClient,
  userId: string,
  event: XPEvent,
  metadata: Record<string, unknown> = {},
) {
  if (event.amount <= 0) {
    return null;
  }

  const { data, error } = await supabase
    .from("user_xp_events")
    .insert({
      user_id: userId,
      quest_id: event.questId ?? null,
      amount: event.amount,
      reason: event.reason,
      event_key: event.eventKey ?? null,
      metadata: sanitizeXPMetadata(metadata),
      created_at: event.createdAt,
    })
    .select("id,user_id,quest_id,amount,reason,event_key,created_at")
    .single();

  if (error) {
    if (event.eventKey && isDuplicateKeyError(error)) {
      return loadXPEventByKey(supabase, userId, event.eventKey);
    }

    throw new Error(`Could not create XP event: ${error.message}`);
  }

  return {
    id: data.id as string,
    questId: data.quest_id as string | undefined,
    amount: data.amount as number,
    reason: data.reason as string,
    createdAt: data.created_at as string,
    eventKey: data.event_key as string | null,
  };
}

export async function loadXPEventByKey(
  supabase: QuestDataClient,
  userId: string,
  eventKey: string,
) {
  const { data, error } = await supabase
    .from("user_xp_events")
    .select("id,user_id,quest_id,amount,reason,event_key,created_at")
    .eq("user_id", userId)
    .eq("event_key", eventKey)
    .maybeSingle();

  if (error) {
    throw new Error(`Could not load XP event: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  return {
    id: data.id as string,
    questId: data.quest_id as string | undefined,
    amount: data.amount as number,
    reason: data.reason as string,
    createdAt: data.created_at as string,
    eventKey: data.event_key as string | null,
  };
}

export async function loadXPEvents(
  supabase: QuestDataClient,
  userId: string,
  sinceIso: string,
) {
  const { data, error } = await supabase
    .from("user_xp_events")
    .select("id,quest_id,amount,reason,event_key,created_at")
    .eq("user_id", userId)
    .gte("created_at", sinceIso)
    .order("created_at", { ascending: false })
    .limit(300);

  if (error) {
    throw new Error(`Could not load XP events: ${error.message}`);
  }

  return (data ?? []).map((row) => ({
    id: row.id as string,
    questId: row.quest_id as string | undefined,
    amount: row.amount as number,
    reason: row.reason as string,
    createdAt: row.created_at as string,
    eventKey: row.event_key as string | null,
  }));
}

export async function loadHealthQuestStreak(
  supabase: QuestDataClient,
  userId: string,
): Promise<UserStreak> {
  const { data, error } = await supabase
    .from("user_streaks")
    .select("current_streak,longest_streak,last_completed_date,streak_freeze_count,protected_today,current_count,best_count,last_logged_date,total_freezes_earned,total_freezes_consumed,last_freeze_earned_at,last_freeze_consumed_at")
    .eq("user_id", userId)
    .eq("streak_type", HEALTH_QUEST_STREAK_TYPE)
    .maybeSingle();

  if (error) {
    throw new Error(`Could not load streak: ${error.message}`);
  }

  if (!data) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastCompletedDate: null,
      streakFreezeCount: 0,
      protectedToday: false,
    };
  }

  return {
    currentStreak: Number(data.current_streak ?? data.current_count ?? 0),
    longestStreak: Number(data.longest_streak ?? data.best_count ?? 0),
    lastCompletedDate: (data.last_completed_date ?? data.last_logged_date ?? null) as string | null,
    streakFreezeCount: Number(data.streak_freeze_count ?? 0),
    protectedToday: Boolean(data.protected_today ?? false),
    totalFreezesEarned: Number(data.total_freezes_earned ?? 0),
    totalFreezesConsumed: Number(data.total_freezes_consumed ?? 0),
    lastFreezeEarnedAt: (data.last_freeze_earned_at ?? null) as string | null,
    lastFreezeConsumedAt: (data.last_freeze_consumed_at ?? null) as string | null,
  };
}

export async function upsertHealthQuestStreak(
  supabase: QuestDataClient,
  userId: string,
  streak: UserStreak,
) {
  const { error } = await supabase
    .from("user_streaks")
    .upsert({
      user_id: userId,
      streak_type: HEALTH_QUEST_STREAK_TYPE,
      current_count: streak.currentStreak,
      best_count: streak.longestStreak,
      last_logged_date: streak.lastCompletedDate,
      current_streak: streak.currentStreak,
      longest_streak: streak.longestStreak,
      last_completed_date: streak.lastCompletedDate,
      streak_freeze_count: streak.streakFreezeCount,
      protected_today: streak.protectedToday,
      total_freezes_earned: streak.totalFreezesEarned ?? 0,
      total_freezes_consumed: streak.totalFreezesConsumed ?? 0,
      last_freeze_earned_at: streak.lastFreezeEarnedAt ?? null,
      last_freeze_consumed_at: streak.lastFreezeConsumedAt ?? null,
    }, { onConflict: "user_id,streak_type" });

  if (error) {
    throw new Error(`Could not update streak: ${error.message}`);
  }
}

export async function saveQuestLifeTrackerLog({
  supabase,
  userId,
  input,
}: {
  supabase: SupabaseClient;
  userId: string;
  input: LifeTrackerLogInput;
}) {
  return saveLifeTrackerLog({
    supabase,
    userId,
    input,
  });
}

export async function insertStreakFreezeAward({
  supabase,
  userId,
  localDate,
  eventKey,
  reason,
}: {
  supabase: QuestDataClient;
  userId: string;
  localDate: string;
  eventKey: string;
  reason: string;
}) {
  const { error } = await supabase
    .from("streak_freezes")
    .insert({
      user_id: userId,
      local_date: localDate,
      event_key: eventKey,
      reason,
    });

  if (!error) {
    return { inserted: true };
  }

  if (isDuplicateKeyError(error)) {
    return { inserted: false };
  }

  throw new Error(`Could not create streak-freeze award: ${error.message}`);
}

export function mapQuestRow(row: DailyQuestRow): DailyQuest {
  return {
    id: row.id,
    userId: row.user_id,
    localDate: row.local_date,
    type: row.quest_type,
    title: row.title,
    description: row.description,
    actionLabel: row.action_label,
    completedLabel: row.completed_label,
    xp: row.xp,
    required: row.required,
    status: row.status,
    orderIndex: row.order_index,
    unlocksAfter: row.unlocks_after ?? [],
    safetyLevel: row.safety_level,
    source: row.source,
    metadata: row.metadata ?? {},
    completedAt: row.completed_at,
    skippedAt: row.skipped_at,
  };
}

function toQuestInsert(userId: string, quest: DailyQuest) {
  return {
    user_id: userId,
    local_date: quest.localDate,
    quest_type: quest.type,
    title: quest.title,
    description: quest.description,
    action_label: quest.actionLabel,
    completed_label: quest.completedLabel,
    xp: quest.xp,
    required: quest.required,
    status: quest.status,
    order_index: quest.orderIndex,
    unlocks_after: quest.unlocksAfter ?? [],
    safety_level: quest.safetyLevel,
    source: quest.source,
    metadata: quest.metadata,
    completed_at: quest.completedAt ?? null,
    skipped_at: quest.skippedAt ?? null,
  };
}

function isDuplicateKeyError(error: { code?: string; message?: string }) {
  return error.code === "23505" || /duplicate key value violates unique constraint/iu.test(error.message ?? "");
}
