"use client";

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { PlayButton } from "../play/play-button";
import { PlayCard } from "../play/play-card";
import { PlayMascotPlaceholder } from "../play/play-mascot-placeholder";
import type { LessonNodeContent, LessonTrackContent } from "@/lib/health-quest/lesson-content";
import { gameCopy } from "@/lib/health-quest/game-copy";
import { questText } from "@/lib/health-quest/play-system";
import type { QuestLocale } from "@/lib/health-quest/types";

export function LessonResultScreen({
  locale,
  lesson,
  track,
}: {
  locale: QuestLocale;
  lesson: LessonNodeContent;
  track: LessonTrackContent;
}) {
  return (
    <div className="mx-auto grid min-h-[70dvh] w-full max-w-md place-items-center">
      <PlayCard className="grid justify-items-center gap-4 p-6 text-center">
        <PlayMascotPlaceholder mood="celebrating" size="lg" />
        <Sparkles aria-hidden="true" className="text-amber-500" />
        <div>
          <h1 className="text-3xl font-black tracking-normal">{questText(gameCopy.completeCounts, locale)}</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            +{lesson.xp} XP · {questText(lesson.title, locale)}
          </p>
        </div>
        <PlayButton asChild className="w-full">
          <Link href={`/learn/${track.slug}`}>
            {locale === "en" ? "Back to unit" : "返回單元"}
            <ArrowRight data-icon="inline-end" aria-hidden="true" />
          </Link>
        </PlayButton>
      </PlayCard>
    </div>
  );
}

