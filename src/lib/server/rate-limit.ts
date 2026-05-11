import type { HealthDataClient } from "@/lib/health-data/common";
import { logWarn } from "@/lib/observability/logger";

type LimitResult =
  | { allowed: true; remaining: number }
  | { allowed: false; retryAfterSeconds: number; message: string };

const fallbackHits = new Map<string, number[]>();

export const RATE_LIMIT_COPY_ZH =
  "今日 AI 使用次數較多，請稍後再試。你仍可繼續記錄健康資料及查看已生成的建議。";

export async function checkUserAiRateLimit({
  supabase,
  userId,
  route,
  dailyLimit,
}: {
  supabase: HealthDataClient;
  userId: string;
  route: string;
  dailyLimit: number;
}): Promise<LimitResult> {
  const dayStart = new Date();
  dayStart.setHours(0, 0, 0, 0);

  const { count, error } = await supabase
    .from("ai_usage_events")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("route", route)
    .gte("created_at", dayStart.toISOString())
    .neq("status", "rate_limited");

  if (error) {
    logWarn("AI rate limit query failed", {
      route,
      status: error.message,
    });
    return { allowed: true, remaining: Math.max(0, dailyLimit - 1) };
  }

  const used = count ?? 0;

  if (used >= dailyLimit) {
    await recordAiUsageEvent({
      supabase,
      userId,
      route,
      status: "rate_limited",
    });

    return {
      allowed: false,
      retryAfterSeconds: secondsUntilTomorrow(),
      message: RATE_LIMIT_COPY_ZH,
    };
  }

  return { allowed: true, remaining: dailyLimit - used - 1 };
}

export function checkIpRateLimit({
  ip,
  route,
  limit,
  windowMs,
}: {
  ip: string;
  route: string;
  limit: number;
  windowMs: number;
}): LimitResult {
  const key = `${route}:${ip}`;
  const now = Date.now();
  const hits = (fallbackHits.get(key) ?? []).filter((hit) => now - hit < windowMs);

  if (hits.length >= limit) {
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil(windowMs / 1000),
      message: RATE_LIMIT_COPY_ZH,
    };
  }

  hits.push(now);
  fallbackHits.set(key, hits);

  return { allowed: true, remaining: limit - hits.length };
}

export async function recordAiUsageEvent({
  supabase,
  userId,
  route,
  feature,
  provider,
  model,
  status,
  inputTokensEstimate,
  outputTokensEstimate,
  costEstimate,
}: {
  supabase: HealthDataClient;
  userId: string;
  route: string;
  feature?: string;
  provider?: string;
  model?: string;
  status: "cached" | "generated" | "fallback" | "failed" | "rate_limited";
  inputTokensEstimate?: number;
  outputTokensEstimate?: number;
  costEstimate?: number;
}) {
  const { error } = await supabase.from("ai_usage_events").insert({
    user_id: userId,
    route,
    feature: feature ?? route,
    provider: provider ?? null,
    model: model ?? null,
    status,
    input_tokens_estimate: inputTokensEstimate ?? null,
    output_tokens_estimate: outputTokensEstimate ?? null,
    cost_estimate: costEstimate ?? null,
  });

  if (error) {
    logWarn("AI usage event failed", {
      route,
      status: error.message,
    });
  }
}

export function getRequestIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");

  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }

  return request.headers.get("x-real-ip") || "unknown";
}

function secondsUntilTomorrow() {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  return Math.ceil((tomorrow.getTime() - now.getTime()) / 1000);
}
