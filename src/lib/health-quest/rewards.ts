import type { LocalizedText, QuestLocale } from "./types";
import { questText } from "./play-system";

export const rewardSources = [
  "first_quest_of_day",
  "streak_protected",
  "weekly_review",
  "lesson_completed",
  "chest_opened",
  "challenge_completed",
  "practice_completed",
] as const;

export type RewardSource = typeof rewardSources[number];

export type RewardEvent = {
  eventType: string;
  amount: number;
  source: RewardSource;
  eventKey: string;
  metadata?: Record<string, unknown>;
};

export type RewardWallet = {
  gems: number;
  lifetimeGems: number;
};

export type ChestReward = {
  gems: number;
  label: LocalizedText;
  eventKey: string;
};

export function buildRewardEventKey(parts: Array<string | number | undefined | null>) {
  return parts
    .filter((part): part is string | number => part !== undefined && part !== null && String(part).length > 0)
    .map((part) => String(part).toLowerCase().replace(/[^a-z0-9:_-]/g, "_"))
    .join(":")
    .slice(0, 160);
}

export function shouldUnlockDailyChest(input: {
  requiredCompletedCount: number;
  totalRequiredCount: number;
  completedCount: number;
}) {
  const dailyMinimum = Math.max(1, Math.min(3, input.totalRequiredCount || 3));

  return input.requiredCompletedCount >= dailyMinimum || input.completedCount >= 3;
}

export function getDailyBonusReward(localDate: string): RewardEvent {
  return {
    eventType: "gems_awarded",
    amount: 1,
    source: "first_quest_of_day",
    eventKey: buildRewardEventKey(["reward", "first_quest", localDate]),
    metadata: { rewardKind: "daily_bonus" },
  };
}

export function getChestReward(localDate: string, seed: string): ChestReward {
  const gems = 1 + deterministicRange(seed, 5);

  return {
    gems,
    label: { zh: `寶箱獲得 ${gems} 粒健康寶石`, en: `Chest earned ${gems} Health Gems` },
    eventKey: buildRewardEventKey(["reward", "daily_chest", localDate]),
  };
}

export function buildChestRewardEvent(localDate: string, seed: string): RewardEvent {
  const reward = getChestReward(localDate, seed);

  return {
    eventType: "gems_awarded",
    amount: reward.gems,
    source: "chest_opened",
    eventKey: reward.eventKey,
    metadata: { rewardKind: "daily_chest" },
  };
}

export function rewardLabel(reward: ChestReward, locale: QuestLocale) {
  return questText(reward.label, locale);
}

export function sanitizeRewardMetadata(metadata: Record<string, unknown> = {}) {
  const allowed = new Set(["rewardKind", "theme", "cosmeticSlug", "challengeType", "leagueName"]);

  return Object.fromEntries(
    Object.entries(metadata)
      .filter(([key, value]) => allowed.has(key) && ["string", "number", "boolean"].includes(typeof value)),
  );
}

function deterministicRange(seed: string, max: number) {
  let hash = 0;
  for (const char of seed) {
    hash = (hash * 31 + char.charCodeAt(0)) % 9973;
  }

  return hash % max;
}

