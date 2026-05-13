import type { LocalizedText, QuestLocale, QuestType } from "./types";

export function text(value: LocalizedText, locale: QuestLocale = "zh-Hant") {
  return locale === "en" ? value.en : value.zh;
}

export const healthQuestCopy = {
  title: {
    en: "Today's Health Quest",
    zh: "今日健康任務",
  },
  subtitle: {
    en: "Complete a few tiny actions to protect your streak.",
    zh: "完成幾個小任務，守住你的健康連續紀錄。",
  },
  streakSafe: {
    en: "Your streak is safe. Small steps count.",
    zh: "你的連續紀錄已保護。細小一步都算數。",
  },
  recoveryMode: {
    en: "Recovery counts today. We made your quests gentler.",
    zh: "今日休息恢復都算數。我哋幫你轉做輕量任務。",
  },
  safety: {
    en: "This may need urgent help. Call 999 or go to Accident & Emergency now if symptoms are severe or urgent.",
    zh: "如果情況嚴重或緊急，請立即致電 999 或前往急症室。",
  },
  notMedicalAdvice: {
    en: "This app gives general lifestyle support, not medical diagnosis.",
    zh: "本應用提供一般生活健康支援，並非醫療診斷。",
  },
  insuranceBoundary: {
    en: "Your health logs are not used for insurance eligibility, pricing, coverage, claim outcomes, or care-access decisions.",
    zh: "你的健康紀錄不會用作保險資格、定價、保障、索償結果或醫療服務取用決定。",
  },
  lifestyleSignal: {
    en: "This looks like a lifestyle signal, not a diagnosis.",
    zh: "呢個比較似生活狀態訊號，並非診斷。",
  },
  seekHelpIfWorrying: {
    en: "Consider seeking medical help if symptoms are severe, persistent, or worrying.",
    zh: "如果症狀嚴重、持續或令你擔心，請考慮尋求醫護協助。",
  },
};

export const questTypeCopy: Record<QuestType, {
  title: LocalizedText;
  description: LocalizedText;
  actionLabel: LocalizedText;
  completedLabel: LocalizedText;
}> = {
  wake: {
    title: { en: "Wake check-in", zh: "起身打卡" },
    description: { en: "Tell Health Quest you started the day.", zh: "用一撳開始今日任務。" },
    actionLabel: { en: "I am up", zh: "我起身啦" },
    completedLabel: { en: "Morning saved", zh: "早晨已記低" },
  },
  water: {
    title: { en: "Drink water", zh: "飲一杯水" },
    description: { en: "One glass is enough to move forward.", zh: "一杯水已經可以向前行。" },
    actionLabel: { en: "Log water", zh: "記低飲水" },
    completedLabel: { en: "Water logged", zh: "飲水已記低" },
  },
  meal: {
    title: { en: "Log a meal", zh: "記低一餐" },
    description: { en: "No calorie pressure. Just mark that you ate.", zh: "唔需要卡路里壓力，只要記低食咗。" },
    actionLabel: { en: "I ate", zh: "我食咗" },
    completedLabel: { en: "Meal logged", zh: "餐點已記低" },
  },
  movement: {
    title: { en: "Move a little", zh: "郁動一下" },
    description: { en: "A short walk, stretch, or gentle movement counts.", zh: "短步行、伸展或輕量郁動都算數。" },
    actionLabel: { en: "I moved", zh: "我郁咗" },
    completedLabel: { en: "Movement counted", zh: "郁動已計算" },
  },
  mood: {
    title: { en: "Mood check", zh: "心情打卡" },
    description: { en: "Pick a simple signal. This is not a diagnosis.", zh: "揀一個簡單狀態，並非診斷。" },
    actionLabel: { en: "Check mood", zh: "記低心情" },
    completedLabel: { en: "Mood saved", zh: "心情已記低" },
  },
  toilet_optional: {
    title: { en: "Bathroom note", zh: "廁所小記" },
    description: { en: "Optional digestion and hydration context.", zh: "可選擇記低消化和補水線索。" },
    actionLabel: { en: "Add note", zh: "加小記" },
    completedLabel: { en: "Note saved", zh: "小記已保存" },
  },
  sleep_prep: {
    title: { en: "Sleep prep", zh: "睡前準備" },
    description: { en: "One tiny wind-down step for tomorrow.", zh: "一個睡前小步驟，幫明天開始。" },
    actionLabel: { en: "Prep sleep", zh: "準備休息" },
    completedLabel: { en: "Sleep prep done", zh: "睡前準備完成" },
  },
  health_review: {
    title: { en: "Evening review", zh: "晚間回顧" },
    description: { en: "Close the loop with one short health review.", zh: "用一個短回顧完成今日循環。" },
    actionLabel: { en: "Review day", zh: "回顧今日" },
    completedLabel: { en: "Review saved", zh: "回顧已保存" },
  },
  doctor_prep: {
    title: { en: "Doctor notes", zh: "醫生備忘" },
    description: { en: "Prepare questions if something feels worrying.", zh: "如有擔心，整理要問醫生的問題。" },
    actionLabel: { en: "Prepare notes", zh: "準備備忘" },
    completedLabel: { en: "Notes prepared", zh: "備忘已準備" },
  },
  recovery: {
    title: { en: "Gentle recovery", zh: "輕量恢復" },
    description: { en: "Recovery counts. Choose the easier version today.", zh: "恢復都算數。今日揀輕量版本。" },
    actionLabel: { en: "Choose recovery", zh: "轉做恢復" },
    completedLabel: { en: "Recovery counted", zh: "恢復已計算" },
  },
  learn: {
    title: { en: "Tiny lesson", zh: "一分鐘小課" },
    description: { en: "Learn one safe health idea.", zh: "學一個安全健康概念。" },
    actionLabel: { en: "Start lesson", zh: "開始小課" },
    completedLabel: { en: "Lesson complete", zh: "小課完成" },
  },
};

export const coachNotes = {
  normal: {
    en: "Small step: drink one more glass of water before lunch.",
    zh: "小步驟：午餐前可以再飲一杯水。",
  },
  recovery: {
    en: "Recovery counts today. Keep movement gentle.",
    zh: "今日恢復都算數。郁動保持輕量就好。",
  },
  protected: {
    en: "You protected your streak with small actions.",
    zh: "你用細小行動守住咗連續紀錄。",
  },
  safety: {
    en: "If symptoms feel severe or unusual, seek medical help. If this is urgent, call 999 or go to A&E now.",
    zh: "如果症狀嚴重或異常，請尋求醫護協助。如屬緊急，請立即致電 999 或去急症室。",
  },
};
