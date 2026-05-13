import {
  HEALTH_OS_DISCLAIMERS,
  INSURANCE_EDUCATION_DISCLAIMER,
  SUPPLEMENT_EDUCATION_DISCLAIMER,
  SUPPLEMENT_EDUCATION_DISCLAIMER_EN,
} from "./constants";
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
      "每日一撳：起身、食咗、飲水、心情或郁咗。",
      "如有不適，記錄類別；嚴重情況請即刻打 999 或去急症室。",
    ],
    scheduleActions: [
      "下星期揀 3 日固定做早上 check-in。",
      "每晚用 1 分鐘回看今日有冇食、飲水、郁動和不適。",
      "覆診前一日整理時間線、相片和要問醫生的問題。",
    ],
    nutritionEducation: "紀錄可用來學習飲食、補水、睡眠和恢復模式；這不是營養診斷或餐單處方。",
    supplementEducation: `${SUPPLEMENT_EDUCATION_DISCLAIMER} ${SUPPLEMENT_EDUCATION_DISCLAIMER_EN}`,
    insuranceEducation: [
      "可學習保障類別和文件準備，但不要用紀錄判斷承保、保障、保費、賠償或索償結果。",
      "可準備保單、收據、醫生報告、檢查結果和健康時間線，並向持牌專業人士查詢。",
      INSURANCE_EDUCATION_DISCLAIMER,
    ],
    familySummary: safetyFlags > 0
      ? "屋企人可看到高層次狀態：本週有安全提示，建議協助準備就醫資料。"
      : "屋企人可看到高層次狀態：本週有日常紀錄，可繼續鼓勵簡單打卡。",
    doctorPrep: safetyFlags > 0 ? "可輸出就診摘要：時間線、症狀/不適、睡眠、飲食、運動和紅旗提示。" : null,
    gymAdjustment: average("recoveryScore") < 60
      ? "運動教育：恢復不足時，可考慮和合資格專業人士討論降低強度或增加步行/休息日。"
      : "運動教育：保持保守、循序漸進；如有痛楚、胸痛、嚴重頭暈或呼吸困難應停止並求助。",
    disclaimers: HEALTH_OS_DISCLAIMERS,
  };
}
