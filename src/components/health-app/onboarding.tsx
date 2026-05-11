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
              <div className="grid gap-3">
                <div className="flex items-center gap-2 text-sm font-medium">
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

          {step === 10 ? (
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
            className="min-h-12 justify-start text-left"
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
      className="flex min-h-12 items-center justify-between rounded-xl border border-border/50 bg-background/50 px-3 text-left text-sm transition hover:border-border"
      onClick={() => onChange(!checked)}
      aria-pressed={checked}
    >
      <span className="flex items-center gap-2">
        <HeartPulse aria-hidden="true" />
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
    ["語言", "Language"],
    ["使用者類型", "User type"],
    ["主要目標", "Main goal"],
    ["健身程度", "Fitness level"],
    ["營養偏好", "Nutrition preference"],
    ["香港醫療偏好", "Hong Kong care preference"],
    ["保險興趣", "Insurance interests"],
    ["健康追蹤", "Health tracking"],
    ["同意設定", "Consent settings"],
    ["私隱與安全", "Privacy and safety"],
    ["第一個行動", "First action"],
  ];

  return locale === "zh-Hant" ? titles[step][0] : titles[step][1];
}

function getStepDescription(step: number, locale: Locale) {
  const descriptions = [
    ["繁體中文優先，英文可隨時切換。", "Traditional Chinese first; English remains available."],
    ["只用作調整介面和免責提示。", "Used only to tune interface copy and disclaimers."],
    ["用於安排空狀態和今日建議。", "Used for empty states and today’s suggestions."],
    ["讓建議保守地配合恢復能力。", "Keeps suggestions conservative for your current capacity."],
    ["只保存類別，不保存敏感餐點全文。", "Stores categories, not sensitive meal text."],
    ["香港照護導航會保留安全提示。", "Hong Kong care navigation keeps safety notices visible."],
    ["只比較保障類別，不推薦特定產品。", "Coverage categories only; no specific product recommendations."],
    ["手機同步只會在原生 App 明確授權後啟用。", "Mobile sync starts only after native-app permission and explicit consent."],
    ["所有保存行為都可選擇，不影響急症安全提示。", "Saving is optional and does not affect emergency safety guidance."],
    ["這一步不可跳過。", "This step is required."],
    ["完成後直接進入第一個價值動作。", "After this, go straight to the first value action."],
  ];

  return locale === "zh-Hant" ? descriptions[step][0] : descriptions[step][1];
}
