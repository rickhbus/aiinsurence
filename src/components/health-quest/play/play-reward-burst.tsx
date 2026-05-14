"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Gem, Sparkles } from "lucide-react";

export function PlayRewardBurst({
  show,
  label,
}: {
  show: boolean;
  label: string;
}) {
  const reduceMotion = useReducedMotion();

  if (!show) {
    return null;
  }

  return (
    <motion.div
      aria-live="polite"
      initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 8, scale: 0.94 }}
      animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0 }}
      className="pointer-events-none fixed left-1/2 top-24 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full border border-amber-300/50 bg-amber-300 px-4 py-2 text-sm font-black text-slate-950 shadow-2xl"
    >
      <Sparkles aria-hidden="true" className="size-4" />
      {label}
      <Gem aria-hidden="true" className="size-4" />
    </motion.div>
  );
}

