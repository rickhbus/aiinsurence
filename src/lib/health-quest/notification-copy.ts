import type { LocalizedText } from "./types";

export type ReminderType =
  | "morning_quest"
  | "water"
  | "evening_review"
  | "weekly_review"
  | "recovery_checkin"
  | "family_nudge";

export const notificationCopy: Record<ReminderType, LocalizedText> = {
  morning_quest: {
    zh: "你嘅小小健康任務準備好啦。",
    en: "Your tiny health quest is ready.",
  },
  water: {
    zh: "一個小步驟，延續你嘅連續紀錄。",
    en: "One small step keeps your streak moving.",
  },
  evening_review: {
    zh: "用一分鐘收尾今日。",
    en: "Close today with one minute.",
  },
  weekly_review: {
    zh: "一週健康回顧準備好啦。",
    en: "Your weekly health review is ready.",
  },
  recovery_checkin: {
    zh: "今日恢復休息都算數。",
    en: "Recovery counts today.",
  },
  family_nudge: {
    zh: "屋企人可以一齊完成小任務。",
    en: "Your family can complete a tiny quest together.",
  },
};

const forbiddenNotificationPattern = /(mood is low|skipped water|symptoms are serious|insurance score|低落|又冇飲水|症狀嚴重|保險分數|claim|policy|diagnosis|medication|HKID|phone|email)/iu;

export function getNotificationCopy(type: ReminderType) {
  return notificationCopy[type];
}

export function assertNotificationCopySafe(copy: LocalizedText) {
  return !forbiddenNotificationPattern.test(copy.en) && !forbiddenNotificationPattern.test(copy.zh);
}
