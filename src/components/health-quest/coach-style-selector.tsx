"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { CoachStyle, QuestLocale } from "@/lib/health-quest/types";
import { getSupabaseRequestHeaders } from "@/lib/supabase/client";

const styles: CoachStyle[] = ["gentle", "direct", "family_doctor", "gym", "calm", "bilingual"];

export function CoachStyleSelector({ current = "gentle", locale }: { current?: CoachStyle; locale: QuestLocale }) {
  const [selected, setSelected] = useState<CoachStyle>(current);

  async function save(style: CoachStyle) {
    setSelected(style);
    try {
      const headers = await getSupabaseRequestHeaders({ "Content-Type": "application/json", Accept: "application/json" });
      await fetch("/api/health-quest/coach-style", {
        method: "POST",
        headers,
        body: JSON.stringify({ coachStyle: style }),
      });
      toast.success(locale === "en" ? "Coach style saved." : "教練語氣已保存。");
    } catch {
      toast.message(locale === "en" ? "Coach style changed locally." : "教練語氣已在本機更新。");
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {styles.map((style) => (
        <Button key={style} type="button" variant={selected === style ? "default" : "outline"} onClick={() => void save(style)}>
          {style}
        </Button>
      ))}
    </div>
  );
}
