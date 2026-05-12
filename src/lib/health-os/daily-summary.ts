import { HEALTH_OS_DISCLAIMERS } from "./constants";
import { collectSafetyFlags, calculateLifestyleScores } from "./scoring";
import { emergencyGuidanceZh } from "./safety";
import type { DailyHealthSummary, HealthContext } from "./types";

export function buildDailyHealthSummary(context: HealthContext): DailyHealthSummary {
  const scores = calculateLifestyleScores(context);
  const flags = collectSafetyFlags(context);
  const red = scores.safetyStatus === "red";
  const sleepMinutes = context.dailyLog?.sleepMinutes ?? context.mobileHealthSummary?.sleepMinutes ?? null;
  const sleepText = sleepMinutes ? `${Math.round(sleepMinutes / 60)} 小時` : "未記錄";
  const gymCount = context.gymWorkouts?.length ?? context.mobileHealthSummary?.workouts ?? 0;
  const nextActions = red
    ? [emergencyGuidanceZh()]
    : buildNextActions(context, scores);

  return {
    ...scores,
    summaryZh: red
      ? "今日有紅旗安全訊號，應先處理醫療或危機安全，不要等待 AI 建議。"
      : `今日睡眠 ${sleepText}，已記錄 ${context.meals?.length ?? 0} 餐、${gymCount} 次運動背景。這是生活狀態參考，不是診斷。`,
    summaryEn: red
      ? "Red-flag safety signals are present. Handle medical or crisis safety first and do not wait for AI guidance."
      : `Today includes ${sleepText} sleep, ${context.meals?.length ?? 0} meal logs, and ${gymCount} workout signals. This is lifestyle feedback, not a diagnosis.`,
    nextActions,
    disclaimers: [
      ...HEALTH_OS_DISCLAIMERS,
      ...flags.map((flag) => `Safety flag: ${flag}`),
    ],
  };
}

function buildNextActions(context: HealthContext, scores: ReturnType<typeof calculateLifestyleScores>) {
  const actions: string[] = [];

  if (scores.energyScore < 55 || (context.dailyLog?.sleepMinutes ?? 420) < 360) {
    actions.push("今日建議先降低訓練強度，選擇輕量訓練或 20 分鐘步行，並提早準備睡眠。");
  }

  if (scores.nutritionScore < 60) {
    actions.push("下一餐可考慮加入蛋白質、蔬菜和水分，避免用極端節食補償。");
  }

  if (scores.digestiveScore < 60) {
    actions.push("留意飲水、尿色、大便形態和痛楚；如嚴重或持續不適，請尋求醫護人員協助。");
  }

  if (actions.length === 0) {
    actions.push("保持一件小事：飲水、記錄一餐，或完成 5 分鐘步行。");
  }

  return actions.slice(0, 3);
}
