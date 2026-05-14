import type { LocalizedText } from "./types";

export type HealthQuestAchievement = {
  slug: string;
  title: LocalizedText;
  description: LocalizedText;
  icon: string;
};

export const healthQuestAchievements: HealthQuestAchievement[] = [
  { slug: "first-step", title: { zh: "第一步", en: "First Step" }, description: { zh: "完成第一個小任務。", en: "Complete the first tiny quest." }, icon: "sparkles" },
  { slug: "three-day-streak", title: { zh: "3 日連續", en: "3-Day Streak" }, description: { zh: "連續 3 日有小步。", en: "Keep a 3-day streak." }, icon: "flame" },
  { slug: "seven-day-streak", title: { zh: "7 日連續", en: "7-Day Streak" }, description: { zh: "連續 7 日有小步。", en: "Keep a 7-day streak." }, icon: "flame" },
  { slug: "hydration-starter", title: { zh: "補水起步", en: "Hydration Starter" }, description: { zh: "完成補水任務。", en: "Complete a hydration quest." }, icon: "droplets" },
  { slug: "mood-checker", title: { zh: "心情打卡", en: "Mood Checker" }, description: { zh: "完成心情打卡。", en: "Complete a mood check-in." }, icon: "smile" },
  { slug: "recovery-counts", title: { zh: "恢復都算數", en: "Recovery Counts" }, description: { zh: "選擇輕量恢復。", en: "Choose gentle recovery." }, icon: "heart" },
  { slug: "lesson-learner", title: { zh: "小課學習者", en: "Lesson Learner" }, description: { zh: "完成一個健康小課。", en: "Complete one health lesson." }, icon: "book" },
  { slug: "doctor-prep-ready", title: { zh: "就診準備完成", en: "Doctor Prep Ready" }, description: { zh: "準備一條問題。", en: "Prepare one question." }, icon: "stethoscope" },
  { slug: "privacy-protector", title: { zh: "私隱守護者", en: "Privacy Protector" }, description: { zh: "檢查分享設定。", en: "Review sharing settings." }, icon: "shield" },
  { slug: "family-supporter", title: { zh: "家庭支援者", en: "Family Supporter" }, description: { zh: "完成家庭安全進度。", en: "Complete safe family progress." }, icon: "users" },
];

export function unlockAchievementOnce(existingSlugs: string[], slug: string) {
  if (existingSlugs.includes(slug)) {
    return { unlockedNow: false, slugs: existingSlugs };
  }

  return { unlockedNow: true, slugs: [...existingSlugs, slug] };
}

