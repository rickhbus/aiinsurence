"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { text } from "@/lib/health-quest/copy";
import type { LessonNodeContent, LessonTrackContent } from "@/lib/health-quest/lesson-content";
import type { QuestLocale } from "@/lib/health-quest/types";
import { getSupabaseRequestHeaders } from "@/lib/supabase/client";
import { LessonCard } from "./lesson-card";
import { LessonCompleteModal } from "./lesson-complete-modal";
import { LessonProgressBar } from "./lesson-progress-bar";
import { LessonQuiz } from "./lesson-quiz";

export function LessonPage({
  track,
  lesson,
  locale = "zh-Hant",
}: {
  track: LessonTrackContent;
  lesson: LessonNodeContent;
  locale?: QuestLocale;
}) {
  const [answer, setAnswer] = useState<string | null>(null);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const correct = answer === lesson.quiz.correctAnswerId;

  function complete() {
    if (!correct) {
      toast.error(locale === "en" ? "Try the gentlest answer." : "試吓揀最溫和嗰個答案。");
      return;
    }

    startTransition(async () => {
      try {
        const headers = await getSupabaseRequestHeaders({
          "Content-Type": "application/json",
          Accept: "application/json",
        });
        await fetch("/api/health-quest/learn/complete", {
          method: "POST",
          headers,
          body: JSON.stringify({ trackSlug: track.slug, lessonSlug: lesson.slug, answerId: answer }),
        });
      } catch {
        // Local/demo mode still shows completion.
      } finally {
        setCompleteOpen(true);
      }
    });
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
      <Button asChild variant="ghost" className="w-fit">
        <Link href={`/learn/${track.slug}`}>
          <ArrowLeft data-icon="inline-start" aria-hidden="true" />
          {locale === "en" ? "Track" : "返回路線"}
        </Link>
      </Button>
      <section className="rounded-3xl border border-border/60 bg-card/80 p-5">
        <Badge variant="secondary" className="mb-3">+{lesson.xp} XP</Badge>
        <h1 className="text-3xl font-bold tracking-normal">{text(lesson.title, locale)}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{text(track.title, locale)}</p>
        <div className="mt-4"><LessonProgressBar value={answer ? 100 : 75} /></div>
      </section>
      {lesson.cards.map((card, index) => <LessonCard key={card.en} card={card} index={index} locale={locale} />)}
      <LessonQuiz quiz={lesson.quiz} answer={answer} locale={locale} onAnswer={setAnswer} />
      <Button type="button" className="min-h-12 rounded-2xl" disabled={isPending || !correct} onClick={complete}>
        <CheckCircle2 data-icon="inline-start" aria-hidden="true" />
        {locale === "en" ? "Complete lesson" : "完成小課"}
      </Button>
      <p className="text-xs leading-5 text-muted-foreground">
        {locale === "en"
          ? "General wellness education only. Not diagnosis, treatment, or insurance advice."
          : "只提供一般健康教育。並非診斷、治療或保險建議。"}
      </p>
      <LessonCompleteModal open={completeOpen} onOpenChange={setCompleteOpen} locale={locale} />
    </div>
  );
}
