"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getSupabaseRequestHeaders } from "@/lib/supabase/client";
import { reminderTypes, type ReminderType } from "@/lib/reminders";

type ReminderRow = {
  id: string;
  reminder_type: string;
  title_zh: string;
  time_of_day: string;
  enabled: boolean;
};

const reminderLabels: Record<ReminderType, string> = {
  morning_check_in: "朝早安心 check-in",
  drink_water: "飲水",
  evening_check_in: "夜晚安心 check-in",
  doctor_appointment: "覆診",
  family_check_in: "家庭 check-in",
  medication_instruction: "按醫生/藥劑師指示服藥",
};

export function SimpleReminders() {
  const [reminderType, setReminderType] = useState<ReminderType>("morning_check_in");
  const [timeOfDay, setTimeOfDay] = useState("09:00");
  const [medicationName, setMedicationName] = useState("");
  const [reminders, setReminders] = useState<ReminderRow[]>([]);
  const [busy, setBusy] = useState(false);

  async function loadReminders() {
    const headers = await getSupabaseRequestHeaders({ Accept: "application/json" });
    const response = await fetch("/api/reminders", { headers });
    const body = await response.json().catch(() => null);

    if (response.ok) {
      setReminders(body.reminders ?? []);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadReminders();
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  async function saveReminder() {
    setBusy(true);

    try {
      const headers = await getSupabaseRequestHeaders({
        "Content-Type": "application/json",
        Accept: "application/json",
      });
      await fetch("/api/reminders", {
        method: "POST",
        headers,
        body: JSON.stringify({
          reminderType,
          timeOfDay,
          medicationName: medicationName || null,
        }),
      });
      await loadReminders();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="border-border/60 bg-card/80 shadow-sm backdrop-blur-xl">
      <CardHeader>
        <CardTitle>安心提醒 / Reminders</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid gap-2 sm:grid-cols-2">
          {reminderTypes.map((type) => (
            <Button
              key={type}
              type="button"
              variant={reminderType === type ? "default" : "outline"}
              className="min-h-12 justify-start"
              onClick={() => setReminderType(type)}
            >
              <Bell data-icon="inline-start" aria-hidden="true" />
              {reminderLabels[type]}
            </Button>
          ))}
        </div>
        <Input
          type="time"
          value={timeOfDay}
          onChange={(event) => setTimeOfDay(event.target.value)}
          aria-label="Reminder time"
        />
        {reminderType === "medication_instruction" ? (
          <Input
            value={medicationName}
            onChange={(event) => setMedicationName(event.target.value)}
            placeholder="藥物名稱由你輸入，可留空"
          />
        ) : null}
        <Button disabled={busy} onClick={saveReminder} className="min-h-12 w-full sm:w-fit">
          保存提醒
        </Button>
        <div className="grid gap-2 text-sm leading-6 text-muted-foreground">
          {reminders.map((reminder) => (
            <p key={reminder.id}>{reminder.time_of_day} - {reminder.title_zh}</p>
          ))}
          {reminders.length === 0 ? <p>暫時未有提醒。</p> : null}
        </div>
      </CardContent>
    </Card>
  );
}
