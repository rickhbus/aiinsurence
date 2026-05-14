"use client";

import Link from "next/link";
import { Crown, Sparkles } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { PlayBadge } from "./play/play-badge";
import { type QuestLocale } from "@/lib/health-quest/types";

export function BossReviewNode({ locale }: { locale: QuestLocale }) {
  const reduceMotion = useReducedMotion();

  return (
    <div className="relative grid justify-items-center pb-2">
      <motion.div
        animate={reduceMotion ? undefined : { scale: [1, 1.03, 1] }}
        transition={{ repeat: Infinity, duration: 2.3 }}
        className="grid translate-x-[-34px] justify-items-center gap-2 sm:translate-x-[-72px]"
      >
        <Link
          href="/weekly-review"
          className="grid size-28 place-items-center rounded-full border-[7px] border-amber-200 bg-gradient-to-br from-amber-400 via-teal-500 to-sky-500 text-white shadow-[0_14px_0_rgba(15,23,42,0.16)] active:translate-y-1 active:shadow-[0_7px_0_rgba(15,23,42,0.16)]"
          aria-label={locale === "en" ? "Weekly boss review" : "一週 Boss 回顧"}
        >
          <Crown aria-hidden="true" className="size-12" />
        </Link>
        <PlayBadge tone="accent">
          <Sparkles aria-hidden="true" className="size-4" />
          {locale === "en" ? "Weekly boss" : "一週 Boss"}
        </PlayBadge>
      </motion.div>
    </div>
  );
}

