"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

export function StreakPulse({ children }: { children: ReactNode }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.span
      className="inline-flex"
      animate={reduceMotion ? undefined : { scale: [1, 1.08, 1] }}
      transition={{ repeat: Infinity, duration: 2 }}
    >
      {children}
    </motion.span>
  );
}

