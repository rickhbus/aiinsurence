"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { BookOpenCheck, CheckCircle2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { PlayButton } from "./play/play-button";
import { PlayCard } from "./play/play-card";
import { PlayBadge } from "./play/play-badge";
import { getDefaultPracticeItems, type ReviewItem } from "@/lib/health-quest/review-scheduler";
import type { QuestLocale } from "@/lib/health-quest/types";
import { getSupabaseRequestHeaders } from "@/lib/supabase/client";

type PracticeResponse = {
  items?: ReviewItem[];
  xp?: number;
  completed?: boolean;
  completedNow?: boolean;
};

const practiceLabels: Record<string, { zh: string; en: string }> = {
  hydration_review: { zh: "補水複習", en: "Hydration review" },
  mood_review: { zh: "心情複習", en: "Mood review" },
  sleep_review: { zh: "睡眠複習", en: "Sleep review" },
  movement_review: { zh: "郁動複習", en: "Movement review" },
  doctor_prep_review: { zh: "就診準備複習", en: "Doctor prep review" },
  insurance_boundary_review: { zh: "保險界線複習", en: "Insurance boundary review" },
};

export function PracticePage({ locale }: { locale: QuestLocale }) {
  const [items, setItems] = useState<ReviewItem[]>(() => getDefaultPracticeItems());
  const [completed, setCompleted] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();
  const dueItems = useMemo(() => items.filter((item) => !completed.includes(item.id)), [completed, items]);

  useEffect(() => {
    let active = true;

    async function loadPractice() {
      try {
        const headers = await getSupabaseRequestHeaders({ Accept: "application/json" });
        const response = await fetch("/api/health-quest/practice", { headers });
        const body = (await response.json().catch(() => null)) as PracticeResponse | null;
        if (active && response.ok && body?.items) {
          setItems(body.items);
        }
      } catch {
        // Keep demo review loop available.
      }
    }

    void loadPractice();

    return () => {
      active = false;
    };
  }, []);

  function completePractice(item: ReviewItem) {
    startTransition(async () => {
      try {
        const headers = await getSupabaseRequestHeaders({ "Content-Type": "application/json", Accept: "application/json" });
        const response = await fetch("/api/health-quest/practice", {
          method: "POST",
          headers,
          body: JSON.stringify({ itemId: item.id, itemType: item.itemType }),
        });
        const body = (await response.json().catch(() => null)) as PracticeResponse | null;

        if (!response.ok || !body?.completed) {
          throw new Error("Practice was not saved");
        }

        setCompleted((current) => Array.from(new Set([...current, item.id])));
        toast.success(body.completedNow
          ? (locale === "en" ? `Practice complete. +${body.xp ?? 5} XP` : `練習完成。+${body.xp ?? 5} XP`)
          : (locale === "en" ? "Already completed today." : "今日已完成。"));
      } catch {
        setCompleted((current) => Array.from(new Set([...current, item.id])));
        toast.message(locale === "en" ? "Practice preview completed on this device." : "練習預覽已在此裝置完成。");
      }
    });
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-5">
      <section className="rounded-[1.8rem] border border-sky-500/15 bg-card/80 p-5 shadow-sm backdrop-blur-xl">
        <p className="text-sm font-black text-sky-700 dark:text-sky-200">{locale === "en" ? "Practice" : "練習"}</p>
        <h1 className="mt-1 text-3xl font-black tracking-normal sm:text-5xl">{locale === "en" ? "Review loop" : "複習循環"}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          {locale === "en"
            ? "Short review sessions refresh safe habit and boundary knowledge. No diagnosis, treatment, or insurance guarantees."
            : "短練習用來重溫安全習慣和保險界線。不作診斷、治療或保險保證。"}
        </p>
      </section>

      <div className="grid gap-3">
        {dueItems.length > 0 ? dueItems.map((item) => (
          <PlayCard key={item.id} className="grid gap-3 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center">
            <span className="grid size-12 place-items-center rounded-2xl bg-sky-500/10 text-sky-700 dark:text-sky-200">
              <RefreshCw aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h2 className="text-lg font-black tracking-normal">{practiceLabels[item.itemType]?.[locale === "en" ? "en" : "zh"] ?? item.itemType}</h2>
              <p className="text-sm leading-6 text-muted-foreground">
                {locale === "en" ? "One quick card, one safe reminder." : "一張小卡，一個安全提醒。"}
              </p>
            </div>
            <PlayButton disabled={isPending} onClick={() => completePractice(item)}>
              <CheckCircle2 data-icon="inline-start" aria-hidden="true" />
              {locale === "en" ? "Practice" : "開始"}
            </PlayButton>
          </PlayCard>
        )) : (
          <PlayCard className="grid justify-items-center gap-3 text-center">
            <BookOpenCheck aria-hidden="true" className="size-10 text-emerald-500" />
            <h2 className="text-xl font-black tracking-normal">{locale === "en" ? "All caught up" : "已完成今日複習"}</h2>
            <PlayBadge tone="success">{locale === "en" ? "Review XP counted once" : "複習 XP 只計一次"}</PlayBadge>
          </PlayCard>
        )}
      </div>
    </div>
  );
}
