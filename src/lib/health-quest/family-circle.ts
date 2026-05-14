import { z } from "zod";

export const familySharingLevels = [
  "streak_only",
  "quest_category_only",
  "daily_wellbeing_status",
  "shared_notes",
  "doctor_prep_summary",
] as const;

export type FamilySharingLevel = typeof familySharingLevels[number];

export const familyCircleSchema = z.object({
  name: z.string().trim().min(1).max(120).default("Health Quest Family"),
});

export const familyInviteSchema = z.object({
  circleId: z.string().uuid(),
  email: z.string().trim().email().max(200),
  displayName: z.string().trim().max(120).optional().nullable(),
});

export const familyPermissionSchema = z.object({
  circleId: z.string().uuid(),
  sharingLevel: z.enum(familySharingLevels).default("streak_only"),
  allowChallengeInvites: z.boolean().default(true),
  allowDoctorSummaryShare: z.boolean().default(false),
});

export function privacySafeFamilyActivity({
  displayName,
  questsCompleted,
  streakProtected,
  sharingLevel,
}: {
  displayName: string;
  questsCompleted: number;
  streakProtected: boolean;
  sharingLevel: FamilySharingLevel;
}) {
  if (sharingLevel === "streak_only") {
    return streakProtected
      ? `${displayName} protected streak today`
      : `${displayName} checked in today`;
  }

  if (sharingLevel === "quest_category_only") {
    return `${displayName} completed ${questsCompleted} quests`;
  }

  return `${displayName} shared a wellbeing update`;
}

export function canShareRawHealthDetails(sharingLevel: FamilySharingLevel) {
  return sharingLevel === "shared_notes" || sharingLevel === "doctor_prep_summary";
}

export function stripUnsafeFamilyPayload(payload: Record<string, unknown>) {
  const blocked = /(symptom|moodNote|food|weight|calorie|diagnosis|medication|policy|claim|safety|incident|note|raw|hkid|phone|email)/iu;

  return Object.fromEntries(
    Object.entries(payload)
      .filter(([key]) => !blocked.test(key))
      .map(([key, value]) => [key, typeof value === "string" ? value.slice(0, 80) : typeof value === "number" || typeof value === "boolean" ? value : null]),
  );
}
