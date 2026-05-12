"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import {
  Activity,
  AlertTriangle,
  Apple,
  ArrowUpRight,
  BedDouble,
  BookOpenCheck,
  Brain,
  CheckCircle2,
  Dumbbell,
  Droplets,
  Flame,
  Footprints,
  HeartPulse,
  Info,
  Moon,
  Plus,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Stethoscope,
  Target,
  TrendingUp,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import {
  foodRecommendations,
  lessons,
} from "@/lib/health-app/content";
import type { Lesson, Locale, LocalizedText, MacroDatum, MetricDatum } from "@/lib/health-app/types";
import type { DailyCheckinRow, DashboardData, GoalRow } from "@/lib/health-data/types";
import { label, safetyCopy, text, ui } from "@/lib/health-app/i18n";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
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

type CardProps = {
  locale: Locale;
  className?: string;
  data?: DashboardData | null;
};

const emptyMetrics: MetricDatum[] = [];

export function HealthScoreCard({ locale, className, data }: CardProps) {
  const score = data?.today.health_score ?? 0;
  const activityScore = data?.today.activity_score ?? 0;
  const nutritionScore = data?.today.nutrition_score ?? 0;
  const sleepScore = data?.today.sleep_score ?? 0;
  const hydrationScore = data?.today.hydration_score ?? 0;

  return (
    <DashboardCard className={cn("health-card-glow", className)} icon={HeartPulse} title={{ zh: "健康分數", en: "Health Score" }} locale={locale} index={0}>
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="scale-90 sm:scale-100">
          <ProgressRing value={score} label="Health score" animated />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="w-fit">
              {!data || data.empty
                ? locale === "zh-Hant" ? "尚未有紀錄" : "No records yet"
                : locale === "zh-Hant" ? "真實紀錄" : "Real records"}
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
              : locale === "zh-Hant"
                ? "連接真實紀錄後，這裡會顯示生活方式教育分數。"
                : "Connect real records to show lifestyle education scoring here."}
          </p>
          <div className="grid grid-cols-2 gap-2 text-center text-xs sm:grid-cols-4">
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
    : [];

  return (
    <DashboardCard className={className} icon={Sparkles} title={ui.todayPlan} locale={locale} index={1}>
      {items.length > 0 ? (
        <div className="flex flex-col gap-3">
          {items.map((item) => (
            <div key={item.title.en} className="group/plan flex items-start gap-3 rounded-xl bg-muted/35 p-3 transition-all duration-200 hover:bg-muted/55 hover:shadow-sm">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20 transition-colors group-hover/plan:bg-primary/15">
                <item.icon aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="font-medium">{text(item.title, locale)}</p>
                <p className="mt-1 text-sm leading-5 text-muted-foreground">{text(item.detail, locale)}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyCardMessage locale={locale} />
      )}
    </DashboardCard>
  );
}

export function ActivitySummaryCard({ locale, className, data }: CardProps) {
  const chartData = dataOrEmpty(data?.charts.activity);
  const activeMinutes = Math.round(data?.today.active_minutes ?? 0);
  const calories = Math.round(data?.today.calories_total ?? 0);
  const streak = data?.weekly.workout_days ?? 0;

  return (
    <DashboardCard className={className} icon={Activity} title={{ zh: "活動摘要", en: "Activity summary" }} locale={locale} index={3}>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricPill icon={Footprints} value="0" label={{ zh: "步數", en: "Steps" }} locale={locale} />
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
  const weeklyDistance = data?.weekly.running_distance_km ?? 0;
  const chartData = dataOrEmpty(data?.charts.runningDistance);
  const averagePace = getAveragePace(data?.recent.running, locale);

  return (
    <DashboardCard className={className} icon={Footprints} title={ui.running} locale={locale} href="/track/running" index={4}>
      <div className="grid grid-cols-2 gap-3">
        <MiniStat value={`${weeklyDistance} km`} label={locale === "zh-Hant" ? "本週距離" : "Weekly distance"} />
        <MiniStat value={lastRun ? `${lastRun.distance_km} km` : locale === "zh-Hant" ? "未記錄" : "No log"} label={locale === "zh-Hant" ? "上次跑步" : "Last run"} />
        <MiniStat value={averagePace} label={locale === "zh-Hant" ? "平均配速" : "Average pace"} />
        <MiniStat value={data ? (locale === "zh-Hant" ? "按紀錄" : "By data") : (locale === "zh-Hant" ? "未載入" : "No data")} label={locale === "zh-Hant" ? "下次建議" : "Next run"} />
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
  const volume = data?.charts.gymVolume.reduce((total, item) => total + item.value, 0) ?? 0;
  const chartData = dataOrEmpty(data?.charts.gymVolume);

  return (
    <DashboardCard className={className} icon={Dumbbell} title={ui.gym} locale={locale} href="/track/gym" index={5}>
      <div className="grid grid-cols-2 gap-3">
        <MiniStat value={lastWorkout?.workout_title || (locale === "zh-Hant" ? "未記錄" : "No log")} label={locale === "zh-Hant" ? "上次訓練" : "Last workout"} />
        <MiniStat value={lastWorkout?.muscle_group || (locale === "zh-Hant" ? "未記錄" : "No log")} label={locale === "zh-Hant" ? "肌群" : "Muscles"} />
        <MiniStat value={`${volume.toLocaleString()} kg`} label={locale === "zh-Hant" ? "本週容量" : "Weekly volume"} />
        <MiniStat value={data ? (locale === "zh-Hant" ? "按紀錄" : "By data") : (locale === "zh-Hant" ? "未載入" : "No data")} label={locale === "zh-Hant" ? "恢復狀態" : "Recovery"} />
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
  const calories = data?.today.calories_total ?? 0;
  const protein = data?.today.protein_total ?? 0;
  const carbs = data?.today.carbs_total ?? 0;
  const fat = data?.today.fat_total ?? 0;
  const waterLiters = ((data?.today.water_total_ml ?? 0) / 1000).toFixed(1);
  const totalMacros = Math.max(1, protein + carbs + fat);
  const macroChartData: MacroDatum[] = [
    { name: "Protein", value: Math.round((protein / totalMacros) * 100), fill: "var(--chart-1)" },
    { name: "Carbs", value: Math.round((carbs / totalMacros) * 100), fill: "var(--chart-2)" },
    { name: "Fat", value: Math.round((fat / totalMacros) * 100), fill: "var(--chart-3)" },
  ];

  return (
    <DashboardCard className={className} icon={Apple} title={ui.nutrition} locale={locale} href="/nutrition" index={6}>
      <div className="grid grid-cols-2 gap-3">
        <MiniStat value={calories.toLocaleString()} label={locale === "zh-Hant" ? "卡路里" : "Calories"} />
        <MiniStat value={`${protein}g`} label={locale === "zh-Hant" ? "蛋白質" : "Protein"} />
        <MiniStat value={`${carbs}g`} label={locale === "zh-Hant" ? "碳水" : "Carbs"} />
        <MiniStat value={`${fat}g`} label={locale === "zh-Hant" ? "脂肪" : "Fat"} />
        <MiniStat value={`${waterLiters}L`} label={locale === "zh-Hant" ? "飲水" : "Water"} />
        <MiniStat value={String(data?.today.nutrition_score ?? 0)} label={locale === "zh-Hant" ? "餐質分" : "Meal quality"} />
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
  const waterMl = data?.today.water_total_ml ?? 0;
  const progress = Math.min(100, Math.round((waterMl / 3000) * 100));
  const chartData = dataOrEmpty(data?.charts.water);

  return (
    <DashboardCard className={className} icon={Droplets} title={ui.water} locale={locale} index={8}>
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
  const average = data?.today.sleep_hours ? data.today.sleep_hours.toFixed(1) : "0.0";
  const sleepScore = data?.today.sleep_score ?? 0;

  return (
    <DashboardCard className={className} icon={BedDouble} title={ui.sleep} locale={locale} index={7}>
      <div className="grid grid-cols-[1fr_auto] gap-4">
        <div className="flex flex-col gap-3">
          <MiniStat value={`${average}h`} label={locale === "zh-Hant" ? "平均睡眠" : "Average sleep"} />
          <p className="text-sm leading-6 text-muted-foreground">
            {data?.today.sleep_hours
              ? locale === "zh-Hant"
                ? "睡眠提示會根據你的真實睡眠紀錄更新。"
                : "Sleep guidance updates from your real sleep records."
              : locale === "zh-Hant"
                ? "尚未有睡眠紀錄。新增紀錄後，這裡會顯示睡眠趨勢。"
                : "No sleep record yet. Add records to show sleep trends here."}
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
    <DashboardCard className={cn("health-card-glow", className)} icon={Brain} title={{ zh: "今日 AI 建議", en: "Today’s AI recommendation" }} locale={locale} href="/coach" index={2}>
      <div className="flex flex-col gap-3">
        <h3 className="text-xl font-semibold tracking-normal">
          {recommendation
            ? `${recommendation.workout.title}，${recommendation.nutrition.title}`
            : locale === "zh-Hant" ? "尚未有真實紀錄可生成建議" : "No real records available for recommendations"}
        </h3>
        <p className="text-sm leading-6 text-muted-foreground">
          {recommendation
            ? recommendation.workout.summary
            : locale === "zh-Hant"
            ? "新增活動、飲食、睡眠或飲水紀錄後，系統會用真實資料生成建議。"
            : "Add activity, food, sleep, or water records to generate recommendations from real data."}
        </p>
        <div className="rounded-xl bg-muted/35 p-3 ring-1 ring-border/50">
          <p className="text-sm font-medium">{label(ui.why, locale)}</p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            {locale === "zh-Hant"
              ? recommendation?.workout.reason ?? "尚未載入真實紀錄，系統不會推斷原因。"
              : recommendation?.workout.reason ?? "No real records are loaded, so the system will not infer a reason."}
          </p>
        </div>
        <div className="rounded-xl bg-muted/35 p-3 ring-1 ring-border/50">
          <p className="text-sm font-medium">{label(ui.action, locale)}</p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            {locale === "zh-Hant"
              ? recommendation?.workout.action ?? "先新增一筆真實紀錄，或使用醫療導航檢查安全警號。"
            : recommendation?.workout.action ?? "Add a real record first, or use care navigation to check warning signs."}
          </p>
        </div>
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-sm leading-6 text-muted-foreground">
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

export function AIGblCard({ locale, className }: CardProps) {
  return (
    <DashboardCard className={className} icon={Brain} title={{ zh: "AI.GBL 個案智能", en: "AI.GBL case intelligence" }} locale={locale} href="/gbl" index={12}>
      <div className="flex flex-col gap-3">
        <p className="text-sm leading-6 text-muted-foreground">
          {locale === "zh-Hant"
            ? "整理醫療、保險、情緒和歷史背景，產生可審核的摘要、風險標記和下一步。"
            : "Normalize healthcare, insurance, emotion, and history context into auditable summaries, risk flags, and next steps."}
        </p>
        <div className="grid grid-cols-2 gap-2">
          <MiniStat value="server" label={locale === "zh-Hant" ? "供應商隔離" : "Provider isolation"} />
          <MiniStat value="RLS" label={locale === "zh-Hant" ? "用戶資料" : "User data"} />
        </div>
        <Button asChild variant="outline" className="w-fit">
          <Link href="/gbl">
            <ArrowUpRight data-icon="inline-start" aria-hidden="true" />
            {locale === "zh-Hant" ? "建立個案" : "Create case"}
          </Link>
        </Button>
      </div>
    </DashboardCard>
  );
}

export function EmotionEngineCard({ locale, className }: CardProps) {
  return (
    <DashboardCard className={className} icon={HeartPulse} title={{ zh: "Emotion Engine", en: "Emotion Engine" }} locale={locale} href="/emotion" index={13}>
      <div className="flex flex-col gap-3">
        <p className="text-sm leading-6 text-muted-foreground">
          {locale === "zh-Hant"
            ? "只把情緒作為語氣和清晰度訊號，不作臨床評估，也不影響保險資格、定價或索償判斷。"
            : "Uses emotion only as a tone and clarity signal, not a clinical assessment or input to insurance eligibility, pricing, or claims."}
        </p>
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-sm leading-6 text-muted-foreground">
          {locale === "zh-Hant"
            ? "使用「你的訊息聽起來...」而不是替使用者貼標籤。"
            : "Uses “your message sounds...” rather than labeling the user."}
        </div>
        <Button asChild variant="outline" className="w-fit">
          <Link href="/emotion">
            <ArrowUpRight data-icon="inline-start" aria-hidden="true" />
            {locale === "zh-Hant" ? "分析訊號" : "Analyze signal"}
          </Link>
        </Button>
      </div>
    </DashboardCard>
  );
}

export function LearnCard({ locale, lesson = lessons[0], className }: CardProps & { lesson?: Lesson }) {
  return (
    <DashboardCard className={className} icon={BookOpenCheck} title={{ zh: "每日健康知識", en: "Health lesson of the day" }} locale={locale} index={9}>
      <div className="flex flex-col gap-3">
        <Badge variant="secondary" className="w-fit">
          {text(lesson.category, locale)}
        </Badge>
        <h3 className="text-xl font-semibold tracking-normal">{text(lesson.title, locale)}</h3>
        <p className="text-sm leading-6 text-muted-foreground">
          {text(lesson.explanation, locale)} {text(lesson.example, locale)}
        </p>
        <p className="rounded-xl bg-muted/35 p-3 text-sm leading-6 text-muted-foreground ring-1 ring-border/50">
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
    <DashboardCard className={className} icon={Stethoscope} title={{ zh: "醫療導航提醒", en: "Healthcare reminder" }} locale={locale} href="/healthcare/symptom-routing" index={10}>
      <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
        <div className="flex flex-col gap-3">
          <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-sm leading-6 text-muted-foreground">
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
  const gymVolume = data?.charts.gymVolume.reduce((total, item) => total + item.value, 0) ?? 0;
  const chartData = dataOrEmpty(data?.charts.activity);

  return (
    <DashboardCard className={className} icon={TrendingUp} title={{ zh: "每週進度", en: "Weekly Progress" }} locale={locale} href="/progress" index={11}>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <MiniStat value={`${data?.weekly.running_distance_km ?? 0} km`} label={locale === "zh-Hant" ? "跑步趨勢" : "Running"} />
        <MiniStat value={`${gymVolume.toLocaleString()} kg`} label={locale === "zh-Hant" ? "健身容量" : "Gym volume"} />
        <MiniStat value={`${data?.weekly.protein_consistency_days ?? 0}/7`} label={locale === "zh-Hant" ? "營養一致" : "Nutrition"} />
        <MiniStat value={`${data?.weekly.water_goal_days ?? 0}d`} label={locale === "zh-Hant" ? "飲水連續" : "Water streak"} />
      </div>
      <ProgressChart data={chartData} height={150} />
      <div className="rounded-xl bg-muted/35 p-3 text-sm leading-6 text-muted-foreground ring-1 ring-border/50">
        <Target aria-hidden="true" className="mb-2 text-primary" />
        {data?.weekly.ai_summary ||
          (locale === "zh-Hant"
            ? "有足夠真實紀錄後，AI 週報會在這裡顯示。"
            : "AI weekly insight appears here after enough real records are available.")}
      </div>
    </DashboardCard>
  );
}

export function GoalCard({ goal, locale }: { goal: GoalRow; locale: Locale }) {
  const progress = getGoalProgress(goal);
  const target = [goal.current_value ?? 0, goal.target_value ?? "-", goal.unit].filter(Boolean).join(" ");

  return (
    <Card className="overflow-hidden border-border/60 bg-card/72 shadow-sm backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-3">
          <span>{goal.title}</span>
          <Badge variant="secondary">{progress}%</Badge>
        </CardTitle>
        <CardDescription>{target}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="h-2.5 overflow-hidden rounded-full bg-muted/50">
          <div className="h-full rounded-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
        <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
          {[goal.weekly_action || (locale === "zh-Hant" ? "尚未設定每週行動。" : "No weekly action set.")].map((action) => (
            <li key={action} className="flex items-start gap-2">
              <ShieldCheck aria-hidden="true" className="mt-0.5 text-primary" />
              <span>{action}</span>
            </li>
          ))}
        </ul>
        <p className="rounded-xl bg-muted/30 p-3 text-sm leading-6 text-muted-foreground ring-1 ring-border/40">
          {locale === "zh-Hant"
            ? "建議會根據你的真實紀錄和恢復狀態調整。"
            : "Suggestions adjust from your real records and recovery state."}
        </p>
      </CardContent>
    </Card>
  );
}

export function WorkoutTemplateCard({ template, locale }: { template: string; locale: Locale }) {
  return (
    <Card className="overflow-hidden border-border/60 bg-card/72 shadow-sm backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
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
    <Card className="overflow-hidden border-border/60 bg-card/72 shadow-sm backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
      <CardHeader>
        <CardTitle>{text(item.title, locale)}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-6 text-muted-foreground">{text(item.body, locale)}</p>
      </CardContent>
    </Card>
  );
}

type EverydayAction = {
  type: DailyCheckinRow["checkin_type"];
  label: LocalizedText;
  detail: LocalizedText;
  icon: LucideIcon;
  payload?: Record<string, string | number | boolean | null>;
};

type MobileHealthStatus = {
  connectedPlatforms?: string[];
  lastSuccessfulSync?: string | null;
  consent?: { mobileHealthSync?: boolean };
};

const everydayActions: EverydayAction[] = [
  {
    type: "wake_up",
    label: { zh: "起床", en: "Wake" },
    detail: { zh: "開始今日節奏", en: "Start the day" },
    icon: BedDouble,
  },
  {
    type: "meal",
    label: { zh: "進食", en: "Eat" },
    detail: { zh: "已完成一餐", en: "Meal done" },
    icon: Apple,
  },
  {
    type: "water",
    label: { zh: "飲水", en: "Drink" },
    detail: { zh: "快速新增 300ml", en: "Add 300ml" },
    icon: Droplets,
    payload: { amount: 300, unit: "ml" },
  },
  {
    type: "exercise",
    label: { zh: "運動", en: "Exercise" },
    detail: { zh: "完成活動打卡", en: "Movement done" },
    icon: Dumbbell,
  },
];

export function EverydayActionsCard({ locale, className, data }: CardProps) {
  const [supabase] = useState(() => getSupabaseBrowserClient());
  const [checkins, setCheckins] = useState<DailyCheckinRow[]>([]);
  const [mobileStatus, setMobileStatus] = useState<MobileHealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingType, setSavingType] = useState<DailyCheckinRow["checkin_type"] | null>(null);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadEverydayState() {
      if (!supabase) {
        if (active) {
          setUnavailable(true);
          setLoading(false);
        }
        return;
      }

      const token = await getEverydayAccessToken(supabase);

      if (!token) {
        if (active) {
          setUnavailable(true);
          setLoading(false);
        }
        return;
      }

      const [checkinsResult, mobileResult] = await Promise.all([
        fetchJson<{ checkins?: DailyCheckinRow[] }>("/api/daily/checkins", token),
        fetchJson<MobileHealthStatus>("/api/mobile-health/status", token),
      ]);

      if (!active) {
        return;
      }

      if (checkinsResult.ok) {
        setCheckins(checkinsResult.data.checkins ?? []);
      } else {
        setUnavailable(true);
      }

      if (mobileResult.ok) {
        setMobileStatus(mobileResult.data);
      }

      setLoading(false);
    }

    loadEverydayState();

    return () => {
      active = false;
    };
  }, [supabase]);

  async function logAction(action: EverydayAction) {
    if (!supabase || savingType) {
      return;
    }

    setSavingType(action.type);

    try {
      const token = await getEverydayAccessToken(supabase);

      if (!token) {
        throw new Error("auth unavailable");
      }

      if (action.type === "water") {
        const waterResult = await postJson("/api/logs/water", { amount_ml: 300 }, token);

        if (!waterResult.ok) {
          throw new Error("water log failed");
        }
      }

      const result = await postJson(
        "/api/daily/checkins",
        {
          checkin_type: action.type,
          label: text(action.label, locale),
          amount: action.payload?.amount ?? null,
          unit: action.payload?.unit ?? null,
          metadata: {
            surface: "dashboard_everyday_loop",
          },
        },
        token,
      );

      if (!result.ok) {
        throw new Error("daily check-in failed");
      }

      const refreshed = await fetchJson<{ checkins?: DailyCheckinRow[] }>("/api/daily/checkins", token);

      if (refreshed.ok) {
        setCheckins(refreshed.data.checkins ?? []);
      }

      window.dispatchEvent(new Event("health-log-saved"));
      toast.success(locale === "zh-Hant" ? "已記錄。" : "Logged.");
    } catch {
      toast.error(locale === "zh-Hant" ? "暫時未能記錄，請稍後再試。" : "Could not log this yet. Try again later.");
    } finally {
      setSavingType(null);
    }
  }

  const visibleCheckins = loading ? data?.recent.checkins ?? checkins : checkins;
  const completedTypes = new Set(visibleCheckins.map((entry) => entry.checkin_type));
  const completedCount = everydayActions.filter((action) => completedTypes.has(action.type)).length;
  const suggestion = getEverydaySuggestion({ data, checkins: visibleCheckins, mobileStatus });
  const connectedPlatforms = mobileStatus?.connectedPlatforms ?? [];
  const mobileConnected = Boolean(mobileStatus?.consent?.mobileHealthSync || connectedPlatforms.length > 0);

  return (
    <DashboardCard className={className} icon={Sparkles} title={{ zh: "每日健康循環", en: "Everyday Health Loop" }} locale={locale} index={2}>
      <div className="grid gap-2 sm:grid-cols-4">
        {everydayActions.map((action) => {
          const isDone = completedTypes.has(action.type);
          const isSaving = savingType === action.type;

          return (
            <Button
              key={action.type}
              type="button"
              variant={isDone ? "secondary" : "outline"}
              className="h-auto min-h-20 flex-col items-start justify-between gap-3 rounded-xl p-3 text-left"
              disabled={loading || !supabase || unavailable || Boolean(savingType)}
              onClick={() => logAction(action)}
            >
              <span className="flex w-full items-center justify-between gap-2">
                <span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary">
                  <action.icon aria-hidden="true" />
                </span>
                {isSaving ? (
                  <RefreshCw className="animate-spin text-muted-foreground" aria-hidden="true" />
                ) : isDone ? (
                  <CheckCircle2 className="text-primary" aria-hidden="true" />
                ) : null}
              </span>
              <span className="min-w-0">
                <span className="block truncate font-semibold">{text(action.label, locale)}</span>
                <span className="block truncate text-xs font-normal text-muted-foreground">{text(action.detail, locale)}</span>
              </span>
            </Button>
          );
        })}
      </div>

      <div className="grid gap-3 lg:grid-cols-[1.35fr_0.9fr]">
        <div className="rounded-xl bg-muted/30 p-4 ring-1 ring-border/40">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">
              {locale === "zh-Hant" ? `${completedCount}/4 已完成` : `${completedCount}/4 done`}
            </Badge>
            {data ? (
              <Badge variant="outline">
                {locale === "zh-Hant" ? "按今日紀錄分析" : "Based on today"}
              </Badge>
            ) : null}
            {unavailable ? (
              <Badge variant="secondary">
                {locale === "zh-Hant" ? "雲端紀錄未就緒" : "Cloud log not ready"}
              </Badge>
            ) : null}
          </div>
          <h3 className="mt-3 text-sm font-semibold">{text(suggestion.title, locale)}</h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{text(suggestion.body, locale)}</p>
        </div>

        <div className="rounded-xl bg-muted/30 p-4 ring-1 ring-border/40">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Smartphone aria-hidden="true" className="text-primary" />
              <span className="text-sm font-semibold">
                {locale === "zh-Hant" ? "Apple / Android 健康" : "Apple / Android health"}
              </span>
            </div>
            <Badge variant={mobileConnected ? "default" : "secondary"}>
              {mobileConnected
                ? locale === "zh-Hant" ? "可分析" : "Ready"
                : locale === "zh-Hant" ? "待連接" : "Pending"}
            </Badge>
          </div>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            {mobileConnected
              ? locale === "zh-Hant"
                ? `已連接 ${connectedPlatforms.join(", ") || "手機健康同步"}，AI 建議會使用已同步摘要。`
                : `Connected to ${connectedPlatforms.join(", ") || "mobile health sync"}; suggestions can use synced summaries.`
              : locale === "zh-Hant"
                ? "瀏覽器不會直接讀取 HealthKit 或 Health Connect；原生 App 會逐項請求授權並只同步摘要。"
                : "The browser does not read HealthKit or Health Connect directly; the native app asks permission and syncs summaries only."}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/settings">{locale === "zh-Hant" ? "同步設定" : "Sync settings"}</Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link href="/track">{locale === "zh-Hant" ? "詳細記錄" : "Detailed logs"}</Link>
            </Button>
          </div>
        </div>
      </div>
    </DashboardCard>
  );
}

export function SafetyDisclaimer({ locale, compact = false }: { locale: Locale; compact?: boolean }) {
  return (
    <div className={cn("rounded-2xl border bg-muted/25 p-4 text-sm leading-6 text-muted-foreground backdrop-blur-sm", compact && "p-3 text-xs")}>
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
  index = 0,
}: {
  icon: LucideIcon;
  title: LocalizedText;
  locale: Locale;
  children: ReactNode;
  href?: string;
  className?: string;
  index?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.42,
        delay: Math.min(index * 0.06, 0.48),
        ease: [0.22, 1, 0.36, 1],
      }}
      className={className}
    >
      <Card className="group/card relative h-full overflow-hidden border-border/60 bg-card/78 shadow-sm backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-border hover:shadow-lg">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/[0.03] via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover/card:opacity-100" />
        <CardHeader className="gap-2">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-sm shadow-primary/20">
                <Icon aria-hidden="true" />
              </span>
              <CardTitle className="text-base font-semibold tracking-tight">{text(title, locale)}</CardTitle>
            </div>
            {href ? (
              <Button asChild variant="ghost" size="icon-sm" className="text-muted-foreground transition-colors hover:text-primary" aria-label={locale === "zh-Hant" ? "開啟" : "Open"}>
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
    <div className="rounded-xl bg-muted/30 p-3 ring-1 ring-border/40 transition-all duration-200 hover:bg-muted/50 hover:ring-border/60">
      <p className="truncate text-base font-semibold tracking-tight">{value}</p>
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
    <div className="metric-hover flex min-w-0 items-center gap-3 rounded-xl bg-muted/30 p-3 ring-1 ring-border/40">
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/8 text-primary ring-1 ring-primary/15">
        <Icon aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="truncate font-semibold tracking-tight">{value}</p>
        <p className="truncate text-xs text-muted-foreground">{text(itemLabel, locale)}</p>
      </div>
    </div>
  );
}

function EmptyCardMessage({ locale }: { locale: Locale }) {
  return (
    <div className="rounded-xl bg-muted/30 p-4 text-sm leading-6 text-muted-foreground ring-1 ring-border/40">
      {locale === "zh-Hant"
        ? "尚未載入真實資料。新增紀錄或登入匿名帳戶後，這裡會顯示個人化內容。"
        : "No real data is loaded yet. Add records or start an anonymous session to show personalized content here."}
    </div>
  );
}

function dataOrEmpty<T>(data: T[] | undefined) {
  return data && data.length > 0 ? data : (emptyMetrics as T[]);
}

async function getEverydayAccessToken(
  supabase: NonNullable<ReturnType<typeof getSupabaseBrowserClient>>,
) {
  try {
    const currentSession = await supabase.auth.getSession();
    const existingToken = currentSession.data.session?.access_token;

    if (existingToken) {
      return existingToken;
    }

    const anonymousSession = await supabase.auth.signInAnonymously();

    return anonymousSession.data.session?.access_token ?? null;
  } catch {
    return null;
  }
}

async function fetchJson<T>(url: string, token: string): Promise<
  | { ok: true; data: T }
  | { ok: false }
> {
  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return { ok: false };
    }

    return { ok: true, data: (await response.json()) as T };
  } catch {
    return { ok: false };
  }
}

async function postJson(url: string, payload: Record<string, unknown>, token: string) {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    return { ok: response.ok };
  } catch {
    return { ok: false };
  }
}

function getEverydaySuggestion({
  data,
  checkins,
  mobileStatus,
}: {
  data?: DashboardData | null;
  checkins: DailyCheckinRow[];
  mobileStatus: MobileHealthStatus | null;
}) {
  const completedTypes = new Set(checkins.map((entry) => entry.checkin_type));
  const waterMl = data?.today.water_total_ml ?? 0;
  const protein = data?.today.protein_total ?? 0;
  const activeMinutes = data?.today.active_minutes ?? 0;
  const mobileConnected = Boolean(
    mobileStatus?.consent?.mobileHealthSync ||
      (mobileStatus?.connectedPlatforms?.length ?? 0) > 0,
  );

  if (!completedTypes.has("wake_up")) {
    return {
      title: { zh: "先做今天第一個小動作", en: "Start with the first tiny action" },
      body: {
        zh: "按一次起床，然後飲 250-300ml 水。今日分析會先用簡單節奏開始，不需要一次填完所有資料。",
        en: "Tap wake, then drink 250-300ml water. Today’s analysis starts from rhythm, not perfect tracking.",
      },
    };
  }

  if (waterMl < 600 && !completedTypes.has("water")) {
    return {
      title: { zh: "先補水，再追其他目標", en: "Hydrate before chasing the rest" },
      body: {
        zh: "今日飲水紀錄偏少。先新增 300ml，運動或外出前留意口渴、頭暈和抽筋訊號。",
        en: "Water is low today. Add 300ml first, and watch thirst, dizziness, or cramps before exercise or going out.",
      },
    };
  }

  if (!completedTypes.has("meal")) {
    return {
      title: { zh: "下一餐用蛋白質做中心", en: "Anchor the next meal with protein" },
      body: {
        zh: "如果只是快速打卡，下一步可在詳細飲食頁補充食物。香港外食可選雞、魚、蛋或豆腐，加菜少汁。",
        en: "After a quick meal tap, add details later if useful. For Hong Kong meals, pick chicken, fish, eggs, or tofu with vegetables and less sauce.",
      },
    };
  }

  if (protein < 90) {
    return {
      title: { zh: "今日蛋白質仍可補一份", en: "Add one more protein serving" },
      body: {
        zh: `目前約 ${Math.round(protein)}g 蛋白質。下一餐可加雞蛋、魚、雞肉、豆腐或希臘乳酪。`,
        en: `Protein is around ${Math.round(protein)}g so far. Add eggs, fish, chicken, tofu, or Greek yogurt next.`,
      },
    };
  }

  if (!completedTypes.has("exercise") && activeMinutes === 0) {
    return {
      title: { zh: "今天用 10 分鐘活動保留連續性", en: "Keep the streak with 10 minutes" },
      body: {
        zh: "如果沒有正式訓練，做 10 分鐘步行、伸展或輕量自重動作即可。胸痛、嚴重氣促或尖銳痛楚要停止並求助。",
        en: "If there is no formal workout, use 10 minutes of walking, stretching, or light bodyweight movement. Stop and seek help for chest pain, severe breathlessness, or sharp pain.",
      },
    };
  }

  if (mobileConnected) {
    return {
      title: { zh: "用手機摘要校準建議", en: "Calibrate with mobile summaries" },
      body: {
        zh: "已同步的步數、睡眠、運動和心率摘要可幫助建議更貼近今天狀態；不會用於診斷或保險決定。",
        en: "Synced steps, sleep, workout, and heart-rate summaries can tune today’s guidance; they are not used for diagnosis or insurance decisions.",
      },
    };
  }

  return {
    title: { zh: "今日節奏已建立", en: "Today’s rhythm is set" },
    body: {
      zh: "保持簡單：補水、均衡餐盤、輕量活動和固定睡眠時間。需要更精準分析時可連接原生手機健康同步。",
      en: "Keep it simple: water, a balanced plate, light movement, and consistent sleep. Connect native mobile health sync when you want sharper analysis.",
    },
  };
}

function getAveragePace(runs: DashboardData["recent"]["running"] | undefined, locale: Locale) {
  if (!runs || runs.length === 0) {
    return locale === "zh-Hant" ? "未記錄" : "No log";
  }

  const totalDistance = runs.reduce((total, run) => total + Number(run.distance_km ?? 0), 0);
  const totalSeconds = runs.reduce((total, run) => total + (run.duration_seconds ?? 0), 0);

  if (totalDistance <= 0 || totalSeconds <= 0) {
    return locale === "zh-Hant" ? "未記錄" : "No log";
  }

  const secondsPerKm = Math.round(totalSeconds / totalDistance);
  const minutes = Math.floor(secondsPerKm / 60);
  const seconds = String(secondsPerKm % 60).padStart(2, "0");

  return `${minutes}:${seconds}/km`;
}

function getGoalProgress(goal: GoalRow) {
  const current = Number(goal.current_value ?? 0);
  const target = Number(goal.target_value ?? 0);

  if (!Number.isFinite(current) || !Number.isFinite(target) || target <= 0) {
    return 0;
  }

  return Math.min(100, Math.max(0, Math.round((current / target) * 100)));
}
