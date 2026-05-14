"use client";

import { Award, Flame, Gem, ShieldCheck, Snowflake, Trophy, UserRound } from "lucide-react";
import { PlayBadge } from "../play/play-badge";
import { PlayCard } from "../play/play-card";
import { PlayLeagueBadge } from "../play/play-league-badge";
import { PlayMascotPlaceholder } from "../play/play-mascot-placeholder";
import type { QuestLocale } from "@/lib/health-quest/types";

const achievements = [
  { zh: "第一步", en: "First Step" },
  { zh: "3 日連續", en: "3-Day Streak" },
  { zh: "7 日連續", en: "7-Day Streak" },
  { zh: "補水起步", en: "Hydration Starter" },
  { zh: "心情打卡", en: "Mood Checker" },
  { zh: "恢復都算數", en: "Recovery Counts" },
  { zh: "小課學習者", en: "Lesson Learner" },
  { zh: "就診準備完成", en: "Doctor Prep Ready" },
  { zh: "私隱守護者", en: "Privacy Protector" },
  { zh: "家庭支援者", en: "Family Supporter" },
];

export function HealthQuestProfilePage({ locale }: { locale: QuestLocale }) {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
      <section className="rounded-[1.8rem] border border-teal-500/15 bg-card/80 p-5 shadow-sm backdrop-blur-xl">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <span className="grid size-20 place-items-center rounded-full bg-teal-500/12 text-teal-700 dark:text-teal-200">
              <UserRound aria-hidden="true" className="size-10" />
            </span>
            <div>
              <p className="text-sm font-black text-teal-700 dark:text-teal-200">{locale === "en" ? "Health Quest profile" : "智健任務個人檔案"}</p>
              <h1 className="text-3xl font-black tracking-normal">{locale === "en" ? "Anonymous Player" : "匿名玩家"}</h1>
              <div className="mt-2 flex flex-wrap gap-2">
                <PlayLeagueBadge league="Jade" />
                <PlayBadge tone="accent"><Gem aria-hidden="true" className="size-4" /> 128</PlayBadge>
              </div>
            </div>
          </div>
          <PlayMascotPlaceholder mood="happy" size="lg" />
        </div>
      </section>

      <div className="grid gap-3 md:grid-cols-4">
        <ProfileMetric icon={Flame} label={locale === "en" ? "Current streak" : "目前連續"} value="12" />
        <ProfileMetric icon={Trophy} label={locale === "en" ? "Longest streak" : "最長連續"} value="21" />
        <ProfileMetric icon={Award} label={locale === "en" ? "Total XP" : "總 XP"} value="4,280" />
        <ProfileMetric icon={Snowflake} label={locale === "en" ? "Freezes" : "保護次數"} value="2" />
      </div>

      <PlayCard>
        <h2 className="text-xl font-black tracking-normal">{locale === "en" ? "Achievements" : "成就"}</h2>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {achievements.map((achievement, index) => (
            <div key={achievement.en} className="flex items-center gap-3 rounded-2xl bg-muted/45 p-3">
              <span className="grid size-10 place-items-center rounded-full bg-amber-400/18 text-amber-700 dark:text-amber-200">
                <Award aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-black">{locale === "en" ? achievement.en : achievement.zh}</p>
                <p className="text-xs text-muted-foreground">{index < 6 ? (locale === "en" ? "Unlocked" : "已解鎖") : (locale === "en" ? "In progress" : "進行中")}</p>
              </div>
            </div>
          ))}
        </div>
      </PlayCard>

      <PlayCard className="flex items-start gap-3 text-sm leading-6 text-muted-foreground">
        <ShieldCheck aria-hidden="true" className="mt-0.5 shrink-0 text-teal-600" />
        <p>
          {locale === "en"
            ? "This profile shows progression, privacy settings, and safety boundaries. It is not a medical record and never claims insurance eligibility, pricing, coverage, claims, or care access."
            : "此頁顯示進度、私隱設定和安全界線。它不是醫療紀錄，亦不聲稱保險資格、定價、保障、索償或照護使用權。"}
        </p>
      </PlayCard>
    </div>
  );
}

function ProfileMetric({ icon: Icon, label, value }: { icon: typeof Flame; label: string; value: string }) {
  return (
    <PlayCard className="grid gap-2">
      <Icon aria-hidden="true" className="text-teal-600" />
      <p className="text-xs font-bold text-muted-foreground">{label}</p>
      <p className="text-3xl font-black tracking-normal">{value}</p>
    </PlayCard>
  );
}

