import { estimateWorkoutVolume, HEALTH_OS_DISCLAIMERS } from "./constants";
import { detectGymSafetyFlags, emergencyGuidanceZh } from "./safety";
import type { GymAnalysis, GymWorkoutContext } from "./types";

export function analyzeGymWorkout(workout: GymWorkoutContext): GymAnalysis {
  const safety = detectGymSafetyFlags(workout);
  const flags = [
    ...safety.emergencyFlags,
    ...(safety.movementPain ? ["movement_pain_flag"] : []),
  ];

  if (safety.emergencyFlags.length > 0) {
    return {
      workoutSummary: "訓練中出現紅旗訊號，應先停止訓練並處理安全。",
      progressionInsight: "今日不建議追求加重量、加次數或完成訓練。",
      recoveryRecommendation: emergencyGuidanceZh(),
      nutritionLink: "安全穩定後才考慮飲食與補水；如症狀持續，請先求醫。",
      moodLink: "先找身邊可信任的人協助，不要獨自硬撐。",
      nextWorkoutSuggestion: "待醫護人員確認安全後，再由輕量活動重新開始。",
      safetyFlags: flags,
      safetyStatus: "red",
      disclaimers: HEALTH_OS_DISCLAIMERS,
    };
  }

  const poorSleep = (workout.sleepMinutes ?? 420) < 360;
  const highSoreness = (workout.sorenessBefore ?? workout.sorenessAfter ?? 0) >= 7;
  const highStressLowEnergy = (workout.stressScore ?? 0) >= 7 || (workout.energyBefore ?? 10) <= 4;
  const volume = estimateWorkoutVolume(workout);
  const intensity = workout.intensity ?? averageRpe(workout);

  if (poorSleep && highSoreness) {
    flags.push("poor_sleep_high_soreness");
  }

  if (highStressLowEnergy) {
    flags.push("high_stress_low_energy");
  }

  return {
    workoutSummary: `完成 ${workout.workoutType ?? "健身訓練"}，估算訓練容量約 ${Math.round(volume).toLocaleString()} kg。`,
    progressionInsight: intensity >= 8
      ? "今次強度偏高，下次只在姿勢穩定和恢復足夠時，選一個動作小幅增加重量或次數。"
      : "強度屬可控範圍；下次可在一個主要動作增加 1 次重複或 2.5kg。",
    recoveryRecommendation: poorSleep || highSoreness
      ? "你今日睡眠或酸痛狀態不理想，建議選擇較輕量、步行或伸展恢復。"
      : "保持補水、正常進食和睡眠，讓身體有時間適應訓練。",
    nutritionLink: "為健身恢復，可考慮在正餐加入蛋白質、碳水和水分；這不是醫療營養診斷。",
    moodLink: highStressLowEnergy
      ? "壓力高或能量低時，把訓練目標縮小會較安全，例如只完成熱身和兩個動作。"
      : "訓練後留意心情變化，記錄 mood after 可幫助調整下次強度。",
    nextWorkoutSuggestion: highSoreness
      ? "下一次可訓練其他肌群，或改做 Recovery / Mobility。"
      : "下一次可沿用同一模板，保持 RPE 6-8，避免硬推至痛楚。",
    safetyFlags: flags,
    safetyStatus: flags.length > 0 ? "yellow" : "green",
    disclaimers: HEALTH_OS_DISCLAIMERS,
  };
}

function averageRpe(workout: GymWorkoutContext) {
  const values = (workout.sets ?? [])
    .map((set) => set.rpe)
    .filter((value): value is number => typeof value === "number");

  if (values.length === 0) {
    return 5;
  }

  return values.reduce((total, value) => total + value, 0) / values.length;
}
