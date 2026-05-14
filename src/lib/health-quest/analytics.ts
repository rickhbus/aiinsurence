import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";

export const healthQuestAnalyticsEvents = [
  "quest_viewed",
  "quest_completed",
  "quest_skipped",
  "quest_made_easier",
  "quest_why_this_opened",
  "recovery_mode_started",
  "safety_banner_shown",
  "weekly_review_opened",
  "weekly_review_completed",
  "lesson_started",
  "lesson_completed",
  "streak_protected",
  "streak_freeze_earned",
  "streak_freeze_consumed",
  "onboarding_started",
  "onboarding_completed",
  "family_challenge_started",
  "family_challenge_progressed",
  "subscription_gate_viewed",
  "doctor_prep_started",
  "insurance_lesson_completed",
] as const;

export const analyticsEventSchema = z.object({
  anonymousId: z.string().trim().max(120).optional().nullable(),
  eventName: z.enum(healthQuestAnalyticsEvents),
  properties: z.record(z.string(), z.unknown()).default({}),
});

const unsafeKeyPattern = /^(notes?|rawText|symptoms?|bodyNotes|moodNote|foodText|doctorNotes|policyText|claimText|phone|email|hkid|token|apiKey|session|prompt)$/iu;
const unsafeNestedPattern = /(symptom|diagnos|medication|medicine|policy|claim|hkid|phone|email|token|apiKey|session|prompt|raw|note|foodText|mood)/iu;

type AnalyticsClient = Pick<SupabaseClient, "from">;

export function sanitizeAnalyticsProperties(properties: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(properties)
      .filter(([key]) => !unsafeKeyPattern.test(key) && !unsafeNestedPattern.test(key))
      .map(([key, value]) => [key, normalizeAnalyticsValue(value)] as const),
  );
}

export async function trackHealthQuestEvent(
  supabase: AnalyticsClient,
  input: {
    userId?: string | null;
    anonymousId?: string | null;
    eventName: typeof healthQuestAnalyticsEvents[number];
    properties?: Record<string, unknown>;
  },
) {
  const properties = sanitizeAnalyticsProperties(input.properties ?? {});
  const { error } = await supabase.from("health_quest_analytics_events").insert({
    user_id: input.userId ?? null,
    anonymous_id: input.anonymousId ?? null,
    event_name: input.eventName,
    properties,
  });

  if (error) {
    throw new Error(`Could not track analytics event: ${error.message}`);
  }
}

function normalizeAnalyticsValue(value: unknown): string | number | boolean | null | string[] {
  if (typeof value === "string") {
    return value.slice(0, 120);
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "boolean" || value === null) {
    return value;
  }

  if (Array.isArray(value)) {
    return value
      .filter((item): item is string => typeof item === "string" && !unsafeNestedPattern.test(item))
      .slice(0, 20)
      .map((item) => item.slice(0, 80));
  }

  return null;
}
