"use client";

import { useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PlayCard } from "../play/play-card";
import { PlayBadge } from "../play/play-badge";
import type { LessonQuestion } from "@/lib/health-quest/lesson-content";
import { questText } from "@/lib/health-quest/play-system";
import type { QuestLocale } from "@/lib/health-quest/types";
import { cn } from "@/lib/utils";

export function LessonQuestionCard({
  question,
  locale,
  onAnswer,
}: {
  question: LessonQuestion;
  locale: QuestLocale;
  onAnswer: (correct: boolean, answerId: string) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const answered = selected !== null;
  const correct = selected === question.correctAnswerId;

  function choose(answerId: string) {
    setSelected(answerId);
    onAnswer(answerId === question.correctAnswerId, answerId);
  }

  return (
    <PlayCard className="grid gap-3">
      <div className="flex items-center justify-between gap-3">
        <PlayBadge tone="secondary">{question.type.replace(/_/g, " ")}</PlayBadge>
        {answered ? (
          correct
            ? <CheckCircle2 aria-hidden="true" className="text-emerald-500" />
            : <XCircle aria-hidden="true" className="text-amber-500" />
        ) : null}
      </div>
      <h3 className="text-lg font-black tracking-normal">{questText(question.question, locale)}</h3>
      <div className="grid gap-2">
        {question.answers.map((answer) => {
          const active = selected === answer.id;

          return (
            <Button
              key={answer.id}
              type="button"
              variant={active ? "default" : "outline"}
              className={cn("min-h-12 justify-start rounded-2xl text-left text-sm whitespace-normal", active && correct && "bg-emerald-600 text-white", active && !correct && "bg-amber-500 text-slate-950")}
              onClick={() => choose(answer.id)}
            >
              {questText(answer.text, locale)}
            </Button>
          );
        })}
      </div>
      {answered ? (
        <p className="rounded-2xl bg-muted/45 p-3 text-sm leading-6 text-muted-foreground">
          {questText(question.explanation, locale)}
        </p>
      ) : null}
    </PlayCard>
  );
}

