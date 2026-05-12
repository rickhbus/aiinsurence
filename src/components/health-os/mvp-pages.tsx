import Link from "next/link";
import type { ReactNode } from "react";
import {
  BarChart3,
  BriefcaseBusiness,
  Brain,
  CalendarDays,
  ClipboardList,
  Dumbbell,
  HeartPulse,
  Home,
  ShieldCheck,
  Stethoscope,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PricingCards } from "@/components/business/pricing-cards";
import { B2BLeadForm } from "@/components/business/b2b-lead-form";
import { PlanFeatureTable } from "@/components/business/plan-feature-table";
import { MealHistoryList } from "@/components/food/meal-history-list";
import { MealLogForm } from "@/components/food/meal-log-form";
import { HydrationQuickAdd } from "@/components/hydration/hydration-quick-add";
import { MoodCheckInForm } from "@/components/mood/mood-check-in-form";
import { MoodTrendChart } from "@/components/mood/mood-trend-chart";
import { BowelUrineForm } from "@/components/toilet/bowel-urine-form";
import { ProgressChart } from "@/components/gym/progress-chart";
import { RecoveryCard } from "@/components/gym/recovery-card";
import { WorkoutLogForm } from "@/components/gym/workout-log-form";
import { WorkoutStartCard } from "@/components/gym/workout-start-card";
import { WorkoutTemplateCard } from "@/components/gym/workout-template-card";
import { WORKOUT_TEMPLATES } from "@/lib/health-os/constants";
import { CheckInForm } from "./check-in-form";
import { AdvancedTodayDashboard } from "./today-dashboard";

export function HealthOsLanding() {
  const cards = [
    { href: "/today", title: "今日狀態 / Today", icon: Home, body: "身體、心情、飲食、運動、睡眠和下一步。" },
    { href: "/check-in", title: "晨晚 check-in", icon: CalendarDays, body: "起床時間、睡眠、能量、心情、壓力。" },
    { href: "/gym", title: "Gym Workout Coach", icon: Dumbbell, body: "訓練、組數、RPE、恢復和紅旗提示。" },
    { href: "/doctor", title: "Doctor Visit Prep", icon: Stethoscope, body: "整理時間線、問題和就診摘要。" },
  ];

  return (
    <main className="min-h-dvh bg-[linear-gradient(160deg,var(--health-bg-start),var(--background)_42%,var(--health-bg-end))] px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <section className="grid min-h-[calc(100dvh-4rem)] content-center gap-8 pb-16 pt-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-center">
          <div className="max-w-3xl">
            <Badge variant="secondary" className="mb-4">Super Family Doctor / 智健家庭醫生</Badge>
            <h1 className="text-gradient-health text-4xl font-bold leading-tight tracking-normal sm:text-6xl">
              智健家庭醫生 / AI Health Companion
            </h1>
            <p className="mt-5 text-base leading-8 text-muted-foreground sm:text-lg">
              我可以幫你整理今日身體、情緒、飲食、運動和睡眠狀態，並提供一般生活建議。這不是醫療診斷；如有緊急情況，請立即致電 999 或前往急症室。
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild size="lg"><Link href="/today">進入今日狀態 / Open Today</Link></Button>
              <Button asChild size="lg" variant="outline"><Link href="/check-in">匿名開始 / Start anonymously</Link></Button>
            </div>
          </div>
          <Card className="border-border/60 bg-card/80 shadow-sm backdrop-blur-xl">
            <CardHeader>
              <CardTitle>Today preview</CardTitle>
              <CardDescription>生活狀態參考，不是健康診斷分數。</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {["Energy 72", "Recovery 64", "Nutrition 68", "Safety green"].map((item) => (
                <div key={item} className="rounded-xl bg-muted/35 p-4 text-sm font-medium">{item}</div>
              ))}
            </CardContent>
          </Card>
        </section>
        <section className="-mt-24 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => (
            <Link key={card.href} href={card.href} className="rounded-2xl">
              <Card className="h-full border-border/60 bg-card/85 shadow-sm backdrop-blur-xl transition hover:-translate-y-0.5 hover:shadow-md">
                <CardHeader>
                  <span className="grid size-10 place-items-center rounded-lg bg-primary text-primary-foreground">
                    <card.icon aria-hidden="true" />
                  </span>
                  <CardTitle>{card.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm leading-6 text-muted-foreground">{card.body}</CardContent>
              </Card>
            </Link>
          ))}
        </section>
      </div>
    </main>
  );
}

export function TodayPage() {
  return <AdvancedTodayDashboard />;
}

export function MorePage() {
  const items: Array<{ href: string; title: string; icon: LucideIcon }> = [
    { href: "/reports", title: "Reports", icon: BarChart3 },
    { href: "/doctor", title: "Doctor Prep", icon: Stethoscope },
    { href: "/insurance", title: "Insurance", icon: ShieldCheck },
    { href: "/pricing", title: "Pricing", icon: ShieldCheck },
    { href: "/business", title: "Business", icon: BriefcaseBusiness },
    { href: "/gbl", title: "GBL", icon: Brain },
    { href: "/emotion", title: "Emotion Engine", icon: HeartPulse },
    { href: "/family", title: "Family", icon: Users },
    { href: "/settings", title: "Settings", icon: Settings },
  ];

  return (
    <PageFrame title="更多 / More" description="進階資料和設定集中在這裡。">
      <div className="grid gap-2">
        {items.map((item) => (
          <Button
            key={item.href}
            asChild
            variant="outline"
            className="h-auto min-h-14 justify-start rounded-xl px-4 py-3 text-left"
          >
            <Link href={item.href}>
              <item.icon data-icon="inline-start" aria-hidden="true" />
              {item.title}
            </Link>
          </Button>
        ))}
      </div>
    </PageFrame>
  );
}

export function CheckInPage() {
  return (
    <PageFrame title="Fast Check-in" description="我今日起身啦 / morning and evening flow">
      <CheckInForm />
    </PageFrame>
  );
}

export function MoodPage() {
  return (
    <PageFrame title="Mood & Emotion Coach" description="你的訊息聽起來像是……不是心理健康診斷。">
      <MoodCheckInForm />
      <MoodTrendChart />
    </PageFrame>
  );
}

export function FoodPage() {
  return (
    <PageFrame title="Food & Nutrition Journal" description="粗略估算、健身恢復、補水和消化連結。">
      <MealLogForm />
      <MealHistoryList />
    </PageFrame>
  );
}

export function HydrationPage() {
  return (
    <PageFrame title="Hydration" description="Water, caffeine, alcohol tracker">
      <HydrationQuickAdd />
    </PageFrame>
  );
}

export function ToiletPage() {
  return (
    <PageFrame title="Bowel & Urine Log" description="Bristol-like 1-7, urine color, pain, blood and dehydration flags">
      <BowelUrineForm />
    </PageFrame>
  );
}

export function GymPage() {
  return (
    <PageFrame title="Gym Workout Coach" description="動作、組數、重量、RPE、恢復和下一次訓練。">
      <WorkoutStartCard />
      <div id="workout-log"><WorkoutLogForm /></div>
      <div className="grid gap-5 xl:grid-cols-2">
        <ProgressChart />
        <RecoveryCard />
      </div>
    </PageFrame>
  );
}

export function GymTemplatesPage() {
  return (
    <PageFrame title="Workout Templates" description="Beginner, PPL, fat loss, muscle gain and recovery plans">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {WORKOUT_TEMPLATES.map((template) => <WorkoutTemplateCard key={template.name} template={template} />)}
      </div>
    </PageFrame>
  );
}

export function ReportsPage() {
  const trends = ["Sleep trend", "Mood trend", "Gym adherence", "Food pattern", "Hydration", "Bowel/urine pattern"];

  return (
    <PageFrame title="AI Weekly Reports" description="3 practical actions next week and doctor-visit export readiness">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {trends.map((trend) => (
          <Card key={trend} className="border-border/60 bg-card/80 shadow-sm backdrop-blur-xl">
            <CardHeader><CardTitle>{trend}</CardTitle></CardHeader>
            <CardContent className="text-sm leading-6 text-muted-foreground">趨勢會由 RLS logs 和 summary tables 生成。</CardContent>
          </Card>
        ))}
      </div>
      <Card className="border-border/60 bg-card/80 shadow-sm backdrop-blur-xl">
        <CardHeader><CardTitle>Doctor summary export</CardTitle></CardHeader>
        <CardContent className="grid gap-2 text-sm leading-6 text-muted-foreground">
          <p>包含近期紀錄、紅旗、安全提示、要問醫生的問題和要帶文件。</p>
          <p>這不是診斷；嚴重或持續症狀請尋求醫護人員協助。</p>
        </CardContent>
      </Card>
    </PageFrame>
  );
}

export function FamilyPage() {
  return (
    <PageFrame title="Family Health Dashboard" description="Consent-first caregiver sharing">
      <div className="grid gap-4 md:grid-cols-3">
        {["自己 / Me", "父母 / Elder", "小朋友 / Child"].map((member) => (
          <Card key={member} className="border-border/60 bg-card/80 shadow-sm backdrop-blur-xl">
            <CardHeader>
              <Users aria-hidden="true" className="size-5 text-primary" />
              <CardTitle>{member}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-6 text-muted-foreground">
              需要明確同意才可分享；不會自動顯示私人健康資料。
            </CardContent>
          </Card>
        ))}
      </div>
    </PageFrame>
  );
}

export function DoctorPrepPage() {
  return (
    <PageFrame title="Doctor Visit Prep" description="Symptoms timeline, recent logs, questions and red flags">
      <PreparationGrid
        icon={Stethoscope}
        items={[
          "症狀時間線 / Symptoms timeline",
          "睡眠、心情、飲食、運動背景 / Daily context",
          "要問醫生的問題 / Questions to ask",
          "要帶文件 / What to bring",
          "紅旗提示 / Red flags",
          "Disclaimer: 這不是診斷",
        ]}
      />
    </PageFrame>
  );
}

export function InsurancePrepPage() {
  return (
    <PageFrame title="Insurance Preparation" description="Education only, no advice or guarantee">
      <PreparationGrid
        icon={ShieldCheck}
        items={[
          "保障類別教育 / Coverage category education",
          "保單文件清單 / Policy document checklist",
          "索償文件清單 / Claim document checklist",
          "VHIS/category-level explanation where relevant",
          "持牌顧問交接提示 / Licensed adviser handoff",
          "不保證承保、賠償或索償結果",
        ]}
      />
    </PageFrame>
  );
}

export function PricingPage() {
  return (
    <PageFrame title="Pricing" description="Mock entitlements until real payment infrastructure is introduced server-side">
      <PricingCards />
      <PlanFeatureTable />
    </PageFrame>
  );
}

export function BusinessPage() {
  const businessCards: Array<{ title: string; icon: LucideIcon; body: string }> = [
    { title: "Gym/PT", icon: Dumbbell, body: "Member workout logs and adherence reports." },
    { title: "Employer wellness", icon: BriefcaseBusiness, body: "Privacy-safe aggregate insights only." },
    { title: "Clinic prep", icon: ClipboardList, body: "Doctor visit preparation, no diagnosis." },
  ];

  return (
    <PageFrame title="Business Wellness" description="Gym, PT, employer, clinic and preparation partnerships">
      <div className="grid gap-4 md:grid-cols-3">
        {businessCards.map(({ title, icon: Icon, body }) => (
          <Card key={title} className="border-border/60 bg-card/80 shadow-sm backdrop-blur-xl">
            <CardHeader><Icon aria-hidden="true" className="size-5 text-primary" /><CardTitle>{title}</CardTitle></CardHeader>
            <CardContent className="text-sm leading-6 text-muted-foreground">{body}</CardContent>
          </Card>
        ))}
      </div>
      <B2BLeadForm />
    </PageFrame>
  );
}

function PageFrame({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-6">
      <section className="welcome-gradient rounded-2xl border border-border/50 bg-card/70 p-5 shadow-sm backdrop-blur-xl">
        <Badge variant="secondary" className="mb-3">智健家庭醫生 / AI Health Companion</Badge>
        <h1 className="text-gradient-health text-3xl font-bold tracking-normal sm:text-4xl">{title}</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">{description}</p>
      </section>
      {children}
      <SafetyFooter />
    </div>
  );
}

function PreparationGrid({ icon: Icon, items }: { icon: LucideIcon; items: string[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <Card key={item} className="border-border/60 bg-card/80 shadow-sm backdrop-blur-xl">
          <CardHeader><Icon aria-hidden="true" className="size-5 text-primary" /><CardTitle className="text-base">{item}</CardTitle></CardHeader>
        </Card>
      ))}
    </div>
  );
}

function SafetyFooter() {
  return (
    <Card className="border-border/60 bg-card/70 shadow-sm backdrop-blur-xl">
      <CardContent className="pt-6 text-sm leading-6 text-muted-foreground">
        這不是醫療診斷、法律或保險建議，不保證治療、安全運動、承保、保障、賠償或索償結果。緊急情況請立即致電 999 或前往急症室。
      </CardContent>
    </Card>
  );
}
