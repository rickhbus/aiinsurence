import { z } from "zod";
import { logQuestReviewCheckin } from "@/lib/health-quest/server";
import { insertXPEvent } from "@/lib/health-quest/storage";
import type { XPEvent } from "@/lib/health-quest/types";
import {
  getAuthenticatedSupabase,
  readValidatedJson,
} from "@/lib/server/persistence-auth";
import { getRequestId, jsonWithRequestId } from "@/lib/server/request-context";

export const dynamic = "force-dynamic";

const learnCompletionSchema = z.object({
  lessonSlug: z.string().trim().min(1).max(80),
});

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  const parsed = await readValidatedJson(request, learnCompletionSchema);

  if (!parsed.ok) {
    return parsed.response;
  }

  const auth = await getAuthenticatedSupabase(request);

  if (!auth.ok) {
    return auth.response;
  }

  try {
    const now = new Date().toISOString();
    await logQuestReviewCheckin({
      supabase: auth.supabase,
      userId: auth.user.id,
      questType: "learn",
      occurredAt: now,
    });

    const event: XPEvent = {
      id: `lesson-${parsed.data.lessonSlug}-${now}`,
      amount: 5,
      reason: "lesson_completed",
      createdAt: now,
    };
    await insertXPEvent(auth.supabase, auth.user.id, event, {
      source: "health_quest",
      lessonSlug: parsed.data.lessonSlug,
    });

    return jsonWithRequestId({ saved: true, xp: 5 }, undefined, requestId);
  } catch {
    return jsonWithRequestId(
      { error: "Lesson completion is temporarily unavailable." },
      { status: 500 },
      requestId,
    );
  }
}
