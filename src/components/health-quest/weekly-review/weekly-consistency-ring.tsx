"use client";

import { motion } from "framer-motion";

export function WeeklyConsistencyRing({ value }: { value: number }) {
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <div className="relative grid size-32 place-items-center rounded-full bg-muted">
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{ background: `conic-gradient(var(--primary) ${clamped * 3.6}deg, transparent 0deg)` }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      />
      <span className="relative grid size-24 place-items-center rounded-full bg-card text-3xl font-bold">{clamped}%</span>
    </div>
  );
}
