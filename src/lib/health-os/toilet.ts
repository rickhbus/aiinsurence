import { HEALTH_OS_DISCLAIMERS } from "./constants";
import { detectToiletSafety } from "./safety";
import type { ToiletAnalysis, ToiletContext } from "./types";

export function analyzeToiletLog(input: ToiletContext): ToiletAnalysis {
  const safety = detectToiletSafety(input);

  if (safety.status === "red") {
    return {
      summary: "紀錄中有腸胃或泌尿紅旗訊號。",
      hydrationHint: input.dehydrationConcern ? "如有頭暈、混亂或明顯脫水，應盡快求醫。" : "先保持安全，補水不應延誤求醫。",
      safetyFlag: safety.flags[0] ?? "red_flag",
      safetyStatus: "red",
      nextAction: "建議你考慮即日醫療評估；如有嚴重痛楚、昏厥、混亂、大量出血或快速惡化，請立即致電 999 或前往急症室。",
      disclaimers: HEALTH_OS_DISCLAIMERS,
    };
  }

  const stoolText = input.stoolType ? `大便形態 ${input.stoolType}/7` : "未有大便形態";

  return {
    summary: `${input.bowelMovement ? "今日有大便紀錄" : "今日未記錄大便"}，${stoolText}，尿色為 ${input.urineColor ?? "未知"}。`,
    hydrationHint: input.urineColor === "dark_yellow"
      ? "尿色偏深可能和水分不足有關，可考慮分段補水並觀察。"
      : "保持分段飲水，留意尿色、痛楚和持續症狀。",
    safetyFlag: safety.flags[0] ?? null,
    safetyStatus: safety.status,
    nextAction: safety.status === "yellow"
      ? "如痛楚、發燒或不適持續，建議向醫護人員查詢。"
      : "繼續觀察趨勢，不需要把單日紀錄過度醫療化。",
    disclaimers: HEALTH_OS_DISCLAIMERS,
  };
}
