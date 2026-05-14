"use client";

import { Button } from "@/components/ui/button";
import { text } from "@/lib/health-quest/copy";
import type { LessonQuiz as LessonQuizType } from "@/lib/health-quest/lesson-content";
import type { QuestLocale } from "@/lib/health-quest/types";

export function LessonQuiz({
  quiz,
  answer,
  locale,
  onAnswer,
}: {
  quiz: LessonQuizType;
  answer: string | null;
  locale: QuestLocale;
  onAnswer: (answer: string) => void;
}) {
  return (
    <div className="grid gap-3 rounded-3xl border border-border/60 bg-card/80 p-4">
      <p className="font-semibold">{text(quiz.question, locale)}</p>
      {quiz.answers.map((option) => (
        <Button
          key={option.id}
          type="button"
          variant={answer === option.id ? "default" : "outline"}
          className="min-h-12 justify-start rounded-2xl whitespace-normal"
          onClick={() => onAnswer(option.id)}
        >
          {text(option.text, locale)}
        </Button>
      ))}
    </div>
  );
}
