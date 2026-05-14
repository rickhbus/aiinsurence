import type { QuestType } from "./types";
import { buildRewardEventKey } from "./rewards";

export const practiceTypes = [
  "hydration_review",
  "mood_review",
  "sleep_review",
  "movement_review",
  "doctor_prep_review",
  "insurance_boundary_review",
] as const;

export type PracticeType = typeof practiceTypes[number];

export type ReviewTrigger =
  | "lesson_completed_7_days_ago"
  | "repeated_quiz_misses"
  | "repeated_quest_skip"
  | "goal_changed"
  | "weekly_review";

export type ReviewItem = {
  id: string;
  itemType: PracticeType;
  sourceId?: string | null;
  dueAt: string;
  completedAt?: string | null;
  metadata: Record<string, unknown>;
};

export function mapQuestTypeToPractice(type: QuestType): PracticeType {
  switch (type) {
    case "water":
      return "hydration_review";
    case "mood":
      return "mood_review";
    case "sleep_prep":
      return "sleep_review";
    case "movement":
      return "movement_review";
    case "doctor_prep":
      return "doctor_prep_review";
    case "learn":
      return "insurance_boundary_review";
    case "meal":
    case "health_review":
    case "recovery":
    case "wake":
    case "toilet_optional":
      return "movement_review";
  }
}

export function scheduleReviewFromLesson(input: {
  userId: string;
  lessonSlug: string;
  completedAt: string;
  practiceType?: PracticeType;
}): ReviewItem {
  const due = new Date(input.completedAt);
  due.setUTCDate(due.getUTCDate() + 7);
  const itemType = input.practiceType ?? inferPracticeFromLesson(input.lessonSlug);

  return {
    id: buildRewardEventKey(["review", input.userId, input.lessonSlug, due.toISOString().slice(0, 10)]),
    itemType,
    sourceId: input.lessonSlug,
    dueAt: due.toISOString(),
    completedAt: null,
    metadata: { trigger: "lesson_completed_7_days_ago" satisfies ReviewTrigger },
  };
}

export function buildPracticeSessionEventKey(userId: string, itemType: PracticeType, localDate: string) {
  return buildRewardEventKey(["practice", userId, itemType, localDate]);
}

export function isReviewDue(item: ReviewItem, now = new Date().toISOString()) {
  return !item.completedAt && item.dueAt <= now;
}

export function getDefaultPracticeItems(now = new Date()) {
  return practiceTypes.slice(0, 3).map((itemType, index) => {
    const due = new Date(now);
    due.setUTCDate(due.getUTCDate() - index);

    return {
      id: `demo-${itemType}`,
      itemType,
      sourceId: null,
      dueAt: due.toISOString(),
      completedAt: null,
      metadata: { trigger: "weekly_review" as ReviewTrigger },
    } satisfies ReviewItem;
  });
}

function inferPracticeFromLesson(lessonSlug: string): PracticeType {
  if (lessonSlug.includes("water") || lessonSlug.includes("hydration")) return "hydration_review";
  if (lessonSlug.includes("mood") || lessonSlug.includes("stress")) return "mood_review";
  if (lessonSlug.includes("sleep")) return "sleep_review";
  if (lessonSlug.includes("doctor")) return "doctor_prep_review";
  if (lessonSlug.includes("insurance")) return "insurance_boundary_review";
  return "movement_review";
}

