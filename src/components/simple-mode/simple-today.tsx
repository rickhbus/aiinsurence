"use client";

import Link from "next/link";
import { ClipboardList, Home, MoreHorizontal, Users } from "lucide-react";
import { useState } from "react";
import { CallFamilyButton } from "@/components/family/call-family-button";
import { CaregiverOnboarding } from "@/components/family/caregiver-onboarding";
import { PhotoJournalButton } from "@/components/photo-journal/photo-journal-button";
import { BigButton } from "./big-button";
import { EmergencyButton } from "./emergency-button";
import { SimpleMoodPicker, type SimpleMood } from "./simple-mood-picker";
import { SimpleSuggestion, type SimpleSuggestionState } from "./simple-suggestion";
import { simpleActionChoices } from "@/lib/health-app/senior-mode";
import { getSupabaseRequestHeaders } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type SimpleAction = "food" | "water" | "toilet" | "move";
type SavingAction = SimpleMood | SimpleAction | null;

const bottomItems = [
  { href: "/today", label: "今日", icon: Home, active: true },
  { href: "/track", label: "記錄", icon: ClipboardList },
  { href: "/family", label: "屋企人", icon: Users },
  { href: "/more", label: "更多", icon: MoreHorizontal },
];

export function SimpleToday() {
  const [result, setResult] = useState<SimpleSuggestionState | null>(null);
  const [saving, setSaving] = useState<SavingAction>(null);

  async function recordMood(mood: SimpleMood) {
    const moodConfig = {
      good: {
        moodScore: 8,
        stressScore: 3,
        energyScore: 7,
        emotionLabel: "relieved",
        userText: "好 / Good",
        result: {
          confirmation: "記低咗 / Saved",
          suggestion: "好，記低咗。今日可以保持簡單，飲水同郁一郁。",
        },
      },
      okay: {
        moodScore: 5,
        stressScore: 5,
        energyScore: 5,
        emotionLabel: "neutral",
        userText: "一般 / Okay",
        result: {
          confirmation: "記低咗 / Saved",
          suggestion: "記低咗。今日可以先飲水，再做一件細小的事。",
        },
      },
      "not-good": {
        moodScore: 3,
        stressScore: 8,
        energyScore: 3,
        emotionLabel: "tired",
        userText: "唔舒服 / Not good",
        result: {
          confirmation: "記低咗 / Saved",
          suggestion: "聽起來今日有點辛苦。先慢慢呼吸 3 次，飲一杯水。",
          tone: "warning" as const,
        },
      },
    }[mood];

    await submitSimpleLog(mood, "/api/mood/log", {
      moodScore: moodConfig.moodScore,
      stressScore: moodConfig.stressScore,
      energyScore: moodConfig.energyScore,
      emotionLabel: moodConfig.emotionLabel,
      triggerCategory: "unknown",
      bodyLinks: [],
      userText: moodConfig.userText,
      consentToSave: true,
      language: "zh-Hant",
    }, moodConfig.result);
  }

  async function recordAction(action: SimpleAction) {
    const now = new Date();
    const isoNow = now.toISOString();
    const today = isoNow.slice(0, 10);
    const actionConfig = {
      water: {
        endpoint: "/api/hydration/log",
        payload: { loggedAt: isoNow, waterMl: 250, drinkType: "water" },
        result: {
          confirmation: "記低咗 / Saved",
          suggestion: "好，記低咗。今日可以再飲一杯水。",
        },
      },
      food: {
        endpoint: "/api/food/log",
        payload: {
          mealTime: isoNow,
          mealType: "snack",
          description: "食咗嘢 / I ate",
          consentToSave: true,
        },
        result: {
          confirmation: "記低咗 / Saved",
          suggestion: "記低咗。下一步可以飲水，幫助消化。",
        },
      },
      toilet: {
        endpoint: "/api/toilet/log",
        payload: {
          loggedAt: isoNow,
          bowelMovement: true,
          urineColor: "unknown",
        },
        result: {
          confirmation: "記低咗 / Saved",
          suggestion: "記低咗。如有血、劇痛、發燒或嚴重不適，請盡快求醫。",
          tone: "warning" as const,
        },
      },
      move: {
        endpoint: "/api/gym/workouts",
        payload: {
          workoutDate: today,
          startedAt: isoNow,
          endedAt: isoNow,
          durationMinutes: 10,
          workoutType: "movement",
          intensity: 4,
          notes: "做運動 / I moved",
          sets: [],
        },
        result: {
          confirmation: "記低咗 / Saved",
          suggestion: "記低咗。今日先拉筋同補水。",
        },
      },
    }[action];

    await submitSimpleLog(action, actionConfig.endpoint, actionConfig.payload, actionConfig.result);
  }

  async function submitSimpleLog(
    action: SavingAction,
    endpoint: string,
    payload: Record<string, unknown>,
    successResult: SimpleSuggestionState,
  ) {
    setSaving(action);
    const saved = await postWithAnonymousSession(endpoint, payload);
    setSaving(null);

    if (saved) {
      void recordDailyCheckIn(action);
      window.dispatchEvent(new Event("health-log-saved"));
      setResult(successResult);
      return;
    }

    setResult({
      confirmation: "暫時未能保存 / Not saved yet",
      suggestion: successResult.suggestion,
      tone: successResult.tone ?? "warning",
    });
  }

  async function recordDailyCheckIn(action: SavingAction) {
    if (!action) {
      return;
    }

    const payload = {
      food: { checkin_type: "meal", label: "食咗嘢" },
      water: { checkin_type: "water", label: "飲咗水" },
      toilet: { checkin_type: "health_review", label: "去廁所" },
      move: { checkin_type: "exercise", label: "郁咗一陣" },
      good: { checkin_type: "health_review", label: "好" },
      okay: { checkin_type: "health_review", label: "一般" },
      "not-good": {
        checkin_type: "health_review",
        label: "唔舒服",
        metadata: { notFeelingWell: true },
      },
    }[action];

    if (payload) {
      await postWithAnonymousSession("/api/daily/checkins", payload);
    }
  }

  async function postWithAnonymousSession(endpoint: string, payload: Record<string, unknown>) {
    try {
      const headers = await getSupabaseRequestHeaders({
        "Content-Type": "application/json",
        Accept: "application/json",
      });

      const response = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      return response.ok;
    } catch {
      return false;
    }
  }

  return (
    <main className="min-h-dvh bg-[linear-gradient(160deg,var(--health-bg-start),var(--background)_45%,var(--health-bg-end))] px-4 pb-[calc(7rem_+_env(safe-area-inset-bottom))] pt-6 sm:px-6 lg:px-8 lg:pb-10">
      <div className="mx-auto flex min-h-[calc(100dvh-3rem)] w-full max-w-3xl flex-col gap-6">
        <header className="pt-2">
          <h1 className="text-4xl font-bold leading-tight tracking-normal text-foreground sm:text-5xl">
            今日點呀？
          </h1>
        </header>

        <CaregiverOnboarding />

        <section aria-label="Mood" className="grid gap-3">
          <SimpleMoodPicker disabled={saving !== null} onSelect={recordMood} />
        </section>

        <section aria-label="Actions" className="grid gap-3 sm:grid-cols-2">
          {simpleActionChoices.map((choice) => (
            <BigButton
              key={choice.action}
              emoji={choice.emoji}
              tone={choice.action === "water" ? "default" : "soft"}
              disabled={saving !== null}
              onClick={() => recordAction(choice.action as SimpleAction)}
            >
              {saving === choice.action ? "保存中" : choice.label}
            </BigButton>
          ))}
          <PhotoJournalButton disabled={saving !== null} onResult={setResult} />
          <CallFamilyButton disabled={saving !== null} onResult={setResult} />
        </section>

        <EmergencyButton onEmergency={setResult} />

        <SimpleSuggestion result={result} />

        <div className="mt-auto flex justify-center pt-2">
          <Link
            href="/today/advanced"
            className="rounded-full px-5 py-3 text-lg font-semibold text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            進階資料
          </Link>
        </div>
      </div>

      <nav
        className="fixed inset-x-0 bottom-0 z-40 grid min-h-20 grid-cols-4 border-t border-border/40 bg-background/90 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-2xl lg:hidden"
        aria-label="Bottom navigation"
      >
        {bottomItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex min-h-12 flex-col items-center justify-center gap-1 rounded-2xl text-[0.68rem] font-medium text-muted-foreground transition-all duration-200",
              item.active && "bg-primary text-primary-foreground shadow-md shadow-primary/25",
            )}
          >
            <item.icon aria-hidden="true" />
            <span className="truncate">{item.label}</span>
          </Link>
        ))}
      </nav>
    </main>
  );
}
