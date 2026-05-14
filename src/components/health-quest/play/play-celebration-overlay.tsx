"use client";

import { motion, useReducedMotion } from "framer-motion";
import { CheckCircle2, Sparkles } from "lucide-react";
import { PlayMascotPlaceholder } from "./play-mascot-placeholder";
import { PlayButton } from "./play-button";

export function PlayCelebrationOverlay({
  open,
  title,
  detail,
  safetyMode,
  onClose,
}: {
  open: boolean;
  title: string;
  detail: string;
  safetyMode?: boolean;
  onClose: () => void;
}) {
  const reduceMotion = useReducedMotion();

  if (!open || safetyMode) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/35 p-4 backdrop-blur-sm">
      <motion.div
        role="dialog"
        aria-modal="true"
        initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="w-full max-w-sm rounded-[1.7rem] border border-white/60 bg-white p-6 text-center shadow-2xl dark:border-white/10 dark:bg-slate-900"
      >
        <div className="mx-auto mb-4 flex w-fit items-center gap-2">
          <Sparkles aria-hidden="true" className="size-6 text-amber-500" />
          <PlayMascotPlaceholder mood="celebrating" />
          <CheckCircle2 aria-hidden="true" className="size-6 text-emerald-500" />
        </div>
        <h2 className="text-2xl font-black tracking-normal">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{detail}</p>
        <PlayButton className="mt-5 w-full" onClick={onClose}>OK</PlayButton>
      </motion.div>
    </div>
  );
}

