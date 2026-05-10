"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import {
  Activity,
  Apple,
  BedDouble,
  BookOpenCheck,
  Brain,
  Dumbbell,
  Droplets,
  Flame,
  Footprints,
  Grip,
  HeartPulse,
  Moon,
  Plus,
  ShieldCheck,
  Sparkles,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import {
  activityData,
  foodRecommendations,
  goals,
  gymLogs,
  gymVolumeData,
  healthScore,
  lessons,
  macroData,
  mealLogs,
  runningDistanceData,
  runningLogs,
  sleepLogs,
  waterData,
  workoutTemplates,
} from "@/lib/health-app/mock-data";
import type { Goal, Lesson, Locale, LocalizedText } from "@/lib/health-app/types";
import { label, safetyCopy, text, ui } from "@/lib/health-app/i18n";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MacroChart, MuscleGroupChart, ProgressChart, ProgressRing } from "./charts";

const cardMotion = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.32 },
};

type CardProps = {
  locale: Locale;
  className?: string;
};

export function HealthScoreCard({ locale, className }: CardProps) {
  return (
    <DashboardCard className={cn("bg-card/80", className)} icon={HeartPulse} title={ui.dashboard} locale={locale}>
      <div className="flex items-center justify-between gap-5">
        <ProgressRing value={healthScore.score} label="Health score" />
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <Badge variant="secondary" className="w-fit">
            {locale === "zh-Hant" ? "今日狀態穩定" : "Steady today"}
          </Badge>
          <p className="text-sm leading-6 text-muted-foreground">
            {text(healthScore.explanation, locale)}
          </p>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <MiniStat value="5" label={locale === "zh-Hant" ? "連續天" : "streak"} />
            <MiniStat value="84%" label={locale === "zh-Hant" ? "一致性" : "consistent"} />
            <MiniStat value="+8" label={locale === "zh-Hant" ? "本週" : "week"} />
          </div>
        </div>
      </div>
    </DashboardCard>
  );
}

export function TodayPlanCard({ locale, className }: CardProps) {
  const items = [
    {
      icon: Dumbbell,
      title: { zh: "上半身力量 30 分鐘", en: "30-minute upper-body strength" },
      detail: { zh: "昨日跑步較用力，今天避免再加跑量。", en: "Yesterday’s run was harder, so avoid extra run volume today." },
    },
    {
      icon: Apple,
      title: { zh: "午餐加一份蛋白質", en: "Add one protein serving at lunch" },
      detail: { zh: "雞、魚、豆腐、蛋或希臘乳酪都可以。", en: "Chicken, fish, tofu, eggs, or Greek yogurt all work." },
    },
    {
      icon: Moon,
      title: { zh: "睡前提早 15 分鐘放低手機", en: "Put the phone down 15 minutes earlier" },
      detail: { zh: "睡眠一致性是今日最大改善位。", en: "Sleep consistency is today’s biggest improvement area." },
    },
    {
      icon: BookOpenCheck,
      title: { zh: "學習：漸進超負荷", en: "Learn: progressive overload" },
      detail: { zh: "只選一個動作小幅進步。", en: "Choose one exercise and improve by one small step." },
    },
  ];

  return (
    <DashboardCard className={className} icon={Sparkles} title={ui.todayPlan} locale={locale}>
      <div className="flex flex-col gap-3">
        {items.map((item) => (
          <div key={item.title.en} className="flex items-start gap-3 rounded-lg bg-muted/45 p-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-background text-foreground ring-1 ring-border">
              <item.icon aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="font-medium">{text(item.title, locale)}</p>
              <p className="mt-1 text-sm leading-5 text-muted-foreground">{text(item.detail, locale)}</p>
            </div>
          </div>
        ))}
      </div>
    </DashboardCard>
  );
}

export function ActivitySummaryCard({ locale, className }: CardProps) {
  return (
    <DashboardCard className={className} icon={Activity} title={{ zh: "活動摘要", en: "Activity summary" }} locale={locale}>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricPill icon={Footprints} value="9,143" label={{ zh: "步數", en: "Steps" }} locale={locale} />
        <MetricPill icon={Flame} value="612" label={{ zh: "卡路里", en: "Calories" }} locale={locale} />
        <MetricPill icon={Activity} value="47m" label={{ zh: "運動分鐘", en: "Workout minutes" }} locale={locale} />
        <MetricPill icon={Trophy} value="5d" label={{ zh: "連續紀錄", en: "Weekly streak" }} locale={locale} />
      </div>
      <ProgressChart data={activityData} height={156} />
    </DashboardCard>
  );
}

export function RunningProgressCard({ locale, className }: CardProps) {
  return (
    <DashboardCard className={className} icon={Footprints} title={ui.running} locale={locale} href="/track/running">
      <div className="grid grid-cols-2 gap-3">
        <MiniStat value="12.3 km" label={locale === "zh-Hant" ? "本週距離" : "Weekly distance"} />
        <MiniStat value="5.0 km" label={locale === "zh-Hant" ? "上次跑步" : "Last run"} />
        <MiniStat value="6:06/km" label={locale === "zh-Hant" ? "平均配速" : "Average pace"} />
        <MiniStat value="Recovery" label={locale === "zh-Hant" ? "下次建議" : "Next run"} />
      </div>
      <ProgressChart data={runningDistanceData} variant="bar" height={142} />
      <p className="text-sm leading-6 text-muted-foreground">
        {locale === "zh-Hant"
          ? "跑量增加保持保守；如果昨日強度高，今日以步行或輕鬆活動恢復。"
          : "Keep weekly distance increases conservative; after a hard run, recover with walking or easy movement."}
      </p>
    </DashboardCard>
  );
}

export function GymProgressCard({ locale, className }: CardProps) {
  return (
    <DashboardCard className={className} icon={Dumbbell} title={ui.gym} locale={locale} href="/track/gym">
      <div className="grid grid-cols-2 gap-3">
        <MiniStat value="Pull + core" label={locale === "zh-Hant" ? "上次訓練" : "Last workout"} />
        <MiniStat value="Back, Core" label={locale === "zh-Hant" ? "肌群" : "Muscles"} />
        <MiniStat value="3,104 kg" label={locale === "zh-Hant" ? "本週容量" : "Weekly volume"} />
        <MiniStat value="Green" label={locale === "zh-Hant" ? "恢復狀態" : "Recovery"} />
      </div>
      <MuscleGroupChart data={gymVolumeData} />
      <p className="text-sm leading-6 text-muted-foreground">
        {locale === "zh-Hant"
          ? "下次可在一個動作增加 1 次重複或 2.5kg；如有尖銳痛楚，立即停止。"
          : "Next time, add one rep or 2.5kg on one movement; stop if sharp pain appears."}
      </p>
    </DashboardCard>
  );
}

export function NutritionCard({ locale, className }: CardProps) {
  return (
    <DashboardCard className={className} icon={Apple} title={ui.nutrition} locale={locale} href="/nutrition">
      <div className="grid grid-cols-2 gap-3">
        <MiniStat value="1,710" label={locale === "zh-Hant" ? "卡路里" : "Calories"} />
        <MiniStat value="108g" label={locale === "zh-Hant" ? "蛋白質" : "Protein"} />
        <MiniStat value="46%" label={locale === "zh-Hant" ? "碳水" : "Carbs"} />
        <MiniStat value="82" label={locale === "zh-Hant" ? "餐質分" : "Meal quality"} />
      </div>
      <MacroChart data={macroData} />
    </DashboardCard>
  );
}

export function WaterCard({ locale, className }: CardProps) {
  return (
    <DashboardCard className={className} icon={Droplets} title={ui.water} locale={locale}>
      <div className="flex items-center justify-between gap-4">
        <ProgressRing value={76} label={locale === "zh-Hant" ? "今日目標" : "today"} size={108} tone="secondary" />
        <div className="flex flex-1 flex-col gap-3">
          <MiniStat value="2.3L" label={locale === "zh-Hant" ? "已飲用" : "Consumed"} />
          <ProgressChart data={waterData} variant="line" height={112} />
        </div>
      </div>
    </DashboardCard>
  );
}

export function SleepCard({ locale, className }: CardProps) {
  const average = (sleepLogs.reduce((sum, item) => sum + item.hours, 0) / sleepLogs.length).toFixed(1);

  return (
    <DashboardCard className={className} icon={BedDouble} title={ui.sleep} locale={locale}>
      <div className="grid grid-cols-[1fr_auto] gap-4">
        <div className="flex flex-col gap-3">
          <MiniStat value={`${average}h`} label={locale === "zh-Hant" ? "平均睡眠" : "Average sleep"} />
          <p className="text-sm leading-6 text-muted-foreground">
            {locale === "zh-Hant"
              ? "睡眠質素不差，但入睡時間仍可更固定。"
              : "Sleep quality is decent, but bedtime consistency can improve."}
          </p>
        </div>
        <ProgressRing value={72} label={locale === "zh-Hant" ? "睡眠分" : "sleep"} size={104} />
      </div>
    </DashboardCard>
  );
}

export function AIRecommendationCard({ locale, className }: CardProps) {
  return (
    <DashboardCard className={className} icon={Brain} title={{ zh: "今日 AI 建議", en: "Today’s AI recommendation" }} locale={locale} href="/coach">
      <div className="flex flex-col gap-3">
        <h3 className="text-xl font-semibold tracking-normal">
          {locale === "zh-Hant" ? "輕量上身訓練，加強午餐蛋白質" : "Light upper-body work and more protein at lunch"}
        </h3>
        <div className="rounded-lg bg-muted/45 p-3">
          <p className="text-sm font-medium">{label(ui.why, locale)}</p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            {locale === "zh-Hant"
              ? "你昨日跑步 RPE 7，今天再加跑量未必最有效；飲食記錄顯示午餐蛋白質仍可提升。"
              : "Yesterday’s run was RPE 7, so more run volume may not be useful today; lunch protein can improve."}
          </p>
        </div>
        <div className="rounded-lg bg-muted/45 p-3">
          <p className="text-sm font-medium">{label(ui.action, locale)}</p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            {locale === "zh-Hant"
              ? "做 30 分鐘上身力量訓練，午餐加入豆腐、魚、雞蛋或雞肉。"
              : "Do 30 minutes of upper-body strength and add tofu, fish, eggs, or chicken at lunch."}
          </p>
        </div>
      </div>
    </DashboardCard>
  );
}

export function LearnCard({ locale, lesson = lessons[0], className }: CardProps & { lesson?: Lesson }) {
  return (
    <DashboardCard className={className} icon={BookOpenCheck} title={{ zh: "每日健康知識", en: "Health lesson of the day" }} locale={locale}>
      <div className="flex flex-col gap-3">
        <Badge variant="secondary" className="w-fit">
          {text(lesson.category, locale)}
        </Badge>
        <h3 className="text-xl font-semibold tracking-normal">{text(lesson.title, locale)}</h3>
        <p className="text-sm leading-6 text-muted-foreground">{text(lesson.explanation, locale)}</p>
        <Button asChild variant="outline" className="w-fit">
          <Link href={`/learn/${lesson.slug}`}>{label(ui.readMore, locale)}</Link>
        </Button>
      </div>
    </DashboardCard>
  );
}

export function GoalCard({ goal, locale }: { goal: Goal; locale: Locale }) {
  return (
    <Card className="bg-card/80 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-3">
          <span>{text(goal.type, locale)}</span>
          <Badge variant="secondary">{goal.progress}%</Badge>
        </CardTitle>
        <CardDescription>{goal.target}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary" style={{ width: `${goal.progress}%` }} />
        </div>
        <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
          {goal.weeklyActions.map((action) => (
            <li key={action.en} className="flex items-start gap-2">
              <ShieldCheck aria-hidden="true" className="mt-0.5 text-primary" />
              <span>{text(action, locale)}</span>
            </li>
          ))}
        </ul>
        <p className="rounded-lg bg-muted/45 p-3 text-sm leading-6 text-muted-foreground">
          {text(goal.suggestion, locale)}
        </p>
      </CardContent>
    </Card>
  );
}

export function WorkoutTemplateCard({ template, locale }: { template: string; locale: Locale }) {
  return (
    <Card className="bg-card/80 shadow-sm">
      <CardHeader>
        <CardTitle>{template}</CardTitle>
        <CardDescription>
          {locale === "zh-Hant"
            ? "包含熱身、主訓練和冷卻；可按疲勞降低容量。"
            : "Includes warm-up, main work, and cool-down; reduce volume when fatigued."}
        </CardDescription>
      </CardHeader>
      <CardFooter className="justify-between">
        <Badge variant="secondary">RPE 6-8</Badge>
        <Button variant="outline" size="sm">
          <Plus data-icon="inline-start" aria-hidden="true" />
          {locale === "zh-Hant" ? "套用" : "Use"}
        </Button>
      </CardFooter>
    </Card>
  );
}

export function FoodRecommendationCard({
  item,
  locale,
}: {
  item: (typeof foodRecommendations)[number];
  locale: Locale;
}) {
  return (
    <Card className="bg-card/80 shadow-sm">
      <CardHeader>
        <CardTitle>{text(item.title, locale)}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-6 text-muted-foreground">{text(item.body, locale)}</p>
      </CardContent>
    </Card>
  );
}

export function SafetyDisclaimer({ locale, compact = false }: { locale: Locale; compact?: boolean }) {
  return (
    <div className={cn("rounded-lg border bg-muted/35 p-4 text-sm leading-6 text-muted-foreground", compact && "p-3 text-xs")}>
      <strong className="text-foreground">{label(ui.safety, locale)}: </strong>
      {locale === "zh-Hant" ? safetyCopy.zh : safetyCopy.en}
    </div>
  );
}

export function SkeletonLoadingState({ locale }: { locale: Locale }) {
  return (
    <Card className="bg-card/80">
      <CardHeader>
        <CardTitle>{label(ui.loading, locale)}</CardTitle>
        <CardDescription>{label(ui.emptyState, locale)}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-5 w-1/2" />
      </CardContent>
    </Card>
  );
}

export function DashboardCard({
  icon: Icon,
  title,
  locale,
  children,
  href,
  className,
}: {
  icon: LucideIcon;
  title: LocalizedText;
  locale: Locale;
  children: ReactNode;
  href?: string;
  className?: string;
}) {
  return (
    <motion.div {...cardMotion}>
      <Card className={cn("relative bg-card/75 shadow-sm backdrop-blur-md transition-transform hover:-translate-y-0.5", className)}>
        <CardHeader className="gap-2">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-lg bg-primary text-primary-foreground">
                <Icon aria-hidden="true" />
              </span>
              <CardTitle>{text(title, locale)}</CardTitle>
            </div>
            <Grip aria-hidden="true" className="text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">{children}</CardContent>
        {href ? (
          <CardFooter className="justify-end">
            <Button asChild variant="ghost" size="sm">
              <Link href={href}>{locale === "zh-Hant" ? "查看" : "Open"}</Link>
            </Button>
          </CardFooter>
        ) : null}
      </Card>
    </motion.div>
  );
}

function MiniStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-lg bg-muted/45 p-3">
      <p className="truncate text-base font-semibold tracking-normal">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function MetricPill({
  icon: Icon,
  value,
  label: itemLabel,
  locale,
}: {
  icon: LucideIcon;
  value: string;
  label: LocalizedText;
  locale: Locale;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-lg bg-muted/45 p-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-background ring-1 ring-border">
        <Icon aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="truncate font-semibold tracking-normal">{value}</p>
        <p className="truncate text-xs text-muted-foreground">{text(itemLabel, locale)}</p>
      </div>
    </div>
  );
}

export { goals, mealLogs, runningLogs, gymLogs, workoutTemplates };
