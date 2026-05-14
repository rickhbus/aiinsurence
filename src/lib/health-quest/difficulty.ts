import type { QuestDifficulty } from "./types";

const order: QuestDifficulty[] = ["tiny", "easy", "normal", "challenge"];

export function clampQuestDifficulty(value: unknown, fallback: QuestDifficulty = "easy"): QuestDifficulty {
  return order.includes(value as QuestDifficulty) ? value as QuestDifficulty : fallback;
}

export function easierDifficulty(value: QuestDifficulty): QuestDifficulty {
  const index = order.indexOf(value);
  return order[Math.max(0, index - 1)] ?? "tiny";
}

export function harderDifficulty(value: QuestDifficulty): QuestDifficulty {
  const index = order.indexOf(value);
  return order[Math.min(order.length - 1, index + 1)] ?? "challenge";
}

export function isTinyOnlyDifficulty(value: QuestDifficulty) {
  return value === "tiny";
}

export function difficultyFromCompletionRate(rate: number): QuestDifficulty {
  if (rate < 0.4) {
    return "tiny";
  }

  if (rate <= 0.7) {
    return "easy";
  }

  return "normal";
}
