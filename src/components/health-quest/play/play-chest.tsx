"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Gift, Lock, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function PlayChest({
  unlocked,
  opened,
  onOpen,
  label,
  className,
}: {
  unlocked: boolean;
  opened?: boolean;
  onOpen?: () => void;
  label: string;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();
  const Icon = opened ? Sparkles : unlocked ? Gift : Lock;

  return (
    <motion.button
      type="button"
      disabled={!unlocked || opened}
      aria-label={label}
      animate={!reduceMotion && unlocked && !opened ? { rotate: [0, -3, 3, 0], y: [0, -2, 0] } : undefined}
      transition={{ repeat: Infinity, duration: 1.4 }}
      onClick={onOpen}
      className={cn(
        "grid size-20 place-items-center rounded-[1.25rem] border-2 border-amber-300 bg-gradient-to-br from-amber-200 to-amber-500 text-slate-950 shadow-[0_10px_0_rgba(180,83,9,0.22)] transition",
        "disabled:cursor-not-allowed disabled:border-border disabled:from-muted disabled:to-muted disabled:text-muted-foreground disabled:shadow-none",
        opened && "border-emerald-300 from-emerald-200 to-teal-400",
        className,
      )}
    >
      <Icon aria-hidden="true" className="size-8" />
    </motion.button>
  );
}

