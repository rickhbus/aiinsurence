import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { buildChestRewardEvent, getDailyBonusReward, sanitizeRewardMetadata } from "@/lib/health-quest/rewards";
import { getAuthenticatedSupabase, readValidatedJson } from "@/lib/server/persistence-auth";
import { getRequestId, jsonWithRequestId } from "@/lib/server/request-context";

export const dynamic = "force-dynamic";

const rewardRequestSchema = z.object({
  action: z.enum(["open_daily_chest", "claim_first_quest_bonus"]),
  localDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export async function GET(request: Request) {
  const requestId = getRequestId(request);
  const auth = await getAuthenticatedSupabase(request);

  if (!auth.ok) {
    return auth.response;
  }

  try {
    const wallet = await loadOrCreateWallet(auth.supabase, auth.user.id);

    return jsonWithRequestId({ wallet }, undefined, requestId);
  } catch {
    return jsonWithRequestId({ error: "Rewards are temporarily unavailable." }, { status: 500 }, requestId);
  }
}

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  const parsed = await readValidatedJson(request, rewardRequestSchema);

  if (!parsed.ok) {
    return parsed.response;
  }

  const auth = await getAuthenticatedSupabase(request);

  if (!auth.ok) {
    return auth.response;
  }

  try {
    const wallet = await loadOrCreateWallet(auth.supabase, auth.user.id);
    const reward = parsed.data.action === "open_daily_chest"
      ? buildChestRewardEvent(parsed.data.localDate, auth.user.id)
      : getDailyBonusReward(parsed.data.localDate);
    const event = await insertRewardEvent({
      supabase: auth.supabase,
      userId: auth.user.id,
      eventType: reward.eventType,
      amount: reward.amount,
      source: reward.source,
      eventKey: reward.eventKey,
      metadata: reward.metadata,
    });

    if (event.duplicate) {
      return jsonWithRequestId({ wallet, reward: event.row, duplicate: true }, undefined, requestId);
    }

    const updatedWallet = await updateWallet(auth.supabase, auth.user.id, wallet.gems + reward.amount, wallet.lifetimeGems + reward.amount);

    return jsonWithRequestId({ wallet: updatedWallet, reward: event.row, duplicate: false }, undefined, requestId);
  } catch {
    return jsonWithRequestId({ error: "Reward could not be saved." }, { status: 500 }, requestId);
  }
}

async function loadOrCreateWallet(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from("health_quest_wallets")
    .upsert({ user_id: userId }, { onConflict: "user_id" })
    .select("gems,lifetime_gems")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return {
    gems: Number(data.gems ?? 0),
    lifetimeGems: Number(data.lifetime_gems ?? 0),
  };
}

async function updateWallet(supabase: SupabaseClient, userId: string, gems: number, lifetimeGems: number) {
  const { data, error } = await supabase
    .from("health_quest_wallets")
    .update({ gems, lifetime_gems: lifetimeGems, updated_at: new Date().toISOString() })
    .eq("user_id", userId)
    .select("gems,lifetime_gems")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return {
    gems: Number(data.gems ?? 0),
    lifetimeGems: Number(data.lifetime_gems ?? 0),
  };
}

async function insertRewardEvent({
  supabase,
  userId,
  eventType,
  amount,
  source,
  eventKey,
  metadata,
}: {
  supabase: SupabaseClient;
  userId: string;
  eventType: string;
  amount: number;
  source: string;
  eventKey: string;
  metadata?: Record<string, unknown>;
}) {
  const insert = await supabase
    .from("health_quest_reward_events")
    .insert({
      user_id: userId,
      event_type: eventType,
      amount,
      source,
      event_key: eventKey,
      metadata: sanitizeRewardMetadata(metadata ?? {}),
    })
    .select("id,event_type,amount,source,event_key,created_at")
    .single();

  if (!insert.error) {
    return { duplicate: false, row: insert.data };
  }

  if (insert.error.code !== "23505") {
    throw new Error(insert.error.message);
  }

  const existing = await supabase
    .from("health_quest_reward_events")
    .select("id,event_type,amount,source,event_key,created_at")
    .eq("user_id", userId)
    .eq("event_key", eventKey)
    .maybeSingle();

  if (existing.error) {
    throw new Error(existing.error.message);
  }

  return { duplicate: true, row: existing.data };
}
