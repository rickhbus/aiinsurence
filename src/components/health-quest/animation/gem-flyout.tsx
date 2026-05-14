"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Gem } from "lucide-react";

export function GemFlyout({ amount, show }: { amount: number; show: boolean }) {
  const reduceMotion = useReducedMotion();

  if (!show || amount <= 0) {
    return null;
  }

  return (
    <motion.span
      aria-live="polite"
      initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 18, scale: 0.9 }}
      animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: -20, scale: 1 }}
      className="pointer-events-none fixed right-5 top-36 z-50 inline-flex items-center gap-1 rounded-full bg-amber-400 px-3 py-1.5 text-sm font-black text-slate-950 shadow-lg"
    >
      <Gem aria-hidden="true" className="size-4" />
      +{amount}
    </motion.span>
  );
}

