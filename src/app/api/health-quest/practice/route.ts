import { z } from "zod";
import { insertXPEvent } from "@/lib/health-quest/storage";
import { buildPracticeSessionEventKey, getDefaultPracticeItems, practiceTypes } from "@/lib/health-quest/review-scheduler";
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
    const { data, error } = await auth.supabase
      .from("health_quest_review_items")
      .select("id,item_type,source_id,due_at,completed_at,metadata,created_at")
      .eq("user_id", auth.user.id)
      .lte("due_at", now)
      .is("completed_at", null)
      .order("due_at", { ascending: true })
      .limit(10);

    if (error) {
      throw new Error(error.message);
    }

    const items = (data ?? []).map((row) => ({
      id: String(row.id),
      itemType: row.item_type,
      sourceId: row.source_id as string | null,
      dueAt: String(row.due_at),
      completedAt: row.completed_at as string | null,
      metadata: (row.metadata ?? {}) as Record<string, unknown>,
    }));

    return jsonWithRequestId({ items: items.length ? items : getDefaultPracticeItems() }, undefined, requestId);
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
    await auth.supabase
      .from("health_quest_review_items")
      .update({ completed_at: new Date().toISOString() })
      .eq("user_id", auth.user.id)
      .eq("id", parsed.data.itemId);

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

    return jsonWithRequestId({ completed: true, xp: 5 }, undefined, requestId);
  } catch {
    return jsonWithRequestId({ error: "Practice could not be completed." }, { status: 500 }, requestId);
  }
}

