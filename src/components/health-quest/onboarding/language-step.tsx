"use client";

import { Languages } from "lucide-react";
import type { QuestLocale } from "@/lib/health-quest/types";
import { StepCards } from "./step-card";

const options = [
  { value: "zh-Hant", icon: Languages, label: { zh: "繁體中文優先", en: "Traditional Chinese first" }, description: { zh: "香港語境和繁中介面。", en: "Hong Kong context with Traditional Chinese UI." } },
  { value: "en", icon: Languages, label: { zh: "English", en: "English" }, description: { zh: "主要用英文。", en: "Use mostly English." } },
  { value: "bilingual", icon: Languages, label: { zh: "中英雙語", en: "Bilingual" }, description: { zh: "重要提示同時顯示中英。", en: "Important guidance appears in both languages." } },
];

export function LanguageStep({ value, locale, onChange }: { value: string; locale: QuestLocale; onChange: (value: string) => void }) {
  return <StepCards options={options} value={value} locale={locale} onChange={onChange} />;
}
