import { z } from "zod";

export const reminderTypes = [
  "morning_check_in",
  "drink_water",
  "evening_check_in",
  "doctor_appointment",
  "family_check_in",
  "medication_instruction",
] as const;

export type ReminderType = typeof reminderTypes[number];

export const reminderInputSchema = z.object({
  reminderType: z.enum(reminderTypes),
  titleZh: z.string().trim().min(1).max(120).optional(),
  timeOfDay: z.string().trim().regex(/^([01]\d|2[0-3]):[0-5]\d$/).default("09:00"),
  enabled: z.boolean().default(true),
  notes: z.string().trim().max(500).optional().nullable(),
  medicationName: z.string().trim().max(120).optional().nullable(),
});

export type ReminderInput = z.input<typeof reminderInputSchema>;

export const medicationReminderTitleZh = "提醒我按醫生/藥劑師指示服藥";

export function buildReminderInsert(input: ReminderInput) {
  const parsed = reminderInputSchema.parse(input);

  if (parsed.reminderType === "medication_instruction") {
    return {
      reminder_type: parsed.reminderType,
      title_zh: medicationReminderTitleZh,
      time_of_day: parsed.timeOfDay,
      enabled: parsed.enabled,
      notes: buildMedicationReminderNote(parsed.medicationName, parsed.notes),
    };
  }

  return {
    reminder_type: parsed.reminderType,
    title_zh: parsed.titleZh || defaultReminderTitleZh[parsed.reminderType],
    time_of_day: parsed.timeOfDay,
    enabled: parsed.enabled,
    notes: parsed.notes || null,
  };
}

export function buildMedicationReminderNote(medicationName?: string | null, notes?: string | null) {
  const parts = [
    medicationName ? `用戶提供名稱：${medicationName.slice(0, 120)}` : null,
    notes ? `用戶備註：${notes.slice(0, 260)}` : null,
    "只作時間提醒，不提供用藥份量或更改用藥建議。",
  ].filter(Boolean);

  return parts.join("\n");
}

export function containsMedicationAdvice(text: string) {
  return /(?:加藥|減藥|停藥|改藥|劑量建議|每日\d+粒|take \d+)/i.test(text);
}

const defaultReminderTitleZh: Record<Exclude<ReminderType, "medication_instruction">, string> = {
  morning_check_in: "朝早安心 check-in",
  drink_water: "飲水提醒",
  evening_check_in: "夜晚安心 check-in",
  doctor_appointment: "覆診提醒",
  family_check_in: "家庭 check-in 提醒",
};
