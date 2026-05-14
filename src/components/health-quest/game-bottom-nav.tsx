"use client";

import Image from "next/image";
import Link from "next/link";
import { BarChart3, BookOpenCheck, Flame, MoreHorizontal, type LucideIcon } from "lucide-react";
import type { HealthPage, Locale, LocalizedText } from "@/lib/health-app/types";
import { text } from "@/lib/health-app/i18n";
import { turtleCoachIdentity } from "@/lib/health-quest/play-system";
import { cn } from "@/lib/utils";

type GameNavItem = {
  label: LocalizedText;
  href: string;
  icon?: LucideIcon;
  mascot?: boolean;
  activePages: HealthPage[];
};

const gameNavItems: GameNavItem[] = [
  { label: { zh: "今日", en: "Today" }, href: "/today", icon: Flame, activePages: ["today", "today-advanced"] },
  { label: turtleCoachIdentity.mascot, href: "/coach", mascot: true, activePages: ["coach", "healthcare", "symptom-routing"] },
  { label: { zh: "學習", en: "Learn" }, href: "/learn", icon: BookOpenCheck, activePages: ["learn", "lesson", "practice", "insurance"] },
  { label: { zh: "進度", en: "Progress" }, href: "/progress", icon: BarChart3, activePages: ["progress", "reports", "goals"] },
  { label: { zh: "更多", en: "More" }, href: "/more", icon: MoreHorizontal, activePages: ["more", "profile", "settings", "memory", "leagues", "family", "doctor", "pricing"] },
];

export function GameBottomNav({ currentPage, locale }: { currentPage: HealthPage; locale: Locale }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 grid min-h-20 grid-cols-5 border-t border-white/50 bg-background/92 px-1 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-12px_30px_rgba(15,118,110,0.10)] backdrop-blur-2xl dark:border-white/10 lg:hidden" aria-label="Health Quest game navigation">
      {gameNavItems.map((item) => {
        const active = item.activePages.includes(currentPage);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
	            className={cn(
	              "flex min-h-12 flex-col items-center justify-center gap-1 rounded-2xl text-[0.62rem] font-black text-muted-foreground transition-all duration-200 min-[380px]:text-[0.68rem]",
	              active && "play-pressable bg-gradient-to-b from-lime-400 via-teal-500 to-teal-700 text-white shadow-md shadow-teal-700/25",
	            )}
	          >
	            {item.mascot ? (
	              <span className={cn("grid size-6 place-items-center overflow-hidden rounded-full bg-teal-500/10 ring-1 ring-teal-500/20", active && "bg-white/90 ring-white/80")}>
	                <Image src="/turtle-avatar-transparent.png" alt="" aria-hidden="true" width={40} height={40} className="size-6 object-contain" />
	              </span>
	            ) : Icon ? (
	              <Icon aria-hidden="true" className={cn("size-5", active && "fill-current")} />
	            ) : null}
	            <span className="truncate">{text(item.label, locale)}</span>
	          </Link>
        );
      })}
    </nav>
  );
}
