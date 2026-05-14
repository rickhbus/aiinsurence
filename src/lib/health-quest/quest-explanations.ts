import type { LocalizedText, QuestType } from "./types";

export const questExplanations: Record<QuestType, LocalizedText> = {
  wake: {
    zh: "起身打卡只是幫 app 知道今日開始，不是健康評分。",
    en: "A wake check-in only tells the app today started. It is not a health score.",
  },
  water: {
    zh: "細小補水行動比大目標更容易持續。",
    en: "Small hydration actions are easier to repeat than large goals.",
  },
  meal: {
    zh: "簡單記錄餐類型可以建立飲食覺察，不需要卡路里壓力。",
    en: "A simple meal-type tap builds awareness without calorie pressure.",
  },
  movement: {
    zh: "輕量活動可以支持日常精神，但恢復休息同樣算數。",
    en: "Light movement can support daily energy, but recovery counts too.",
  },
  mood: {
    zh: "記錄心情可以幫 app 選擇更輕鬆或更主動嘅任務。",
    en: "Checking mood helps the app choose gentler or more active quests.",
  },
  toilet_optional: {
    zh: "消化和補水線索只作一般生活支援；嚴重、持續或令你擔心時應尋求醫護協助。",
    en: "Digestion and hydration signals are general support only; seek care if severe, persistent, or worrying.",
  },
  sleep_prep: {
    zh: "一個小睡前流程比追求完美睡眠更容易重複。",
    en: "A tiny wind-down routine is easier to repeat than chasing perfect sleep.",
  },
  health_review: {
    zh: "一個短回顧幫你留意生活模式，不是診斷。",
    en: "A short review helps notice lifestyle patterns. It is not a diagnosis.",
  },
  doctor_prep: {
    zh: "睇醫生前寫低一條問題，可以令面診更清晰。",
    en: "Writing one question before a visit can make the appointment clearer.",
  },
  recovery: {
    zh: "休息日不是失敗。恢復可以保護連續紀錄。",
    en: "A rest day is not a failure. Recovery can protect your streak.",
  },
  learn: {
    zh: "一個小概念幫你明白下一步，但不提供診斷、治療或保險建議。",
    en: "One tiny idea can clarify the next step, without diagnosis, treatment, or insurance advice.",
  },
};

export function explainQuest(type: QuestType) {
  return questExplanations[type];
}
