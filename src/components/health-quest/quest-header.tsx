import Link from "next/link";
import { ChevronRight, HeartPulse } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { healthQuestCopy } from "@/lib/health-quest/copy";
import type { DailyQuestState, QuestLocale } from "@/lib/health-quest/types";
import { text } from "@/lib/health-quest/copy";
import { EnergyBattery } from "./energy-battery";
import { StreakCard } from "./streak-card";
import { XPCard } from "./xp-card";

export function QuestHeader({
  state,
  locale,
}: {
  state: DailyQuestState;
  locale: QuestLocale;
}) {
  return (
    <section className="grid gap-4">
      <div className="flex flex-col gap-4 rounded-3xl border border-border/50 bg-card/72 p-5 shadow-sm backdrop-blur-xl sm:p-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <Badge variant="secondary" className="mb-3 gap-1">
            <HeartPulse aria-hidden="true" />
            Health Quest / Super Family Doctor / 智健家庭醫生
          </Badge>
          <h1 className="text-3xl font-bold leading-tight tracking-normal sm:text-5xl">
            {text(healthQuestCopy.title, locale)}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
            {text(healthQuestCopy.subtitle, locale)}
          </p>
        </div>
        <Button asChild variant="outline" className="min-h-11 w-full sm:w-fit">
          <Link href="/today/advanced">
            Advanced Today
            <ChevronRight data-icon="inline-end" aria-hidden="true" />
          </Link>
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <StreakCard streak={state.streak} />
        <XPCard xp={state.earnedXpToday} />
        <EnergyBattery battery={state.energyBattery} />
      </div>
    </section>
  );
}
