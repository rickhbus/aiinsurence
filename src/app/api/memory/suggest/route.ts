import { memorySuggestInputSchema } from "@/lib/health-data/validation";
import { readValidatedJson } from "@/lib/server/persistence-auth";
import { checkAnonymousRateLimit, getRequestIp } from "@/lib/server/rate-limit";
import { getRequestId, jsonWithRequestId } from "@/lib/server/request-context";

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  const parsed = await readValidatedJson(request, memorySuggestInputSchema);

  if (!parsed.ok) {
    return parsed.response;
  }

  const limit = await checkAnonymousRateLimit({
    ip: getRequestIp(request),
    route: "/api/memory/suggest",
    limit: 60,
    windowMs: 24 * 60 * 60 * 1000,
  });

  if (!limit.allowed) {
    return jsonWithRequestId(
      { error: limit.message },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
      requestId,
    );
  }

  const suggestion = suggestMemory(parsed.data.message);

  return jsonWithRequestId({
    shouldSuggest: Boolean(suggestion),
    suggestion,
  }, undefined, requestId);
}

function suggestMemory(message: string) {
  if (!/(偏好|喜歡|鍾意|目標|prefer|goal|高蛋白|少糖|公營|私營)/iu.test(message)) {
    return null;
  }

  return {
    category: /食|蛋白|糖|meal|nutrition/iu.test(message)
      ? "nutrition"
      : /公營|私營|醫療|care/iu.test(message)
        ? "healthcare"
        : "behavior",
    content: message.slice(0, 240),
  };
}
