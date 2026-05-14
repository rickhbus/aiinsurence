import { z } from "zod";
import type { LocalizedText } from "./types";

export const familyChallengeTypes = [
  "water_7_day",
  "mood_checkin_week",
  "family_walk_weekend",
  "doctor_prep_checklist",
  "three_lessons_together",
] as const;

export type FamilyChallengeType = typeof familyChallengeTypes[number];

export const familyChallengeSchema = z.object({
  circleId: z.string().uuid(),
  challengeType: z.enum(familyChallengeTypes),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const challengeCopy: Record<FamilyChallengeType, { title: LocalizedText; description: LocalizedText; target: number }> = {
  water_7_day: {
    title: { zh: "7 日飲水挑戰", en: "7-day water challenge" },
    description: { zh: "家庭總共完成 7 次飲水任務。分享進度，不分享私隱細節。", en: "Complete 7 water quests together. Share progress, not private details." },
    target: 7,
  },
  mood_checkin_week: {
    title: { zh: "心情打卡週", en: "Mood check-in week" },
    description: { zh: "只分享完成進度，不分享心情文字。", en: "Share progress only, not mood text." },
    target: 7,
  },
  family_walk_weekend: {
    title: { zh: "週末家庭散步", en: "Family walk weekend" },
    description: { zh: "輕量活動，恢復都算數。", en: "Gentle activity; recovery counts too." },
    target: 3,
  },
  doctor_prep_checklist: {
    title: { zh: "醫生準備清單", en: "Doctor prep checklist" },
    description: { zh: "準備問題，不分享私人健康細節。", en: "Prepare questions without sharing private health details." },
    target: 3,
  },
  three_lessons_together: {
    title: { zh: "一齊完成 3 個小課", en: "Complete 3 lessons together" },
    description: { zh: "分享進度，不分享私隱細節。", en: "Share progress, not private details." },
    target: 3,
  },
};

export function buildFamilyChallenge(type: FamilyChallengeType) {
  return challengeCopy[type];
}
