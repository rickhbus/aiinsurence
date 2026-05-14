"use client";

import { HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { text } from "@/lib/health-quest/copy";
import { explainQuest } from "@/lib/health-quest/quest-explanations";
import type { QuestLocale, QuestType } from "@/lib/health-quest/types";

export function WhyThisDialog({ questType, locale, onOpen }: { questType: QuestType; locale: QuestLocale; onOpen?: () => void }) {
  return (
    <Dialog onOpenChange={(open) => {
      if (open) {
        onOpen?.();
      }
    }}>
      <DialogTrigger asChild>
        <Button type="button" variant="ghost" size="sm">
          <HelpCircle data-icon="inline-start" aria-hidden="true" />
          {locale === "en" ? "Why this?" : "點解做呢個？"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{locale === "en" ? "Why this?" : "點解做呢個？"}</DialogTitle>
        </DialogHeader>
        <p className="text-sm leading-6 text-muted-foreground">{text(explainQuest(questType), locale)}</p>
      </DialogContent>
    </Dialog>
  );
}
