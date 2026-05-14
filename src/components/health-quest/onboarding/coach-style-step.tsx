"use client";

import { Dumbbell, HeartHandshake, MessageCircle, ShieldPlus, Waves } from "lucide-react";
import type { QuestLocale } from "@/lib/health-quest/types";
import { StepCards } from "./step-card";

const options = [
  { value: "gentle", icon: HeartHandshake, label: { zh: "溫柔", en: "Gentle" }, description: { zh: "鼓勵、小步、無內疚。", en: "Encouraging, small, and guilt-free." } },
  { value: "direct", icon: MessageCircle, label: { zh: "直接", en: "Direct" }, description: { zh: "清楚講下一步。", en: "Clear next step, less fluff." } },
  { value: "family_doctor", icon: ShieldPlus, label: { zh: "家庭醫生感", en: "Family doctor" }, description: { zh: "一般生活支援和安全提醒。", en: "General lifestyle support with safety reminders." } },
  { value: "gym", icon: Dumbbell, label: { zh: "健身教練", en: "Gym" }, description: { zh: "活力啲，但不會聲稱運動一定安全。", en: "More energetic, without claiming exercise is always safe." } },
  { value: "calm", icon: Waves, label: { zh: "冷靜", en: "Calm" }, description: { zh: "簡短、穩定、低壓。", en: "Short, steady, and low-pressure." } },
  { value: "bilingual", icon: MessageCircle, label: { zh: "中英提示", en: "Bilingual" }, description: { zh: "回覆中英並列。", en: "Responses show Chinese and English together." } },
];

export function CoachStyleStep({ value, locale, onChange }: { value: string; locale: QuestLocale; onChange: (value: string) => void }) {
  return <StepCards options={options} value={value} locale={locale} onChange={onChange} />;
}
