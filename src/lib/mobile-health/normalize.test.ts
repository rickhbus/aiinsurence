import { describe, expect, it } from "vitest";
import { normalizeMobileHealthBatch } from "./normalize";
import type { MobileHealthSyncPayload } from "./types";

describe("mobile health normalization", () => {
  it("normalizes run, sleep, and body-weight summaries without raw native ids", () => {
    const payload: MobileHealthSyncPayload = {
      sourcePlatform: "apple_healthkit",
      sourceDevice: "iPhone",
      idempotencyKey: "sync-2026-05-11",
      consentGranted: true,
      records: [
        {
          type: "workout",
          workoutType: "run",
          sourceRecordId: "native-run-1",
          unit: null,
          label: null,
          startTime: "2026-05-11T09:00:00.000Z",
          endTime: "2026-05-11T09:30:00.000Z",
          distanceKm: 5,
          calories: 320,
          averageHeartRateBpm: 142,
        },
        {
          type: "sleep_session",
          sourceRecordId: "native-sleep-1",
          unit: null,
          label: null,
          startTime: "2026-05-10T15:00:00.000Z",
          endTime: "2026-05-10T22:30:00.000Z",
        },
        {
          type: "body_weight",
          sourceRecordId: "native-weight-1",
          startTime: "2026-05-11T08:00:00.000Z",
          value: 160,
          unit: "lb",
          label: null,
        },
      ],
    };

    const result = normalizeMobileHealthBatch(payload, "user-123", "batch-123");

    expect(result.rejected).toHaveLength(0);
    expect(result.stagingRecords).toHaveLength(3);
    expect(result.stagingRecords[0].source_record_hash).not.toContain("native-run-1");
    expect(result.materializations.map((item) => item.kind)).toEqual([
      "running",
      "sleep",
      "body_metric",
    ]);
    expect(result.materializations[0]).toMatchObject({
      kind: "running",
      input: {
        distance_km: 5,
        duration_seconds: 1800,
        calories: 320,
      },
    });
    expect(result.materializations[2]).toMatchObject({
      kind: "body_metric",
      input: {
        weight_kg: 72.57,
      },
    });
  });

  it("keeps heart-rate data as a bounded summary only", () => {
    const payload: MobileHealthSyncPayload = {
      sourcePlatform: "android_health_connect",
      sourceDevice: null,
      idempotencyKey: "sync-hr-summary",
      consentGranted: true,
      records: [
        {
          type: "heart_rate_summary",
          sourceRecordId: null,
          startTime: "2026-05-11T10:00:00.000Z",
          endTime: "2026-05-11T10:10:00.000Z",
          unit: null,
          label: null,
          averageHeartRateBpm: 72,
          minHeartRateBpm: 60,
          maxHeartRateBpm: 120,
        },
      ],
    };

    const result = normalizeMobileHealthBatch(payload, "user-123", "batch-123");

    expect(result.stagingRecords[0].summary).toEqual({
      averageHeartRateBpm: 72,
      minHeartRateBpm: 60,
      maxHeartRateBpm: 120,
      unit: "bpm",
    });
    expect(result.materializations).toHaveLength(0);
  });
});
