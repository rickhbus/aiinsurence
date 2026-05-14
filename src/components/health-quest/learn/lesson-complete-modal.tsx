"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { QuestLocale } from "@/lib/health-quest/types";

export function LessonCompleteModal({ open, onOpenChange, locale }: { open: boolean; onOpenChange: (open: boolean) => void; locale: QuestLocale }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{locale === "en" ? "Lesson complete" : "小課完成"}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">+5 XP</p>
      </DialogContent>
    </Dialog>
  );
}
