import {
  type MobileHealthMaterialization,
  type MobileHealthNormalizationResult,
  type MobileHealthRecordInput,
  type MobileHealthStagingRecord,
  type MobileHealthSyncPayload,
} from "./types";

export function normalizeMobileHealthBatch(
  payload: MobileHealthSyncPayload,
  userId: string,
  syncBatchId: string | null = null,
): MobileHealthNormalizationResult {
  const result: MobileHealthNormalizationResult = {
    stagingRecords: [],
    materializations: [],
    rejected: [],
  };

  payload.records.forEach((record, index) => {
    const normalized = normalizeRecord(record, payload, userId, syncBatchId);

    if (!normalized) {
      result.rejected.push({
        index,
        reason: "Unsupported or incomplete mobile health record.",
      });
      return;
    }

    result.stagingRecords.push(normalized.stagingRecord);

    if (normalized.materialization) {
      result.materializations.push(normalized.materialization);
    }
  });

  return result;
}

export function buildMobileHealthRecordKey(record: MobileHealthStagingRecord) {
  return `${record.source_record_hash}:${record.start_time}:${record.data_type}`;
}

function normalizeRecord(
  record: MobileHealthRecordInput,
  payload: MobileHealthSyncPayload,
  userId: string,
  syncBatchId: string | null,
):
  | {
      stagingRecord: MobileHealthStagingRecord;
      materialization: MobileHealthMaterialization | null;
    }
  | null {
  const start = new Date(record.startTime);
  const end = record.endTime ? new Date(record.endTime) : null;

  if (Number.isNaN(start.getTime()) || (end && Number.isNaN(end.getTime()))) {
    return null;
  }

  const summary = buildSummary(record, start, end);

  if (!summary) {
    return null;
  }

  const sourceRecordHash = hashRecordIdentity({
    platform: payload.sourcePlatform,
    idempotencyKey: payload.idempotencyKey,
    sourceRecordId: record.sourceRecordId,
    type: record.type,
    startTime: record.startTime,
    value: record.value,
  });
  const stagingRecord: MobileHealthStagingRecord = {
    user_id: userId,
    sync_batch_id: syncBatchId,
    source_platform: payload.sourcePlatform,
    source_record_hash: sourceRecordHash,
    data_type: record.type,
    start_time: start.toISOString(),
    end_time: end?.toISOString() ?? null,
    source_device: sanitizeSourceDevice(payload.sourceDevice),
    summary,
  };

  return {
    stagingRecord,
    materialization: buildMaterialization(record, stagingRecord, start, end),
  };
}

function buildSummary(
  record: MobileHealthRecordInput,
  start: Date,
  end: Date | null,
): Record<string, string | number | boolean | null> | null {
  switch (record.type) {
    case "steps":
      return {
        steps: Math.round(record.value ?? 0),
        unit: record.unit ?? "count",
      };
    case "active_energy":
      return {
        activeEnergyKcal: round(convertEnergyToKcal(record.value ?? 0, record.unit)),
        unit: "kcal",
      };
    case "workout":
      return {
        workoutType: record.workoutType ?? "other",
        durationSeconds: getDurationSeconds(record, start, end),
        distanceKm: record.distanceKm ? round(record.distanceKm, 3) : null,
        calories: record.calories ?? null,
        averageHeartRateBpm: record.averageHeartRateBpm ?? null,
      };
    case "sleep_session":
      return {
        sleepHours: round(getSleepHours(record, start, end), 2),
        unit: "hours",
      };
    case "body_weight":
      return {
        weightKg: round(convertWeightToKg(record.value ?? 0, record.unit), 2),
        unit: "kg",
      };
    case "heart_rate_summary":
      return {
        averageHeartRateBpm: record.averageHeartRateBpm ?? record.value ?? null,
        minHeartRateBpm: record.minHeartRateBpm ?? null,
        maxHeartRateBpm: record.maxHeartRateBpm ?? null,
        unit: "bpm",
      };
    case "mindful_minutes":
      return {
        mindfulMinutes: round(convertDurationToMinutes(record, start, end), 1),
        unit: "minutes",
        nonClinical: true,
      };
    case "mood":
      return {
        moodLabel: record.label ?? "unspecified",
        nonClinical: true,
      };
  }
}

function buildMaterialization(
  record: MobileHealthRecordInput,
  stagingRecord: MobileHealthStagingRecord,
  start: Date,
  end: Date | null,
): MobileHealthMaterialization | null {
  const key = buildMobileHealthRecordKey(stagingRecord);

  if (record.type === "workout" && record.workoutType === "run" && record.distanceKm) {
    const durationSeconds = getDurationSeconds(record, start, end);

    if (durationSeconds <= 0) {
      return null;
    }

    return {
      key,
      kind: "running",
      input: {
        distance_km: round(record.distanceKm, 3),
        duration_seconds: durationSeconds,
        pace: null,
        heart_rate_avg: record.averageHeartRateBpm ?? null,
        calories: record.calories ?? null,
        rpe: 5,
        route_notes: "Mobile health sync summary",
        weather: null,
        shoe: null,
        notes: null,
        created_at: start.toISOString(),
      },
    };
  }

  if (record.type === "sleep_session") {
    return {
      key,
      kind: "sleep",
      input: {
        sleep_hours: round(getSleepHours(record, start, end), 2),
        bedtime: null,
        wake_time: null,
        sleep_quality: null,
        notes: "Mobile health sync summary",
        created_at: start.toISOString(),
      },
    };
  }

  if (record.type === "body_weight") {
    return {
      key,
      kind: "body_metric",
      input: {
        weight_kg: round(convertWeightToKg(record.value ?? 0, record.unit), 2),
        waist_cm: null,
        body_fat_percentage: null,
        notes: "Mobile health sync summary",
        created_at: start.toISOString(),
      },
    };
  }

  return null;
}

function getDurationSeconds(record: MobileHealthRecordInput, start: Date, end: Date | null) {
  if (record.durationSeconds) {
    return record.durationSeconds;
  }

  if (end) {
    return Math.max(1, Math.round((end.getTime() - start.getTime()) / 1000));
  }

  return Math.max(1, Math.round((record.value ?? 0) * 60));
}

function getSleepHours(record: MobileHealthRecordInput, start: Date, end: Date | null) {
  if (record.unit === "hours" && record.value != null) {
    return record.value;
  }

  if (record.durationSeconds) {
    return record.durationSeconds / 3600;
  }

  if (end) {
    return Math.max(0, (end.getTime() - start.getTime()) / 3_600_000);
  }

  return record.value ?? 0;
}

function convertDurationToMinutes(record: MobileHealthRecordInput, start: Date, end: Date | null) {
  if (record.unit === "minutes" && record.value != null) {
    return record.value;
  }

  return getDurationSeconds(record, start, end) / 60;
}

function convertWeightToKg(value: number, unit: string | null) {
  return unit === "lb" || unit === "lbs" ? value * 0.45359237 : value;
}

function convertEnergyToKcal(value: number, unit: string | null) {
  return unit === "kj" || unit === "kilojoule" || unit === "kilojoules" ? value / 4.184 : value;
}

function hashRecordIdentity(value: Record<string, string | number | null | undefined>) {
  return hashString(JSON.stringify(value));
}

function hashString(value: string) {
  let hash = 0x811c9dc5;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }

  return (hash >>> 0).toString(16).padStart(8, "0");
}

function sanitizeSourceDevice(value: string | null) {
  const normalized = value?.trim();

  if (!normalized) {
    return null;
  }

  if (/[^\s@]+@[^\s@]+\.[^\s@]+|\+?\d[\d\s().-]{7,}\d/.test(normalized)) {
    return "provided_device";
  }

  return normalized.slice(0, 80);
}

function round(value: number, decimals = 1) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}
