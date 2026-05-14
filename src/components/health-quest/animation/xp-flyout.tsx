"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Sparkles } from "lucide-react";

export function XpFlyout({ amount, show }: { amount: number; show: boolean }) {
  const reduceMotion = useReducedMotion();

  if (!show || amount <= 0) {
    return null;
  }

  return (
    <motion.span
      aria-live="polite"
      initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 18, scale: 0.9 }}
      animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: -20, scale: 1 }}
      className="pointer-events-none fixed right-5 top-24 z-50 inline-flex items-center gap-1 rounded-full bg-teal-500 px-3 py-1.5 text-sm font-black text-white shadow-lg"
    >
      <Sparkles aria-hidden="true" className="size-4" />
      +{amount} XP
    </motion.span>
  );
}

