"use client";

import { motion, useReducedMotion } from "framer-motion";
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
import { PlayBadge } from "./play/play-badge";
import { PlayPathConnector } from "./play/play-path-connector";
import { questText } from "@/lib/health-quest/play-system";
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

export function GamePathNode({
  quest,
  locale,
  last,
  onSelect,
}: {
  quest: DailyQuest;
  locale: QuestLocale;
  last?: boolean;
  onSelect: (quest: DailyQuest) => void;
}) {
  const reduceMotion = useReducedMotion();
  const active = quest.status === "active" || quest.status === "recovery";
  const done = quest.status === "done";
  const locked = quest.status === "locked";
  const safety = quest.status === "blocked_by_safety";
  const Icon = safety ? ShieldAlert : locked ? Lock : done ? Check : questIcons[quest.type];
  const side = quest.orderIndex % 2 === 0 ? "translate-x-[-34px] sm:translate-x-[-58px]" : "translate-x-[34px] sm:translate-x-[58px]";

  return (
    <div className={cn("relative grid justify-items-center pb-14", last && "pb-3")}>
      <motion.button
        type="button"
        onClick={() => onSelect(quest)}
        initial={false}
        animate={!reduceMotion && active ? { y: [0, -4, 0], scale: [1, 1.035, 1] } : undefined}
        transition={{ repeat: Infinity, duration: 1.65 }}
        className={cn("group relative grid justify-items-center gap-2", side)}
        aria-label={questText(quest.title, locale)}
      >
        <span
          className={cn(
            "grid size-24 place-items-center rounded-full border-[6px] text-white shadow-[0_12px_0_rgba(15,23,42,0.14)] transition group-active:translate-y-1 group-active:shadow-[0_6px_0_rgba(15,23,42,0.14)]",
            active && "border-teal-200 bg-teal-600 ring-8 ring-teal-400/20",
            done && "border-emerald-200 bg-emerald-600",
            locked && "border-border bg-muted text-muted-foreground shadow-none",
            quest.status === "recovery" && "border-amber-200 bg-amber-500 text-slate-950",
            safety && "border-red-200 bg-red-600",
            quest.status === "skipped" && "border-slate-200 bg-slate-400 text-white",
          )}
        >
          <Icon aria-hidden="true" className="size-10" />
        </span>
        <div className="grid justify-items-center gap-1">
          <span className="max-w-36 rounded-full bg-background/80 px-3 py-1 text-center text-xs font-black shadow-sm backdrop-blur">
            {questText(quest.title, locale)}
          </span>
          <PlayBadge tone={done ? "success" : safety ? "safety" : quest.status === "recovery" ? "recovery" : locked ? "muted" : "secondary"}>
            {done ? (locale === "en" ? "Done" : "完成") : `+${quest.xp} XP`}
          </PlayBadge>
        </div>
      </motion.button>
      {!last ? <PlayPathConnector state={connectorState(quest.status)} /> : null}
    </div>
  );
}

function connectorState(status: QuestStatus) {
  if (status === "done") return "done";
  if (status === "locked") return "locked";
  if (status === "recovery") return "recovery";
  if (status === "blocked_by_safety") return "safety";
  return "normal";
}

