import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Brain,
  CalendarCheck,
  ChevronRight,
  ClipboardList,
  Flame,
  HeartPulse,
  MoreHorizontal,
  PhoneCall,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Star,
  Trophy,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { PlayBadge } from "@/components/health-quest/play/play-badge";
import { PlayButton } from "@/components/health-quest/play/play-button";
import { PlayMascotPlaceholder } from "@/components/health-quest/play/play-mascot-placeholder";
import type { PlayTone } from "@/lib/health-quest/play-system";
import { cn } from "@/lib/utils";

type StatPill = {
  label: string;
  value: string;
  icon: LucideIcon;
  tone: PlayTone;
};

type FeatureCard = {
  href: string;
  title: string;
  body: string;
  icon: LucideIcon;
  tone: PlayTone;
};

type QuestStep = {
  href: string;
  step: string;
  title: string;
  body: string;
  icon: LucideIcon;
  tone: PlayTone;
};

type QuickLink = {
  href: string;
  title: string;
  body: string;
  icon: LucideIcon;
  tone: PlayTone;
};

const navStats: StatPill[] = [
  { label: "第 3 關 / Level 3", value: "Jade", icon: Star, tone: "success" },
  { label: "7 日連續 / 7-day streak", value: "7", icon: Flame, tone: "accent" },
  { label: "家庭聯賽 / Family league", value: "Top 5", icon: Trophy, tone: "secondary" },
];

const heroStats: StatPill[] = [
  { label: "今日 XP / Today XP", value: "120", icon: Sparkles, tone: "success" },
  { label: "連續日數 / Streak", value: "7", icon: Flame, tone: "accent" },
  { label: "任務等級 / Level", value: "3", icon: Star, tone: "secondary" },
];

const featureCards: FeatureCard[] = [
  {
    href: "/today",
    title: "每日細任務 / Tiny daily check-ins",
    body: "一撳記低今日狀態，唔使打長文；小健龜會把大件事拆成細步。",
    icon: CalendarCheck,
    tone: "success",
  },
  {
    href: "/healthcare",
    title: "AI 安全護欄 / AI triage guardrails",
    body: "先看紅旗和緊急路線，再做安全分析；危急時唔等 AI 回覆。",
    icon: ShieldCheck,
    tone: "safety",
  },
  {
    href: "/insurance",
    title: "保險教育 / Insurance education",
    body: "整理學習清單和文件準備，不判斷承保、保費、保障或索償結果。",
    icon: ClipboardList,
    tone: "secondary",
  },
];

const questSteps: QuestStep[] = [
  {
    href: "/today",
    step: "1",
    title: "今日打卡 / Today quest",
    body: "用 30 秒記低精神、飲水、心情和一件小事。",
    icon: CalendarCheck,
    tone: "success",
  },
  {
    href: "/healthcare",
    step: "2",
    title: "AI 安全分析 / Safety analysis",
    body: "將不適整理成安全提醒和下一步準備。",
    icon: Brain,
    tone: "safety",
  },
  {
    href: "/family",
    step: "3",
    title: "屋企人同行 / Family team",
    body: "用同意優先的分享，讓照顧者看到需要知道的事。",
    icon: Users,
    tone: "accent",
  },
  {
    href: "/reports",
    step: "4",
    title: "每週報告 / Weekly report",
    body: "把每日任務變成覆診和家庭照顧的簡單摘要。",
    icon: BarChart3,
    tone: "secondary",
  },
];

const quickLinks: QuickLink[] = [
  {
    href: "/family",
    title: "屋企人 / Family",
    body: "照顧者同步",
    icon: Users,
    tone: "accent",
  },
  {
    href: "/reports",
    title: "報告 / Reports",
    body: "每週摘要",
    icon: BarChart3,
    tone: "secondary",
  },
  {
    href: "/insurance",
    title: "保險 / Insurance",
    body: "教育和文件",
    icon: ShieldCheck,
    tone: "success",
  },
  {
    href: "/more",
    title: "更多 / More",
    body: "進階功能",
    icon: MoreHorizontal,
    tone: "muted",
  },
];

export function QuestHome() {
  return (
    <main className="play-shell-bg min-h-dvh overflow-hidden px-4 py-5 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
        <HomeNav />

        <section className="grid gap-5 lg:grid-cols-12 lg:items-stretch">
          <div className="play-island-card relative overflow-hidden rounded-[2rem] p-5 sm:p-7 lg:col-span-8">
            <div className="absolute inset-x-0 top-0 h-2 bg-gradient-to-r from-lime-400 via-emerald-500 to-sky-400" aria-hidden="true" />
            <div className="flex flex-wrap gap-2">
              <PlayBadge tone="success">Daily quest</PlayBadge>
              <PlayBadge tone="accent">For parents + family</PlayBadge>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_13rem] lg:items-center">
              <div className="min-w-0">
                <p className="mb-2 text-sm font-black uppercase tracking-normal text-emerald-700 dark:text-emerald-200">
                  小健龜智健任務 / AI Health Quest
                </p>
                <h1 className="max-w-3xl text-4xl font-black leading-tight tracking-normal text-slate-950 dark:text-white sm:text-5xl lg:text-6xl">
                  俾爸媽每日一撳，像做任務一樣簡單。
                </h1>
                <p className="mt-4 max-w-2xl text-base font-semibold leading-7 text-muted-foreground sm:text-lg">
                  A language-lesson-style health quest: tiny check-ins, friendly turtle coaching, family peace of mind.
                </p>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <PlayButton
                    asChild
                    tone="success"
                    className="min-h-16 rounded-[1.35rem] bg-lime-500 px-5 text-base font-black text-slate-950 hover:bg-lime-400"
                  >
                    <Link href="/today">
                      開始今日任務
                      <ArrowRight data-icon="inline-end" aria-hidden="true" />
                    </Link>
                  </PlayButton>
                  <PlayButton asChild tone="secondary" className="min-h-16 rounded-[1.35rem] px-5 text-base font-black">
                    <Link href="/healthcare">
                      AI 安全分析
                      <ShieldCheck data-icon="inline-end" aria-hidden="true" />
                    </Link>
                  </PlayButton>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  {heroStats.map((stat) => (
                    <StatBadge key={stat.label} stat={stat} />
                  ))}
                </div>
              </div>

              <div className="rounded-[1.8rem] border border-white/70 bg-white/65 p-4 text-center shadow-inner dark:border-white/10 dark:bg-white/5">
                <PlayMascotPlaceholder mood="celebrating" size="lg" className="mx-auto" />
                <p className="mt-3 text-lg font-black">小健龜教練 / Turtle coach</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  今日做少少都算數。Tiny wins still count.
                </p>
              </div>
            </div>
          </div>

          <aside className="play-island-card grid content-between gap-4 rounded-[2rem] p-5 lg:col-span-4">
            <div>
              <PlayBadge tone="primary">今日路線 / Today route</PlayBadge>
              <h2 className="mt-4 text-2xl font-black tracking-normal">一條任務路，照顧全家。</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Start with a tiny check-in, then unlock safety analysis, family sharing, and weekly reports when useful.
              </p>
            </div>

            <div className="rounded-[1.6rem] border border-red-500/20 bg-red-500/10 p-4">
              <div className="flex items-start gap-3">
                <PhoneCall aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-red-600 dark:text-red-300" />
                <p className="text-sm font-bold leading-6 text-red-700 dark:text-red-200">
                  緊急情況請立即致電 999 或前往急症室。In an emergency, call 999 or go to A&amp;E now.
                </p>
              </div>
            </div>

            <div className="grid gap-2">
              {navStats.map((stat) => (
                <StatBadge key={stat.label} stat={stat} wide />
              ))}
            </div>
          </aside>
        </section>

        <section className="grid gap-5 lg:grid-cols-12">
          <div className="grid gap-4 md:grid-cols-3 lg:col-span-8">
            {featureCards.map((feature) => (
              <FeatureQuestCard key={feature.href} feature={feature} />
            ))}
          </div>

          <QuestMap />
        </section>

        <section className="play-island-card rounded-[1.8rem] p-4 sm:p-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {quickLinks.map((item) => (
              <QuickLinkCard key={item.href} item={item} />
            ))}
          </div>
        </section>

        <SafetyCard />
      </div>
    </main>
  );
}

function HomeNav() {
  return (
    <header className="flex flex-col gap-3 rounded-[1.6rem] border border-white/70 bg-white/70 px-4 py-3 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/50 sm:flex-row sm:items-center sm:justify-between">
      <Link href="/" className="flex min-w-0 items-center gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-lime-400 text-slate-950 shadow-[0_5px_0_rgba(22,163,74,0.25)]">
          <HeartPulse aria-hidden="true" className="size-6" />
        </span>
        <span className="min-w-0">
          <span className="block text-lg font-black tracking-normal">小健龜 Health Quest</span>
          <span className="block text-xs font-semibold text-muted-foreground">Anonymous-first turtle coach</span>
        </span>
      </Link>

      <div className="flex flex-wrap gap-2">
        {navStats.map((stat) => (
          <StatBadge key={stat.label} stat={stat} compact />
        ))}
      </div>
    </header>
  );
}

function StatBadge({ stat, compact, wide }: { stat: StatPill; compact?: boolean; wide?: boolean }) {
  const Icon = stat.icon;

  return (
    <span
      className={cn(
        "play-stat-pill",
        wide && "w-full justify-start px-3 py-2",
        compact && "text-[0.7rem]",
      )}
    >
      <Icon aria-hidden="true" className={cn("size-4", stat.tone === "accent" && "text-amber-500", stat.tone === "success" && "text-lime-600", stat.tone === "secondary" && "text-sky-500")} />
      <span>{stat.label}</span>
      <span className="rounded-full bg-lime-300 px-2 py-0.5 text-slate-950">{stat.value}</span>
    </span>
  );
}

function FeatureQuestCard({ feature }: { feature: FeatureCard }) {
  const Icon = feature.icon;

  return (
    <Card className="play-island-card rounded-[1.6rem] border-0 p-0">
      <CardContent className="flex h-full flex-col gap-4 p-4">
        <div className="flex items-start justify-between gap-3">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-lime-400/25 text-emerald-700 ring-1 ring-lime-500/20 dark:text-lime-200">
            <Icon aria-hidden="true" className="size-6" />
          </span>
          <PlayBadge tone={feature.tone}>+20 XP</PlayBadge>
        </div>
        <div className="min-w-0">
          <h3 className="text-lg font-black tracking-normal">{feature.title}</h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{feature.body}</p>
        </div>
        <Link
          href={feature.href}
          className="play-pressable mt-auto inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-emerald-500/20 bg-white/80 px-4 text-sm font-black text-emerald-700 shadow-sm dark:bg-white/10 dark:text-emerald-200"
        >
          開始 / Start
          <ChevronRight aria-hidden="true" className="size-4" />
        </Link>
      </CardContent>
    </Card>
  );
}

function QuestMap() {
  return (
    <Card className="play-island-card relative overflow-hidden rounded-[1.8rem] border-0 p-0 lg:col-span-4">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <PlayBadge tone="primary">Quest path</PlayBadge>
            <h2 className="mt-3 text-2xl font-black tracking-normal">今日路線圖</h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">Tap any stop. 小步前進，安全先行。</p>
          </div>
          <PlayMascotPlaceholder mood="thinking" size="sm" />
        </div>

        <div className="relative mt-5 grid gap-4 pl-3">
          <div className="play-node-track absolute left-8 top-5 h-[calc(100%-2.5rem)] w-3 rounded-full opacity-80" aria-hidden="true" />
          {questSteps.map((step) => (
            <QuestPathLink key={step.href} step={step} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function QuestPathLink({ step }: { step: QuestStep }) {
  const Icon = step.icon;

  return (
    <Link href={step.href} className="play-pressable relative z-10 flex items-center gap-3 rounded-[1.4rem] border border-white/70 bg-white/80 p-3 shadow-sm dark:border-white/10 dark:bg-white/10">
      <span className="grid size-11 shrink-0 place-items-center rounded-full bg-lime-400 text-base font-black text-slate-950 shadow-[0_6px_0_rgba(22,163,74,0.24)]">
        {step.step}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <Icon aria-hidden="true" className="size-4 text-emerald-600 dark:text-lime-200" />
          <span className="font-black tracking-normal">{step.title}</span>
          <PlayBadge tone={step.tone} className="min-h-6 px-2 text-[0.65rem]">
            Ready
          </PlayBadge>
        </span>
        <span className="mt-1 block text-xs leading-5 text-muted-foreground">{step.body}</span>
      </span>
      <ChevronRight aria-hidden="true" className="size-5 shrink-0 text-muted-foreground" />
    </Link>
  );
}

function QuickLinkCard({ item }: { item: QuickLink }) {
  const Icon = item.icon;

  return (
    <Link href={item.href} className="play-pressable flex min-h-24 items-center gap-3 rounded-[1.4rem] border border-white/70 bg-white/80 p-4 shadow-sm dark:border-white/10 dark:bg-white/10">
      <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-200">
        <Icon aria-hidden="true" className="size-5" />
      </span>
      <span className="min-w-0">
        <span className="block font-black tracking-normal">{item.title}</span>
        <span className="mt-1 block text-sm text-muted-foreground">{item.body}</span>
      </span>
      <PlayBadge tone={item.tone} className="ml-auto hidden sm:inline-flex">
        Go
      </PlayBadge>
    </Link>
  );
}

function SafetyCard() {
  return (
    <Card className="play-safety-card rounded-[1.8rem] p-0">
      <CardContent className="grid gap-4 p-5 sm:grid-cols-[auto_1fr] sm:items-start">
        <span className="grid size-12 place-items-center rounded-2xl bg-red-500/12 text-red-700 dark:text-red-200">
          <ShieldAlert aria-hidden="true" className="size-6" />
        </span>
        <div className="grid gap-3">
          <div>
            <PlayBadge tone="safety">安全邊界 / Safety boundaries</PlayBadge>
            <h2 className="mt-3 text-2xl font-black tracking-normal">有事先求助，任務可以等。</h2>
          </div>
          <div className="grid gap-2 text-sm font-semibold leading-6 text-red-800 dark:text-red-100">
            <p>緊急情況、自傷或即時危險，請立即致電 999 或前往急症室，不要等待 AI 或保險確認。</p>
            <p>In emergencies, self-harm risk, or imminent danger, call 999 or go to A&amp;E now. Do not wait for AI or insurance confirmation.</p>
          </div>
          <p className="text-sm leading-6 text-muted-foreground">
            本 app 不作診斷、處方、治療保證、法律或保險建議，也不決定保險資格、定價、保障、索償、照護使用權或索償結果。
            It does not diagnose, prescribe, guarantee treatment, give legal or insurance advice, or determine insurance eligibility, pricing, coverage, claims, care access, or claim outcomes.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
