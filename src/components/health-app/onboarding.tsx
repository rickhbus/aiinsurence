"use client";

import { useMemo, useState } from "react";
import { Activity, Apple, Check, Dumbbell, Droplets, Flag, ShieldCheck } from "lucide-react";
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

const ONBOARDING_STORAGE_KEY = "health:onboarding-completed:v1";

type OnboardingState = {
  language: Locale;
  main_goal: string;
  fitness_level: string;
  nutrition_preference: string;
  hk_care_preference: string;
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

export function OnboardingPage({ locale }: { locale: Locale }) {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [state, setState] = useState<OnboardingState>({
    language: locale,
    main_goal: "build_muscle",
    fitness_level: "returning",
    nutrition_preference: "balanced",
    hk_care_preference: "either",
    memory_consent_granted: false,
    privacy_acknowledged: false,
    first_action: "water",
  });
  const selectedAction = useMemo(
    () => firstActions.find((action) => action.value === state.first_action) ?? firstActions[0],
    [state.first_action],
  );
  const stepCount = 8;
  const canContinue = step !== 6 || state.privacy_acknowledged;

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
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <section className="welcome-gradient rounded-2xl border border-border/50 bg-card/60 p-5 shadow-sm backdrop-blur-xl">
        <Badge variant="secondary" className="w-fit">
          {locale === "zh-Hant" ? "開始設定" : "Onboarding"}
        </Badge>
        <h2 className="text-gradient-health mt-3 text-3xl font-bold tracking-tight">
          {text(ui.appNameFull, locale)}
        </h2>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${((step + 1) / stepCount) * 100}%` }}
          />
        </div>
      </section>

      <Card className="overflow-hidden border-border/60 bg-card/72 shadow-sm backdrop-blur-xl">
        <CardHeader>
          <CardTitle>{getStepTitle(step, locale)}</CardTitle>
          <CardDescription>{getStepDescription(step, locale)}</CardDescription>
        </CardHeader>
        <CardContent>
          {step === 0 ? (
            <ChoiceGrid
              value={state.language}
              onChange={(language) => setState((current) => ({ ...current, language: language as Locale }))}
              options={[
                ["zh-Hant", "繁體中文"],
                ["en", "English"],
              ]}
            />
          ) : null}

          {step === 1 ? (
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

          {step === 2 ? (
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

          {step === 3 ? (
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

          {step === 4 ? (
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

          {step === 5 ? (
            <div className="grid gap-3">
              <Button
                type="button"
                variant={state.memory_consent_granted ? "default" : "outline"}
                onClick={() => setState((current) => ({ ...current, memory_consent_granted: true }))}
              >
                <ShieldCheck data-icon="inline-start" aria-hidden="true" />
                {locale === "zh-Hant" ? "同意保存已確認健康記憶" : "Allow confirmed health memory"}
              </Button>
              <Button
                type="button"
                variant={!state.memory_consent_granted ? "default" : "outline"}
                onClick={() => setState((current) => ({ ...current, memory_consent_granted: false }))}
              >
                {locale === "zh-Hant" ? "暫時不要保存記憶" : "Not now"}
              </Button>
            </div>
          ) : null}

          {step === 6 ? (
            <label className="flex items-start gap-3 rounded-xl border border-border/50 bg-muted/30 p-4 text-sm leading-6">
              <input
                className="mt-1"
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

          {step === 7 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {firstActions.map((action) => (
                <button
                  type="button"
                  key={action.value}
                  onClick={() => setState((current) => ({ ...current, first_action: action.value }))}
                  className={`flex min-h-20 items-center gap-3 rounded-xl border p-3 text-left transition ${
                    state.first_action === action.value
                      ? "border-primary bg-primary/10"
                      : "border-border/50 bg-muted/20 hover:border-border"
                  }`}
                >
                  <action.icon aria-hidden="true" />
                  <span>{text(action.label, locale)}</span>
                </button>
              ))}
            </div>
          ) : null}
        </CardContent>
        <CardFooter className="flex justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            disabled={step === 0 || saving}
            onClick={() => setStep((current) => Math.max(0, current - 1))}
          >
            {locale === "zh-Hant" ? "返回" : "Back"}
          </Button>
          {step < stepCount - 1 ? (
            <Button
              type="button"
              disabled={!canContinue || saving}
              onClick={() => setStep((current) => current + 1)}
            >
              {locale === "zh-Hant" ? "下一步" : "Next"}
            </Button>
          ) : (
            <Button type="button" disabled={saving} onClick={complete}>
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
      <SelectTrigger className="w-full">
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
          onClick={() => onChange(optionValue)}
        >
          {label}
        </Button>
      ))}
    </div>
  );
}

function getStepTitle(step: number, locale: Locale) {
  const titles = [
    ["語言", "Language"],
    ["主要目標", "Main goal"],
    ["健身程度", "Fitness level"],
    ["營養偏好", "Nutrition preference"],
    ["香港醫療偏好", "Hong Kong care preference"],
    ["健康記憶", "Health memory"],
    ["私隱與安全", "Privacy and safety"],
    ["第一個行動", "First action"],
  ];

  return locale === "zh-Hant" ? titles[step][0] : titles[step][1];
}

function getStepDescription(step: number, locale: Locale) {
  const descriptions = [
    ["繁體中文優先，英文可隨時切換。", "Traditional Chinese first; English remains available."],
    ["用於安排空狀態和今日建議。", "Used for empty states and today’s suggestions."],
    ["讓建議保守地配合恢復能力。", "Keeps suggestions conservative for your current capacity."],
    ["只保存類別，不保存敏感餐點全文。", "Stores categories, not sensitive meal text."],
    ["香港照護導航會保留安全提示。", "Hong Kong care navigation keeps safety notices visible."],
    ["AI 只可建議，必須由你確認才保存。", "AI may suggest memory, but only you can save it."],
    ["這一步不可跳過。", "This step is required."],
    ["完成後直接進入第一個價值動作。", "After this, go straight to the first value action."],
  ];

  return locale === "zh-Hant" ? descriptions[step][0] : descriptions[step][1];
}
