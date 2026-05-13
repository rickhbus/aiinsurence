import { generateText } from "ai";
import { getGuideModel, getGuideRuntimeConfig } from "@/lib/ai/provider";
import { logWarn } from "@/lib/observability/logger";
import { toNumber } from "./common";
import {
  assertUserId,
  throwIfSupabaseError,
  type HealthDataClient,
} from "./common";
import {
  EMERGENCY_COPY_ZH,
  MEDICAL_DISCLAIMER_ZH,
  type CoachResponse,
  type DashboardData,
  type TodayRecommendation,
} from "./types";

export async function getCachedTodayRecommendation(
  supabase: HealthDataClient,
  userId: string,
  dateKey: string,
) {
  assertUserId(userId);

  const { data, error } = await supabase
    .from("ai_daily_recommendations")
    .select("recommendation,created_at,updated_at")
    .eq("user_id", userId)
    .eq("recommendation_date", dateKey)
    .maybeSingle();

  throwIfSupabaseError(error, "load daily recommendation");

  return data?.recommendation as TodayRecommendation | null;
}

export async function upsertTodayRecommendation(
  supabase: HealthDataClient,
  userId: string,
  dateKey: string,
  recommendation: TodayRecommendation,
) {
  assertUserId(userId);

  const { error } = await supabase.from("ai_daily_recommendations").upsert(
    {
      user_id: userId,
      recommendation_date: dateKey,
      recommendation,
    },
    { onConflict: "user_id,recommendation_date" },
  );

  throwIfSupabaseError(error, "save daily recommendation");
}

export function buildTodayRecommendation(data: DashboardData): TodayRecommendation {
  const hadHardRun = data.recent.running.some((run) => (run.rpe ?? 0) >= 7);
  const hadExerciseCheckin = data.recent.checkins.some((entry) => entry.checkin_type === "exercise");
  const hadWakeCheckin = data.recent.checkins.some((entry) => entry.checkin_type === "wake_up");
  const mealCheckins = data.recent.checkins.filter((entry) => entry.checkin_type === "meal").length;
  const needsProtein = data.today.protein_total < 90;
  const needsWater = data.today.water_total_ml < 2000;
  const sleepLow = data.today.sleep_hours > 0 && data.today.sleep_hours < 7;

  return {
    workout: {
      title: hadHardRun ? "恢復活動日" : hadExerciseCheckin ? "完成後恢復" : "10 分鐘起動",
      summary: hadHardRun
        ? "昨日或近期跑步強度偏高，今日先維持活動但避免加跑量。"
        : hadExerciseCheckin
          ? "你已經完成運動打卡，接下來重點是補水、伸展和觀察恢復。"
        : "用 25-35 分鐘全身或上身力量訓練，保持穩定節奏。",
      reason: hadHardRun
        ? "安全進步比短期加量重要，RPE 高後需要恢復。"
        : hadExerciseCheckin
          ? "完成運動後，恢復質素會影響下一次訓練表現。"
        : "近期紀錄仍可建立基本力量與活動一致性。",
      action: hadHardRun
        ? "步行 20 分鐘，加 8-10 分鐘伸展。"
        : hadExerciseCheckin
          ? "飲 250-500ml 水，做 5 分鐘輕鬆伸展。"
        : "完成 4 個動作，每個 2-3 組，RPE 6-7。",
    },
    nutrition: {
      title: needsProtein
        ? mealCheckins > 0 ? "下一餐補蛋白質" : "先記錄第一餐加蛋白質"
        : "維持均衡餐盤",
      summary: needsProtein
        ? "今日蛋白質仍有空間，可以用香港日常食物簡單補足。"
        : "今天營養節奏不錯，重點是避免高糖飲品和過油醬汁。",
      reason: needsProtein
        ? `目前約 ${data.today.protein_total}g 蛋白質，距離穩定目標仍有距離。`
        : "你的蛋白質和總能量紀錄已經有基本支撐。",
      action: needsProtein
        ? "午餐加入雞蛋、魚、雞肉、豆腐或希臘乳酪。"
        : "保持半碗至一碗主食、足量蔬菜和一掌心蛋白質。",
    },
    foodGaps: buildFoodGaps(data),
    recovery: {
      title: !hadWakeCheckin ? "起床後先建立節奏" : sleepLow ? "今晚優先睡眠一致性" : needsWater ? "補水節奏" : "保留恢復窗口",
      summary: !hadWakeCheckin
        ? "先完成起床打卡，讓今日建議從簡單節奏開始。"
        : sleepLow
        ? "睡眠不足會影響食慾、恢復和訓練表現。"
        : needsWater
          ? "香港天氣濕熱，飲水不足會拖低恢復感。"
          : "今天不需要把所有目標都推到最大。",
      reason: !hadWakeCheckin
        ? "每天第一個小動作比一次過追蹤所有數字更容易持續。"
        : sleepLow
        ? `昨晚約 ${data.today.sleep_hours} 小時，先改善一致性。`
        : needsWater
          ? `今日飲水約 ${data.today.water_total_ml}ml，仍可分段補足。`
          : "可持續習慣來自穩定而不是極端。",
      action: !hadWakeCheckin
        ? "按一次起床打卡，然後飲 250ml 水。"
        : sleepLow
        ? "睡前 15 分鐘放低手機，明早記錄精神狀態。"
        : needsWater
          ? "未來兩小時分兩次各飲 250ml。"
          : "安排 10 分鐘輕鬆步行或拉伸。",
    },
    learning: {
      title: "漸進超負荷",
      summary: "每次只微調一個變量，例如重量、次數或組數。",
      action: "今天選一個動作，比上次多 1 次重複即可。",
    },
    safetyNote: "如有胸痛、嚴重呼吸困難、頭暈、尖銳痛楚或症狀惡化，請停止活動並尋求醫療協助。",
  };
}

export function buildFoodGaps(data: DashboardData): TodayRecommendation["foodGaps"] {
  const meals = data.recent.meals;
  const mealText = meals.map((meal) => `${meal.food_name} ${meal.notes ?? ""}`).join(" ");
  const fiberTotal = meals.reduce((total, meal) => total + toNumber(meal.fiber_g), 0);
  const hasVegetableOrFruit = /菜|蔬|水果|果|豆|菇|salad|vegetable|fruit|beans|tofu/i.test(mealText);
  const gaps: TodayRecommendation["foodGaps"] = [];
  const safetyNote = "這只是食物記錄模式教育，不是營養、維他命或醫療診斷；如擔心營養狀態，請用化驗或醫護／註冊營養師確認。";

  if (data.today.protein_total < 70) {
    gaps.push({
      title: "蛋白質食物來源可能較少記錄",
      summary: "可能較少記錄某類食物來源：魚、蛋、雞肉、豆腐、豆類或乳製品。",
      reason: `今日蛋白質紀錄約 ${data.today.protein_total}g，這只反映已保存的食物紀錄。`,
      action: "下一餐可先加入一掌心蛋白質食物，並繼續用相片或文字確認實際吃了甚麼。",
    });
  }

  if (meals.length === 0 || (!hasVegetableOrFruit && fiberTotal < 12)) {
    gaps.push({
      title: "蔬果、豆類或全穀來源可能較少記錄",
      summary: "可能較少記錄某類食物來源：深色蔬菜、水果、豆類、菇類或全穀主食。",
      reason: meals.length === 0
        ? "今日未有完整餐點紀錄，系統不會推斷你真正吃少了甚麼。"
        : `今日已記錄纖維約 ${Math.round(fiberTotal)}g，並未見明確蔬果或豆類文字。`,
      action: "下一餐可加一份蔬菜或水果；如有長期症狀或擔心營養狀態，請用化驗或專業評估確認。",
    });
  }

  if (gaps.length === 0) {
    gaps.push({
      title: "暫未見明顯食物來源空白",
      summary: "可能較少記錄某類食物來源的提示會隨更多餐點、相片和文字紀錄更新。",
      reason: "現有紀錄已有基本蛋白質和植物性食物線索，但仍不是完整營養評估。",
      action: "保持每餐記錄主食、蛋白質、蔬菜和飲品；需要精準判斷時請用化驗或專業人士確認。",
    });
  }

  return gaps.map((gap) => ({
    ...gap,
    reason: `${gap.reason} ${safetyNote}`,
  })).slice(0, 2);
}

export async function buildCoachResponse({
  message,
  dashboardData,
}: {
  message: string;
  dashboardData: DashboardData;
}): Promise<CoachResponse> {
  const redFlag = containsEmergencySignal(message);

  if (redFlag) {
    return {
      answer: EMERGENCY_COPY_ZH,
      reason: "你的訊息可能包含危急警號，系統會先處理安全。",
      nextStep: "請立即致電 999 或前往急症室，不要等待 AI 或保險確認。",
      safetyNote: MEDICAL_DISCLAIMER_ZH,
      category: "healthcare",
      memorySuggestion: null,
    };
  }

  const deterministic = buildDeterministicCoachResponse(message, dashboardData);
  const config = getGuideRuntimeConfig();

  if (!config.isConfigured) {
    return deterministic;
  }

  try {
    const { text } = await generateText({
      model: getGuideModel(config),
      system: [
        "You are a safe Hong Kong AI health coach.",
        "Do not diagnose, prescribe, recommend insurance products, or guarantee claims.",
        "Use Traditional Chinese by default.",
        "Give one practical next action, a reason, and a safety note.",
        "Do not save memory; only suggest memory if the user explicitly states a preference.",
      ].join("\n"),
      prompt: [
        `User message: ${message}`,
        `Today score: ${dashboardData.today.health_score}`,
        `Protein: ${dashboardData.today.protein_total}g`,
        `Water: ${dashboardData.today.water_total_ml}ml`,
        `Sleep: ${dashboardData.today.sleep_hours}h`,
        `Running this week: ${dashboardData.weekly.running_distance_km}km`,
        "Write concise coaching copy only.",
      ].join("\n"),
      temperature: 0.2,
      maxOutputTokens: 320,
      maxRetries: 1,
      timeout: { totalMs: 8000 },
    });

    return {
      ...deterministic,
      answer: text.trim().slice(0, 1600) || deterministic.answer,
    };
  } catch (error) {
    logWarn("AI coach generation failed", {
      route: "/api/coach",
      status: error instanceof Error ? error.message : "unknown",
    });
    return deterministic;
  }
}

function buildDeterministicCoachResponse(
  message: string,
  dashboardData: DashboardData,
): CoachResponse {
  const lower = message.toLowerCase();
  const category = lower.includes("保險")
    ? "insurance"
    : lower.includes("食") || lower.includes("protein") || lower.includes("meal")
      ? "nutrition"
      : lower.includes("痛") || lower.includes("醫")
        ? "healthcare"
        : lower.includes("learn") || lower.includes("學")
          ? "learning"
          : "fitness";

  const recommendation = dashboardData.recommendation;

  if (category === "insurance") {
    return {
      answer: "可以。我會先幫你理解保障類型、索償文件和要問保險公司的問題，但不會推薦特定產品或保證索償。",
      reason: "保險問題需要區分一般教育、保單條款和持牌中介意見。",
      nextStep: "貼上你想理解的一小段條款，或選擇住院、門診、危疾、意外其中一類。",
      safetyNote: "本內容只屬一般保險教育，並非保險、法律或財務建議，亦不保證索償結果。",
      category,
      memorySuggestion: null,
    };
  }

  return {
    answer: `${recommendation.workout.summary} ${recommendation.nutrition.summary}`,
    reason: `${recommendation.workout.reason} ${recommendation.nutrition.reason}`,
    nextStep: recommendation.workout.action,
    safetyNote: recommendation.safetyNote,
    category,
    memorySuggestion: inferMemorySuggestion(message),
  };
}

function inferMemorySuggestion(message: string): CoachResponse["memorySuggestion"] {
  if (!/(偏好|鍾意|喜歡|prefer|goal|目標|少糖|高蛋白)/iu.test(message)) {
    return null;
  }

  return {
    shouldSuggest: true,
    category: /食|糖|蛋白|nutrition|meal/iu.test(message) ? "nutrition" : "behavior",
    content: message.slice(0, 180),
  };
}

function containsEmergencySignal(message: string) {
  return /(胸痛|胸口痛|嚴重呼吸困難|中風|昏迷|嚴重出血|嚴重過敏|自殺|自殘|chest pain|stroke|suicidal|severe bleeding|anaphylaxis)/iu.test(
    message,
  );
}
