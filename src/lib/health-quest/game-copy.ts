import type { LocalizedText, QuestLocale } from "./types";
import { questText } from "./play-system";

export const gameCopy = {
  dailyReady: { zh: "今日路線準備好啦。", en: "Your path is ready." },
  nextTinyStep: { zh: "下一個小步", en: "Next tiny step" },
  completeCounts: { zh: "好，呢一步算數。", en: "Nice. That counts." },
  streakProtected: { zh: "連續紀錄已保護。", en: "Streak protected." },
  chestUnlocked: { zh: "你解鎖咗寶箱！", en: "You unlocked a chest!" },
  recoveryOn: { zh: "輕量模式已開啟。恢復都算數。", en: "Gentle mode is on. Recovery counts." },
  safetyFirst: { zh: "安全最優先。", en: "Safety comes first." },
  movedUp: { zh: "你升級啦。", en: "You moved up." },
  reminderReady: { zh: "你嘅小任務準備好啦。", en: "Your tiny quest is ready." },
  lockedTinyStep: { zh: "先完成下一個小步。", en: "Complete the next tiny step first." },
  rewardSummary: { zh: "已計 XP，同時保留你嘅健康私隱。", en: "XP counted while keeping health details private." },
  noClinicalReward: { zh: "獎勵只係習慣鼓勵，不代表診斷、治療或保險結果。", en: "Rewards are habit encouragement only, not diagnosis, treatment, or insurance outcomes." },
  emergencyHongKong: { zh: "如有緊急或危急情況，請立即致電 999 或前往急症室。", en: "For urgent or emergency situations in Hong Kong, call 999 or go to Accident & Emergency now." },
  freshWeek: { zh: "新一週，重新開始。", en: "New week, fresh start." },
} satisfies Record<string, LocalizedText>;

export const forbiddenGameCopy = [
  "failed",
  "unhealthy",
  "lazy",
  "bad patient",
  "non-compliant",
  "your health score is poor",
  "your insurance score improved",
  "you are covered",
  "you will be approved",
] as const;

export function tGame(key: keyof typeof gameCopy, locale: QuestLocale) {
  return questText(gameCopy[key], locale);
}

