"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  Apple,
  Check,
  Dumbbell,
  Droplets,
  Flag,
  HeartPulse,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import { toast } from "sonner";
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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Locale } from "@/lib/health-app/types";
import { text, ui } from "@/lib/health-app/i18n";
import { cn } from "@/lib/utils";

const ONBOARDING_STORAGE_KEY = "health:onboarding-completed:v1";

type OnboardingState = {
  language: Locale | "bilingual";
  user_type: string;
  main_goal: string;
  fitness_level: string;
  nutrition_preference: string;
  hk_care_preference: string;
  insurance_interests: string[];
  health_tracking_interests: string[];
  mobile_health_sync_interest: string;
  save_profile_preferences: boolean;
  save_health_logs: boolean;
  save_ai_history: boolean;
  adviser_handoff_consent: boolean;
  analytics_consent: boolean;
  memory_consent_granted: boolean;
  privacy_acknowledged: boolean;
  first_action: string;
};

const firstActions = [
  { value: "water", label: { zh: "記錄今日飲水", en: "Log today’s water" }, href: "/track/water", icon: Droplets },
  { value: "run", label: { zh: "新增第一次跑步", en: "Add first run" }, href: "/track/running", icon: Activity },
  { value: "gym", label: { zh: "新增第一次健身", en: "Add first gym workout" }, href: "/track/gym", icon: Dumbbell },
  { value: "meal", label: { zh: "記錄今日第一餐", en: "Log first meal" }, href: "/nutrition/food-log", icon: Apple },
  { value: "goal", label: { zh: "設定第一個目標", en: "Set first goal" }, href: "/goals", icon: Flag },
];

const insuranceInterestOptions = [
  ["inpatient_vhis", "住院／VHIS 類別", "Inpatient / VHIS-style"],
  ["outpatient", "門診", "Outpatient"],
  ["dental", "牙科", "Dental"],
  ["maternity", "產科", "Maternity"],
  ["travel", "旅遊", "Travel"],
  ["critical_illness", "危疾", "Critical illness"],
  ["life_income_protection", "人壽／收入保障", "Life / income protection"],
  ["claims_explanation", "索償文件解釋", "Claims explanation"],
];

const healthTrackingOptions = [
  ["running", "跑步", "Running"],
  ["gym", "健身", "Gym"],
  ["meals", "飲食", "Meals"],
  ["water", "飲水", "Water"],
  ["sleep", "睡眠", "Sleep"],
  ["body_metrics", "身體指標", "Body metrics"],
];

type StepVisual = {
  label: { zh: string; en: string };
  cue: { zh: string; en: string };
  colors: {
    background: string;
    soft: string;
    surface: string;
    primary: string;
    secondary: string;
    accent: string;
    ink: string;
  };
};

const stepVisuals: StepVisual[] = [
  {
    label: { zh: "講你舒服的語言", en: "Use your comfy language" },
    cue: { zh: "中英都可以", en: "Chinese or English is okay" },
    colors: {
      background: "#dff8f0",
      soft: "#fff6bf",
      surface: "#ffffff",
      primary: "#13a889",
      secondary: "#5b7cfa",
      accent: "#ffb650",
      ink: "#12324a",
    },
  },
  {
    label: { zh: "你是哪一位", en: "Who is here today" },
    cue: { zh: "只用來調整介面", en: "Only tunes the screen" },
    colors: {
      background: "#e7f0ff",
      soft: "#ffe6f0",
      surface: "#ffffff",
      primary: "#4a73ff",
      secondary: "#ff7aa8",
      accent: "#55c89f",
      ink: "#14213d",
    },
  },
  {
    label: { zh: "揀一個大目標", en: "Pick one big goal" },
    cue: { zh: "一步一步來", en: "One tiny step at a time" },
    colors: {
      background: "#fff2d6",
      soft: "#e5f9ff",
      surface: "#ffffff",
      primary: "#ff8c3a",
      secondary: "#2aa7c9",
      accent: "#ffd34d",
      ink: "#3b2f1f",
    },
  },
  {
    label: { zh: "今天有多少力氣", en: "How strong today feels" },
    cue: { zh: "建議會保守一點", en: "Advice stays gentle" },
    colors: {
      background: "#eaffdf",
      soft: "#fff0d9",
      surface: "#ffffff",
      primary: "#49b54a",
      secondary: "#ff9f40",
      accent: "#86d7ff",
      ink: "#17331b",
    },
  },
  {
    label: { zh: "食物小偏好", en: "Food little likes" },
    cue: { zh: "只保存類別", en: "Only categories are saved" },
    colors: {
      background: "#fff0e5",
      soft: "#e7fff4",
      surface: "#ffffff",
      primary: "#f36f45",
      secondary: "#2cbf86",
      accent: "#ffd35b",
      ink: "#40211b",
    },
  },
  {
    label: { zh: "香港求診路線", en: "Hong Kong care path" },
    cue: { zh: "安全提示會一直在", en: "Safety stays visible" },
    colors: {
      background: "#e5f7ff",
      soft: "#fff7cf",
      surface: "#ffffff",
      primary: "#1689c7",
      secondary: "#21b07b",
      accent: "#ffcf45",
      ink: "#102f40",
    },
  },
  {
    label: { zh: "保障類別看看", en: "Coverage categories" },
    cue: { zh: "不推薦特定產品", en: "No product recommendation" },
    colors: {
      background: "#edf0ff",
      soft: "#e9fff7",
      surface: "#ffffff",
      primary: "#6170e8",
      secondary: "#18b88f",
      accent: "#ffc04d",
      ink: "#1a1f45",
    },
  },
  {
    label: { zh: "想追蹤甚麼", en: "What to track" },
    cue: { zh: "手機同步要再同意", en: "Sync needs permission later" },
    colors: {
      background: "#e9fbff",
      soft: "#f1ebff",
      surface: "#ffffff",
      primary: "#20a5c4",
      secondary: "#7b61ff",
      accent: "#ffbd4a",
      ink: "#123640",
    },
  },
  {
    label: { zh: "保存由你話事", en: "Saving is your choice" },
    cue: { zh: "急症提示不受影響", en: "Emergency safety stays on" },
    colors: {
      background: "#f0ffe9",
      soft: "#fff0f4",
      surface: "#ffffff",
      primary: "#47b44f",
      secondary: "#ff759d",
      accent: "#5bd2ff",
      ink: "#17381c",
    },
  },
  {
    label: { zh: "先看安全提示", en: "Safety note first" },
    cue: { zh: "這一步不可跳過", en: "This step is required" },
    colors: {
      background: "#fff4dc",
      soft: "#e7f5ff",
      surface: "#ffffff",
      primary: "#f0a51e",
      secondary: "#248bd1",
      accent: "#ff6f61",
      ink: "#3a2a12",
    },
  },
  {
    label: { zh: "做第一件小事", en: "Do one tiny action" },
    cue: { zh: "完成後即刻開始", en: "Start right after this" },
    colors: {
      background: "#e9fff2",
      soft: "#fff3d8",
      surface: "#ffffff",
      primary: "#18a96f",
      secondary: "#ff9d35",
      accent: "#4f83ff",
      ink: "#123426",
    },
  },
];

export function OnboardingPage({ locale }: { locale: Locale }) {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [state, setState] = useState<OnboardingState>({
    language: locale,
    user_type: "patient_member",
    main_goal: "build_muscle",
    fitness_level: "returning",
    nutrition_preference: "balanced",
    hk_care_preference: "either",
    insurance_interests: ["inpatient_vhis"],
    health_tracking_interests: ["water", "sleep"],
    mobile_health_sync_interest: "not_now",
    save_profile_preferences: true,
    save_health_logs: false,
    save_ai_history: false,
    adviser_handoff_consent: false,
    analytics_consent: false,
    memory_consent_granted: false,
    privacy_acknowledged: false,
    first_action: "water",
  });
  const selectedAction = useMemo(
    () => firstActions.find((action) => action.value === state.first_action) ?? firstActions[0],
    [state.first_action],
  );
  const stepCount = 11;
  const canContinue = step !== 9 || state.privacy_acknowledged;

  async function complete() {
    if (!state.privacy_acknowledged) {
      toast.error(locale === "zh-Hant" ? "請先確認私隱與安全提示。" : "Confirm the privacy and safety notice first.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(state),
      });

      if (!response.ok && response.status !== 401 && response.status !== 503) {
        throw new Error("Onboarding save failed");
      }

      window.localStorage.setItem(ONBOARDING_STORAGE_KEY, "true");
      window.location.assign(selectedAction.href);
    } catch {
      toast.error(locale === "zh-Hant" ? "暫時未能保存，已保留本機進度。" : "Could not save yet; local progress is kept.");
      window.localStorage.setItem(ONBOARDING_STORAGE_KEY, "true");
      window.location.assign("/dashboard");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-5">
      <section className="welcome-gradient overflow-hidden rounded-3xl border border-border/50 bg-card/70 p-5 shadow-sm backdrop-blur-xl sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Badge variant="secondary" className="h-7 rounded-full px-3 text-sm">
              {locale === "zh-Hant" ? "開始設定" : "Onboarding"}
            </Badge>
            <h2 className="text-gradient-health mt-3 text-3xl font-bold leading-tight sm:text-4xl">
              {text(ui.appNameFull, locale)}
            </h2>
          </div>
          <div className="w-fit self-start rounded-2xl bg-background/70 px-4 py-3 text-right shadow-sm sm:self-auto">
            <p className="text-sm font-medium text-muted-foreground">
              {locale === "zh-Hant" ? "第幾步" : "Step"}
            </p>
            <p className="text-2xl font-bold text-primary">
              {step + 1}
              <span className="text-base text-muted-foreground">/{stepCount}</span>
            </p>
          </div>
        </div>
        <div className="mt-5 h-3 overflow-hidden rounded-full bg-background/70">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${((step + 1) / stepCount) * 100}%` }}
          />
        </div>
        <div className="mt-4 grid grid-cols-11 gap-1.5" aria-hidden="true">
          {Array.from({ length: stepCount }).map((_, index) => (
            <span
              key={index}
              className={cn(
                "h-2 rounded-full transition",
                index <= step ? "bg-primary" : "bg-background/70",
              )}
            />
          ))}
        </div>
      </section>

      <Card className="overflow-hidden rounded-3xl border-border/60 bg-card/80 shadow-sm backdrop-blur-xl">
        <CardHeader className="px-5 pt-5 sm:px-6 sm:pt-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="text-2xl font-bold leading-tight sm:text-3xl">
                {getStepTitle(step, locale)}
              </CardTitle>
              <CardDescription className="mt-2 text-base leading-7">
                {getStepDescription(step, locale)}
              </CardDescription>
            </div>
            <Badge variant="outline" className="h-7 rounded-full px-3 text-sm">
              {step + 1}/{stepCount}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="px-5 pb-2 sm:px-6">
          <div className="grid gap-5 lg:grid-cols-[minmax(260px,0.9fr)_minmax(0,1.1fr)] lg:items-start">
            <StepPicture step={step} locale={locale} />
            <div className="min-w-0" aria-live="polite">
              {step === 0 ? (
                <ChoiceGrid
                  value={state.language}
                  onChange={(language) =>
                    setState((current) => ({
                      ...current,
                      language: language as OnboardingState["language"],
                    }))
                  }
                  options={[
                    ["zh-Hant", "繁體中文"],
                    ["en", "English"],
                    ["bilingual", locale === "zh-Hant" ? "雙語" : "Bilingual"],
                  ]}
                />
              ) : null}

              {step === 1 ? (
                <SelectField
                  value={state.user_type}
                  onChange={(user_type) => setState((current) => ({ ...current, user_type }))}
                  options={[
                    ["patient_member", locale === "zh-Hant" ? "病人／會員" : "Patient / member"],
                    ["provider_admin", locale === "zh-Hant" ? "醫療提供者／管理員" : "Provider / admin"],
                    ["broker_benefits_adviser", locale === "zh-Hant" ? "保險中介／福利顧問" : "Broker / benefits adviser"],
                    ["employer_hr", locale === "zh-Hant" ? "僱主／HR 福利" : "Employer / HR benefits"],
                  ]}
                />
              ) : null}

              {step === 2 ? (
                <SelectField
                  value={state.main_goal}
                  onChange={(main_goal) => setState((current) => ({ ...current, main_goal }))}
                  options={[
                    ["lose_fat", locale === "zh-Hant" ? "減脂" : "Lose fat"],
                    ["build_muscle", locale === "zh-Hant" ? "增肌與力量" : "Build muscle"],
                    ["run_5k", locale === "zh-Hant" ? "跑 5K" : "Run 5K"],
                    ["sleep_better", locale === "zh-Hant" ? "改善睡眠" : "Sleep better"],
                    ["eat_better", locale === "zh-Hant" ? "飲食更穩定" : "Eat better"],
                    ["hk_care_navigation", locale === "zh-Hant" ? "香港醫療導航" : "Hong Kong care navigation"],
                  ]}
                />
              ) : null}

              {step === 3 ? (
                <SelectField
                  value={state.fitness_level}
                  onChange={(fitness_level) => setState((current) => ({ ...current, fitness_level }))}
                  options={[
                    ["beginner", locale === "zh-Hant" ? "剛開始" : "Beginner"],
                    ["returning", locale === "zh-Hant" ? "重新建立習慣" : "Returning"],
                    ["consistent", locale === "zh-Hant" ? "已有穩定習慣" : "Consistent"],
                    ["advanced", locale === "zh-Hant" ? "進階訓練" : "Advanced"],
                  ]}
                />
              ) : null}

              {step === 4 ? (
                <SelectField
                  value={state.nutrition_preference}
                  onChange={(nutrition_preference) => setState((current) => ({ ...current, nutrition_preference }))}
                  options={[
                    ["balanced", locale === "zh-Hant" ? "均衡飲食" : "Balanced"],
                    ["high_protein", locale === "zh-Hant" ? "高蛋白" : "High protein"],
                    ["lower_sugar", locale === "zh-Hant" ? "少糖" : "Lower sugar"],
                    ["vegetarian", locale === "zh-Hant" ? "素食友善" : "Vegetarian"],
                    ["no_preference", locale === "zh-Hant" ? "暫無偏好" : "No preference"],
                  ]}
                />
              ) : null}

              {step === 5 ? (
                <SelectField
                  value={state.hk_care_preference}
                  onChange={(hk_care_preference) => setState((current) => ({ ...current, hk_care_preference }))}
                  options={[
                    ["public", locale === "zh-Hant" ? "公營優先" : "Public first"],
                    ["private", locale === "zh-Hant" ? "私營優先" : "Private first"],
                    ["either", locale === "zh-Hant" ? "兩者都可以" : "Either"],
                    ["not_sure", locale === "zh-Hant" ? "未確定" : "Not sure"],
                  ]}
                />
              ) : null}

              {step === 6 ? (
                <MultiChoiceGrid
                  values={state.insurance_interests}
                  onToggle={(value) =>
                    setState((current) => ({
                      ...current,
                      insurance_interests: toggleValue(current.insurance_interests, value),
                    }))
                  }
                  options={insuranceInterestOptions.map(([value, zh, en]) => [
                    value,
                    locale === "zh-Hant" ? zh : en,
                  ])}
                />
              ) : null}

              {step === 7 ? (
                <div className="grid gap-5">
                  <MultiChoiceGrid
                    values={state.health_tracking_interests}
                    onToggle={(value) =>
                      setState((current) => ({
                        ...current,
                        health_tracking_interests: toggleValue(current.health_tracking_interests, value),
                      }))
                    }
                    options={healthTrackingOptions.map(([value, zh, en]) => [
                      value,
                      locale === "zh-Hant" ? zh : en,
                    ])}
                  />
                  <div className="grid gap-3 rounded-2xl border border-border/50 bg-background/50 p-4">
                    <div className="flex items-center gap-2 text-base font-semibold">
                      <Smartphone aria-hidden="true" />
                      {locale === "zh-Hant" ? "手機健康資料同步" : "Mobile health sync"}
                    </div>
                    <ChoiceGrid
                      value={state.mobile_health_sync_interest}
                      onChange={(mobile_health_sync_interest) =>
                        setState((current) => ({ ...current, mobile_health_sync_interest }))
                      }
                      options={[
                        ["apple_health", locale === "zh-Hant" ? "Apple Health" : "Apple Health"],
                        ["android_health_connect", locale === "zh-Hant" ? "Android Health Connect" : "Android Health Connect"],
                        ["not_now", locale === "zh-Hant" ? "暫時不要" : "Not now"],
                      ]}
                    />
                    <p className="text-sm leading-6 text-muted-foreground">
                      {locale === "zh-Hant"
                        ? "瀏覽器不能直接讀取 Apple Health 或 Health Connect；日後原生 App 會逐項請求授權，只同步摘要。"
                        : "Browsers cannot directly read Apple Health or Health Connect; a future native app will request per-type permission and sync summaries only."}
                    </p>
                  </div>
                </div>
              ) : null}

              {step === 8 ? (
                <div className="grid gap-3">
                  <ConsentToggle
                    locale={locale}
                    checked={state.save_profile_preferences}
                    onChange={(save_profile_preferences) =>
                      setState((current) => ({ ...current, save_profile_preferences }))
                    }
                    label={locale === "zh-Hant" ? "保存個人偏好" : "Save profile preferences"}
                  />
                  <ConsentToggle
                    locale={locale}
                    checked={state.save_health_logs}
                    onChange={(save_health_logs) =>
                      setState((current) => ({ ...current, save_health_logs }))
                    }
                    label={locale === "zh-Hant" ? "保存健康紀錄" : "Save health logs"}
                  />
                  <ConsentToggle
                    locale={locale}
                    checked={state.save_ai_history}
                    onChange={(save_ai_history) =>
                      setState((current) => ({ ...current, save_ai_history }))
                    }
                    label={locale === "zh-Hant" ? "保存 AI 建議／歷史" : "Save AI recommendations/history"}
                  />
                  <Button
                    type="button"
                    variant={state.memory_consent_granted ? "default" : "outline"}
                    className="min-h-14 justify-start rounded-2xl text-left text-base"
                    onClick={() => setState((current) => ({ ...current, memory_consent_granted: true }))}
                  >
                    <ShieldCheck data-icon="inline-start" aria-hidden="true" />
                    {locale === "zh-Hant" ? "同意保存已確認健康記憶" : "Allow confirmed health memory"}
                  </Button>
                  <Button
                    type="button"
                    variant={!state.memory_consent_granted ? "default" : "outline"}
                    className="min-h-14 justify-start rounded-2xl text-left text-base"
                    onClick={() => setState((current) => ({ ...current, memory_consent_granted: false }))}
                  >
                    {locale === "zh-Hant" ? "暫時不要保存記憶" : "Not now"}
                  </Button>
                  <ConsentToggle
                    locale={locale}
                    checked={state.adviser_handoff_consent}
                    onChange={(adviser_handoff_consent) =>
                      setState((current) => ({ ...current, adviser_handoff_consent }))
                    }
                    label={locale === "zh-Hant" ? "允許顧問交接同意" : "Adviser handoff consent"}
                  />
                  <ConsentToggle
                    locale={locale}
                    checked={state.analytics_consent}
                    onChange={(analytics_consent) =>
                      setState((current) => ({ ...current, analytics_consent }))
                    }
                    label={locale === "zh-Hant" ? "允許私隱安全分析" : "Privacy-safe analytics consent"}
                  />
                </div>
              ) : null}

              {step === 9 ? (
                <label className="flex items-start gap-4 rounded-2xl border border-border/50 bg-background/55 p-5 text-base leading-7 shadow-sm">
                  <input
                    className="mt-1 size-5 accent-primary"
                    type="checkbox"
                    checked={state.privacy_acknowledged}
                    onChange={(event) =>
                      setState((current) => ({ ...current, privacy_acknowledged: event.target.checked }))
                    }
                  />
                  <span>
                    {locale === "zh-Hant"
                      ? "我明白本服務只提供健康教育、健身營養方向、香港醫療導航及一般保險教育，不取代醫生或持牌專業人士。"
                      : "I understand this service provides health education, fitness and nutrition guidance, Hong Kong care navigation, and general insurance education only."}
                  </span>
                </label>
              ) : null}

              {step === 10 ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {firstActions.map((action) => (
                    <button
                      type="button"
                      key={action.value}
                      onClick={() => setState((current) => ({ ...current, first_action: action.value }))}
                      className={cn(
                        "flex min-h-24 items-center gap-3 rounded-2xl border p-4 text-left text-base font-semibold transition",
                        state.first_action === action.value
                          ? "border-primary bg-primary/10 text-primary shadow-sm"
                          : "border-border/50 bg-background/50 hover:border-border hover:bg-muted/40",
                      )}
                    >
                      <action.icon className="size-6" aria-hidden="true" />
                      <span>{text(action.label, locale)}</span>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col justify-between gap-3 bg-background/45 p-5 sm:flex-row sm:p-6">
          <Button
            type="button"
            variant="outline"
            className="min-h-12 w-full rounded-2xl text-base sm:w-auto"
            disabled={step === 0 || saving}
            onClick={() => setStep((current) => Math.max(0, current - 1))}
          >
            {locale === "zh-Hant" ? "返回" : "Back"}
          </Button>
          {step < stepCount - 1 ? (
            <Button
              type="button"
              className="min-h-12 w-full rounded-2xl text-base sm:w-auto"
              disabled={!canContinue || saving}
              onClick={() => setStep((current) => current + 1)}
            >
              {locale === "zh-Hant" ? "下一步" : "Next"}
            </Button>
          ) : (
            <Button type="button" className="min-h-12 w-full rounded-2xl text-base sm:w-auto" disabled={saving} onClick={complete}>
              <Check data-icon="inline-start" aria-hidden="true" />
              {saving ? (locale === "zh-Hant" ? "儲存中" : "Saving") : (locale === "zh-Hant" ? "開始" : "Start")}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}

export function isOnboardingComplete() {
  if (typeof window === "undefined") {
    return true;
  }

  return window.localStorage.getItem(ONBOARDING_STORAGE_KEY) === "true";
}

function StepPicture({ step, locale }: { step: number; locale: Locale }) {
  const visual = stepVisuals[step] ?? stepVisuals[0];
  const titleId = `onboarding-step-picture-${step}`;

  return (
    <figure
      className="overflow-hidden rounded-3xl border border-border/50 p-4 shadow-sm"
      style={{
        background: `linear-gradient(145deg, ${visual.colors.background}, ${visual.colors.soft})`,
      }}
    >
      <svg
        className="h-auto w-full"
        viewBox="0 0 320 220"
        role="img"
        aria-labelledby={titleId}
      >
        <title id={titleId}>{text(visual.label, locale)}</title>
        <StepArt step={step} colors={visual.colors} />
      </svg>
      <figcaption className="mt-3 rounded-2xl bg-white/70 p-4 shadow-sm backdrop-blur">
        <p className="text-lg font-bold leading-tight" style={{ color: visual.colors.ink }}>
          {text(visual.label, locale)}
        </p>
        <p className="mt-1 text-sm font-medium" style={{ color: visual.colors.ink }}>
          {text(visual.cue, locale)}
        </p>
      </figcaption>
    </figure>
  );
}

function StepArt({ step, colors }: { step: number; colors: StepVisual["colors"] }) {
  const { primary, secondary, accent, surface, ink } = colors;
  const stroke = {
    stroke: ink,
    strokeWidth: 8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  return (
    <>
      <circle cx="55" cy="48" r="18" fill={accent} opacity="0.8" />
      <circle cx="276" cy="45" r="13" fill={secondary} opacity="0.35" />
      <circle cx="274" cy="176" r="24" fill={surface} opacity="0.75" />
      <path d="M36 184 C82 156 118 190 164 166 S242 146 286 184" fill="none" stroke={surface} strokeWidth="16" strokeLinecap="round" opacity="0.7" />
      {step === 0 ? (
        <>
          <rect x="48" y="58" width="104" height="78" rx="24" fill={surface} />
          <rect x="170" y="82" width="104" height="78" rx="24" fill={surface} />
          <path d="M132 126 L148 148 L146 124" fill={surface} />
          <path d="M192 148 L170 176 L176 148" fill={surface} />
          <text x="100" y="108" textAnchor="middle" fontSize="42" fontWeight="800" fill={primary}>中</text>
          <text x="222" y="132" textAnchor="middle" fontSize="35" fontWeight="800" fill={secondary}>EN</text>
          <circle cx="158" cy="112" r="6" fill={accent} />
          <circle cx="168" cy="118" r="5" fill={primary} />
        </>
      ) : null}
      {step === 1 ? (
        <>
          <circle cx="106" cy="82" r="28" fill={primary} />
          <circle cx="184" cy="75" r="30" fill={secondary} />
          <circle cx="226" cy="116" r="26" fill={accent} />
          <rect x="68" y="118" width="78" height="54" rx="27" fill={surface} />
          <rect x="144" y="114" width="84" height="58" rx="29" fill={surface} />
          <rect x="198" y="146" width="66" height="38" rx="19" fill={surface} />
          <path d="M96 80 Q106 90 116 80" fill="none" stroke={ink} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M174 72 Q184 84 196 72" fill="none" stroke={ink} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M217 116 Q226 124 236 116" fill="none" stroke={ink} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        </>
      ) : null}
      {step === 2 ? (
        <>
          <path d="M42 162 C78 108 124 112 154 162 Z" fill={secondary} opacity="0.72" />
          <path d="M112 164 C150 92 226 90 278 164 Z" fill={primary} opacity="0.82" />
          <path d="M154 72 V162" {...stroke} />
          <path d="M158 74 L226 96 L158 118 Z" fill={accent} />
          <path d="M82 68 L91 86 L111 88 L96 101 L100 120 L82 110 L64 120 L68 101 L53 88 L73 86 Z" fill={surface} />
        </>
      ) : null}
      {step === 3 ? (
        <>
          <rect x="62" y="144" width="52" height="34" rx="12" fill={accent} />
          <rect x="118" y="118" width="52" height="60" rx="12" fill={secondary} />
          <rect x="174" y="88" width="52" height="90" rx="12" fill={primary} />
          <path d="M76 78 H244" {...stroke} />
          <rect x="54" y="62" width="28" height="34" rx="10" fill={surface} />
          <rect x="238" y="62" width="28" height="34" rx="10" fill={surface} />
          <path d="M134 76 Q160 42 188 76" fill="none" stroke={accent} strokeWidth="10" strokeLinecap="round" />
        </>
      ) : null}
      {step === 4 ? (
        <>
          <path d="M76 112 H242 C236 154 206 178 159 178 C112 178 82 154 76 112 Z" fill={surface} />
          <path d="M96 112 C122 92 196 92 222 112" fill="none" stroke={primary} strokeWidth="10" strokeLinecap="round" />
          <circle cx="112" cy="80" r="24" fill={primary} />
          <path d="M116 54 C128 42 144 44 151 54" fill="none" stroke={secondary} strokeWidth="8" strokeLinecap="round" />
          <path d="M170 82 C186 56 225 62 228 94 C232 130 196 142 174 121 C156 141 120 130 124 94 C128 63 156 58 170 82 Z" fill={accent} />
          <circle cx="154" cy="131" r="8" fill={secondary} />
          <circle cx="184" cy="136" r="8" fill={primary} />
        </>
      ) : null}
      {step === 5 ? (
        <>
          <path d="M62 72 L132 48 L190 72 L258 48 V158 L190 182 L132 158 L62 182 Z" fill={surface} />
          <path d="M132 48 V158 M190 72 V182" fill="none" stroke={secondary} strokeWidth="6" strokeLinecap="round" opacity="0.7" />
          <path d="M98 132 C122 94 152 112 176 82 C194 60 222 64 238 84" fill="none" stroke={accent} strokeWidth="9" strokeLinecap="round" />
          <rect x="116" y="84" width="70" height="58" rx="12" fill={primary} />
          <path d="M151 98 V128 M136 113 H166" fill="none" stroke={surface} strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
        </>
      ) : null}
      {step === 6 ? (
        <>
          <path d="M160 42 L246 74 V122 C246 156 214 181 160 190 C106 181 74 156 74 122 V74 Z" fill={surface} />
          <path d="M160 64 L220 86 V120 C220 144 198 162 160 170 C122 162 100 144 100 120 V86 Z" fill={primary} opacity="0.88" />
          <path d="M128 120 L151 142 L197 96" fill="none" stroke={surface} strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="66" y="162" width="56" height="22" rx="11" fill={accent} />
          <rect x="204" y="158" width="50" height="26" rx="13" fill={secondary} />
        </>
      ) : null}
      {step === 7 ? (
        <>
          <rect x="98" y="38" width="124" height="158" rx="28" fill={ink} opacity="0.86" />
          <rect x="112" y="56" width="96" height="118" rx="20" fill={surface} />
          <circle cx="160" cy="184" r="6" fill={surface} />
          <path d="M132 130 V104 M160 130 V82 M188 130 V96" fill="none" stroke={primary} strokeWidth="12" strokeLinecap="round" />
          <circle cx="236" cy="92" r="23" fill={accent} />
          <path d="M226 92 L234 100 L248 82" fill="none" stroke={surface} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="82" cy="142" r="20" fill={secondary} opacity="0.88" />
        </>
      ) : null}
      {step === 8 ? (
        <>
          <rect x="58" y="68" width="204" height="116" rx="32" fill={surface} />
          <path d="M124 104 C138 80 174 82 180 112 C186 82 224 80 236 106 C250 138 214 164 180 174 C146 164 110 138 124 104 Z" fill={secondary} />
          <rect x="82" y="132" width="86" height="34" rx="17" fill={primary} />
          <circle cx="149" cy="149" r="13" fill={surface} />
          <path d="M103 96 V82 C103 61 119 48 140 48 C161 48 177 61 177 82 V96" fill="none" stroke={accent} strokeWidth="12" strokeLinecap="round" />
          <rect x="92" y="88" width="94" height="54" rx="18" fill={accent} />
        </>
      ) : null}
      {step === 9 ? (
        <>
          <rect x="68" y="52" width="184" height="136" rx="30" fill={surface} />
          <path d="M160 72 L218 94 V126 C218 150 195 168 160 176 C125 168 102 150 102 126 V94 Z" fill={primary} opacity="0.9" />
          <path d="M132 126 L153 146 L193 104" fill="none" stroke={surface} strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M70 98 H42 M250 98 H278 M78 154 H52 M242 154 H268" fill="none" stroke={accent} strokeWidth="9" strokeLinecap="round" />
        </>
      ) : null}
      {step === 10 ? (
        <>
          <path d="M48 174 C88 112 134 194 174 126 C198 86 238 92 274 56" fill="none" stroke={surface} strokeWidth="18" strokeLinecap="round" />
          <path d="M48 174 C88 112 134 194 174 126 C198 86 238 92 274 56" fill="none" stroke={primary} strokeWidth="8" strokeLinecap="round" strokeDasharray="1 18" />
          <path d="M174 68 L232 98 L186 142 L154 110 Z" fill={secondary} />
          <path d="M232 98 L270 82 L218 134 Z" fill={accent} />
          <circle cx="168" cy="104" r="10" fill={surface} />
          <path d="M132 132 L108 158 L150 144 Z" fill={primary} />
          <circle cx="70" cy="176" r="16" fill={accent} />
        </>
      ) : null}
    </>
  );
}

function SelectField({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: Array<[string, string]>;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="min-h-14 w-full rounded-2xl px-4 text-base font-semibold">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {options.map(([optionValue, label]) => (
            <SelectItem key={optionValue} value={optionValue}>
              {label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

function ChoiceGrid({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: Array<[string, string]>;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {options.map(([optionValue, label]) => (
        <Button
          key={optionValue}
          type="button"
          variant={value === optionValue ? "default" : "outline"}
          className="min-h-14 justify-center rounded-2xl px-4 text-base font-semibold"
          onClick={() => onChange(optionValue)}
        >
          {label}
        </Button>
      ))}
    </div>
  );
}

function MultiChoiceGrid({
  values,
  onToggle,
  options,
}: {
  values: string[];
  onToggle: (value: string) => void;
  options: Array<[string, string]>;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {options.map(([optionValue, optionLabel]) => {
        const active = values.includes(optionValue);

        return (
          <Button
            key={optionValue}
            type="button"
            variant={active ? "default" : "outline"}
            onClick={() => onToggle(optionValue)}
            className="min-h-14 justify-start rounded-2xl px-4 text-left text-base font-semibold whitespace-normal"
          >
            {active ? <Check data-icon="inline-start" aria-hidden="true" /> : null}
            {optionLabel}
          </Button>
        );
      })}
    </div>
  );
}

function ConsentToggle({
  locale,
  checked,
  onChange,
  label,
}: {
  locale: Locale;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      className="flex min-h-14 items-center justify-between gap-3 rounded-2xl border border-border/50 bg-background/50 px-4 text-left text-base font-semibold transition hover:border-border hover:bg-muted/35"
      onClick={() => onChange(!checked)}
      aria-pressed={checked}
    >
      <span className="flex min-w-0 items-center gap-2">
        <HeartPulse className="size-5 shrink-0" aria-hidden="true" />
        {label}
      </span>
      <Badge variant={checked ? "default" : "secondary"}>
        {checked
          ? locale === "zh-Hant" ? "開啟" : "On"
          : locale === "zh-Hant" ? "關閉" : "Off"}
      </Badge>
    </button>
  );
}

function toggleValue(values: string[], value: string) {
  return values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value];
}

function getStepTitle(step: number, locale: Locale) {
  const titles = [
    ["先揀語言", "Pick language"],
    ["你是哪一位", "Who are you"],
    ["揀大目標", "Pick a big goal"],
    ["今天力氣", "Today’s energy"],
    ["食物偏好", "Food likes"],
    ["求診偏好", "Care path"],
    ["保障興趣", "Coverage interests"],
    ["想追蹤甚麼", "What to track"],
    ["保存設定", "Saving choices"],
    ["安全提示", "Safety note"],
    ["第一件小事", "First tiny action"],
  ];

  const title = titles[step] ?? titles[0];

  return locale === "zh-Hant" ? title[0] : title[1];
}

function getStepDescription(step: number, locale: Locale) {
  const descriptions = [
    ["繁體中文優先，英文仍可用。", "Traditional Chinese first; English still works."],
    ["只幫介面用合適語氣。", "Only helps the interface speak the right way."],
    ["我們會用它安排今日建議。", "This shapes today’s suggestions."],
    ["建議會跟著你的狀態放慢。", "Suggestions stay gentle for your current state."],
    ["只保存類別，不保存敏感餐點全文。", "Stores categories, not sensitive meal text."],
    ["香港照護導航會保留安全提示。", "Hong Kong care navigation keeps safety notices visible."],
    ["只比較保障類別，不推薦特定產品。", "Coverage categories only; no specific product recommendations."],
    ["手機同步只會在原生 App 明確授權後啟用。", "Mobile sync starts only after native-app permission and explicit consent."],
    ["保存全都可選，急症提示仍然會出現。", "Saving is optional; emergency safety guidance still appears."],
    ["這一步不可跳過。", "This step is required."],
    ["完成後直接去做第一件小事。", "After this, go straight to one tiny action."],
  ];

  const description = descriptions[step] ?? descriptions[0];

  return locale === "zh-Hant" ? description[0] : description[1];
}
