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

type ClaimedRewardRow = {
  wallet_gems: number;
  wallet_lifetime_gems: number;
  reward_id: string;
  reward_event_type: string;
  reward_amount: number;
  reward_source: string;
  reward_event_key: string;
  reward_created_at: string;
  duplicate: boolean;
};

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
    const reward = parsed.data.action === "open_daily_chest"
      ? buildChestRewardEvent(parsed.data.localDate, auth.user.id)
      : getDailyBonusReward(parsed.data.localDate);
    const claim = await claimRewardEvent({
      supabase: auth.supabase,
      eventType: reward.eventType,
      amount: reward.amount,
      source: reward.source,
      eventKey: reward.eventKey,
      metadata: reward.metadata,
    });

    return jsonWithRequestId({
      wallet: claim.wallet,
      reward: claim.reward,
      duplicate: claim.duplicate,
    }, undefined, requestId);
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

async function claimRewardEvent({
  supabase,
  eventType,
  amount,
  source,
  eventKey,
  metadata,
}: {
  supabase: SupabaseClient;
  eventType: string;
  amount: number;
  source: string;
  eventKey: string;
  metadata?: Record<string, unknown>;
}) {
  const { data, error } = await supabase.rpc("claim_health_quest_reward", {
    p_event_type: eventType,
    p_amount: amount,
    p_source: source,
    p_event_key: eventKey,
    p_metadata: sanitizeRewardMetadata(metadata ?? {}),
  });

  if (error) {
    throw new Error(error.message);
  }

  const row = Array.isArray(data) ? data[0] as ClaimedRewardRow | undefined : data as ClaimedRewardRow | undefined;

  if (!row) {
    throw new Error("Reward claim returned no row");
  }

  return {
    wallet: {
      gems: Number(row.wallet_gems ?? 0),
      lifetimeGems: Number(row.wallet_lifetime_gems ?? 0),
    },
    reward: {
      id: row.reward_id,
      event_type: row.reward_event_type,
      amount: Number(row.reward_amount ?? 0),
      source: row.reward_source,
      event_key: row.reward_event_key,
      created_at: row.reward_created_at,
    },
    duplicate: Boolean(row.duplicate),
  };
}
