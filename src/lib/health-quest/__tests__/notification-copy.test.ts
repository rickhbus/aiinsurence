import { describe, expect, it } from "vitest";
import { assertNotificationCopySafe, notificationCopy } from "../notification-copy";
import { buildSafeReminderDeliveryPreview, isWithinQuietHours, reminderPreferencesSchema } from "../reminders";

describe("notification copy", () => {
  it("contains no private health detail", () => {
    expect(Object.values(notificationCopy).every(assertNotificationCopySafe)).toBe(true);
    expect(JSON.stringify(notificationCopy)).not.toMatch(/mood is low|symptoms are serious|insurance score/i);
  });

  it("handles quiet hours that cross midnight", () => {
    expect(isWithinQuietHours({
      currentTime: "23:30",
      quietHoursStart: "22:00",
      quietHoursEnd: "07:00",
    })).toBe(true);
    expect(isWithinQuietHours({
      currentTime: "12:00",
      quietHoursStart: "22:00",
      quietHoursEnd: "07:00",
    })).toBe(false);
  });

  it("keeps reminder delivery as copy/preference only", () => {
    const preview = buildSafeReminderDeliveryPreview({
      type: "morning_quest",
      scheduledTime: "23:30",
      quietHoursStart: "22:00",
      quietHoursEnd: "07:00",
    });

    expect(preview.deliveryImplemented).toBe(false);
    expect(preview.suppressedByQuietHours).toBe(true);
    expect(JSON.stringify(preview.copy)).not.toMatch(/symptom|policy|claim|HKID|phone|email/i);
  });

  it("rejects invalid reminder times", () => {
    expect(reminderPreferencesSchema.partial().safeParse({ reminderTime: "29:99" }).success).toBe(false);
  });
});
