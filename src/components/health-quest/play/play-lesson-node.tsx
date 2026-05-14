"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { Check, Lock } from "lucide-react";
import { PlayBadge } from "./play-badge";
import { cn } from "@/lib/utils";

export type PlayLessonNodeState = "locked" | "current" | "completed" | "perfect" | "review_due";

export function PlayLessonNode({
  icon: Icon,
  state,
  title,
  xp,
  onClick,
  className,
}: {
  icon: LucideIcon;
  state: PlayLessonNodeState;
  title: string;
  xp: number;
  onClick?: () => void;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();
  const locked = state === "locked";
  const complete = state === "completed" || state === "perfect";
  const NodeIcon = locked ? Lock : complete ? Check : Icon;

  return (
    <motion.button
      type="button"
      disabled={locked}
      onClick={onClick}
      animate={!reduceMotion && state === "current" ? { scale: [1, 1.05, 1] } : undefined}
      transition={{ repeat: Infinity, duration: 1.8 }}
      className={cn(
        "group grid justify-items-center gap-2 text-center disabled:cursor-not-allowed",
        locked && "opacity-55",
        className,
      )}
    >
      <span
        className={cn(
          "grid size-20 place-items-center rounded-full border-4 text-white shadow-[0_10px_0_rgba(15,23,42,0.12)] transition group-active:translate-y-1 group-active:shadow-[0_5px_0_rgba(15,23,42,0.12)]",
          state === "current" && "border-teal-200 bg-teal-600 ring-4 ring-teal-400/25",
          state === "locked" && "border-border bg-muted text-muted-foreground shadow-none",
          state === "completed" && "border-emerald-200 bg-emerald-600",
          state === "perfect" && "border-amber-200 bg-gradient-to-br from-amber-400 to-emerald-500 text-slate-950",
          state === "review_due" && "border-sky-200 bg-sky-500",
        )}
      >
        <NodeIcon aria-hidden="true" className="size-8" />
      </span>
      <span className="max-w-28 text-xs font-bold leading-4">{title}</span>
      <PlayBadge tone={state === "review_due" ? "secondary" : complete ? "success" : "primary"}>+{xp} XP</PlayBadge>
    </motion.button>
  );
}

