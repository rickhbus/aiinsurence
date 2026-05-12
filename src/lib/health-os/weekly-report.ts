import { HEALTH_OS_DISCLAIMERS } from "./constants";
import { buildDailyHealthSummary } from "./daily-summary";
import type { HealthContext, WeeklyReport } from "./types";

export function buildWeeklyReport(contexts: HealthContext[]): WeeklyReport {
  const summaries = contexts.map((context) => buildDailyHealthSummary(context));
  const average = (key: keyof Pick<typeof summaries[number], "energyScore" | "recoveryScore" | "nutritionScore" | "stressScore" | "movementScore" | "digestiveScore">) =>
    summaries.length
      ? Math.round(summaries.reduce((total, summary) => total + summary[key], 0) / summaries.length)
      : 0;
  const safetyFlags = summaries.filter((summary) => summary.safetyStatus !== "green").length;

  return {
    overview: `本週生活狀態參考：能量 ${average("energyScore")}、恢復 ${average("recoveryScore")}、營養 ${average("nutritionScore")}、活動 ${average("movementScore")}。`,
    trends: [
      `壓力參考分 ${average("stressScore")}，分數越高代表壓力負荷較低。`,
      `消化與補水參考分 ${average("digestiveScore")}。`,
      `已整理 ${summaries.length} 天紀錄。`,
    ],
    warnings: safetyFlags > 0
      ? [`本週有 ${safetyFlags} 天出現安全或紅旗提示，建議整理給醫護人員。`]
      : ["未見紅旗安全提示，但持續或嚴重症狀仍應求醫。"],
    nextWeekActions: [
      "選一個固定早上或晚上 check-in 時間。",
      "安排 2-3 次可恢復的運動，不用每次追求最高強度。",
      "每日至少記錄一餐和一次補水，讓趨勢更可靠。",
    ],
    doctorPrep: safetyFlags > 0 ? "可輸出就診摘要：時間線、症狀/不適、睡眠、飲食、運動和紅旗提示。" : null,
    gymAdjustment: average("recoveryScore") < 60
      ? "下週先減少高強度組數，增加恢復或步行日。"
      : "下週可保守地在一個動作增加一小步。",
    disclaimers: HEALTH_OS_DISCLAIMERS,
  };
}
