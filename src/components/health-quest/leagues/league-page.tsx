"use client";

import { useEffect, useState } from "react";
import { ShieldCheck, Trophy } from "lucide-react";
import { PlayCard } from "../play/play-card";
import { PlayLeagueBadge } from "../play/play-league-badge";
import { PlayProgressBar } from "../play/play-progress-bar";
import { buildLeagueStandings, getLeagueForXp, getWeekStart, type LeagueStanding } from "@/lib/health-quest/leagues";
import { gameCopy } from "@/lib/health-quest/game-copy";
import { questText } from "@/lib/health-quest/play-system";
import type { QuestLocale } from "@/lib/health-quest/types";
import { getSupabaseRequestHeaders } from "@/lib/supabase/client";

type LeagueResponse = {
  league?: string;
  standings?: LeagueStanding[];
  weeklyXp?: number;
};

const fallbackStandings = buildLeagueStandings([
  { userId: "demo-user", displayName: "Health Player 8A2F", leagueName: "Jade", weekStart: getWeekStart(), xp: 420 },
  { userId: "demo-2", displayName: "Health Player 2C11", leagueName: "Jade", weekStart: getWeekStart(), xp: 390 },
  { userId: "demo-3", displayName: "Health Player 91B0", leagueName: "Jade", weekStart: getWeekStart(), xp: 330 },
  { userId: "demo-4", displayName: "Health Player 44DE", leagueName: "Jade", weekStart: getWeekStart(), xp: 250 },
]);

export function LeaguePage({ locale }: { locale: QuestLocale }) {
  const [standings, setStandings] = useState<LeagueStanding[]>(fallbackStandings);
  const [weeklyXp, setWeeklyXp] = useState(420);

  useEffect(() => {
    let active = true;

    async function loadLeague() {
      try {
        const headers = await getSupabaseRequestHeaders({ Accept: "application/json" });
        const response = await fetch("/api/health-quest/leagues", { headers });
        const body = (await response.json().catch(() => null)) as LeagueResponse | null;

        if (active && response.ok && body?.standings) {
          setStandings(body.standings);
          setWeeklyXp(body.weeklyXp ?? 0);
        }
      } catch {
        // Keep privacy-safe demo standings.
      }
    }

    void loadLeague();

    return () => {
      active = false;
    };
  }, []);

  const league = getLeagueForXp(weeklyXp);
  const nextProgress = Math.min(100, Math.round((weeklyXp / 700) * 100));

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
      <section className="rounded-[1.8rem] border border-teal-500/15 bg-card/80 p-5 shadow-sm backdrop-blur-xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-black text-teal-700 dark:text-teal-200">{locale === "en" ? "Health Leagues" : "健康聯賽"}</p>
            <h1 className="mt-1 text-3xl font-black tracking-normal sm:text-5xl">{locale === "en" ? "Weekly XP race" : "每週 XP 排行"}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              {questText(gameCopy.freshWeek, locale)} {locale === "en" ? "Only XP and anonymous names are shown." : "只顯示 XP 同匿名名稱。"}
            </p>
          </div>
          <PlayLeagueBadge league={league} className="w-fit" />
        </div>
        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between text-xs font-bold text-muted-foreground">
            <span>{weeklyXp} XP</span>
            <span>{locale === "en" ? "Promotion progress" : "升級進度"}</span>
          </div>
          <PlayProgressBar value={nextProgress} tone="success" />
        </div>
      </section>

      <PlayCard className="grid gap-3">
        <div className="flex items-center gap-2">
          <Trophy aria-hidden="true" className="text-amber-500" />
          <h2 className="text-xl font-black tracking-normal">{locale === "en" ? "Leaderboard" : "排行榜"}</h2>
        </div>
        <div className="grid gap-2">
          {standings.map((member) => (
            <div key={member.userId} className="grid grid-cols-[44px_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl bg-muted/45 p-3">
              <span className="grid size-9 place-items-center rounded-full bg-background text-sm font-black">{member.rank}</span>
              <div className="min-w-0">
                <p className="truncate text-sm font-black">{member.displayName}</p>
                <p className="text-xs text-muted-foreground">
                  {member.zone === "promotion" ? (locale === "en" ? "Promotion zone" : "升級區") : member.zone === "demotion" ? (locale === "en" ? "Fresh start zone" : "重新開始區") : (locale === "en" ? "Safe zone" : "安全區")}
                </p>
              </div>
              <span className="rounded-full bg-teal-500/10 px-3 py-1 text-sm font-black text-teal-700 dark:text-teal-200">{member.xp} XP</span>
            </div>
          ))}
        </div>
      </PlayCard>

      <PlayCard className="flex items-start gap-3 text-sm leading-6 text-muted-foreground">
        <ShieldCheck aria-hidden="true" className="mt-0.5 shrink-0 text-teal-600" />
        <p>
          {locale === "en"
            ? "Leagues never show mood, symptoms, meals, weight, calories, doctor notes, insurance info, or raw health data."
            : "聯賽永遠不顯示心情、症狀、餐點、體重、卡路里、醫生備註、保險資料或原始健康資料。"}
        </p>
      </PlayCard>
    </div>
  );
}
