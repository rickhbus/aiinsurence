"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ShieldCheck, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export type MascotMood = "idle" | "happy" | "celebrating" | "gentle" | "recovery" | "safety_serious" | "thinking";

export function PlayMascotPlaceholder({
  mood = "idle",
  size = "md",
  className,
}: {
  mood?: MascotMood;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const reduceMotion = useReducedMotion();
  const serious = mood === "safety_serious";
  const recovery = mood === "recovery" || mood === "gentle";

  return (
    <motion.div
      aria-label="小健龍 Jade Health Dragon"
      initial={false}
      animate={reduceMotion || serious ? { y: 0 } : { y: [0, -4, 0] }}
      transition={{ repeat: Infinity, duration: mood === "celebrating" ? 1.1 : 2.6 }}
      className={cn(
        "relative grid place-items-center rounded-[28%_42%_32%_38%] border-2 bg-gradient-to-br shadow-lg",
        size === "sm" && "size-14",
        size === "md" && "size-20",
        size === "lg" && "size-28",
        serious
          ? "border-red-300 from-red-100 to-white text-red-700 dark:border-red-500/40 dark:from-red-950/80 dark:to-slate-900 dark:text-red-200"
          : recovery
            ? "border-amber-300 from-amber-100 to-white text-amber-800 dark:border-amber-500/40 dark:from-amber-950/80 dark:to-slate-900 dark:text-amber-200"
            : "border-teal-300 from-teal-100 via-sky-100 to-white text-teal-800 dark:border-teal-500/40 dark:from-teal-950/80 dark:via-sky-950/70 dark:to-slate-900 dark:text-teal-100",
        className,
      )}
    >
      <span className="absolute -left-1 top-4 h-4 w-3 rounded-full border border-current/30 bg-current/10" aria-hidden="true" />
      <span className="absolute -right-1 top-4 h-4 w-3 rounded-full border border-current/30 bg-current/10" aria-hidden="true" />
      <span className="absolute -top-2 left-5 h-4 w-3 rotate-[-20deg] rounded-t-full bg-current/20" aria-hidden="true" />
      <span className="absolute -top-2 right-5 h-4 w-3 rotate-[20deg] rounded-t-full bg-current/20" aria-hidden="true" />
      <span className="grid size-10 place-items-center rounded-full bg-white/75 text-current shadow-inner dark:bg-white/10">
        {serious ? <ShieldCheck aria-hidden="true" /> : <Sparkles aria-hidden="true" />}
      </span>
      <span className="absolute bottom-3 left-1/2 h-1.5 w-8 -translate-x-1/2 rounded-full bg-current/35" aria-hidden="true" />
    </motion.div>
  );
}

