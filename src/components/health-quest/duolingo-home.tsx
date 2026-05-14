import Link from "next/link";
import {
  BarChart3,
  Brain,
  ClipboardList,
  HeartPulse,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Trophy,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { PlayBadge } from "@/components/health-quest/play/play-badge";
import { PlayButton } from "@/components/health-quest/play/play-button";
import { PlayMascotPlaceholder } from "@/components/health-quest/play/play-mascot-placeholder";

const questNodes: Array<{
  href: string;
  title: string;
  label: string;
  icon: LucideIcon;
  tone: "primary" | "secondary" | "accent" | "safety";
}> = [
  {
    href: "/today",
    title: "每日一撳",
    label: "Start here",
    icon: HeartPulse,
    tone: "primary",
  },
  {
    href: "/healthcare",
    title: "AI 分析",
    label: "Safety first",
    icon: Stethoscope,
    tone: "secondary",
  },
  {
    href: "/family",
    title: "屋企人安心",
    label: "Care circle",
    icon: Users,
    tone: "accent",
  },
  {
    href: "/reports",
    title: "每週任務",
    label: "Next plan",
    icon: BarChart3,
    tone: "primary",
  },
];

const featureCards: Array<{
  href: string;
  title: string;
  body: string;
  icon: LucideIcon;
  badge: string;
}> = [
  {
    href: "/today",
    title: "Tiny daily check-ins",
    body: "Record mood, water, food, movement, and notes in simple steps.",
    icon: ClipboardList,
    badge: "+10 XP",
  },
  {
    href: "/healthcare",
    title: "AI triage guardrails",
    body: "Friendly analysis with emergency and safety boundaries checked first.",
    icon: Brain,
    badge: "Safe path",
  },
  {
    href: "/insurance",
    title: "Insurance education",
    body: "Prepare documents and questions without eligibility, pricing, or claim decisions.",
    icon: ShieldCheck,
    badge: "Education",
  },
];

const progressPills = ["Level 3", "7-day streak", "Family league"];

export function DuolingoHome() {
  return (
    <main className="play-shell-bg min-h-dvh overflow-hidden px-4 py-5 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100dvh-2.5rem)] w-full max-w-7xl gap-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-center">
        <section className="grid gap-6">
          <nav className="flex flex-wrap items-center justify-between gap-3 rounded-full border border-white/70 bg-white/62 px-3 py-2 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
            <Link href="/" className="flex items-center gap-2 rounded-full px-2 py-1 text-sm font-black">
              <span className="grid size-9 place-items-center rounded-full bg-[var(--play-lime)] text-lg shadow-sm">龜</span>
              <span>小健龜 Health Quest</span>
            </Link>
            <div className="flex flex-wrap items-center gap-2">
              {progressPills.map((pill) => (
                <span key={pill} className="play-stat-pill">{pill}</span>
              ))}
            </div>
          </nav>

          <div className="play-island-card relative overflow-hidden rounded-[2rem] p-5 sm:p-7 lg:p-9">
            <div className="absolute -right-16 -top-20 size-56 rounded-full bg-[var(--play-lime)]/20 blur-3xl" aria-hidden="true" />
            <div className="absolute -bottom-24 left-8 size-56 rounded-full bg-[var(--play-sky)]/16 blur-3xl" aria-hidden="true" />

            <div className="relative grid gap-8 xl:grid-cols-[minmax(0,1fr)_260px] xl:items-center">
              <div className="grid gap-5">
                <div className="flex flex-wrap items-center gap-2">
                  <PlayBadge tone="primary">Daily quest</PlayBadge>
                  <PlayBadge tone="accent">For parents + family</PlayBadge>
                </div>

                <div className="grid gap-4">
                  <h1 className="max-w-4xl text-balance text-5xl font-black leading-[0.96] tracking-[-0.045em] text-foreground sm:text-6xl lg:text-7xl">
                    俾爸媽每日一撳，像做任務一樣簡單。
                  </h1>
                  <p className="max-w-2xl text-pretty text-xl font-bold leading-8 text-muted-foreground sm:text-2xl">
                    A Duolingo-style health quest: tiny check-ins, friendly turtle coaching, family peace of mind.
                  </p>
                </div>

                <div className="grid gap-3 sm:max-w-xl sm:grid-cols-2">
                  <PlayButton asChild size="lg" className="min-h-16 text-lg">
                    <Link href="/today">
                      <Sparkles data-icon="inline-start" aria-hidden="true" />
                      開始今日任務
                    </Link>
                  </PlayButton>
                  <PlayButton asChild size="lg" tone="secondary" className="min-h-16 text-lg">
                    <Link href="/healthcare">
                      <Stethoscope data-icon="inline-start" aria-hidden="true" />
                      AI 安全分析
                    </Link>
                  </PlayButton>
                </div>

                <p className="max-w-2xl text-sm font-semibold leading-6 text-muted-foreground">
                  緊急情況請立即致電 999 或前往急症室。This app does not diagnose, prescribe, or decide insurance eligibility, pricing, coverage, claims, or care access.
                </p>
              </div>

              <div className="relative mx-auto grid w-full max-w-[260px] place-items-center">
                <div className="absolute inset-x-4 bottom-2 h-8 rounded-full bg-teal-900/10 blur-xl" aria-hidden="true" />
                <div className="play-pressable relative grid place-items-center rounded-[2rem] bg-white/72 p-5 shadow-xl ring-1 ring-white/70 dark:bg-white/8 dark:ring-white/10">
                  <PlayMascotPlaceholder mood="celebrating" size="lg" className="size-36" />
                  <div className="mt-4 grid gap-1 text-center">
                    <p className="text-sm font-black uppercase tracking-wide text-teal-700 dark:text-teal-200">Coach says</p>
                    <p className="text-lg font-black">今日做一小步就夠。</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <section className="grid gap-4 md:grid-cols-3" aria-label="Health quest features">
            {featureCards.map(({ href, title, body, icon: Icon, badge }) => (
              <Link key={href} href={href} className="group rounded-[1.7rem] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <Card className="play-island-card h-full rounded-[1.7rem] border-0 transition group-hover:-translate-y-0.5">
                  <CardContent className="grid gap-4 p-5">
                    <div className="flex items-center justify-between gap-3">
                      <span className="grid size-12 place-items-center rounded-2xl bg-[var(--play-lime)] text-teal-950 shadow-sm">
                        <Icon aria-hidden="true" className="size-6" />
                      </span>
                      <span className="play-stat-pill">{badge}</span>
                    </div>
                    <div>
                      <h2 className="text-xl font-black tracking-tight">{title}</h2>
                      <p className="mt-2 text-sm font-medium leading-6 text-muted-foreground">{body}</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </section>
        </section>

        <aside className="play-island-card rounded-[2rem] p-5 lg:sticky lg:top-5" aria-label="Quest path">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <PlayBadge tone="accent">Quest map</PlayBadge>
              <h2 className="mt-2 text-2xl font-black tracking-tight">今日路線</h2>
            </div>
            <Trophy aria-hidden="true" className="size-9 text-amber-500" />
          </div>

          <div className="play-node-track relative grid gap-4 rounded-[1.8rem] p-4">
            {questNodes.map(({ href, title, label, icon: Icon, tone }, index) => (
              <Link
                key={href}
                href={href}
                className="play-pressable group grid grid-cols-[3.25rem_1fr] items-center gap-3 rounded-[1.35rem] bg-white/86 p-3 ring-1 ring-white/70 backdrop-blur-xl transition dark:bg-slate-950/70 dark:ring-white/10"
              >
                <span className="grid size-13 place-items-center rounded-full bg-gradient-to-br from-lime-300 via-teal-400 to-sky-400 text-teal-950 shadow-sm ring-4 ring-white/70 dark:ring-white/10">
                  <Icon aria-hidden="true" className="size-6" />
                </span>
                <span className="min-w-0">
                  <span className="flex items-center gap-2 text-xs font-black uppercase text-teal-700 dark:text-teal-200">
                    Step {index + 1}
                    <PlayBadge tone={tone} className="min-h-6 px-2 text-[10px]">{label}</PlayBadge>
                  </span>
                  <span className="mt-1 block truncate text-lg font-black">{title}</span>
                </span>
              </Link>
            ))}
          </div>

          <div className="play-safety-card mt-5 rounded-[1.5rem] border p-4">
            <div className="flex items-start gap-3">
              <ShieldCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-red-600 dark:text-red-200" />
              <p className="text-sm font-bold leading-6 text-red-900 dark:text-red-100">
                Safety comes before points: crisis, chest pain, stroke signs, serious breathing issues, or severe injury should go to emergency care, not a quest.
              </p>
            </div>
          </div>

          <Link href="/more" className="mx-auto mt-5 flex w-fit rounded-full px-5 py-3 text-sm font-black text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
            查看全部功能 / All features
          </Link>
        </aside>
      </div>
    </main>
  );
}
