import type { SupabaseClient } from "@supabase/supabase-js";
import { createBodyMetric } from "@/lib/health-data/body";
import { createRunningLog } from "@/lib/health-data/running";
import { createSleepLog } from "@/lib/health-data/sleep";
import {
  buildMobileHealthRecordKey,
  normalizeMobileHealthBatch,
} from "@/lib/mobile-health/normalize";
import { mobileHealthSyncPayloadSchema } from "@/lib/mobile-health/types";
import { hashUserId, logError, logInfo } from "@/lib/observability/logger";
import {
  getAuthenticatedSupabase,
  readValidatedJson,
} from "@/lib/server/persistence-auth";
import { checkSubjectRateLimit } from "@/lib/server/rate-limit";
import {
  getRequestId,
  jsonWithRequestId,
  withRequestIdHeaders,
} from "@/lib/server/request-context";
import { saveConsentEvent } from "@/lib/user-memory";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  const parsed = await readValidatedJson(request, mobileHealthSyncPayloadSchema);

  if (!parsed.ok) {
    return parsed.response;
  }

  const auth = await getAuthenticatedSupabase(request);

  if (!auth.ok) {
    return auth.response;
  }

  if (!parsed.data.consentGranted) {
    return jsonWithRequestId(
      { error: "Explicit mobile health sync consent is required." },
      { status: 400 },
      requestId,
    );
  }

  const limit = await checkSubjectRateLimit({
    subject: auth.user.id,
    route: "/api/mobile-health/sync",
    limit: 20,
    windowMs: 60 * 60 * 1000,
  });

  if (!limit.allowed) {
    return jsonWithRequestId(
      { error: limit.message },
      {
        status: 429,
        headers: { "Retry-After": String(limit.retryAfterSeconds) },
      },
      requestId,
    );
  }

  try {
    const existingBatch = await findExistingBatch({
      supabase: auth.supabase,
      userId: auth.user.id,
      idempotencyKey: parsed.data.idempotencyKey,
    });

    if (existingBatch) {
      return jsonWithRequestId(
        {
          accepted_count: existingBatch.accepted_count,
          rejected_count: existingBatch.rejected_count,
          duplicate_count: existingBatch.duplicate_count + existingBatch.accepted_count,
          status: "duplicate",
        },
        { status: 200 },
        requestId,
      );
    }

    await saveConsentEvent(auth.user.id, "mobile_health_sync", true, auth.supabase);

    const batch = await createSyncBatch({
      supabase: auth.supabase,
      userId: auth.user.id,
      sourcePlatform: parsed.data.sourcePlatform,
      idempotencyKey: parsed.data.idempotencyKey,
      requestId,
    });
    const normalized = normalizeMobileHealthBatch(parsed.data, auth.user.id, batch.id);
    const existingKeys = await findExistingRecordKeys({
      supabase: auth.supabase,
      userId: auth.user.id,
      sourcePlatform: parsed.data.sourcePlatform,
      hashes: normalized.stagingRecords.map((record) => record.source_record_hash),
    });
    const newRecords = normalized.stagingRecords.filter(
      (record) => !existingKeys.has(buildMobileHealthRecordKey(record)),
    );
    const newKeys = new Set(newRecords.map(buildMobileHealthRecordKey));

    if (newRecords.length > 0) {
      const { error } = await auth.supabase
        .from("mobile_health_records")
        .insert(newRecords);

      if (error) {
        throw new Error("mobile_health_records insert failed");
      }
    }

    for (const materialization of normalized.materializations) {
      if (!newKeys.has(materialization.key)) {
        continue;
      }

      if (materialization.kind === "running") {
        await createRunningLog(auth.supabase, auth.user.id, materialization.input);
      } else if (materialization.kind === "sleep") {
        await createSleepLog(auth.supabase, auth.user.id, materialization.input);
      } else {
        await createBodyMetric(auth.supabase, auth.user.id, materialization.input);
      }
    }

    const duplicateCount = normalized.stagingRecords.length - newRecords.length;
    await completeSyncBatch({
      supabase: auth.supabase,
      batchId: batch.id,
      acceptedCount: newRecords.length,
      rejectedCount: normalized.rejected.length,
      duplicateCount,
    });

    logInfo("mobile_health_sync_completed", {
      route: "/api/mobile-health/sync",
      requestId,
      userHash: hashUserId(auth.user.id),
      acceptedCount: newRecords.length,
      rejectedCount: normalized.rejected.length,
      duplicateCount,
    });

    return Response.json(
      {
        accepted_count: newRecords.length,
        rejected_count: normalized.rejected.length,
        duplicate_count: duplicateCount,
        requestId,
      },
      withRequestIdHeaders(undefined, requestId),
    );
  } catch (error) {
    logError("mobile_health_sync_failed", {
      route: "/api/mobile-health/sync",
      requestId,
      error,
    });

    return jsonWithRequestId(
      { error: "Mobile health sync is temporarily unavailable." },
      { status: 500 },
      requestId,
    );
  }
}

async function findExistingBatch({
  supabase,
  userId,
  idempotencyKey,
}: {
  supabase: SupabaseClient;
  userId: string;
  idempotencyKey: string;
}) {
  const { data, error } = await supabase
    .from("mobile_health_sync_batches")
    .select("id,accepted_count,rejected_count,duplicate_count,status")
    .eq("user_id", userId)
    .eq("idempotency_key", idempotencyKey)
    .eq("status", "completed")
    .maybeSingle();

  if (error) {
    throw new Error("mobile_health_sync_batches lookup failed");
  }

  return data as {
    id: string;
    accepted_count: number;
    rejected_count: number;
    duplicate_count: number;
    status: string;
  } | null;
}

async function createSyncBatch({
  supabase,
  userId,
  sourcePlatform,
  idempotencyKey,
  requestId,
}: {
  supabase: SupabaseClient;
  userId: string;
  sourcePlatform: string;
  idempotencyKey: string;
  requestId: string;
}) {
  const { data, error } = await supabase
    .from("mobile_health_sync_batches")
    .insert({
      user_id: userId,
      source_platform: sourcePlatform,
      idempotency_key: idempotencyKey,
      request_id: requestId,
      status: "processing",
    })
    .select("id")
    .single();

  if (error) {
    throw new Error("mobile_health_sync_batches insert failed");
  }

  return data as { id: string };
}

async function findExistingRecordKeys({
  supabase,
  userId,
  sourcePlatform,
  hashes,
}: {
  supabase: SupabaseClient;
  userId: string;
  sourcePlatform: string;
  hashes: string[];
}) {
  if (hashes.length === 0) {
    return new Set<string>();
  }

  const { data, error } = await supabase
    .from("mobile_health_records")
    .select("source_record_hash,start_time,data_type")
    .eq("user_id", userId)
    .eq("source_platform", sourcePlatform)
    .in("source_record_hash", hashes);

  if (error) {
    throw new Error("mobile_health_records dedupe lookup failed");
  }

  return new Set(
    ((data ?? []) as Array<{
      source_record_hash: string;
      start_time: string;
      data_type: string;
    }>).map((record) => `${record.source_record_hash}:${record.start_time}:${record.data_type}`),
  );
}

async function completeSyncBatch({
  supabase,
  batchId,
  acceptedCount,
  rejectedCount,
  duplicateCount,
}: {
  supabase: SupabaseClient;
  batchId: string;
  acceptedCount: number;
  rejectedCount: number;
  duplicateCount: number;
}) {
  const { error } = await supabase
    .from("mobile_health_sync_batches")
    .update({
      status: "completed",
      accepted_count: acceptedCount,
      rejected_count: rejectedCount,
      duplicate_count: duplicateCount,
      completed_at: new Date().toISOString(),
    })
    .eq("id", batchId);

  if (error) {
    throw new Error("mobile_health_sync_batches completion failed");
  }
}
