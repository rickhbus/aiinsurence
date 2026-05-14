import type { AdaptationReason, LocalizedText } from "./types";

export const adaptationReasonCopy: Record<AdaptationReason, LocalizedText> = {
  low_completion: {
    zh: "最近完成較少，所以任務會變短。",
    en: "Recent completion is lower, so quests are shorter.",
  },
  high_completion: {
    zh: "最近好穩定，所以可以加一個可選挑戰。",
    en: "You have been consistent, so an optional challenge can appear.",
  },
  repeated_skip: {
    zh: "有些任務經常略過，今日轉做更細版本。",
    en: "Some quests were skipped often, so today uses a smaller version.",
  },
  low_energy: {
    zh: "能量偏低，今日保持輕量。",
    en: "Energy looks lower, so today stays gentle.",
  },
  low_mood: {
    zh: "心情偏低，今日用支持式任務。",
    en: "Mood looks lower, so today uses supportive quests.",
  },
  poor_sleep: {
    zh: "睡眠訊號偏弱，今日減低活動強度。",
    en: "Sleep signals look weaker, so movement intensity is reduced.",
  },
  pain_or_soreness: {
    zh: "身體不適或痠痛時，休息和輕量伸展都算數。",
    en: "With pain or soreness, rest and gentle stretching count.",
  },
  dehydration_signal: {
    zh: "補水一致性較低，加入一個小小飲水任務。",
    en: "Hydration consistency is lower, so a tiny water quest is added.",
  },
  recovery_day: {
    zh: "恢復日同樣保護連續紀錄。",
    en: "Recovery days still protect your streak.",
  },
  safety_block: {
    zh: "安全提示優先，普通遊戲化暫停。",
    en: "Safety guidance comes first; ordinary gamification pauses.",
  },
  user_preference: {
    zh: "任務按你設定的偏好調整。",
    en: "Quests are tuned to your preferences.",
  },
  time_budget: {
    zh: "按你每日可用時間縮短任務。",
    en: "Quests are shortened for your daily time budget.",
  },
  new_user: {
    zh: "新開始用最簡單路線。",
    en: "New starts use the easiest path.",
  },
  streak_risk: {
    zh: "連續紀錄有風險，先做最容易保護的一步。",
    en: "Your streak is at risk, so the easiest saving step comes first.",
  },
};

export function uniqueAdaptationReasons(reasons: AdaptationReason[]) {
  return Array.from(new Set(reasons));
}
