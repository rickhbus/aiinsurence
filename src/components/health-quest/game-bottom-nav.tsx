"use client";

import Link from "next/link";
import { BarChart3, BookOpenCheck, Flame, Trophy, UserRound, type LucideIcon } from "lucide-react";
import type { HealthPage, Locale, LocalizedText } from "@/lib/health-app/types";
import { text } from "@/lib/health-app/i18n";
import { cn } from "@/lib/utils";

type GameNavItem = {
  label: LocalizedText;
  href: string;
  icon: LucideIcon;
  activePages: HealthPage[];
};

const gameNavItems: GameNavItem[] = [
  { label: { zh: "今日", en: "Today" }, href: "/today", icon: Flame, activePages: ["today", "today-advanced"] },
  { label: { zh: "學習", en: "Learn" }, href: "/learn", icon: BookOpenCheck, activePages: ["learn", "lesson", "practice"] },
  { label: { zh: "聯賽", en: "Leagues" }, href: "/leagues", icon: Trophy, activePages: ["leagues"] },
  { label: { zh: "進度", en: "Progress" }, href: "/progress", icon: BarChart3, activePages: ["progress", "reports", "goals"] },
  { label: { zh: "個人", en: "Profile" }, href: "/profile", icon: UserRound, activePages: ["profile", "settings", "memory"] },
];

export function GameBottomNav({ currentPage, locale }: { currentPage: HealthPage; locale: Locale }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 grid min-h-20 grid-cols-5 border-t border-border/40 bg-background/92 px-1 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-2xl lg:hidden" aria-label="Health Quest game navigation">
      {gameNavItems.map((item) => {
        const active = item.activePages.includes(currentPage);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex min-h-12 flex-col items-center justify-center gap-1 rounded-2xl text-[0.62rem] font-black text-muted-foreground transition-all duration-200 min-[380px]:text-[0.68rem]",
              active && "bg-gradient-to-b from-teal-500 to-teal-700 text-white shadow-md shadow-teal-700/25",
            )}
          >
            <item.icon aria-hidden="true" className={cn("size-5", active && "fill-current")} />
            <span className="truncate">{text(item.label, locale)}</span>
          </Link>
        );
      })}
    </nav>
  );
}

