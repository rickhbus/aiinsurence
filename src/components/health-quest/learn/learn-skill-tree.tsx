"use client";

import { Badge } from "@/components/ui/badge";
import { lessonTracks } from "@/lib/health-quest/lesson-content";
import type { QuestLocale } from "@/lib/health-quest/types";
import { LessonTrackCard } from "./lesson-track-card";

export function LearnSkillTree({ locale = "zh-Hant" }: { locale?: QuestLocale }) {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5">
      <section className="rounded-3xl border border-border/60 bg-card/80 p-5 shadow-sm">
        <Badge variant="secondary" className="mb-3">Learn</Badge>
        <h1 className="text-3xl font-bold tracking-normal">{locale === "en" ? "Learn one tiny health idea" : "學一個小小健康概念"}</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {locale === "en" ? "30-90 second lessons. General wellness education only." : "30-90 秒小課。只提供一般健康教育。"}
        </p>
      </section>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {lessonTracks.map((track) => <LessonTrackCard key={track.slug} track={track} locale={locale} />)}
      </div>
    </div>
  );
}
