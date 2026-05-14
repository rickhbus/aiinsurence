import { z } from "zod";
import { getNotificationCopy, type ReminderType } from "./notification-copy";

const timeStringSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/);

export const reminderPreferencesSchema = z.object({
  preferredQuestTime: z.enum(["morning", "midday", "evening", "no_preference"]).default("no_preference"),
  reminderEnabled: z.boolean().default(false),
  reminderTime: timeStringSchema.nullable().optional(),
  morningReminderEnabled: z.boolean().default(false),
  morningReminderTime: timeStringSchema.nullable().optional(),
  waterReminderEnabled: z.boolean().default(false),
  eveningReviewEnabled: z.boolean().default(false),
  weeklyReviewEnabled: z.boolean().default(true),
  notificationQuietHoursStart: timeStringSchema.nullable().optional(),
  notificationQuietHoursEnd: timeStringSchema.nullable().optional(),
});

export function buildReminderPreview(types: ReminderType[]) {
  return types.map((type) => ({
    type,
    copy: getNotificationCopy(type),
  }));
}

export function isWithinQuietHours({
  currentTime,
  quietHoursStart,
  quietHoursEnd,
}: {
  currentTime: string;
  quietHoursStart?: string | null;
  quietHoursEnd?: string | null;
}) {
  if (!quietHoursStart || !quietHoursEnd) {
    return false;
  }

  const current = timeToMinutes(currentTime);
  const start = timeToMinutes(quietHoursStart);
  const end = timeToMinutes(quietHoursEnd);

  if (current === null || start === null || end === null || start === end) {
    return false;
  }

  return start < end
    ? current >= start && current < end
    : current >= start || current < end;
}

export function buildSafeReminderDeliveryPreview({
  type,
  scheduledTime,
  quietHoursStart,
  quietHoursEnd,
}: {
  type: ReminderType;
  scheduledTime: string;
  quietHoursStart?: string | null;
  quietHoursEnd?: string | null;
}) {
  return {
    type,
    scheduledTime,
    suppressedByQuietHours: isWithinQuietHours({
      currentTime: scheduledTime,
      quietHoursStart,
      quietHoursEnd,
    }),
    copy: getNotificationCopy(type),
    deliveryImplemented: false,
  };
}

function timeToMinutes(value: string) {
  const match = value.match(/^(\d{2}):(\d{2})(?::\d{2})?$/);

  if (!match) {
    return null;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (hours > 23 || minutes > 59) {
    return null;
  }

  return hours * 60 + minutes;
}
