import { z } from "zod";
import { getNotificationCopy, type ReminderType } from "./notification-copy";

export const reminderPreferencesSchema = z.object({
  preferredQuestTime: z.enum(["morning", "midday", "evening", "no_preference"]).default("no_preference"),
  reminderEnabled: z.boolean().default(false),
  reminderTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/).nullable().optional(),
  morningReminderEnabled: z.boolean().default(false),
  morningReminderTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/).nullable().optional(),
  waterReminderEnabled: z.boolean().default(false),
  eveningReviewEnabled: z.boolean().default(false),
  weeklyReviewEnabled: z.boolean().default(true),
  notificationQuietHoursStart: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/).nullable().optional(),
  notificationQuietHoursEnd: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/).nullable().optional(),
});

export function buildReminderPreview(types: ReminderType[]) {
  return types.map((type) => ({
    type,
    copy: getNotificationCopy(type),
  }));
}
