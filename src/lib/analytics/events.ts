import type { HealthDataClient } from "@/lib/health-data/common";
import { logWarn } from "@/lib/observability/logger";

export type AnalyticsEventName =
  | "dashboard_viewed"
  | "quick_add_opened"
  | "run_logged"
  | "gym_logged"
  | "meal_logged"
  | "water_logged"
  | "sleep_logged"
  | "body_metric_logged"
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
  | "goal_created"
  | "weekly_report_viewed";

type AnalyticsMetadata = Record<string, string | number | boolean | null>;

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
    event_payload: metadata,
  });

  if (error) {
    logWarn("Analytics event failed", {
      route: "analytics",
      event,
      status: error.message,
    });
  }
}
