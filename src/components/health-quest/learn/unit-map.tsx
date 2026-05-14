"use client";

import { PlayBadge } from "../play/play-badge";
import { PlayCard } from "../play/play-card";
import { UnitNode } from "./unit-node";
import { lessonTracks } from "@/lib/health-quest/lesson-content";
import { questText } from "@/lib/health-quest/play-system";
import type { QuestLocale } from "@/lib/health-quest/types";

export function UnitMap({ locale = "zh-Hant" }: { locale?: QuestLocale }) {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
      <section className="rounded-[1.8rem] border border-sky-500/15 bg-card/80 p-5 shadow-sm backdrop-blur-xl">
        <PlayBadge tone="secondary">{locale === "en" ? "Learn" : "學習"}</PlayBadge>
        <h1 className="mt-3 text-3xl font-black tracking-normal sm:text-5xl">
          {locale === "en" ? "Health lesson map" : "健康小課地圖"}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          {locale === "en"
            ? "Tiny lesson cards, quick quizzes, practice, review, and weekly boss nodes. General education only."
            : "小卡、小測、練習、複習同 Boss 節點。只提供一般健康教育。"}
        </p>
      </section>

      <div className="grid gap-5">
        {lessonTracks.map((track) => (
          <PlayCard key={track.slug} className="overflow-hidden">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <PlayBadge tone="primary">Unit {track.unitNumber}</PlayBadge>
                <h2 className="mt-2 text-2xl font-black tracking-normal">{questText(track.title, locale)}</h2>
                <p className="mt-1 max-w-xl text-sm leading-6 text-muted-foreground">{questText(track.description, locale)}</p>
              </div>
              <PlayBadge tone="accent">{track.lessons.length} nodes</PlayBadge>
            </div>
            <div className="mt-5 flex gap-4 overflow-x-auto pb-2">
              {track.lessons.map((lesson, index) => (
                <div key={lesson.slug} className="shrink-0">
                  <UnitNode
                    trackSlug={track.slug}
                    trackIcon={track.icon}
                    lesson={lesson}
                    locale={locale}
                    state={deriveLessonState(index)}
                  />
                </div>
              ))}
            </div>
          </PlayCard>
        ))}
      </div>
    </div>
  );
}

function deriveLessonState(index: number) {
  if (index === 0) return "current";
  if (index < 2) return "completed";
  if (index === 5) return "review_due";
  return "locked";
}

