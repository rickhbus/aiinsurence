"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PlayButton } from "../play/play-button";
import { PlayProgressBar } from "../play/play-progress-bar";
import { LessonQuestionCard } from "./lesson-question-card";
import { LessonResultScreen } from "./lesson-result-screen";
import type { LessonNodeContent, LessonTrackContent } from "@/lib/health-quest/lesson-content";
import { questText } from "@/lib/health-quest/play-system";
import type { QuestLocale } from "@/lib/health-quest/types";
import { getSupabaseRequestHeaders } from "@/lib/supabase/client";

export function LessonRunner({
  track,
  lesson,
  locale,
}: {
  track: LessonTrackContent;
  lesson: LessonNodeContent;
  locale: QuestLocale;
}) {
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const [complete, setComplete] = useState(false);
  const [isPending, startTransition] = useTransition();
  const correctCount = Object.values(answers).filter(Boolean).length;
  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount >= lesson.questions.length;
  const passed = allAnswered && correctCount === lesson.questions.length;
  const progress = useMemo(() => Math.round((answeredCount / Math.max(1, lesson.questions.length)) * 100), [answeredCount, lesson.questions.length]);

  function completeLesson() {
    if (!passed) {
      toast.error(locale === "en" ? "Try the safest answers first." : "先揀最安全嘅答案。");
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
          body: JSON.stringify({ trackSlug: track.slug, lessonSlug: lesson.slug, answerId: lesson.quiz.correctAnswerId }),
        });
      } catch {
        // Local/demo mode still shows completion.
      } finally {
        setComplete(true);
      }
    });
  }

  if (complete) {
    return <LessonResultScreen locale={locale} lesson={lesson} track={track} />;
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
      <Button asChild variant="ghost" className="w-fit">
        <Link href={`/learn/${track.slug}`}>
          <ArrowLeft data-icon="inline-start" aria-hidden="true" />
          {locale === "en" ? "Unit map" : "返回單元"}
        </Link>
      </Button>
      <section className="rounded-[1.8rem] border border-teal-500/15 bg-card/80 p-5 shadow-sm backdrop-blur-xl">
        <p className="text-sm font-black text-teal-700 dark:text-teal-200">+{lesson.xp} XP</p>
        <h1 className="mt-1 text-3xl font-black tracking-normal">{questText(lesson.title, locale)}</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{questText(track.title, locale)}</p>
        <PlayProgressBar value={progress} className="mt-4" />
      </section>

      {lesson.cards.map((card) => (
        <section key={card.en} className="rounded-[1.35rem] border border-border/60 bg-card/70 p-4 text-sm leading-6 text-muted-foreground">
          {questText(card, locale)}
        </section>
      ))}

      {lesson.questions.map((question) => (
        <LessonQuestionCard
          key={question.id}
          question={question}
          locale={locale}
          onAnswer={(correct) => setAnswers((current) => ({ ...current, [question.id]: correct }))}
        />
      ))}

      <PlayButton type="button" disabled={isPending || !passed} onClick={completeLesson}>
        <CheckCircle2 data-icon="inline-start" aria-hidden="true" />
        {locale === "en" ? "Complete lesson" : "完成小課"}
      </PlayButton>
    </div>
  );
}

