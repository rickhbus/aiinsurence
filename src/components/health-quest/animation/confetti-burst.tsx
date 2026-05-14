"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

const pieces = Array.from({ length: 12 }, (_, index) => index);

export function ConfettiBurst({ show, safetyMode }: { show: boolean; safetyMode?: boolean }) {
  const reduceMotion = useReducedMotion();

  if (!show || safetyMode || reduceMotion) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 top-16 z-50 mx-auto h-32 w-64">
      {pieces.map((piece) => (
        <motion.span
          key={piece}
          initial={{ opacity: 0, x: 128, y: 60, rotate: 0 }}
          animate={{ opacity: [0, 1, 0], x: 128 + (piece - 6) * 18, y: [60, 10 + (piece % 3) * 14, 110], rotate: 180 + piece * 18 }}
          transition={{ duration: 1.1, delay: piece * 0.02 }}
          className={cn(
            "absolute size-2 rounded-sm",
            piece % 4 === 0 && "bg-teal-400",
            piece % 4 === 1 && "bg-sky-400",
            piece % 4 === 2 && "bg-amber-400",
            piece % 4 === 3 && "bg-emerald-400",
          )}
        />
      ))}
    </div>
  );
}

