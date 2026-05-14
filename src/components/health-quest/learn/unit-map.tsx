"use client";

import { BookOpenCheck, CheckCircle2, Crown, Lock, Sparkles } from "lucide-react";
import { PlayBadge } from "../play/play-badge";
import { PlayCard } from "../play/play-card";
import { PlayMascotPlaceholder } from "../play/play-mascot-placeholder";
import { UnitNode } from "./unit-node";
import type { PlayLessonNodeState } from "../play/play-lesson-node";
import { lessonTracks } from "@/lib/health-quest/lesson-content";
import { questText, turtleCoachIdentity } from "@/lib/health-quest/play-system";
import type { QuestLocale } from "@/lib/health-quest/types";

export function UnitMap({ locale = "zh-Hant" }: { locale?: QuestLocale }) {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5">
      <section className="play-island-card overflow-hidden rounded-[1.8rem] p-5 sm:p-6">
        <div className="grid gap-5 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <PlayBadge tone="secondary">{locale === "en" ? "Lesson path" : "小課路線"}</PlayBadge>
            <h1 className="mt-3 text-3xl font-black tracking-normal sm:text-5xl">
              {locale === "en" ? "Health skill tree" : "健康技能樹"}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              {locale === "en"
                ? "Follow short lesson nodes, quick practice, review stops, and chest-style boss checks. General education only."
                : "沿住小課節點、快速練習、複習點同寶箱 Boss 回顧前進。只提供一般健康教育。"}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <LegendItem icon={CheckCircle2} label={locale === "en" ? "Completed" : "已完成"} tone="success" />
              <LegendItem icon={Sparkles} label={locale === "en" ? "Current" : "目前"} tone="primary" />
              <LegendItem icon={BookOpenCheck} label={locale === "en" ? "Review" : "複習"} tone="secondary" />
              <LegendItem icon={Lock} label={locale === "en" ? "Locked" : "未解鎖"} tone="muted" />
              <LegendItem icon={Crown} label={locale === "en" ? "Boss chest" : "Boss 寶箱"} tone="accent" />
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-[1.5rem] border border-teal-500/20 bg-teal-500/10 p-3">
            <PlayMascotPlaceholder mood="thinking" size="lg" />
            <div className="max-w-40">
              <p className="text-sm font-black text-teal-700 dark:text-teal-200">
                {questText(turtleCoachIdentity.mascot, locale)}
              </p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                {locale === "en" ? "One small lesson, one safer next step." : "一個小課，一個更安全下一步。"}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6">
        {lessonTracks.map((track) => (
          <PlayCard key={track.slug} className="overflow-hidden p-0">
            <div className="border-b border-white/60 p-5 dark:border-white/10">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <PlayBadge tone="primary">Unit {track.unitNumber}</PlayBadge>
                  <h2 className="mt-2 text-2xl font-black tracking-normal">{questText(track.title, locale)}</h2>
                  <p className="mt-1 max-w-xl text-sm leading-6 text-muted-foreground">{questText(track.description, locale)}</p>
                </div>
                <div className="flex flex-wrap gap-2 sm:justify-end">
                  <PlayBadge tone="accent">{track.lessons.length} nodes</PlayBadge>
                  <PlayBadge tone="secondary">{locale === "en" ? "Path progress" : "路線進度"}</PlayBadge>
                </div>
              </div>
            </div>
            <div className="relative px-5 py-7">
              <div className="play-node-track absolute left-1/2 top-8 h-[calc(100%-4rem)] w-3 -translate-x-1/2 rounded-full opacity-80" aria-hidden="true" />
              <div className="relative z-10 grid gap-5">
                {track.lessons.map((lesson, index) => (
                  <div
                    key={lesson.slug}
                    className={index % 2 === 0 ? "grid justify-items-start sm:pl-[12%]" : "grid justify-items-end sm:pr-[12%]"}
                  >
                    <UnitNode
                      trackSlug={track.slug}
                      trackIcon={track.icon}
                      lesson={lesson}
                      locale={locale}
                      state={deriveLessonState(index, lesson.kind)}
                    />
                  </div>
                ))}
              </div>
            </div>
          </PlayCard>
        ))}
      </div>
    </div>
  );
}

function LegendItem({
  icon: Icon,
  label,
  tone,
}: {
  icon: typeof Sparkles;
  label: string;
  tone: "primary" | "secondary" | "accent" | "success" | "muted";
}) {
  return (
    <PlayBadge tone={tone}>
      <Icon aria-hidden="true" className="size-4" />
      {label}
    </PlayBadge>
  );
}

function deriveLessonState(index: number, kind: string): PlayLessonNodeState {
  if (kind === "boss") return "boss";
  if (kind === "review") return "review_due";
  if (index < 2) return "completed";
  if (index === 2) return "current";
  return "locked";
}
