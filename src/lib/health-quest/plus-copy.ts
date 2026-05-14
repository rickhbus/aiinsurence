import type { LocalizedText, QuestLocale } from "./types";
import { questText } from "./play-system";

export type PlusTier = "free" | "plus" | "pro" | "family";

export const plusTierCopy: Record<PlusTier, { title: LocalizedText; features: LocalizedText[] }> = {
  free: {
    title: { zh: "免費路線", en: "Free path" },
    features: [
      { zh: "每日路線", en: "Daily path" },
      { zh: "基本連續紀錄與 XP", en: "Basic streak and XP" },
      { zh: "安全指引與恢復模式", en: "Safety guidance and recovery mode" },
    ],
  },
  plus: {
    title: { zh: "智健 Plus", en: "Health Quest Plus" },
    features: [
      { zh: "自訂路線", en: "Custom path" },
      { zh: "更多連續紀錄保護", en: "Extra streak freezes" },
      { zh: "無限練習與更多主題", en: "Unlimited practice and more themes" },
    ],
  },
  pro: {
    title: { zh: "智健 Pro", en: "Health Quest Pro" },
    features: [
      { zh: "醫生摘要匯出", en: "Doctor summary export" },
      { zh: "進階趨勢", en: "Advanced trends" },
      { zh: "30/90 日報告", en: "30/90-day report" },
    ],
  },
  family: {
    title: { zh: "家庭方案", en: "Family" },
    features: [
      { zh: "家庭圈", en: "Family circle" },
      { zh: "家庭挑戰", en: "Family challenges" },
      { zh: "照顧者摘要", en: "Caregiver summaries" },
    ],
  },
};

export function shouldShowPlusUpsell(context: {
  mode?: "normal" | "recovery" | "safety";
  safetyLevel?: "normal" | "caution" | "urgent";
  moment: "weekly_review" | "advanced_trends" | "custom_paths" | "unlimited_review" | "doctor_export" | "family_features";
}) {
  if (context.mode === "safety" || context.safetyLevel === "urgent") {
    return false;
  }

  return true;
}

export function plusFeatureText(tier: PlusTier, locale: QuestLocale) {
  return plusTierCopy[tier].features.map((feature) => questText(feature, locale));
}

