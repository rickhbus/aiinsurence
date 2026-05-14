"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Gem, Gift, Sparkles } from "lucide-react";

export function ChestOpeningAnimation({ show, gems }: { show: boolean; gems: number }) {
  const reduceMotion = useReducedMotion();

  if (!show) {
    return null;
  }

  return (
    <motion.div
      aria-live="polite"
      initial={reduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      className="pointer-events-none fixed left-1/2 top-28 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full border border-amber-300/60 bg-amber-300 px-4 py-2 text-sm font-black text-slate-950 shadow-2xl"
    >
      <Gift aria-hidden="true" className="size-4" />
      <Sparkles aria-hidden="true" className="size-4" />
      +{gems}
      <Gem aria-hidden="true" className="size-4" />
    </motion.div>
  );
}

