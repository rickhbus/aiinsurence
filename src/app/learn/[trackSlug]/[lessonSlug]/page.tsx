import { notFound } from "next/navigation";
import { LessonPage } from "@/components/health-quest/learn/lesson-page";
import { findLesson, findLessonTrack } from "@/lib/health-quest/lesson-content";

export default async function LessonRoute({
  params,
}: {
  params: Promise<{ trackSlug: string; lessonSlug: string }>;
}) {
  const { trackSlug, lessonSlug } = await params;
  const track = findLessonTrack(trackSlug);
  const lesson = findLesson(trackSlug, lessonSlug);

  if (!track || !lesson) {
    notFound();
  }

  return (
    <main className="min-h-dvh bg-[linear-gradient(160deg,var(--health-bg-start),var(--background)_45%,var(--health-bg-end))] px-4 py-6">
      <LessonPage track={track} lesson={lesson} locale="zh-Hant" />
    </main>
  );
}
