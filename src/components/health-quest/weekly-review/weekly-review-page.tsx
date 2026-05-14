"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { text } from "@/lib/health-quest/copy";
import type { QuestLocale } from "@/lib/health-quest/types";
import type { WeeklyHealthQuestReview } from "@/lib/health-quest/weekly-review";
import { getSupabaseRequestHeaders } from "@/lib/supabase/client";
import { WeeklyBestHabit } from "./weekly-best-habit";
import { WeeklyBossCard } from "./weekly-boss-card";
import { WeeklyDoctorPrepPrompt } from "./weekly-doctor-prep-prompt";
import { WeeklyHabitBreakdown } from "./weekly-habit-breakdown";
import { WeeklyMakeEasierCard } from "./weekly-make-easier-card";
import { WeeklyNextGoalCard } from "./weekly-next-goal-card";
import { WeeklyRecoveryCard } from "./weekly-recovery-card";
import { WeeklyShareCard } from "./weekly-share-card";

type ReviewResponse = {
  review?: WeeklyHealthQuestReview;
};

export function WeeklyReviewPage({ locale = "zh-Hant" }: { locale?: QuestLocale }) {
  const [review, setReview] = useState<WeeklyHealthQuestReview | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      const headers = await getSupabaseRequestHeaders({ Accept: "application/json" });
      const response = await fetch("/api/health-quest/weekly-review", { headers });
      const body = (await response.json().catch(() => null)) as ReviewResponse | null;

      if (active && response.ok && body?.review) {
        setReview(body.review);
      }
    }

    void load().catch(() => undefined);

    return () => {
      active = false;
    };
  }, []);

  if (!review) {
    return (
      <div className="mx-auto max-w-5xl rounded-3xl border border-border/60 bg-card/80 p-6">
        {locale === "en" ? "Loading weekly review..." : "載入一週回顧..."}
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
      <section className="rounded-3xl border border-border/60 bg-card/80 p-5 shadow-sm">
        <Badge variant="secondary" className="mb-3">Weekly Review</Badge>
        <h1 className="text-3xl font-bold tracking-normal">{locale === "en" ? "This Week, Not Perfect — Just Consistent" : "今週唔求完美，只求持續"}</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {locale === "en" ? "Review what helped, what got in the way, and what to make easier next week." : "睇返咩有幫助、咩阻住你、下星期邊件事可以再簡化。"}
        </p>
      </section>
      <WeeklyBossCard review={review} locale={locale} />
      <div className="grid gap-4 lg:grid-cols-2">
        <WeeklyHabitBreakdown consistent={review.mostConsistentHabit} skipped={review.mostSkippedHabit} locale={locale} />
        <WeeklyBestHabit habit={review.mostConsistentHabit} locale={locale} />
        <WeeklyMakeEasierCard suggestion={review.makeEasierSuggestion} locale={locale} />
        <WeeklyRecoveryCard recoveryDays={review.recoveryDays} safetyEvents={review.safetyEventCount} locale={locale} />
      </div>
      <WeeklyNextGoalCard goal={review.nextTinyGoal} locale={locale} />
      <WeeklyDoctorPrepPrompt prompt={review.doctorPrepPrompt} locale={locale} />
      <WeeklyShareCard locale={locale} />
      <footer className="rounded-3xl border border-border/60 bg-card/80 p-4 text-xs leading-5 text-muted-foreground">
        {review.disclaimers.map((disclaimer) => (
          <p key={disclaimer.en}>{text(disclaimer, locale)}</p>
        ))}
      </footer>
    </div>
  );
}
