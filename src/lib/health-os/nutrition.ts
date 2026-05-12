import { HEALTH_OS_DISCLAIMERS, NUTRITION_DISCLAIMER } from "./constants";
import type { FoodAnalysis, MealContext } from "./types";

export function analyzeMeal(input: MealContext): FoodAnalysis {
  const safetyFlags = [];

  if (input.alcoholUnits && input.alcoholUnits > 2) {
    safetyFlags.push("higher_alcohol_intake");
  }

  if (input.highSugarFlag) {
    safetyFlags.push("high_sugar_flag");
  }

  if (input.highSodiumFlag) {
    safetyFlags.push("high_sodium_flag");
  }

  const macros = [
    input.proteinG != null ? `${input.proteinG}g protein` : null,
    input.carbsG != null ? `${input.carbsG}g carbs` : null,
    input.fatG != null ? `${input.fatG}g fat` : null,
  ].filter(Boolean).join(", ");

  return {
    summary: input.hasImage
      ? "已收到相片上載介面輸入，但真實影像分析仍待供應商實作；暫時只會根據你輸入的文字和數值作粗略整理。"
      : `這餐粗略估算為 ${input.estimatedCalories ?? "未填"} kcal${macros ? `，${macros}` : ""}。`,
    estimated: true,
    imageAnalysisPending: Boolean(input.hasImage),
    recoveryNote: (input.proteinG ?? 0) >= 20
      ? "蛋白質估算有助健身恢復；仍需配合睡眠和總能量。"
      : "如今日有訓練，可考慮在下一餐加入蛋白質來源。",
    hydrationNote: input.caffeineMg && input.caffeineMg > 200
      ? "咖啡因偏高可能影響睡眠或焦慮感，較後時間可考慮減量。"
      : "如今日尿色偏深或有運動出汗，記得補水。",
    digestionNote: (input.fiberG ?? 0) >= 6
      ? "纖維估算較好，可留意腸胃反應和飲水。"
      : "可考慮加入蔬菜、水果或全穀類，幫助飽足和消化。",
    safetyFlags,
    disclaimers: [NUTRITION_DISCLAIMER, ...HEALTH_OS_DISCLAIMERS],
  };
}
