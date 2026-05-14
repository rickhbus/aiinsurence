"use client";

import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
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
  const celebrating = mood === "celebrating";

  return (
    <motion.div
      aria-label="小健龜 Turtle Health Guide"
      initial={false}
      animate={reduceMotion || serious ? { y: 0 } : { y: [0, -4, 0] }}
      transition={{ repeat: Infinity, duration: mood === "celebrating" ? 1.1 : 2.6 }}
      className={cn(
        "relative grid place-items-center overflow-hidden rounded-[28%_42%_32%_38%] border-2 bg-gradient-to-br shadow-lg",
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
      <span className="absolute inset-1 rounded-[inherit] bg-white/50 shadow-inner dark:bg-white/10" aria-hidden="true" />
      <Image
        src="/turtle-avatar-transparent.png"
        alt=""
        aria-hidden="true"
        width={256}
        height={256}
        priority={size === "lg"}
        className={cn(
          "relative z-10 h-[88%] w-[88%] object-contain drop-shadow-sm",
          serious && "saturate-75",
          recovery && "sepia-[0.18]",
          celebrating && "scale-105",
        )}
      />
      <span
        className={cn(
          "absolute right-1.5 top-1.5 z-20 grid rounded-full bg-white/90 text-current shadow-sm ring-1 ring-current/15 dark:bg-slate-950/80",
          size === "sm" ? "size-5 [&_svg]:size-3" : "size-7 [&_svg]:size-4",
        )}
      >
        {serious ? <ShieldCheck aria-hidden="true" /> : <Sparkles aria-hidden="true" />}
      </span>
    </motion.div>
  );
}
