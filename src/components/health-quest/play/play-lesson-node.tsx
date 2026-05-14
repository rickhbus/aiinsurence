"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { Check, Crown, Lock } from "lucide-react";
import { PlayBadge } from "./play-badge";
import { cn } from "@/lib/utils";

export type PlayLessonNodeState = "locked" | "current" | "completed" | "perfect" | "review_due" | "boss";

export function PlayLessonNode({
  icon: Icon,
  state,
  title,
  xp,
  cue,
  onClick,
  className,
}: {
  icon: LucideIcon;
  state: PlayLessonNodeState;
  title: string;
  xp: number;
  cue?: string;
  onClick?: () => void;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();
  const locked = state === "locked";
  const complete = state === "completed" || state === "perfect";
  const boss = state === "boss";
  const NodeIcon = locked ? Lock : complete ? Check : boss ? Crown : Icon;

  return (
    <motion.button
      type="button"
      disabled={locked}
      onClick={onClick}
      animate={!reduceMotion && (state === "current" || boss) ? { scale: [1, 1.05, 1] } : undefined}
      transition={{ repeat: Infinity, duration: boss ? 2.25 : 1.8 }}
      className={cn(
        "group grid justify-items-center gap-2 text-center disabled:cursor-not-allowed",
        locked && "opacity-55",
        className,
      )}
    >
      <span
        className={cn(
          "play-pressable grid size-20 place-items-center rounded-full border-4 text-white transition",
          state === "current" && "border-lime-200 bg-teal-600 ring-4 ring-lime-400/25",
          state === "locked" && "border-border bg-muted text-muted-foreground shadow-none",
          state === "completed" && "border-emerald-200 bg-emerald-600",
          state === "perfect" && "border-amber-200 bg-gradient-to-br from-amber-400 to-emerald-500 text-slate-950",
          state === "review_due" && "border-sky-200 bg-sky-500",
          boss && "border-amber-200 bg-gradient-to-br from-amber-300 via-amber-500 to-teal-500 text-slate-950 ring-4 ring-amber-300/25",
        )}
      >
        <NodeIcon aria-hidden="true" className="size-8" />
      </span>
      <span className="max-w-28 text-xs font-black leading-4">{title}</span>
      <div className="flex flex-wrap justify-center gap-1">
        {cue ? <PlayBadge tone={locked ? "muted" : state === "review_due" ? "secondary" : boss ? "accent" : complete ? "success" : "primary"}>{cue}</PlayBadge> : null}
        <PlayBadge tone={state === "review_due" ? "secondary" : boss ? "accent" : complete ? "success" : "primary"}>+{xp} XP</PlayBadge>
      </div>
    </motion.button>
  );
}
