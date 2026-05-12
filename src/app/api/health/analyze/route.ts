import { generateGuideMessage } from "@/lib/ai/health-guide";
import {
  analyzeHealthInputCore,
  buildHealthInputAnalysisResponse,
  createSafetyLockedAssistant,
  healthInputAnalysisInputSchema,
} from "@/lib/health-input-analysis";
import { readValidatedJson } from "@/lib/server/persistence-auth";
import { checkAnonymousRateLimit, getRequestIp } from "@/lib/server/rate-limit";
import { getRequestId, jsonWithRequestId } from "@/lib/server/request-context";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  const parsed = await readValidatedJson(request, healthInputAnalysisInputSchema);

  if (!parsed.ok) {
    return parsed.response;
  }

  const core = analyzeHealthInputCore(parsed.data, requestId);

  if (!core.safety.safetyLocked) {
    const limit = await checkAnonymousRateLimit({
      ip: getRequestIp(request),
      route: "/api/health/analyze",
      limit: 20,
      windowMs: 24 * 60 * 60 * 1000,
    });

    if (!limit.allowed) {
      return jsonWithRequestId(
        { error: limit.message },
        { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
        requestId,
      );
    }
  }

  const assistant = core.safety.safetyLocked
    ? createSafetyLockedAssistant(core)
    : await generateGuideMessage({
        input: parsed.data.input,
        mode: core.intakeMode,
        recommendation: core.navigation,
      });

  return jsonWithRequestId(
    buildHealthInputAnalysisResponse(core, assistant),
    undefined,
    requestId,
  );
}
