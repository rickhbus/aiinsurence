"use client";

import { Bell, BellOff, Clock4, Sun } from "lucide-react";
import type { QuestLocale } from "@/lib/health-quest/types";
import { StepCards } from "./step-card";

const timeOptions = [
  { value: "morning", icon: Sun, label: { zh: "早上", en: "Morning" }, description: { zh: "今日開始時做兩三步。", en: "Do two or three steps as the day starts." } },
  { value: "midday", icon: Clock4, label: { zh: "中午", en: "Midday" }, description: { zh: "午間補水或簡短回顧。", en: "Midday hydration or quick check-in." } },
  { value: "evening", icon: Clock4, label: { zh: "晚上", en: "Evening" }, description: { zh: "睡前回顧和準備。", en: "Evening review and wind-down." } },
  { value: "no_preference", icon: BellOff, label: { zh: "暫時不用提醒", en: "No preference" }, description: { zh: "你仍可每日打開 app 做任務。", en: "You can still open the app for quests." } },
];

export function ReminderStep({
  value,
  reminderEnabled,
  locale,
  onTimeChange,
  onReminderChange,
}: {
  value: string;
  reminderEnabled: boolean;
  locale: QuestLocale;
  onTimeChange: (value: string) => void;
  onReminderChange: (value: boolean) => void;
}) {
  return (
    <div className="grid gap-4">
      <StepCards options={timeOptions} value={value} locale={locale} onChange={onTimeChange} />
      <button type="button" className="text-left" onClick={() => onReminderChange(!reminderEnabled)}>
        <div className="rounded-3xl border border-border/60 bg-card/80 p-4">
          <span className="flex items-center gap-2 font-medium">
            <Bell aria-hidden="true" />
            {locale === "en" ? "Enable gentle reminders" : "開啟溫和提醒"}
          </span>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {locale === "en"
              ? "Reminder copy never includes private health details."
              : "提醒文字不會包含私人健康細節。"}
          </p>
          <p className="mt-2 text-sm font-medium">{reminderEnabled ? "On" : "Off"}</p>
        </div>
      </button>
    </div>
  );
}
