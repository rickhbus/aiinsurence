import { z } from "zod";
import { trackHealthQuestEvent } from "@/lib/health-quest/analytics";
import { getLessonBySlug } from "@/lib/health-quest/lessons";
import { insertXPEvent } from "@/lib/health-quest/storage";
import type { XPEvent } from "@/lib/health-quest/types";
import { getAuthenticatedSupabase, readValidatedJson } from "@/lib/server/persistence-auth";
import { getRequestId, jsonWithRequestId } from "@/lib/server/request-context";

export const dynamic = "force-dynamic";

const completeLessonSchema = z.object({
  trackSlug: z.string().trim().min(1).max(120),
  lessonSlug: z.string().trim().min(1).max(120),
  answerId: z.string().trim().min(1).max(20),
});

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  const parsed = await readValidatedJson(request, completeLessonSchema);

  if (!parsed.ok) {
    return parsed.response;
  }

  const auth = await getAuthenticatedSupabase(request);

  if (!auth.ok) {
    return auth.response;
  }

  const localLesson = getLessonBySlug(parsed.data.trackSlug, parsed.data.lessonSlug);

  if (!localLesson || parsed.data.answerId !== localLesson.lesson.quiz.correctAnswerId) {
    return jsonWithRequestId({ error: "Lesson answer is not complete." }, { status: 400 }, requestId);
  }

  try {
    const trackRow = await auth.supabase
      .from("lesson_tracks")
      .select("id")
      .eq("slug", parsed.data.trackSlug)
      .maybeSingle();

    if (trackRow.error || !trackRow.data) {
      throw new Error(trackRow.error?.message ?? "Track not found");
    }

    const lessonRow = await auth.supabase
      .from("lesson_nodes")
      .select("id,slug")
      .eq("track_id", trackRow.data.id)
      .eq("slug", parsed.data.lessonSlug)
      .maybeSingle();

    if (lessonRow.error || !lessonRow.data) {
      throw new Error(lessonRow.error?.message ?? "Lesson not found");
    }

    const existing = await auth.supabase
      .from("user_lesson_progress")
      .select("id,status")
      .eq("user_id", auth.user.id)
      .eq("lesson_id", lessonRow.data.id)
      .maybeSingle();

    const completedNow = existing.data?.status !== "completed";

    if (completedNow) {
      const { error } = await auth.supabase
        .from("user_lesson_progress")
        .upsert({
          user_id: auth.user.id,
          lesson_id: lessonRow.data.id,
          status: "completed",
          score: 1,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id,lesson_id" });

      if (error) {
        throw new Error(error.message);
      }

      const event: XPEvent = {
        id: `lesson-${parsed.data.trackSlug}-${parsed.data.lessonSlug}`,
        amount: localLesson.lesson.xp,
        reason: `lesson_completed:${parsed.data.trackSlug}:${parsed.data.lessonSlug}`,
        createdAt: new Date().toISOString(),
      };
      await insertXPEvent(auth.supabase, auth.user.id, event, {
        source: "health_quest",
        trackSlug: parsed.data.trackSlug,
        lessonSlug: parsed.data.lessonSlug,
        unlocksQuestType: localLesson.lesson.unlocksQuestType ?? null,
      });
    }

    await trackHealthQuestEvent(auth.supabase, {
      userId: auth.user.id,
      eventName: localLesson.track.slug === "insurance-education" ? "insurance_lesson_completed" : "lesson_completed",
      properties: {
        trackSlug: parsed.data.trackSlug,
        lessonSlug: parsed.data.lessonSlug,
        completedNow,
      },
    }).catch(() => undefined);

    return jsonWithRequestId({ completed: true, completedNow, xp: completedNow ? localLesson.lesson.xp : 0 }, undefined, requestId);
  } catch {
    return jsonWithRequestId({ error: "Lesson completion is temporarily unavailable." }, { status: 500 }, requestId);
  }
}
