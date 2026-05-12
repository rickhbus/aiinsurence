import { HEALTH_OS_DISCLAIMERS } from "./constants";
import type { HydrationAnalysis, HydrationContext } from "./types";

export function analyzeHydration(input: HydrationContext): HydrationAnalysis {
  const water = input.waterMl ?? 0;
  const caffeine = input.caffeineMg ?? 0;
  const alcohol = input.alcoholUnits ?? 0;
  const safetyStatus = alcohol >= 3 ? "yellow" : "green";

  return {
    summary: `今次記錄：水 ${water}ml，咖啡因約 ${caffeine}mg，酒精約 ${alcohol} units。`,
    sleepMoodHint: caffeine > 200 || alcohol > 0
      ? "咖啡因或酒精可能影響睡眠、心情和恢復；較後時間可考慮減量。"
      : "補水有助能量、消化和運動恢復，但不代表醫療治療。",
    nextAction: water > 0
      ? "今日餘下時間可分段補水，避免一次過大量飲水。"
      : "可以先加 250-500ml 水，再觀察口渴和尿色。",
    safetyStatus,
    disclaimers: HEALTH_OS_DISCLAIMERS,
  };
}
