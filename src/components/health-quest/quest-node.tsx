"use client";

import { motion } from "framer-motion";
import {
  Apple,
  BedDouble,
  BookOpenCheck,
  Check,
  ClipboardList,
  Droplets,
  Dumbbell,
  HeartPulse,
  Lock,
  Moon,
  ShieldAlert,
  Smile,
  Stethoscope,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { text } from "@/lib/health-quest/copy";
import type { DailyQuest, QuestLocale, QuestStatus, QuestType } from "@/lib/health-quest/types";
import { cn } from "@/lib/utils";

const questIcons: Record<QuestType, LucideIcon> = {
  wake: Moon,
  water: Droplets,
  meal: Apple,
  movement: Dumbbell,
  mood: Smile,
  toilet_optional: HeartPulse,
  sleep_prep: BedDouble,
  health_review: ClipboardList,
  doctor_prep: Stethoscope,
  recovery: HeartPulse,
  learn: BookOpenCheck,
};

export function QuestNode({
  quest,
  locale,
  busy,
  onComplete,
  onSkip,
}: {
  quest: DailyQuest;
  locale: QuestLocale;
  busy?: boolean;
  onComplete: (quest: DailyQuest) => void;
  onSkip: (quest: DailyQuest) => void;
}) {
  const Icon = quest.status === "blocked_by_safety" ? ShieldAlert : quest.status === "locked" ? Lock : quest.status === "done" ? Check : questIcons[quest.type];
  const active = quest.status === "active" || quest.status === "recovery";
  const disabled = busy || quest.status === "locked" || quest.status === "done" || quest.status === "skipped" || quest.status === "blocked_by_safety";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
      className="relative"
    >
      <Card className={cn(
        "border-border/60 bg-card/88 shadow-sm transition-all",
        active && "ring-2 ring-primary/45 shadow-md shadow-primary/10",
        quest.status === "done" && "bg-emerald-500/10 ring-emerald-500/25",
        quest.status === "recovery" && "bg-amber-500/10 ring-amber-500/25",
        quest.status === "blocked_by_safety" && "bg-destructive/10 ring-destructive/30",
        quest.status === "locked" && "opacity-65",
      )}>
        <CardHeader className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
          <motion.span
            animate={active ? { scale: [1, 1.06, 1] } : { scale: 1 }}
            transition={active ? { repeat: Infinity, duration: 1.8 } : undefined}
            className={cn(
              "grid size-12 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-sm",
              quest.status === "done" && "bg-emerald-600",
              quest.status === "recovery" && "bg-amber-600",
              quest.status === "blocked_by_safety" && "bg-destructive",
              quest.status === "locked" && "bg-muted text-muted-foreground",
            )}
          >
            <Icon aria-hidden="true" />
          </motion.span>
          <div className="min-w-0">
            <CardTitle className="truncate text-base">{text(quest.title, locale)}</CardTitle>
            <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">{text(quest.description, locale)}</p>
          </div>
          <Badge variant={quest.status === "done" ? "default" : "secondary"}>
            {quest.status === "done" ? "Done" : `+${quest.xp} XP`}
          </Badge>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <QuestStatusBadge status={quest.status} />
          <div className="flex gap-2">
            {!quest.required && quest.status !== "done" ? (
              <Button type="button" variant="ghost" disabled={busy || quest.status === "locked"} onClick={() => onSkip(quest)}>
                {locale === "zh-Hant" ? "跳過" : "Skip"}
              </Button>
            ) : null}
            <Button type="button" className="min-h-11 flex-1 sm:flex-none" disabled={disabled} onClick={() => onComplete(quest)}>
              {quest.status === "done" ? <Check data-icon="inline-start" aria-hidden="true" /> : null}
              {quest.status === "done" ? text(quest.completedLabel, locale) : text(quest.actionLabel, locale)}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function QuestStatusBadge({ status }: { status: QuestStatus }) {
  const label: Record<QuestStatus, string> = {
    locked: "Locked",
    active: "Active",
    done: "Done",
    skipped: "Skipped",
    recovery: "Recovery",
    blocked_by_safety: "Safety first",
  };

  return <Badge variant={status === "blocked_by_safety" ? "destructive" : "outline"}>{label[status]}</Badge>;
}
