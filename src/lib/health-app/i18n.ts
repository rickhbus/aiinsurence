import type { Locale, LocalizedText } from "./types";

export const locales: Array<{ value: Locale; label: string }> = [
  { value: "zh-Hant", label: "繁體中文" },
  { value: "en", label: "English" },
];

export const ui = {
  appName: { zh: "智健導航", en: "AI Health Guide" },
  appNameFull: { zh: "AI Health Guide / 智健導航", en: "AI Health Guide / 智健導航" },
  dashboard: { zh: "儀表板", en: "Dashboard" },
  todayPlan: { zh: "今日計劃", en: "Today Plan" },
  coach: { zh: "AI 健康教練", en: "AI Health Coach" },
  track: { zh: "記錄", en: "Track" },
  running: { zh: "跑步", en: "Running" },
  walking: { zh: "步行", en: "Walking" },
  gym: { zh: "健身", en: "Gym" },
  sports: { zh: "運動", en: "Sports" },
  body: { zh: "身體指標", en: "Body Metrics" },
  sleep: { zh: "睡眠", en: "Sleep" },
  water: { zh: "飲水", en: "Water" },
  nutrition: { zh: "營養", en: "Nutrition" },
  foodLog: { zh: "飲食記錄", en: "Food Log" },
  dietPlan: { zh: "飲食計劃", en: "Diet Plan" },
  mealRecommendations: { zh: "餐單建議", en: "Meal Recommendations" },
  caloriesMacros: { zh: "卡路里與宏量", en: "Calories & Macros" },
  groceryIdeas: { zh: "購物靈感", en: "Grocery Ideas" },
  learn: { zh: "學習", en: "Learn" },
  fitnessBasics: { zh: "健身基礎", en: "Fitness Basics" },
  nutritionGuide: { zh: "營養指南", en: "Nutrition Guide" },
  exerciseLibrary: { zh: "動作庫", en: "Exercise Library" },
  conditionsEducation: { zh: "疾病教育", en: "Conditions Education" },
  hkCareGuide: { zh: "香港照護指南", en: "Hong Kong Care Guide" },
  healthcare: { zh: "醫療導航", en: "Healthcare Navigation" },
  symptomRouting: { zh: "症狀路由", en: "Symptom Routing" },
  urgentSigns: { zh: "緊急警號", en: "Urgent Signs" },
  publicPrivate: { zh: "公私營照護", en: "Public / Private Care" },
  specialistFinder: { zh: "專科方向", en: "Specialist Finder" },
  insurancePolicyHelper: { zh: "保單助手", en: "Insurance Policy Helper" },
  insurance: { zh: "保險教育", en: "Insurance Education" },
  progress: { zh: "進度", en: "Progress" },
  weeklyReport: { zh: "每週報告", en: "Weekly Report" },
  goals: { zh: "目標", en: "Goals" },
  streaks: { zh: "連續紀錄", en: "Streaks" },
  achievements: { zh: "成就", en: "Achievements" },
  trends: { zh: "趨勢", en: "Trends" },
  profile: { zh: "個人資料", en: "Profile" },
  memory: { zh: "健康記憶", en: "Health Memory" },
  preferences: { zh: "偏好", en: "Preferences" },
  medicalNotes: { zh: "醫療備註", en: "Medical Notes" },
  privacyConsent: { zh: "私隱與同意", en: "Privacy & Consent" },
  settings: { zh: "設定", en: "Settings" },
  auth: { zh: "登入", en: "Auth" },
  quickAdd: { zh: "快速新增", en: "Quick Add" },
  readMore: { zh: "閱讀更多", en: "Read more" },
  save: { zh: "保存", en: "Save" },
  dontSave: { zh: "不要保存", en: "Don’t save" },
  edit: { zh: "編輯", en: "Edit" },
  safety: { zh: "安全提示", en: "Safety" },
  why: { zh: "原因", en: "Why" },
  action: { zh: "下一步", en: "Action" },
  language: { zh: "語言", en: "Language" },
  darkMode: { zh: "深色模式", en: "Dark mode" },
  emptyState: { zh: "新增第一筆紀錄後，這裡會變成你的個人趨勢。", en: "After your first log, this becomes your personal trend." },
  loading: { zh: "載入健康資料", en: "Loading health data" },
};

export function text(value: LocalizedText, locale: Locale) {
  return locale === "zh-Hant" ? value.zh : value.en;
}

export function bilingual(value: LocalizedText) {
  return `${value.zh} / ${value.en}`;
}

export function label(value: LocalizedText, locale: Locale, showBoth = false) {
  if (showBoth) {
    return bilingual(value);
  }

  return text(value, locale);
}

export const safetyCopy = {
  zh:
    "本應用只提供健康教育、生活方式建議、健身與營養方向、香港醫療導航及一般保險教育。不診斷疾病、不處方藥物、不取代醫生或持牌保險顧問。",
  en:
    "This app provides health education, lifestyle guidance, fitness and nutrition ideas, Hong Kong care navigation, and general insurance education. It does not diagnose, prescribe, replace a clinician, or act as a licensed insurance adviser.",
};

export const emergencyCopy = {
  zh: "如有胸痛、嚴重呼吸困難、中風徵兆、嚴重過敏、失去知覺、自殺念頭或快速惡化，請立即致電 999 或前往急症室。不要等待 AI 或保險確認。",
  en: "For chest pain, severe breathing difficulty, stroke signs, severe allergic reaction, loss of consciousness, suicidal thoughts, or rapid worsening, call 999 or go to A&E now. Do not wait for AI or insurance confirmation.",
};
