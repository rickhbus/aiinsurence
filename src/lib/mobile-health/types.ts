import { z } from "zod";

export const mobileHealthSourceSchema = z.enum([
  "apple_healthkit",
  "android_health_connect",
  "manual",
  "unknown",
]);

export const mobileHealthDataTypeSchema = z.enum([
  "steps",
  "active_energy",
  "workout",
  "sleep_session",
  "body_weight",
  "heart_rate_summary",
  "mindful_minutes",
  "mood",
]);

const optionalText = (max = 120) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .nullable()
    .transform((value) => (value ? value : null));

const finiteNumber = z.number().finite();

export const mobileHealthRecordSchema = z
  .object({
    type: mobileHealthDataTypeSchema,
    sourceRecordId: optionalText(180),
    startTime: z.string().datetime(),
    endTime: z.string().datetime().optional().nullable(),
    value: finiteNumber.min(0).max(1_000_000).optional().nullable(),
    unit: optionalText(40),
    workoutType: z
      .enum(["run", "walk", "cycle", "strength", "mobility", "other"])
      .optional()
      .nullable(),
    durationSeconds: z.number().int().positive().max(7 * 24 * 60 * 60).optional().nullable(),
    distanceKm: finiteNumber.positive().max(500).optional().nullable(),
    calories: z.number().int().min(0).max(50_000).optional().nullable(),
    averageHeartRateBpm: z.number().int().min(30).max(240).optional().nullable(),
    minHeartRateBpm: z.number().int().min(30).max(240).optional().nullable(),
    maxHeartRateBpm: z.number().int().min(30).max(260).optional().nullable(),
    label: optionalText(80),
  })
  .superRefine((record, context) => {
    if (record.endTime && Date.parse(record.endTime) < Date.parse(record.startTime)) {
      context.addIssue({
        code: "custom",
        message: "endTime must be after startTime.",
        path: ["endTime"],
      });
    }

    if (record.type === "steps" && record.value == null) {
      context.addIssue({
        code: "custom",
        message: "steps requires a value.",
        path: ["value"],
      });
    }

    if (record.type === "body_weight" && record.value == null) {
      context.addIssue({
        code: "custom",
        message: "body_weight requires a value.",
        path: ["value"],
      });
    }

    if (record.type === "sleep_session" && !record.endTime && record.durationSeconds == null && record.value == null) {
      context.addIssue({
        code: "custom",
        message: "sleep_session requires endTime, durationSeconds, or value.",
        path: ["endTime"],
      });
    }

    if (record.type === "workout" && record.durationSeconds == null && !record.endTime) {
      context.addIssue({
        code: "custom",
        message: "workout requires durationSeconds or endTime.",
        path: ["durationSeconds"],
      });
    }
  });

export const mobileHealthSyncPayloadSchema = z.object({
  sourcePlatform: mobileHealthSourceSchema,
  sourceDevice: optionalText(80),
  idempotencyKey: z.string().trim().min(8).max(128),
  consentGranted: z.boolean(),
  records: z.array(mobileHealthRecordSchema).min(1).max(100),
});

export type MobileHealthSource = z.infer<typeof mobileHealthSourceSchema>;
export type MobileHealthDataType = z.infer<typeof mobileHealthDataTypeSchema>;
export type MobileHealthRecordInput = z.infer<typeof mobileHealthRecordSchema>;
export type MobileHealthSyncPayload = z.infer<typeof mobileHealthSyncPayloadSchema>;

export type MobileHealthStagingRecord = {
  user_id: string;
  sync_batch_id: string | null;
  source_platform: MobileHealthSource;
  source_record_hash: string;
  data_type: MobileHealthDataType;
  start_time: string;
  end_time: string | null;
  source_device: string | null;
  summary: Record<string, string | number | boolean | null>;
};

export type MobileHealthMaterialization =
  | {
      key: string;
      kind: "running";
      input: {
        distance_km: number;
        duration_seconds: number;
        pace: string | null;
        heart_rate_avg: number | null;
        calories: number | null;
        rpe: number;
        route_notes: string | null;
        weather: string | null;
        shoe: string | null;
        notes: string | null;
        created_at: string;
      };
    }
  | {
      key: string;
      kind: "sleep";
      input: {
        sleep_hours: number;
        bedtime: string | null;
        wake_time: string | null;
        sleep_quality: number | null;
        notes: string | null;
        created_at: string;
      };
    }
  | {
      key: string;
      kind: "body_metric";
      input: {
        weight_kg: number;
        waist_cm: null;
        body_fat_percentage: null;
        notes: string | null;
        created_at: string;
      };
    };

export type MobileHealthNormalizationResult = {
  stagingRecords: MobileHealthStagingRecord[];
  materializations: MobileHealthMaterialization[];
  rejected: Array<{ index: number; reason: string }>;
};
