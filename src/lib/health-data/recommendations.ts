import { generateText } from "ai";
import { getGuideModel, getGuideRuntimeConfig } from "@/lib/ai/provider";
import { logWarn } from "@/lib/observability/logger";
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
  const needsProtein = data.today.protein_total < 90;
  const needsWater = data.today.water_total_ml < 2000;
  const sleepLow = data.today.sleep_hours > 0 && data.today.sleep_hours < 7;

  return {
    workout: {
      title: hadHardRun ? "恢復活動日" : "輕量力量訓練",
      summary: hadHardRun
        ? "昨日或近期跑步強度偏高，今日先維持活動但避免加跑量。"
        : "用 25-35 分鐘全身或上身力量訓練，保持穩定節奏。",
      reason: hadHardRun
        ? "安全進步比短期加量重要，RPE 高後需要恢復。"
        : "近期紀錄仍可建立基本力量與活動一致性。",
      action: hadHardRun
        ? "步行 20 分鐘，加 8-10 分鐘伸展。"
        : "完成 4 個動作，每個 2-3 組，RPE 6-7。",
    },
    nutrition: {
      title: needsProtein ? "午餐加一份蛋白質" : "維持均衡餐盤",
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
    recovery: {
      title: sleepLow ? "今晚優先睡眠一致性" : needsWater ? "補水節奏" : "保留恢復窗口",
      summary: sleepLow
        ? "睡眠不足會影響食慾、恢復和訓練表現。"
        : needsWater
          ? "香港天氣濕熱，飲水不足會拖低恢復感。"
          : "今天不需要把所有目標都推到最大。",
      reason: sleepLow
        ? `昨晚約 ${data.today.sleep_hours} 小時，先改善一致性。`
        : needsWater
          ? `今日飲水約 ${data.today.water_total_ml}ml，仍可分段補足。`
          : "可持續習慣來自穩定而不是極端。",
      action: sleepLow
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
