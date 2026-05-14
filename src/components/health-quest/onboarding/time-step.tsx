"use client";

import { Clock3 } from "lucide-react";
import type { QuestLocale } from "@/lib/health-quest/types";
import { StepCards } from "./step-card";

const options = [
  { value: "thirty_seconds", icon: Clock3, label: { zh: "30 秒", en: "30 seconds" }, description: { zh: "只做最細版本，兩步就夠。", en: "Tiny actions only; two steps are enough." } },
  { value: "two_minutes", icon: Clock3, label: { zh: "2 分鐘", en: "2 minutes" }, description: { zh: "適合每日守住連續紀錄。", en: "Good for protecting a daily streak." } },
  { value: "five_minutes", icon: Clock3, label: { zh: "5 分鐘", en: "5 minutes" }, description: { zh: "完成幾個小任務，再學一個概念。", en: "Finish a few quests and learn one tiny idea." } },
  { value: "ten_minutes", icon: Clock3, label: { zh: "10 分鐘", en: "10 minutes" }, description: { zh: "可以加入可選深入任務。", en: "Allows optional deeper quests." } },
];

export function TimeStep({ value, locale, onChange }: { value: string; locale: QuestLocale; onChange: (value: string) => void }) {
  return <StepCards options={options} value={value} locale={locale} onChange={onChange} />;
}
