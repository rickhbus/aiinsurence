"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import {
  Activity,
  AlertTriangle,
  Apple,
  ArrowUpRight,
  BedDouble,
  BookOpenCheck,
  Brain,
  Dumbbell,
  Droplets,
  Flame,
  Footprints,
  HeartPulse,
  Info,
  Moon,
  Plus,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Target,
  TrendingUp,
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
import type { DashboardData } from "@/lib/health-data/types";
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
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { MacroChart, MuscleGroupChart, ProgressChart, ProgressRing } from "./charts";

const cardMotion = {
  initial: false,
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.32 },
};

type CardProps = {
  locale: Locale;
  className?: string;
  data?: DashboardData | null;
};

export function HealthScoreCard({ locale, className, data }: CardProps) {
  const score = data?.today.health_score ?? healthScore.score;
  const activityScore = data?.today.activity_score ?? 86;
  const nutritionScore = data?.today.nutrition_score ?? 82;
  const sleepScore = data?.today.sleep_score ?? 72;
  const hydrationScore = data?.today.hydration_score ?? 76;

  return (
    <DashboardCard className={cn("bg-card/88", className)} icon={HeartPulse} title={{ zh: "健康分數", en: "Health Score" }} locale={locale}>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <ProgressRing value={score} label="Health score" />
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="w-fit">
              {locale === "zh-Hant" ? "較上週 +8" : "+8 vs last week"}
            </Badge>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon-xs" aria-label={locale === "zh-Hant" ? "分數說明" : "Score explanation"}>
                  <Info aria-hidden="true" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="max-w-64">
                {locale === "zh-Hant"
                  ? "此分數只作教育和生活方式參考，不是醫療診斷。"
                  : "This score is educational lifestyle feedback, not a medical diagnosis."}
              </TooltipContent>
            </Tooltip>
          </div>
          <p className="text-sm leading-6 text-muted-foreground">
            {data
              ? locale === "zh-Hant"
                ? "分數根據今日活動、飲食、睡眠和飲水摘要計算，只作生活方式教育參考。"
                : "Score is calculated from today’s activity, nutrition, sleep, and hydration summaries for lifestyle education only."
              : text(healthScore.explanation, locale)}
          </p>
          <div className="grid grid-cols-4 gap-2 text-center text-xs">
            <MiniStat value={String(activityScore)} label={locale === "zh-Hant" ? "活動量" : "Activity"} />
            <MiniStat value={String(nutritionScore)} label={locale === "zh-Hant" ? "飲食" : "Nutrition"} />
            <MiniStat value={String(sleepScore)} label={locale === "zh-Hant" ? "睡眠" : "Sleep"} />
            <MiniStat value={String(hydrationScore)} label={locale === "zh-Hant" ? "飲水" : "Water"} />
          </div>
        </div>
      </div>
    </DashboardCard>
  );
}

export function TodayPlanCard({ locale, className, data }: CardProps) {
  const recommendation = data?.recommendation;
  const items = recommendation
    ? [
        {
          icon: Dumbbell,
          title: { zh: `運動: ${recommendation.workout.title}`, en: `Exercise: ${recommendation.workout.title}` },
          detail: { zh: recommendation.workout.action, en: recommendation.workout.action },
        },
        {
          icon: Apple,
          title: { zh: `飲食: ${recommendation.nutrition.title}`, en: `Nutrition: ${recommendation.nutrition.title}` },
          detail: { zh: recommendation.nutrition.action, en: recommendation.nutrition.action },
        },
        {
          icon: Moon,
          title: { zh: `恢復: ${recommendation.recovery.title}`, en: `Recovery: ${recommendation.recovery.title}` },
          detail: { zh: recommendation.recovery.action, en: recommendation.recovery.action },
        },
        {
          icon: BookOpenCheck,
          title: { zh: `學習: ${recommendation.learning.title}`, en: `Learn: ${recommendation.learning.title}` },
          detail: { zh: recommendation.learning.action, en: recommendation.learning.action },
        },
      ]
    : [
    {
      icon: Dumbbell,
      title: { zh: "運動: 上半身力量 30 分鐘", en: "Exercise: 30-minute upper-body strength" },
      detail: { zh: "昨日跑步較用力，今天避免再加跑量。", en: "Yesterday’s run was harder, so avoid extra run volume today." },
    },
    {
      icon: Apple,
      title: { zh: "飲食: 午餐加一份蛋白質", en: "Nutrition: add one protein serving at lunch" },
      detail: { zh: "雞、魚、豆腐、蛋或希臘乳酪都可以。", en: "Chicken, fish, tofu, eggs, or Greek yogurt all work." },
    },
    {
      icon: Moon,
      title: { zh: "恢復: 睡前 15 分鐘放低手機", en: "Recovery: put the phone down 15 minutes earlier" },
      detail: { zh: "睡眠一致性是今日最大改善位。", en: "Sleep consistency is today’s biggest improvement area." },
    },
    {
      icon: BookOpenCheck,
      title: { zh: "學習: 漸進超負荷", en: "Learn: progressive overload" },
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

export function ActivitySummaryCard({ locale, className, data }: CardProps) {
  const chartData = dataOrFallback(data?.charts.activity, activityData);
  const activeMinutes = Math.round(data?.today.active_minutes ?? 47);
  const calories = Math.round(data?.today.calories_total ?? 612);
  const streak = data?.weekly.workout_days ?? 5;

  return (
    <DashboardCard className={className} icon={Activity} title={{ zh: "活動摘要", en: "Activity summary" }} locale={locale}>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricPill icon={Footprints} value="9,143" label={{ zh: "步數", en: "Steps" }} locale={locale} />
        <MetricPill icon={Flame} value={String(calories)} label={{ zh: "卡路里", en: "Calories" }} locale={locale} />
        <MetricPill icon={Activity} value={`${activeMinutes}m`} label={{ zh: "運動分鐘", en: "Workout minutes" }} locale={locale} />
        <MetricPill icon={Trophy} value={`${streak}d`} label={{ zh: "連續紀錄", en: "Weekly streak" }} locale={locale} />
      </div>
      <ProgressChart data={chartData} height={156} />
    </DashboardCard>
  );
}

export function RunningProgressCard({ locale, className, data }: CardProps) {
  const lastRun = data?.recent.running[0];
  const weeklyDistance = data?.weekly.running_distance_km ?? 12.3;
  const chartData = dataOrFallback(data?.charts.runningDistance, runningDistanceData);
  const averagePace = getAveragePace(data?.recent.running);

  return (
    <DashboardCard className={className} icon={Footprints} title={ui.running} locale={locale} href="/track/running">
      <div className="grid grid-cols-2 gap-3">
        <MiniStat value={`${weeklyDistance} km`} label={locale === "zh-Hant" ? "本週距離" : "Weekly distance"} />
        <MiniStat value={lastRun ? `${lastRun.distance_km} km` : "5.0 km"} label={locale === "zh-Hant" ? "上次跑步" : "Last run"} />
        <MiniStat value={averagePace} label={locale === "zh-Hant" ? "平均配速" : "Average pace"} />
        <MiniStat value="Recovery" label={locale === "zh-Hant" ? "下次建議" : "Next run"} />
      </div>
      <ProgressChart data={chartData} variant="bar" height={142} />
      <p className="text-sm leading-6 text-muted-foreground">
        {locale === "zh-Hant"
          ? "跑量增加保持保守；如果昨日強度高，今日以步行或輕鬆活動恢復。"
          : "Keep weekly distance increases conservative; after a hard run, recover with walking or easy movement."}
      </p>
    </DashboardCard>
  );
}

export function GymProgressCard({ locale, className, data }: CardProps) {
  const lastWorkout = data?.recent.gym[0];
  const volume = data?.charts.gymVolume.reduce((total, item) => total + item.value, 0) ?? 3104;
  const chartData = dataOrFallback(data?.charts.gymVolume, gymVolumeData);

  return (
    <DashboardCard className={className} icon={Dumbbell} title={ui.gym} locale={locale} href="/track/gym">
      <div className="grid grid-cols-2 gap-3">
        <MiniStat value={lastWorkout?.workout_title || "Pull + core"} label={locale === "zh-Hant" ? "上次訓練" : "Last workout"} />
        <MiniStat value={lastWorkout?.muscle_group || "Back, Core"} label={locale === "zh-Hant" ? "肌群" : "Muscles"} />
        <MiniStat value={`${volume.toLocaleString()} kg`} label={locale === "zh-Hant" ? "本週容量" : "Weekly volume"} />
        <MiniStat value="Green" label={locale === "zh-Hant" ? "恢復狀態" : "Recovery"} />
      </div>
      <MuscleGroupChart data={chartData} />
      <p className="text-sm leading-6 text-muted-foreground">
        {locale === "zh-Hant"
          ? "下次可在一個動作增加 1 次重複或 2.5kg；如有尖銳痛楚，立即停止。"
          : "Next time, add one rep or 2.5kg on one movement; stop if sharp pain appears."}
      </p>
    </DashboardCard>
  );
}

export function NutritionCard({ locale, className, data }: CardProps) {
  const calories = data?.today.calories_total ?? 1710;
  const protein = data?.today.protein_total ?? 108;
  const carbs = data?.today.carbs_total ?? 46;
  const fat = data?.today.fat_total ?? 20;
  const waterLiters = ((data?.today.water_total_ml ?? 2300) / 1000).toFixed(1);
  const totalMacros = Math.max(1, protein + carbs + fat);
  const macroChartData = data
    ? [
        { name: "Protein", value: Math.round((protein / totalMacros) * 100), fill: "var(--chart-1)" },
        { name: "Carbs", value: Math.round((carbs / totalMacros) * 100), fill: "var(--chart-2)" },
        { name: "Fat", value: Math.round((fat / totalMacros) * 100), fill: "var(--chart-3)" },
      ]
    : macroData;

  return (
    <DashboardCard className={className} icon={Apple} title={ui.nutrition} locale={locale} href="/nutrition">
      <div className="grid grid-cols-2 gap-3">
        <MiniStat value={calories.toLocaleString()} label={locale === "zh-Hant" ? "卡路里" : "Calories"} />
        <MiniStat value={`${protein}g`} label={locale === "zh-Hant" ? "蛋白質" : "Protein"} />
        <MiniStat value={`${carbs}g`} label={locale === "zh-Hant" ? "碳水" : "Carbs"} />
        <MiniStat value={`${fat}g`} label={locale === "zh-Hant" ? "脂肪" : "Fat"} />
        <MiniStat value={`${waterLiters}L`} label={locale === "zh-Hant" ? "飲水" : "Water"} />
        <MiniStat value={String(data?.today.nutrition_score ?? 82)} label={locale === "zh-Hant" ? "餐質分" : "Meal quality"} />
      </div>
      <MacroChart data={macroChartData} />
      <p className="text-sm leading-6 text-muted-foreground">
        {locale === "zh-Hant"
          ? "香港外食建議：魚湯米線少油、雞飯少汁加菜，配無糖茶。"
          : "Hong Kong food idea: fish soup noodles with less oil, chicken rice with less sauce and vegetables, plus unsweetened tea."}
      </p>
    </DashboardCard>
  );
}

export function WaterCard({ locale, className, data }: CardProps) {
  const waterMl = data?.today.water_total_ml ?? 2300;
  const progress = Math.min(100, Math.round((waterMl / 3000) * 100));
  const chartData = dataOrFallback(data?.charts.water, waterData);

  return (
    <DashboardCard className={className} icon={Droplets} title={ui.water} locale={locale}>
      <div className="flex items-center justify-between gap-4">
        <ProgressRing value={progress} label={locale === "zh-Hant" ? "今日目標" : "today"} size={108} tone="secondary" />
        <div className="flex flex-1 flex-col gap-3">
          <MiniStat value={`${(waterMl / 1000).toFixed(1)}L`} label={locale === "zh-Hant" ? "已飲用" : "Consumed"} />
          <ProgressChart data={chartData} variant="line" height={112} />
        </div>
      </div>
    </DashboardCard>
  );
}

export function SleepCard({ locale, className, data }: CardProps) {
  const average = data?.today.sleep_hours
    ? data.today.sleep_hours.toFixed(1)
    : (sleepLogs.reduce((sum, item) => sum + item.hours, 0) / sleepLogs.length).toFixed(1);
  const sleepScore = data?.today.sleep_score ?? 72;

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
        <ProgressRing value={sleepScore} label={locale === "zh-Hant" ? "睡眠分" : "sleep"} size={104} />
      </div>
    </DashboardCard>
  );
}

export function AIRecommendationCard({ locale, className, data }: CardProps) {
  const recommendation = data?.recommendation;

  return (
    <DashboardCard className={className} icon={Brain} title={{ zh: "今日 AI 建議", en: "Today’s AI recommendation" }} locale={locale} href="/coach">
      <div className="flex flex-col gap-3">
        <h3 className="text-xl font-semibold tracking-normal">
          {recommendation
            ? `${recommendation.workout.title}，${recommendation.nutrition.title}`
            : locale === "zh-Hant" ? "輕量上身訓練，加強午餐蛋白質" : "Light upper-body work and more protein at lunch"}
        </h3>
        <p className="text-sm leading-6 text-muted-foreground">
          {recommendation
            ? recommendation.workout.summary
            : locale === "zh-Hant"
            ? "今天先維持活動節奏，不急於加跑量。"
            : "Keep your activity rhythm today without rushing to add run volume."}
        </p>
        <div className="rounded-lg bg-muted/45 p-3">
          <p className="text-sm font-medium">{label(ui.why, locale)}</p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            {locale === "zh-Hant"
              ? recommendation?.workout.reason ?? "你昨日跑步 RPE 7，今天再加跑量未必最有效；飲食記錄顯示午餐蛋白質仍可提升。"
              : "Yesterday’s run was RPE 7, so more run volume may not be useful today; lunch protein can improve."}
          </p>
        </div>
        <div className="rounded-lg bg-muted/45 p-3">
          <p className="text-sm font-medium">{label(ui.action, locale)}</p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            {locale === "zh-Hant"
              ? recommendation?.workout.action ?? "做 30 分鐘上身力量訓練，午餐加入豆腐、魚、雞蛋或雞肉。"
            : "Do 30 minutes of upper-body strength and add tofu, fish, eggs, or chicken at lunch."}
          </p>
        </div>
        <div className="rounded-lg border border-primary/20 bg-secondary/45 p-3 text-sm leading-6 text-muted-foreground">
          <strong className="text-foreground">{locale === "zh-Hant" ? "安全提示: " : "Safety note: "}</strong>
          {locale === "zh-Hant"
            ? recommendation?.safetyNote ?? "如膝痛加劇、胸痛或嚴重氣促，停止運動並尋求醫療協助。"
            : "If knee pain worsens, chest pain appears, or breathing is severe, stop and seek care."}
        </div>
        <Button asChild variant="outline" className="w-fit">
          <Link href="/coach">
            <ArrowUpRight data-icon="inline-start" aria-hidden="true" />
            {locale === "zh-Hant" ? "查看詳情" : "View details"}
          </Link>
        </Button>
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
        <p className="text-sm leading-6 text-muted-foreground">
          {text(lesson.explanation, locale)} {text(lesson.example, locale)}
        </p>
        <p className="rounded-lg bg-muted/45 p-3 text-sm leading-6 text-muted-foreground">
          <strong className="text-foreground">{label(ui.action, locale)}: </strong>
          {text(lesson.actionStep, locale)}
        </p>
        <Button asChild variant="outline" className="w-fit">
          <Link href={`/learn/${lesson.slug}`}>
            <BookOpenCheck data-icon="inline-start" aria-hidden="true" />
            {locale === "zh-Hant" ? "做小測驗" : "Take quiz"}
          </Link>
        </Button>
      </div>
    </DashboardCard>
  );
}

export function HealthcareReminderCard({ locale, className }: CardProps) {
  return (
    <DashboardCard className={className} icon={Stethoscope} title={{ zh: "醫療導航提醒", en: "Healthcare reminder" }} locale={locale} href="/healthcare/symptom-routing">
      <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
        <div className="flex flex-col gap-3">
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm leading-6 text-muted-foreground">
            <AlertTriangle aria-hidden="true" className="mb-2 text-destructive" />
            {locale === "zh-Hant"
              ? "胸痛、嚴重呼吸困難、中風徵兆、嚴重過敏、大量出血或失去知覺，請立即致電 999 或前往急症室。"
              : "For chest pain, severe breathing difficulty, stroke signs, severe allergy, severe bleeding, or loss of consciousness, call 999 or go to A&E now."}
          </div>
          <p className="text-sm leading-6 text-muted-foreground">
            {locale === "zh-Hant"
              ? "這不是診斷。根據你提供的資料，系統只會協助理解合理下一步。"
              : "This is not a diagnosis. Based on what you share, the system only helps explain a reasonable next step."}
          </p>
        </div>
        <Button asChild>
          <Link href="/healthcare/symptom-routing">
            <Stethoscope data-icon="inline-start" aria-hidden="true" />
            {locale === "zh-Hant" ? "檢查照護方向" : "Check care direction"}
          </Link>
        </Button>
      </div>
    </DashboardCard>
  );
}

export function WeeklyProgressCard({ locale, className, data }: CardProps) {
  const gymVolume = data?.charts.gymVolume.reduce((total, item) => total + item.value, 0) ?? 3104;
  const chartData = dataOrFallback(data?.charts.activity, activityData);

  return (
    <DashboardCard className={className} icon={TrendingUp} title={{ zh: "每週進度", en: "Weekly Progress" }} locale={locale} href="/progress">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <MiniStat value={`${data?.weekly.running_distance_km ?? 12.3} km`} label={locale === "zh-Hant" ? "跑步趨勢" : "Running"} />
        <MiniStat value={`${gymVolume.toLocaleString()} kg`} label={locale === "zh-Hant" ? "健身容量" : "Gym volume"} />
        <MiniStat value={`${data?.weekly.protein_consistency_days ?? 4}/7`} label={locale === "zh-Hant" ? "營養一致" : "Nutrition"} />
        <MiniStat value={`${data?.weekly.water_goal_days ?? 5}d`} label={locale === "zh-Hant" ? "飲水連續" : "Water streak"} />
      </div>
      <ProgressChart data={chartData} height={150} />
      <div className="rounded-lg bg-muted/45 p-3 text-sm leading-6 text-muted-foreground">
        <Target aria-hidden="true" className="mb-2 text-primary" />
        {locale === "zh-Hant"
          ? "AI 週報重點：先守住睡眠和蛋白質，再小幅增加跑量。"
          : "AI weekly insight: protect sleep and protein first, then nudge running volume gradually."}
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
    <motion.div {...cardMotion} className={className}>
      <Card className="relative h-full bg-card/82 shadow-sm backdrop-blur-md transition-all hover:-translate-y-0.5 hover:shadow-md">
        <CardHeader className="gap-2">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground">
                <Icon aria-hidden="true" />
              </span>
              <CardTitle>{text(title, locale)}</CardTitle>
            </div>
            {href ? (
              <Button asChild variant="ghost" size="icon-sm" aria-label={locale === "zh-Hant" ? "開啟" : "Open"}>
                <Link href={href}>
                  <ArrowUpRight aria-hidden="true" />
                </Link>
              </Button>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">{children}</CardContent>
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

function dataOrFallback<T>(data: T[] | undefined, fallback: T[]) {
  return data && data.length > 0 ? data : fallback;
}

function getAveragePace(runs: DashboardData["recent"]["running"] | undefined) {
  if (!runs || runs.length === 0) {
    return "6:06/km";
  }

  const totalDistance = runs.reduce((total, run) => total + Number(run.distance_km ?? 0), 0);
  const totalSeconds = runs.reduce((total, run) => total + (run.duration_seconds ?? 0), 0);

  if (totalDistance <= 0 || totalSeconds <= 0) {
    return "6:06/km";
  }

  const secondsPerKm = Math.round(totalSeconds / totalDistance);
  const minutes = Math.floor(secondsPerKm / 60);
  const seconds = String(secondsPerKm % 60).padStart(2, "0");

  return `${minutes}:${seconds}/km`;
}

export { goals, mealLogs, runningLogs, gymLogs, workoutTemplates };
