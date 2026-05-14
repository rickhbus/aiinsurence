import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PlayBadge } from "@/components/health-quest/play/play-badge";
import { PlayCard } from "@/components/health-quest/play/play-card";
import { UnitNode } from "@/components/health-quest/learn/unit-node";
import { findLessonTrack } from "@/lib/health-quest/lesson-content";
import { questText } from "@/lib/health-quest/play-system";

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
        <PlayCard>
          <PlayBadge tone="primary">Unit {track.unitNumber}</PlayBadge>
          <h1 className="mt-3 text-3xl font-black tracking-normal">{questText(track.title, "zh-Hant")}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{questText(track.description, "zh-Hant")}</p>
          <div className="mt-6 flex gap-4 overflow-x-auto pb-2">
            {track.lessons.map((lesson, index) => (
              <div key={lesson.slug} className="shrink-0">
                <UnitNode
                  trackSlug={track.slug}
                  trackIcon={track.icon}
                  lesson={lesson}
                  locale="zh-Hant"
                  state={index === 0 ? "current" : index < 2 ? "completed" : index === 5 ? "review_due" : "locked"}
                />
              </div>
            ))}
          </div>
        </PlayCard>
      </div>
    </main>
  );
}
