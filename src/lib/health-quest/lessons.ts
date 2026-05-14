import type { SupabaseClient } from "@supabase/supabase-js";
import { lessonTracks, type LessonNodeContent } from "./lesson-content";
import type { XPEvent } from "./types";
import { buildLessonEventKey } from "./xp";

type LessonClient = Pick<SupabaseClient, "from">;

export function listLessonTracks() {
  return lessonTracks;
}

export function getLessonBySlug(trackSlug: string, lessonSlug: string) {
  const track = lessonTracks.find((item) => item.slug === trackSlug);
  const lesson = track?.lessons.find((item) => item.slug === lessonSlug);

  return track && lesson ? { track, lesson } : null;
}

export function buildLessonXpEvent(lesson: LessonNodeContent, now = new Date().toISOString()): XPEvent {
  return {
    id: `lesson-${lesson.slug}-${now}`,
    amount: lesson.xp,
    reason: `lesson_completed:${lesson.slug}`,
    createdAt: now,
    eventKey: buildLessonEventKey(lesson.slug),
  };
}

export async function loadLessonProgress(supabase: LessonClient, userId: string) {
  const { data, error } = await supabase
    .from("user_lesson_progress")
    .select("lesson_id,status,score,completed_at,lesson_nodes(slug,lesson_tracks(slug))")
    .eq("user_id", userId);

  if (error) {
    return [];
  }

  return data ?? [];
}

export async function completeLessonOnce({
  supabase,
  userId,
  lessonId,
  score,
}: {
  supabase: LessonClient;
  userId: string;
  lessonId: string;
  score: number;
}) {
  const existing = await supabase
    .from("user_lesson_progress")
    .select("id,status,completed_at")
    .eq("user_id", userId)
    .eq("lesson_id", lessonId)
    .maybeSingle();

  if (existing.error) {
    throw new Error(existing.error.message);
  }

  if (existing.data?.status === "completed") {
    return { completedNow: false, progress: existing.data };
  }

  const { data, error } = await supabase
    .from("user_lesson_progress")
    .upsert({
      user_id: userId,
      lesson_id: lessonId,
      status: "completed",
      score,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id,lesson_id" })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return { completedNow: true, progress: data };
}
