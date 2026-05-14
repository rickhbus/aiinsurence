"use client";

import Link from "next/link";
import { BookOpenCheck, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { text } from "@/lib/health-quest/copy";
import type { LessonTrackContent } from "@/lib/health-quest/lesson-content";
import type { QuestLocale } from "@/lib/health-quest/types";
import { LessonNode } from "./lesson-node";

export function LessonTrackCard({ track, locale }: { track: LessonTrackContent; locale: QuestLocale }) {
  return (
    <Card className="border-border/60 bg-card/86 shadow-sm">
      <CardHeader>
        <BookOpenCheck aria-hidden="true" className="text-primary" />
        <CardTitle>{text(track.title, locale)}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 text-sm text-muted-foreground">
        <p>{text(track.description, locale)}</p>
        {track.lessons.slice(0, 1).map((lesson) => (
          <LessonNode key={lesson.slug} trackSlug={track.slug} lesson={lesson} locale={locale} />
        ))}
      </CardContent>
      <CardFooter>
        <Button asChild variant="ghost">
          <Link href={`/learn/${track.slug}`}>
            {locale === "en" ? "Open track" : "開啟路線"}
            <ChevronRight data-icon="inline-end" aria-hidden="true" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
