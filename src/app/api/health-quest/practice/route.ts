import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { insertXPEvent } from "@/lib/health-quest/storage";
import { buildPracticeSessionEventKey, getDefaultPracticeItems, practiceTypes, type ReviewItem } from "@/lib/health-quest/review-scheduler";
import type { XPEvent } from "@/lib/health-quest/types";
import { getAuthenticatedSupabase, readValidatedJson } from "@/lib/server/persistence-auth";
import { getRequestId, jsonWithRequestId } from "@/lib/server/request-context";

export const dynamic = "force-dynamic";

const completePracticeSchema = z.object({
  itemId: z.string().trim().min(1).max(180),
  itemType: z.enum(practiceTypes),
});

export async function GET(request: Request) {
  const requestId = getRequestId(request);
  const auth = await getAuthenticatedSupabase(request);

  if (!auth.ok) {
    return auth.response;
  }

  try {
    const now = new Date().toISOString();
    const items = await loadDuePracticeItems(auth.supabase, auth.user.id, now);

    return jsonWithRequestId({
      items: items.length ? items : await ensureDefaultPracticeItems(auth.supabase, auth.user.id, new Date(now)),
    }, undefined, requestId);
  } catch {
    return jsonWithRequestId({ error: "Practice is temporarily unavailable." }, { status: 500 }, requestId);
  }
}

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  const parsed = await readValidatedJson(request, completePracticeSchema);

  if (!parsed.ok) {
    return parsed.response;
  }

  const auth = await getAuthenticatedSupabase(request);

  if (!auth.ok) {
    return auth.response;
  }

  try {
    const completedAt = new Date().toISOString();
    const updated = await auth.supabase
      .from("health_quest_review_items")
      .update({ completed_at: completedAt })
      .eq("user_id", auth.user.id)
      .eq("id", parsed.data.itemId)
      .eq("item_type", parsed.data.itemType)
      .is("completed_at", null)
      .select("id,item_type,completed_at")
      .maybeSingle();

    if (updated.error) {
      throw new Error(updated.error.message);
    }

    if (!updated.data) {
      const existing = await auth.supabase
        .from("health_quest_review_items")
        .select("id,item_type,completed_at")
        .eq("user_id", auth.user.id)
        .eq("id", parsed.data.itemId)
        .maybeSingle();

      if (existing.error) {
        throw new Error(existing.error.message);
      }

      if (!existing.data) {
        return jsonWithRequestId({ error: "Practice item was not found." }, { status: 404 }, requestId);
      }

      if (existing.data.item_type !== parsed.data.itemType) {
        return jsonWithRequestId({ error: "Practice item type does not match." }, { status: 400 }, requestId);
      }

      return jsonWithRequestId({ completed: true, completedNow: false, xp: 0 }, undefined, requestId);
    }

    const localDate = new Date().toISOString().slice(0, 10);
    const event: XPEvent = {
      id: `practice-${parsed.data.itemId}`,
      amount: 5,
      reason: `practice_completed:${parsed.data.itemType}`,
      createdAt: new Date().toISOString(),
      eventKey: buildPracticeSessionEventKey(auth.user.id, parsed.data.itemType, localDate),
    };

    await insertXPEvent(auth.supabase, auth.user.id, event, {
      source: "health_quest",
      reviewType: parsed.data.itemType,
    });

    return jsonWithRequestId({ completed: true, completedNow: true, xp: 5 }, undefined, requestId);
  } catch {
    return jsonWithRequestId({ error: "Practice could not be completed." }, { status: 500 }, requestId);
  }
}

async function loadDuePracticeItems(
  supabase: SupabaseClient,
  userId: string,
  nowIso: string,
) {
  const { data, error } = await supabase
    .from("health_quest_review_items")
    .select("id,item_type,source_id,due_at,completed_at,metadata,created_at")
    .eq("user_id", userId)
    .lte("due_at", nowIso)
    .is("completed_at", null)
    .order("due_at", { ascending: true })
    .limit(10);

  if (error) {
    throw new Error(error.message);
  }

  return mapReviewRows(data ?? []);
}

async function ensureDefaultPracticeItems(
  supabase: SupabaseClient,
  userId: string,
  now: Date,
) {
  const localDate = now.toISOString().slice(0, 10);
  const defaults = getDefaultPracticeItems(now).map((item) => ({
    ...item,
    sourceId: `default:${localDate}:${item.itemType}`,
  }));
  const sourceIds = defaults.map((item) => item.sourceId);
  const existing = await loadPracticeItemsBySourceIds(supabase, userId, sourceIds);
  const existingSourceIds = new Set(existing.map((item) => item.sourceId).filter(Boolean));
  const missingRows = defaults
    .filter((item) => !existingSourceIds.has(item.sourceId))
    .map((item) => ({
      user_id: userId,
      item_type: item.itemType,
      source_id: item.sourceId,
      due_at: item.dueAt,
      metadata: item.metadata,
    }));

  if (missingRows.length > 0) {
    const { error } = await supabase
      .from("health_quest_review_items")
      .upsert(missingRows, {
        onConflict: "user_id,item_type,source_id",
        ignoreDuplicates: true,
      });

    if (error) {
      throw new Error(error.message);
    }
  }

  const seeded = await loadPracticeItemsBySourceIds(supabase, userId, sourceIds);
  const nowIso = now.toISOString();

  return seeded
    .filter((item) => !item.completedAt && item.dueAt <= nowIso)
    .sort((a, b) => a.dueAt.localeCompare(b.dueAt))
    .slice(0, 10);
}

async function loadPracticeItemsBySourceIds(
  supabase: SupabaseClient,
  userId: string,
  sourceIds: string[],
) {
  const { data, error } = await supabase
    .from("health_quest_review_items")
    .select("id,item_type,source_id,due_at,completed_at,metadata,created_at")
    .eq("user_id", userId)
    .in("source_id", sourceIds);

  if (error) {
    throw new Error(error.message);
  }

  return mapReviewRows(data ?? []);
}

function mapReviewRows(rows: Array<Record<string, unknown>>): ReviewItem[] {
  return rows.map((row) => ({
    id: String(row.id),
    itemType: row.item_type as ReviewItem["itemType"],
    sourceId: row.source_id as string | null,
    dueAt: String(row.due_at),
    completedAt: row.completed_at as string | null,
    metadata: (row.metadata ?? {}) as Record<string, unknown>,
  }));
}
