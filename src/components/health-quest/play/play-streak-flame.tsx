"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";

export function PlayStreakFlame({
  streak,
  protectedToday,
  className,
}: {
  streak: number;
  protectedToday?: boolean;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.span
      animate={reduceMotion ? undefined : { scale: [1, 1.08, 1] }}
      transition={{ repeat: Infinity, duration: 2 }}
      className={cn(
        "inline-flex h-11 min-w-16 items-center justify-center gap-1 rounded-full border border-amber-400/40 bg-amber-300/20 px-3 text-sm font-black text-amber-800 dark:text-amber-200",
        protectedToday && "border-emerald-400/40 bg-emerald-400/15 text-emerald-700 dark:text-emerald-200",
        className,
      )}
    >
      <Flame aria-hidden="true" className="size-5 fill-current" />
      {streak}
    </motion.span>
  );
}

