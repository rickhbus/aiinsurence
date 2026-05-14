import type { DailyQuest, LocalizedText, QuestType } from "./types";

export const makeEasierMap: Record<QuestType, LocalizedText> = {
  wake: { zh: "撳一下表示今日開始", en: "Tap once to start today" },
  water: { zh: "飲一杯水", en: "Drink one glass" },
  meal: { zh: "只點選餐類型", en: "Tap meal type only" },
  movement: { zh: "站起身伸展 30 秒", en: "Stand up and stretch for 30 seconds" },
  mood: { zh: "點一個表情符號", en: "Tap one emoji" },
  toilet_optional: { zh: "只選擇略過或正常", en: "Tap skip or okay only" },
  sleep_prep: { zh: "放低電話 1 分鐘", en: "Put phone away for 1 minute" },
  health_review: { zh: "點今日：可以 / 攰 / 唔太好", en: "Tap today: okay / tired / not good" },
  doctor_prep: { zh: "寫低一條問題", en: "Write one question" },
  recovery: { zh: "選擇休息都算數", en: "Choose rest counts" },
  learn: { zh: "讀一張小卡", en: "Read one card" },
};

export function makeQuestEasier(quest: DailyQuest): DailyQuest {
  const easier = makeEasierMap[quest.type];

  return {
    ...quest,
    title: easier,
    description: {
      zh: "今日做最簡單版本。恢復和略過都無需內疚。",
      en: "Use the easiest version today. Recovery and skipping are guilt-free.",
    },
    actionLabel: easier,
    xp: Math.max(1, Math.min(quest.xp, 5)),
    metadata: {
      ...quest.metadata,
      madeEasier: true,
      originalQuestType: quest.type,
    },
  };
}

export function getMakeEasierText(type: QuestType) {
  return makeEasierMap[type];
}
