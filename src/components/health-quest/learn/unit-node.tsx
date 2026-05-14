"use client";

import { useRouter } from "next/navigation";
import { Apple, BookOpenCheck, Crown, Droplets, Dumbbell, Moon, ShieldCheck, Smile, Sparkles, Stethoscope, Users, type LucideIcon } from "lucide-react";
import { PlayLessonNode, type PlayLessonNodeState } from "../play/play-lesson-node";
import type { LessonNodeContent } from "@/lib/health-quest/lesson-content";
import { questText } from "@/lib/health-quest/play-system";
import type { QuestLocale } from "@/lib/health-quest/types";

const icons: Record<string, LucideIcon> = {
  sparkles: Sparkles,
  droplets: Droplets,
  smile: Smile,
  moon: Moon,
  apple: Apple,
  dumbbell: Dumbbell,
  stethoscope: Stethoscope,
  users: Users,
  "shield-check": ShieldCheck,
};

export function UnitNode({
  trackSlug,
  trackIcon,
  lesson,
  locale,
  state,
}: {
  trackSlug: string;
  trackIcon: string;
  lesson: LessonNodeContent;
  locale: QuestLocale;
  state: PlayLessonNodeState;
}) {
  const router = useRouter();
  const Icon = lesson.kind === "boss" ? Crown : icons[trackIcon] ?? BookOpenCheck;

  return (
    <PlayLessonNode
      icon={Icon}
      state={state}
      title={questText(lesson.title, locale)}
      xp={lesson.xp}
      onClick={() => router.push(`/learn/${trackSlug}/${lesson.slug}`)}
    />
  );
}
