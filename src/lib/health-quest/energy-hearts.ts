import type { AdaptiveQuestPlan, EnergyBattery, LocalizedText, QuestDifficulty } from "./types";

export type EnergyHeartState = {
  hearts: number;
  intensity: "normal" | "easy" | "tiny" | "recovery";
  recommendedDifficulty: QuestDifficulty;
  recoverySuggested: boolean;
  label: LocalizedText;
  note: LocalizedText;
};

export function deriveEnergyHearts(input: {
  battery?: EnergyBattery | null;
  adaptivePlan?: AdaptiveQuestPlan | null;
  mode?: "normal" | "recovery" | "safety";
}): EnergyHeartState {
  if (input.mode === "safety") {
    return {
      hearts: 0,
      intensity: "recovery",
      recommendedDifficulty: "tiny",
      recoverySuggested: true,
      label: { zh: "安全優先", en: "Safety first" },
      note: { zh: "先處理安全指引；能量不作限制。", en: "Follow safety guidance first; energy never blocks help." },
    };
  }

  const batteryScore = typeof input.battery?.score === "number" ? input.battery.score : 7;
  const planRecovery = input.adaptivePlan?.recoveryModeRecommended === true || input.mode === "recovery";
  const hearts = clampHearts(Math.ceil(batteryScore / 2));

  if (planRecovery || hearts === 0) {
    return {
      hearts,
      intensity: "recovery",
      recommendedDifficulty: "tiny",
      recoverySuggested: true,
      label: { zh: "恢復能量", en: "Recovery energy" },
      note: { zh: "今日可以做最細任務。恢復都算數。", en: "Today can be tiny. Recovery counts." },
    };
  }

  if (hearts <= 2) {
    return {
      hearts,
      intensity: "tiny",
      recommendedDifficulty: "tiny",
      recoverySuggested: true,
      label: { zh: "低能量", en: "Low energy" },
      note: { zh: "改做一個不勉強的小步。恢復都算數。", en: "Switch to one tiny no-pressure step. Recovery counts." },
    };
  }

  if (hearts <= 4) {
    return {
      hearts,
      intensity: "easy",
      recommendedDifficulty: "easy",
      recoverySuggested: false,
      label: { zh: "輕量路線", en: "Easy path" },
      note: { zh: "任務會保持短而簡單。", en: "Quests stay short and simple." },
    };
  }

  return {
    hearts: 5,
    intensity: "normal",
    recommendedDifficulty: "normal",
    recoverySuggested: false,
    label: { zh: "今日能量", en: "Today energy" },
    note: { zh: "正常路線已準備好。", en: "Your normal path is ready." },
  };
}

export function applyEnergyToAdaptivePlan(plan: AdaptiveQuestPlan, energy: EnergyHeartState): AdaptiveQuestPlan {
  if (energy.intensity === "normal") {
    return plan;
  }

  return {
    ...plan,
    difficulty: energy.recommendedDifficulty,
    minimumRequiredQuests: energy.intensity === "recovery" ? 1 : Math.min(plan.minimumRequiredQuests, 2),
    maxDailyQuests: energy.intensity === "recovery" ? Math.min(plan.maxDailyQuests, 3) : Math.min(plan.maxDailyQuests, 4),
    recoveryModeRecommended: plan.recoveryModeRecommended || energy.recoverySuggested,
    adaptationReasons: Array.from(new Set([...plan.adaptationReasons, "low_energy"])),
  };
}

function clampHearts(value: number) {
  return Math.max(0, Math.min(5, value));
}
