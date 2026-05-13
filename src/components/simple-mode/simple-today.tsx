"use client";

import Link from "next/link";
import { ClipboardList, Home, MoreHorizontal, Users } from "lucide-react";
import { useState } from "react";
import { CallFamilyButton } from "@/components/family/call-family-button";
import { PhotoJournalButton } from "@/components/photo-journal/photo-journal-button";
import { BigButton } from "./big-button";
import { EmergencyButton } from "./emergency-button";
import { SimpleMoodPicker, type SimpleMood } from "./simple-mood-picker";
import { SimpleSuggestion, type SimpleSuggestionState } from "./simple-suggestion";
import { simpleActionChoices } from "@/lib/health-app/senior-mode";
import {
  saveSimpleModeAction,
  type SimpleModeCheckInAction,
} from "@/lib/health-app/simple-mode-persistence";
import { getSupabaseRequestHeaders } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type SimpleGridAction = (typeof simpleActionChoices)[number]["action"];
type DirectSimpleAction = Extract<SimpleGridAction, "wake" | "food" | "water" | "move" | "toilet">;
type ActivePanel = "mood" | "sick" | null;
type SavingAction = SimpleModeCheckInAction | null;
type SickCategory = "dizzy" | "chest_pain" | "stomach_pain" | "fever" | "fall" | "other";

const bottomItems = [
  { href: "/today", label: "今日", icon: Home, active: true },
  { href: "/track", label: "記錄", icon: ClipboardList },
  { href: "/family", label: "屋企人", icon: Users },
  { href: "/more", label: "更多", icon: MoreHorizontal },
];

const savedAndDrinkWater: SimpleSuggestionState = {
  confirmation: "記低咗 / Saved",
  suggestion: "下一步：飲一杯水 / Next: drink one glass of water.",
};

const sickChoices: Array<{
  category: SickCategory;
  emoji: string;
  label: string;
  redFlag: boolean;
  suggestion: string;
}> = [
  {
    category: "dizzy",
    emoji: "🌀",
    label: "頭暈",
    redFlag: false,
    suggestion: "記低咗。可以休息、飲水，若持續或變差請求醫。如頭暈嚴重、呼吸困難、胸痛或混亂，請即刻打 999 或去急症室。",
  },
  {
    category: "chest_pain",
    emoji: "❤️",
    label: "胸口痛",
    redFlag: true,
    suggestion: "如情況嚴重，請即刻打 999 或去急症室。",
  },
  {
    category: "stomach_pain",
    emoji: "🤲",
    label: "肚痛",
    redFlag: false,
    suggestion: "記低咗。可以休息、飲水，若持續或變差請求醫。如有劇痛、流血、混亂或呼吸困難，請即刻打 999 或去急症室。",
  },
  {
    category: "fever",
    emoji: "🌡️",
    label: "發燒",
    redFlag: false,
    suggestion: "記低咗。可以休息、飲水，若持續或變差請求醫。",
  },
  {
    category: "fall",
    emoji: "🩹",
    label: "跌親",
    redFlag: true,
    suggestion: "如情況嚴重，請即刻打 999 或去急症室。跌親後如有受傷、頭部撞擊、流血、混亂或嚴重痛，請即刻求助。",
  },
  {
    category: "other",
    emoji: "❓",
    label: "其他",
    redFlag: false,
    suggestion: "記低咗。可以休息、飲水，若持續或變差請求醫。如情況嚴重，請即刻打 999 或去急症室。",
  },
];

export function SimpleToday() {
  const [result, setResult] = useState<SimpleSuggestionState | null>(null);
  const [saving, setSaving] = useState<SavingAction>(null);
  const [activePanel, setActivePanel] = useState<ActivePanel>(null);

  async function recordMood(mood: SimpleMood) {
    const moodConfig = {
      good: {
        moodScore: 8,
        stressScore: 3,
        energyScore: 7,
        emotionLabel: "relieved",
        userText: "好 / Good",
      },
      okay: {
        moodScore: 5,
        stressScore: 5,
        energyScore: 5,
        emotionLabel: "neutral",
        userText: "一般 / Okay",
      },
      "not-good": {
        moodScore: 3,
        stressScore: 8,
        energyScore: 3,
        emotionLabel: "tired",
        userText: "唔舒服 / Not good",
      },
    }[mood];

    setActivePanel(null);
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
    }, savedAndDrinkWater);
  }

  async function recordAction(action: DirectSimpleAction) {
    const now = new Date();
    const isoNow = now.toISOString();
    const today = isoNow.slice(0, 10);
    const actionConfig: Record<DirectSimpleAction, {
      endpoint: string;
      payload: Record<string, unknown>;
      result: SimpleSuggestionState;
    }> = {
      wake: {
        endpoint: "/api/daily-health/check-in",
        payload: {
          logDate: today,
          wakeTime: isoNow,
          consentToSave: true,
        },
        result: {
          confirmation: "早晨，記低咗。",
          suggestion: "今日慢慢嚟，先飲一杯水。",
        },
      },
      water: {
        endpoint: "/api/hydration/log",
        payload: { loggedAt: isoNow, waterMl: 250, drinkType: "water" },
        result: savedAndDrinkWater,
      },
      food: {
        endpoint: "/api/food/log",
        payload: {
          mealTime: isoNow,
          mealType: "snack",
          description: "食咗 / I ate",
          consentToSave: true,
        },
        result: savedAndDrinkWater,
      },
      toilet: {
        endpoint: "/api/toilet/log",
        payload: {
          loggedAt: isoNow,
          bowelMovement: true,
          urineColor: "unknown",
        },
        result: savedAndDrinkWater,
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
          notes: "郁咗 / I moved",
          sets: [],
        },
        result: savedAndDrinkWater,
      },
    };

    const config = actionConfig[action];
    await submitSimpleLog(action, config.endpoint, config.payload, config.result);
  }

  async function recordSickCategory(category: SickCategory) {
    const now = new Date();
    const choice = sickChoices.find((item) => item.category === category);

    if (!choice) {
      return;
    }

    setActivePanel(null);
    await submitSimpleLog(
      "sick",
      "/api/daily-health/check-in",
      {
        logDate: now.toISOString().slice(0, 10),
        bodyNotes: `simple_discomfort:${category}`,
        consentToSave: true,
      },
      {
        confirmation: "記低咗 / Saved",
        suggestion: choice.suggestion,
        tone: choice.redFlag ? "danger" : "warning",
      },
      {
        discomfortCategory: category,
        redFlagPrompted: choice.redFlag,
      },
    );
  }

  async function submitSimpleLog(
    action: SimpleModeCheckInAction,
    endpoint: string,
    payload: Record<string, unknown>,
    successResult: SimpleSuggestionState,
    checkInMetadata?: Record<string, string | number | boolean | null>,
  ) {
    setSaving(action);
    let saved = false;

    try {
      const headers = await getSupabaseRequestHeaders({
        "Content-Type": "application/json",
        Accept: "application/json",
      });
      const result = await saveSimpleModeAction({
        action,
        endpoint,
        payload,
        checkInMetadata,
        postJson: (postEndpoint, postPayload) =>
          postWithAnonymousSession(postEndpoint, postPayload, headers),
      });
      saved = result.saved;
    } catch {
      saved = false;
    } finally {
      setSaving(null);
    }

    if (saved) {
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

  async function postWithAnonymousSession(
    endpoint: string,
    payload: Record<string, unknown>,
    headers: Headers,
  ) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: new Headers(headers),
        body: JSON.stringify(payload),
      });

      return response.ok;
    } catch {
      return false;
    }
  }

  function openPanel(panel: ActivePanel) {
    setResult(null);
    setActivePanel((current) => (current === panel ? null : panel));
  }

  function renderAction(choice: (typeof simpleActionChoices)[number]) {
    switch (choice.action) {
      case "photo":
        return (
          <PhotoJournalButton
            key={choice.action}
            disabled={saving !== null}
            label={choice.label}
            onResult={setResult}
          />
        );
      case "mood":
        return (
          <BigButton
            key={choice.action}
            emoji={choice.emoji}
            tone={activePanel === "mood" ? "default" : "soft"}
            disabled={saving !== null}
            onClick={() => openPanel("mood")}
          >
            {choice.label}
          </BigButton>
        );
      case "sick":
        return (
          <BigButton
            key={choice.action}
            emoji={choice.emoji}
            tone={activePanel === "sick" ? "warning" : "soft"}
            disabled={saving !== null}
            onClick={() => openPanel("sick")}
          >
            {saving === "sick" ? "保存中" : choice.label}
          </BigButton>
        );
      default:
        return (
          <BigButton
            key={choice.action}
            emoji={choice.emoji}
            tone={choice.action === "water" ? "default" : "soft"}
            disabled={saving !== null}
            onClick={() => void recordAction(choice.action)}
          >
            {saving === choice.action ? "保存中" : choice.label}
          </BigButton>
        );
    }
  }

  return (
    <main className="min-h-dvh bg-[linear-gradient(160deg,var(--health-bg-start),var(--background)_45%,var(--health-bg-end))] px-4 pb-[calc(7rem_+_env(safe-area-inset-bottom))] pt-6 sm:px-6 lg:px-8 lg:pb-10">
      <div className="mx-auto flex min-h-[calc(100dvh-3rem)] w-full max-w-2xl flex-col gap-5">
        <header className="grid gap-2 pt-2">
          <h1 className="text-4xl font-bold leading-tight tracking-normal text-foreground sm:text-5xl">
            今日做咗咩？
          </h1>
          <p className="text-xl font-semibold leading-8 text-muted-foreground sm:text-2xl">
            一撳就記低，屋企人放心。
          </p>
        </header>

        <section aria-label="Daily actions" className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2">
          {simpleActionChoices.map((choice) => renderAction(choice))}
        </section>

        {activePanel === "mood" ? (
          <section aria-label="Mood choices" className="grid gap-3 rounded-xl border border-border/70 bg-card/92 p-4 shadow-sm">
            <h2 className="text-2xl font-bold tracking-normal">今日心情？</h2>
            <SimpleMoodPicker disabled={saving !== null} onSelect={(mood) => void recordMood(mood)} />
          </section>
        ) : null}

        {activePanel === "sick" ? (
          <section aria-label="Feel sick choices" className="grid gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 shadow-sm">
            <h2 className="text-2xl font-bold tracking-normal">邊度唔舒服？</h2>
            <div className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2">
              {sickChoices.map((choice) => (
                <BigButton
                  key={choice.category}
                  emoji={choice.emoji}
                  tone={choice.redFlag ? "warning" : "soft"}
                  disabled={saving !== null}
                  onClick={() => void recordSickCategory(choice.category)}
                >
                  {choice.label}
                </BigButton>
              ))}
            </div>
          </section>
        ) : null}

        <SimpleSuggestion result={result} />

        <section aria-label="Family help" className="grid gap-3 pt-1">
          <CallFamilyButton disabled={saving !== null} onResult={setResult} />
          <EmergencyButton onEmergency={setResult} />
        </section>
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
