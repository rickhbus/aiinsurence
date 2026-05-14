"use client";

import type { LessonNodeContent, LessonTrackContent } from "@/lib/health-quest/lesson-content";
import type { QuestLocale } from "@/lib/health-quest/types";
import { LessonRunner } from "./lesson-runner";

export function LessonPage({
  track,
  lesson,
  locale = "zh-Hant",
}: {
  track: LessonTrackContent;
  lesson: LessonNodeContent;
  locale?: QuestLocale;
}) {
  return <LessonRunner track={track} lesson={lesson} locale={locale} />;
}

