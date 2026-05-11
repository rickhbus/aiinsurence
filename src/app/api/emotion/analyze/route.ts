import { trackServerEvent } from "@/lib/analytics/events";
import { classifyEmotion } from "@/lib/emotion-engine/classifier";
import { emotionAnalysisInputSchema } from "@/lib/emotion-engine/validators";
import { saveEmotionAnalysis } from "@/lib/gbl/persistence";
import { hashUserId, logError } from "@/lib/observability/logger";
import { readValidatedJson } from "@/lib/server/persistence-auth";
import {
  checkIpRateLimit,
  checkUserAiRateLimit,
  getRequestIp,
  recordAiUsageEvent,
} from "@/lib/server/rate-limit";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  const parsed = await readValidatedJson(request, emotionAnalysisInputSchema);

  if (!parsed.ok) {
    return parsed.response;
  }

  const supabase = await createClient();
  const { data } = supabase
    ? await supabase.auth.getUser()
    : { data: { user: null } };
  const user = data.user;

  if (supabase && user) {
    const limit = await checkUserAiRateLimit({
      supabase,
      userId: user.id,
      route: "/api/emotion/analyze",
      dailyLimit: 60,
    });

    if (!limit.allowed) {
      return Response.json(
        { error: limit.message, requestId },
        {
          status: 429,
          headers: { "Retry-After": String(limit.retryAfterSeconds) },
        },
      );
    }
  } else {
    const limit = checkIpRateLimit({
      ip: getRequestIp(request),
      route: "/api/emotion/analyze",
      limit: 12,
      windowMs: 24 * 60 * 60 * 1000,
    });

    if (!limit.allowed) {
      return Response.json(
        { error: limit.message, requestId },
        {
          status: 429,
          headers: { "Retry-After": String(limit.retryAfterSeconds) },
        },
      );
    }
  }

  try {
    const result = classifyEmotion(parsed.data, requestId);
    let persisted = false;
    let id: string | undefined;

    if (supabase && user && parsed.data.save) {
      id = await saveEmotionAnalysis({
        supabase,
        userId: user.id,
        caseId: parsed.data.caseId,
        result,
      });
      persisted = true;

      void trackServerEvent({
        supabase,
        userId: user.id,
        event: "emotion_analysis_created",
        metadata: {
          primaryEmotion: result.primary_emotion,
          urgency: result.urgency_level,
        },
      });

      await recordAiUsageEvent({
        supabase,
        userId: user.id,
        route: "/api/emotion/analyze",
        feature: "emotion_engine",
        status: "generated",
        inputTokensEstimate: Math.ceil(parsed.data.text.length / 4),
        outputTokensEstimate: Math.ceil(result.user_visible_summary.length / 4),
      });
    }

    return Response.json({ ...result, id, persisted, requestId });
  } catch (error) {
    logError("Emotion Engine analysis failed", {
      route: "/api/emotion/analyze",
      status: "failed",
      error,
      requestId,
      userHash: hashUserId(user?.id),
    });

    return Response.json(
      {
        error: "Emotion Engine is temporarily unavailable. Please try again later.",
        requestId,
      },
      { status: 500 },
    );
  }
}
