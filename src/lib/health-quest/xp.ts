import type { DailyQuest, QuestType, XPEvent } from "./types";

export const QUEST_XP: Record<QuestType, number> = {
  wake: 5,
  water: 5,
  meal: 10,
  movement: 15,
  mood: 10,
  toilet_optional: 5,
  sleep_prep: 10,
  health_review: 10,
  doctor_prep: 15,
  recovery: 10,
  learn: 5,
};

const SENSITIVE_METADATA_KEY_PATTERN =
  /(symptom|diagnosis|medical|note|notes|message|content|prompt|meal|food|policy|claim|hkid|email|phone|name|text|input|pain|mood)/iu;

export function getQuestXp(type: QuestType) {
  return QUEST_XP[type];
}

export function getCompletionXp(quest: DailyQuest) {
  if (quest.status === "blocked_by_safety" || quest.safetyLevel === "urgent") {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(quest.xp || getQuestXp(quest.type))));
}

export function buildXPEvent({
  quest,
  now = new Date().toISOString(),
}: {
  quest: DailyQuest;
  now?: string;
}): XPEvent {
  return {
    id: `xp-${quest.id}-${now}`,
    questId: quest.id,
    amount: getCompletionXp(quest),
    reason: `quest_completed:${quest.type}`,
    createdAt: now,
  };
}

export function sumEarnedXpToday(quests: DailyQuest[], xpEvents: XPEvent[] = []) {
  if (xpEvents.length > 0) {
    return xpEvents.reduce((total, event) => total + clampXp(event.amount), 0);
  }

  return quests
    .filter((quest) => quest.status === "done")
    .reduce((total, quest) => total + getCompletionXp(quest), 0);
}

export function sanitizeXPMetadata(metadata: Record<string, unknown>) {
  const safeEntries = Object.entries(metadata)
    .filter(([key]) => !SENSITIVE_METADATA_KEY_PATTERN.test(key))
    .map(([key, value]) => [key, normalizeMetadataValue(value)] as const);

  return Object.fromEntries(safeEntries);
}

function normalizeMetadataValue(value: unknown): string | number | boolean | null {
  if (typeof value === "string") {
    return value.slice(0, 80);
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "boolean" || value === null) {
    return value;
  }

  return null;
}

function clampXp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}
