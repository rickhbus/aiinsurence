import { trackServerEvent } from "@/lib/analytics/events";
import { runGblAnalysis } from "@/lib/gbl/engine";
import { saveGblAnalysis } from "@/lib/gbl/persistence";
import { gblAnalysisInputSchema } from "@/lib/gbl/validators";
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
  const parsed = await readValidatedJson(request, gblAnalysisInputSchema);

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
      route: "/api/gbl/analyze",
      dailyLimit: 30,
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
      route: "/api/gbl/analyze",
      limit: 8,
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
    const result = await runGblAnalysis(parsed.data, requestId);
    let persisted = false;
    let caseId: string | undefined;
    let analysisId: string | undefined;

    if (supabase && user && parsed.data.save) {
      const saved = await saveGblAnalysis({
        supabase,
        userId: user.id,
        result,
      });
      persisted = true;
      caseId = saved.caseId;
      analysisId = saved.analysisId;

      void trackServerEvent({
        supabase,
        userId: user.id,
        event: "gbl_analysis_created",
        metadata: {
          analysisType: result.analysisType,
          status: result.status,
        },
      });

      await recordAiUsageEvent({
        supabase,
        userId: user.id,
        route: "/api/gbl/analyze",
        feature: "ai_gbl",
        status: result.status === "generated" ? "generated" : "fallback",
        inputTokensEstimate: Math.ceil(parsed.data.primaryConcern.length / 4),
        outputTokensEstimate: Math.ceil(result.userVisibleSummary.length / 4),
      });
    }

    return Response.json({
      ...result,
      id: analysisId,
      caseId,
      persisted,
      requestId,
    });
  } catch (error) {
    logError("AI.GBL analysis failed", {
      route: "/api/gbl/analyze",
      status: "failed",
      error,
      requestId,
      userHash: hashUserId(user?.id),
    });

    return Response.json(
      {
        error: "AI.GBL is temporarily unavailable. Please try again later.",
        requestId,
      },
      { status: 500 },
    );
  }
}
