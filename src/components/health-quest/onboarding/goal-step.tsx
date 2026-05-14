"use client";

import { BedDouble, Brain, Droplets, Dumbbell, HeartPulse, ShieldCheck, Stethoscope, Users, Utensils } from "lucide-react";
import type { QuestLocale } from "@/lib/health-quest/types";
import { StepCards } from "./step-card";

const options = [
  { value: "better_sleep", icon: BedDouble, label: { zh: "瞓得好啲", en: "Better sleep" }, description: { zh: "由一個睡前小習慣開始。", en: "Start with one small wind-down habit." } },
  { value: "more_energy", icon: HeartPulse, label: { zh: "精神多啲", en: "More energy" }, description: { zh: "用補水、休息同輕量郁動支持每日狀態。", en: "Support daily energy with hydration, rest, and gentle movement." } },
  { value: "drink_more_water", icon: Droplets, label: { zh: "飲多啲水", en: "Drink more water" }, description: { zh: "一杯水都算數。", en: "One glass counts." } },
  { value: "eat_better", icon: Utensils, label: { zh: "食得清晰啲", en: "Eat better" }, description: { zh: "不計卡路里，先建立覺察。", en: "No calorie pressure, just awareness." } },
  { value: "move_more", icon: Dumbbell, label: { zh: "郁動多啲", en: "Move more" }, description: { zh: "輕量版本和恢復日都算數。", en: "Gentle versions and recovery days count." } },
  { value: "reduce_stress", icon: Brain, label: { zh: "壓力少啲", en: "Reduce stress" }, description: { zh: "一般生活支援，不是心理診斷。", en: "General lifestyle support, not a mental health diagnosis." } },
  { value: "mood_support", icon: HeartPulse, label: { zh: "心情支援", en: "Mood support" }, description: { zh: "用溫和打卡幫任務變輕。", en: "Gentle check-ins help the app soften quests." } },
  { value: "doctor_prep", icon: Stethoscope, label: { zh: "睇醫生準備", en: "Doctor prep" }, description: { zh: "整理問題，不作診斷。", en: "Organize questions, not diagnosis." } },
  { value: "family_care", icon: Users, label: { zh: "照顧屋企人", en: "Family care" }, description: { zh: "分享進度，不分享私隱細節。", en: "Share progress, not private details." } },
  { value: "insurance_education", icon: ShieldCheck, label: { zh: "保險教育", en: "Insurance education" }, description: { zh: "整理問題，不作保險建議。", en: "Organize questions, not insurance advice." } },
];

export function GoalStep({ value, locale, onChange }: { value: string; locale: QuestLocale; onChange: (value: string) => void }) {
  return <StepCards options={options} value={value} locale={locale} onChange={onChange} />;
}
