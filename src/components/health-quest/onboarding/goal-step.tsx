"use client";

import { BedDouble, Brain, Droplets, Dumbbell, HeartPulse, ShieldCheck, Stethoscope, Users, Utensils } from "lucide-react";
import type { QuestLocale } from "@/lib/health-quest/types";
import { StepCards } from "./step-card";

const options = [
  { value: "better_sleep", icon: BedDouble, label: { zh: "瞓得好少少", en: "Sleep a little better" }, description: { zh: "由一個細小睡前流程開始。", en: "Start with a small wind-down routine." } },
  { value: "more_energy", icon: HeartPulse, label: { zh: "冇咁攰", en: "Feel less drained" }, description: { zh: "用小習慣保住精神。", en: "Build tiny habits that protect energy." } },
  { value: "drink_more_water", icon: Droplets, label: { zh: "記得飲水", en: "Remember water" }, description: { zh: "溫和補水提示，唔施壓。", en: "Gentle hydration prompts, no pressure." } },
  { value: "eat_better", icon: Utensils, label: { zh: "食得清晰啲", en: "Notice eating patterns" }, description: { zh: "先建立覺察，不計卡路里、不羞辱。", en: "Awareness first, no calorie shame." } },
  { value: "move_more", icon: Dumbbell, label: { zh: "輕量郁動", en: "Move gently" }, description: { zh: "恢復日同簡化版本都算數。", en: "Recovery days and lighter versions count." } },
  { value: "reduce_stress", icon: Brain, label: { zh: "壓力細啲", en: "Lower daily pressure" }, description: { zh: "一般生活支援，不作診斷。", en: "General lifestyle support, not diagnosis." } },
  { value: "mood_support", icon: HeartPulse, label: { zh: "心情打卡", en: "Check in with mood" }, description: { zh: "由簡單低壓打卡開始。", en: "Start with simple, low-pressure check-ins." } },
  { value: "doctor_prep", icon: Stethoscope, label: { zh: "睇醫生準備", en: "Prepare for a visit" }, description: { zh: "整理想講同想問醫護嘅內容。", en: "Organize what to tell and ask your clinician." } },
  { value: "family_care", icon: Users, label: { zh: "照顧屋企人", en: "Family care" }, description: { zh: "分享進度，不分享私隱細節。", en: "Share progress, not private details." } },
  { value: "insurance_education", icon: ShieldCheck, label: { zh: "了解保險基礎", en: "Understand insurance basics" }, description: { zh: "整理問題，不作保險建議。", en: "Organize questions, not insurance advice." } },
];

export function GoalStep({ value, locale, onChange }: { value: string; locale: QuestLocale; onChange: (value: string) => void }) {
  return <StepCards options={options} value={value} locale={locale} onChange={onChange} />;
}
