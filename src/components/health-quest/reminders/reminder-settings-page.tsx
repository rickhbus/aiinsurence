"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { QuestLocale } from "@/lib/health-quest/types";
import { getSupabaseRequestHeaders } from "@/lib/supabase/client";
import { ReminderCopyPreview } from "./reminder-copy-preview";
import { ReminderTimePicker } from "./reminder-time-picker";

export function ReminderSettingsPage({ locale = "zh-Hant" }: { locale?: QuestLocale }) {
  const [time, setTime] = useState("08:30");
  const [enabled, setEnabled] = useState(false);

  async function save() {
    const headers = await getSupabaseRequestHeaders({ "Content-Type": "application/json", Accept: "application/json" });
    await fetch("/api/health-quest/reminders", {
      method: "POST",
      headers,
      body: JSON.stringify({
        reminderEnabled: enabled,
        reminderTime: time,
        morningReminderEnabled: enabled,
        morningReminderTime: time,
      }),
    }).catch(() => undefined);
    toast.success(locale === "en" ? "Reminder preferences saved." : "提醒偏好已保存。");
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
      <section className="rounded-3xl border border-border/60 bg-card/80 p-5">
        <Badge variant="secondary" className="mb-3">
          <Bell data-icon="inline-start" aria-hidden="true" />
          Reminders
        </Badge>
        <h1 className="text-3xl font-bold tracking-normal">{locale === "en" ? "Reminder preferences" : "提醒偏好"}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {locale === "en" ? "Safe notification copy, without private health details." : "安全提醒文字，不包含私人健康細節。"}
        </p>
      </section>
      <div className="rounded-3xl border border-border/60 bg-card/80 p-4">
        <Button type="button" variant={enabled ? "default" : "outline"} onClick={() => setEnabled((value) => !value)}>
          {enabled ? (locale === "en" ? "Enabled" : "已開啟") : (locale === "en" ? "Disabled" : "已關閉")}
        </Button>
        <div className="mt-4">
          <ReminderTimePicker value={time} onChange={setTime} />
        </div>
      </div>
      <ReminderCopyPreview locale={locale} />
      <Button type="button" className="min-h-12 rounded-2xl" onClick={save}>{locale === "en" ? "Save" : "保存"}</Button>
    </div>
  );
}
