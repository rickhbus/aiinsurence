"use client";

import { Volume2, VolumeX } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { QuestLocale } from "@/lib/health-quest/types";

const storageKey = "health-quest-sound-enabled";

export function SoundToggle({ locale }: { locale: QuestLocale }) {
  const [enabled, setEnabled] = useState(() =>
    typeof window !== "undefined" && window.localStorage.getItem(storageKey) === "true",
  );

  function toggle() {
    setEnabled((current) => {
      const next = !current;
      window.localStorage.setItem(storageKey, String(next));
      return next;
    });
  }

  return (
    <Button type="button" variant="outline" size="icon" onClick={toggle} aria-label={locale === "en" ? "Toggle Health Quest sounds" : "切換智健任務聲音"}>
      {enabled ? <Volume2 aria-hidden="true" /> : <VolumeX aria-hidden="true" />}
    </Button>
  );
}
