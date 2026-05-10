"use client";

import { CheckCircle2, Circle, Plus } from "lucide-react";
import { useState } from "react";
import { label, text, ui } from "@/lib/health-app/i18n";
import type { Locale } from "@/lib/health-app/types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  ActivitySummaryCard,
  AIRecommendationCard,
  GymProgressCard,
  HealthScoreCard,
  LearnCard,
  NutritionCard,
  RunningProgressCard,
  SafetyDisclaimer,
  SleepCard,
  TodayPlanCard,
  WaterCard,
} from "./dashboard-cards";
import { WelcomeStrip } from "./navigation";

export function DashboardPage({ locale }: { locale: Locale }) {
  return (
    <div className="flex flex-col gap-5">
      <WelcomeStrip locale={locale} />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        <HealthScoreCard locale={locale} />
        <TodayPlanCard locale={locale} />
      </div>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3" aria-label="Dashboard cards">
        <ActivitySummaryCard locale={locale} className="md:col-span-2 xl:col-span-2" />
        <AIRecommendationCard locale={locale} />
        <RunningProgressCard locale={locale} />
        <GymProgressCard locale={locale} />
        <NutritionCard locale={locale} />
        <WaterCard locale={locale} />
        <SleepCard locale={locale} />
        <LearnCard locale={locale} />
      </section>

      <section id="today-plan" className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <OnboardingFlow locale={locale} />
        <QuickAddPanel locale={locale} />
      </section>

      <SafetyDisclaimer locale={locale} />
    </div>
  );
}

function OnboardingFlow({ locale }: { locale: Locale }) {
  const [step, setStep] = useState(0);
  const [memory, setMemory] = useState("on");
  const steps = [
    {
      title: { zh: "歡迎", en: "Welcome" },
      body: {
        zh: "你的 AI 指南，結合健身、飲食、醫療導航和健康知識。",
        en: "Your AI guide for fitness, food, care navigation, and health knowledge.",
      },
    },
    {
      title: ui.language,
      body: { zh: "繁體中文優先，英文可隨時切換。", en: "Traditional Chinese first, English available anytime." },
    },
    {
      title: { zh: "主要目標", en: "Main goal" },
      body: { zh: "減脂、增肌、跑得更好、吃得更健康或理解醫療/保險。", en: "Lose weight, build muscle, run better, eat healthier, or understand care and insurance." },
    },
    {
      title: { zh: "健身程度", en: "Fitness level" },
      body: { zh: "初級、中級或進階，建議會按疲勞和恢復調整。", en: "Beginner, intermediate, or advanced; advice adapts to fatigue and recovery." },
    },
    {
      title: { zh: "營養偏好", en: "Nutrition preferences" },
      body: { zh: "高蛋白、素食、少糖、少鈉、預算友善或香港本地食物。", en: "High protein, vegetarian, lower sugar, lower sodium, budget-friendly, or Hong Kong local food." },
    },
    {
      title: { zh: "照護偏好", en: "Care preference" },
      body: { zh: "公營、私營、都可以或未確定。", en: "Public, private, either, or not sure." },
    },
    {
      title: { zh: "記憶同意", en: "Memory consent" },
      body: {
        zh: "應用可記住你的目標、偏好和紀錄來個人化建議。你可隨時編輯或刪除。",
        en: "The app can remember goals, preferences, and logs to personalize suggestions. You can edit or delete this anytime.",
      },
    },
  ];

  return (
    <Card className="bg-card/80 shadow-sm">
      <CardHeader>
        <CardTitle>{locale === "zh-Hant" ? "快速入門流程" : "Onboarding flow"}</CardTitle>
        <CardDescription>
          {locale === "zh-Hant"
            ? "新用戶可以用 7 步設定健康指南。"
            : "New users can set up the guide in seven steps."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="grid gap-2 sm:grid-cols-7">
          {steps.map((item, index) => (
            <button
              key={item.title.en}
              type="button"
              className="flex min-h-12 items-center gap-2 rounded-lg border bg-background px-2 text-left text-xs"
              onClick={() => setStep(index)}
              aria-current={step === index ? "step" : undefined}
            >
              {step > index ? <CheckCircle2 aria-hidden="true" className="text-primary" /> : <Circle aria-hidden="true" />}
              <span className="truncate">{text(item.title, locale)}</span>
            </button>
          ))}
        </div>

        <div className="rounded-lg bg-muted/45 p-4">
          <p className="text-sm text-muted-foreground">
            {locale === "zh-Hant" ? `步驟 ${step + 1} / 7` : `Step ${step + 1} / 7`}
          </p>
          <h3 className="mt-2 text-xl font-semibold tracking-normal">{text(steps[step].title, locale)}</h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{text(steps[step].body, locale)}</p>
        </div>

        {step === 6 ? (
          <ToggleGroup type="single" value={memory} onValueChange={(value) => value && setMemory(value)} className="justify-start">
            <ToggleGroupItem value="on">{locale === "zh-Hant" ? "開啟記憶" : "Turn on memory"}</ToggleGroupItem>
            <ToggleGroupItem value="off">{locale === "zh-Hant" ? "不使用記憶" : "Use without memory"}</ToggleGroupItem>
          </ToggleGroup>
        ) : null}
      </CardContent>
    </Card>
  );
}

function QuickAddPanel({ locale }: { locale: Locale }) {
  const actions = [
    { label: ui.running, detail: { zh: "距離、時間、RPE、路線", en: "Distance, time, RPE, route" } },
    { label: ui.gym, detail: { zh: "動作、組數、重量、休息", en: "Exercise, sets, load, rest" } },
    { label: ui.foodLog, detail: { zh: "餐類、熱量、蛋白質、糖", en: "Meal, calories, protein, sugar" } },
    { label: ui.water, detail: { zh: "快速加 250ml 或 500ml", en: "Quick add 250ml or 500ml" } },
  ];

  return (
    <Card className="bg-card/80 shadow-sm">
      <CardHeader>
        <CardTitle>{label(ui.quickAdd, locale)}</CardTitle>
        <CardDescription>
          {locale === "zh-Hant" ? "用大按鈕快速記錄，不打斷日常節奏。" : "Large quick actions for low-friction logging."}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        {actions.map((action) => (
          <Button key={action.label.en} variant="outline" className="h-auto justify-start gap-3 p-3 text-left">
            <Plus data-icon="inline-start" aria-hidden="true" />
            <span className="flex min-w-0 flex-col">
              <span className="font-medium">{text(action.label, locale)}</span>
              <span className="text-xs text-muted-foreground">{text(action.detail, locale)}</span>
            </span>
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}
