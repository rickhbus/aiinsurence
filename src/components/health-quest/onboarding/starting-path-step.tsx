"use client";

import { Apple, BedDouble, Brain, Droplets, HeartPulse, Stethoscope, Users } from "lucide-react";
import type { QuestLocale } from "@/lib/health-quest/types";
import { StepCards } from "./step-card";

const options = [
  { value: "easy_start", icon: HeartPulse, label: { zh: "輕鬆開始", en: "Easy start" }, description: { zh: "飲水、心情、一個簡單回顧。", en: "Water, mood, and one simple review." } },
  { value: "energy_reset", icon: Droplets, label: { zh: "精神重置", en: "Energy reset" }, description: { zh: "補水、睡眠、輕量郁動。", en: "Hydration, sleep, and gentle movement." } },
  { value: "sleep_better", icon: BedDouble, label: { zh: "瞓得好啲", en: "Sleep better" }, description: { zh: "睡前小準備和恢復。", en: "Tiny wind-down and recovery." } },
  { value: "stress_less", icon: Brain, label: { zh: "壓力少啲", en: "Stress less" }, description: { zh: "簡短呼吸、心情支援。", en: "Short breathing and mood support." } },
  { value: "move_gently", icon: HeartPulse, label: { zh: "輕量郁動", en: "Move gently" }, description: { zh: "低壓活動，恢復同樣計。", en: "Low-pressure movement; recovery counts." } },
  { value: "food_awareness", icon: Apple, label: { zh: "飲食覺察", en: "Food awareness" }, description: { zh: "不計分、不羞辱，只記類別。", en: "No scoring or shame; only simple categories." } },
  { value: "doctor_prep", icon: Stethoscope, label: { zh: "睇醫生準備", en: "Prepare for a visit" }, description: { zh: "準備問題，不作診斷。", en: "Prepare questions, not diagnosis." } },
  { value: "family_care", icon: Users, label: { zh: "家庭支援", en: "Family support" }, description: { zh: "分享進度，不分享私隱細節。", en: "Share progress, not private details." } },
];

export function StartingPathStep({ value, locale, onChange }: { value: string; locale: QuestLocale; onChange: (value: string) => void }) {
  return <StepCards options={options} value={value} locale={locale} onChange={onChange} />;
}
