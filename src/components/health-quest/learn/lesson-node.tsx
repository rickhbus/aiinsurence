"use client";

import Link from "next/link";
import { CheckCircle2, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { text } from "@/lib/health-quest/copy";
import type { LessonNodeContent } from "@/lib/health-quest/lesson-content";
import type { QuestLocale } from "@/lib/health-quest/types";

export function LessonNode({ trackSlug, lesson, locale, done }: { trackSlug: string; lesson: LessonNodeContent; locale: QuestLocale; done?: boolean }) {
  return (
    <Button asChild variant={done ? "default" : "outline"} className="min-h-14 justify-start rounded-2xl">
      <Link href={`/learn/${trackSlug}/${lesson.slug}`}>
        {done ? <CheckCircle2 data-icon="inline-start" aria-hidden="true" /> : <Circle data-icon="inline-start" aria-hidden="true" />}
        {text(lesson.title, locale)}
      </Link>
    </Button>
  );
}
