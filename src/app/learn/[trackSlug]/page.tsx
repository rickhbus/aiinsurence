import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LessonTrackCard } from "@/components/health-quest/learn/lesson-track-card";
import { findLessonTrack } from "@/lib/health-quest/lesson-content";

export default async function LearnTrackRoute({
  params,
}: {
  params: Promise<{ trackSlug: string }>;
}) {
  const { trackSlug } = await params;
  const track = findLessonTrack(trackSlug);

  if (!track) {
    notFound();
  }

  return (
    <main className="min-h-dvh bg-[linear-gradient(160deg,var(--health-bg-start),var(--background)_45%,var(--health-bg-end))] px-4 py-6">
      <div className="mx-auto flex max-w-4xl flex-col gap-5">
        <Button asChild variant="ghost" className="w-fit">
          <Link href="/learn">
            <ArrowLeft data-icon="inline-start" aria-hidden="true" />
            學習 / Learn
          </Link>
        </Button>
        <LessonTrackCard track={track} locale="zh-Hant" />
      </div>
    </main>
  );
}
