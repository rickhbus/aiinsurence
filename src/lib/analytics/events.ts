import type { HealthDataClient } from "@/lib/health-data/common";
import { logWarn } from "@/lib/observability/logger";

export type AnalyticsEventName =
  | "dashboard_viewed"
  | "onboarding_started"
  | "onboarding_completed"
  | "quick_add_opened"
  | "run_logged"
  | "gym_logged"
  | "meal_logged"
  | "water_logged"
  | "sleep_logged"
  | "body_metric_logged"
  | "daily_checkin_logged"
  | "coach_message_sent"
  | "recommendation_viewed"
  | "recommendation_saved"
  | "memory_suggested"
  | "memory_saved"
  | "memory_declined"
  | "lesson_opened"
  | "lesson_completed"
  | "symptom_routing_started"
  | "symptom_routing_completed"
  | "insurance_helper_used"
  | "gbl_analysis_created"
  | "emotion_analysis_created"
  | "goal_created"
  | "weekly_report_viewed";

type AnalyticsMetadata = Record<string, string | number | boolean | null>;

const SENSITIVE_ANALYTICS_KEY_PATTERN =
  /(symptom|diagnosis|medical|note|notes|message|content|prompt|meal|food|policy|claim|hkid|email|phone|name|text|input)/iu;

export async function trackServerEvent({
  supabase,
  userId,
  event,
  metadata = {},
}: {
  supabase: HealthDataClient;
  userId: string;
  event: AnalyticsEventName;
  metadata?: AnalyticsMetadata;
}) {
  const { error } = await supabase.from("analytics_events").insert({
    user_id: userId,
    event_name: event,
    event_payload: scrubAnalyticsMetadata(metadata),
  });

  if (error) {
    logWarn("Analytics event failed", {
      route: "analytics",
      event,
      status: error.message,
    });
  }
}

export function scrubAnalyticsMetadata(metadata: AnalyticsMetadata) {
  return Object.fromEntries(
    Object.entries(metadata).map(([key, value]) => [
      key,
      SENSITIVE_ANALYTICS_KEY_PATTERN.test(key)
        ? scrubSensitiveAnalyticsValue(value)
        : normalizeAnalyticsValue(value),
    ]),
  );
}

function scrubSensitiveAnalyticsValue(value: AnalyticsMetadata[string]) {
  if (typeof value === "string") {
    return "[redacted]";
  }

  return normalizeAnalyticsValue(value);
}

function normalizeAnalyticsValue(value: AnalyticsMetadata[string]) {
  if (typeof value === "string") {
    return value.slice(0, 120);
  }

  return value;
}
