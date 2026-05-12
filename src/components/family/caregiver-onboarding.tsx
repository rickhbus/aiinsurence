"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  normalizeUserMode,
  shouldRecommendFamilyCare,
  userModeStorageKey,
  type UserMode,
} from "@/lib/family/user-mode";

const choices: Array<{ mode: UserMode; label: string }> = [
  { mode: "self", label: "我自己用" },
  { mode: "parent", label: "幫爸爸媽媽用" },
  { mode: "caregiver", label: "照顧長者" },
];

export function CaregiverOnboarding() {
  const [loaded, setLoaded] = useState(false);
  const [selectedMode, setSelectedMode] = useState<UserMode | null>(null);
  const [hasStoredMode, setHasStoredMode] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const stored = normalizeUserMode(window.localStorage.getItem(userModeStorageKey));
      setSelectedMode(stored);
      setHasStoredMode(Boolean(stored));
      setLoaded(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  function chooseMode(mode: UserMode) {
    window.localStorage.setItem(userModeStorageKey, mode);
    setSelectedMode(mode);
    setHasStoredMode(true);
  }

  if (!loaded || (hasStoredMode && !shouldRecommendFamilyCare(selectedMode))) {
    return null;
  }

  if (hasStoredMode && shouldRecommendFamilyCare(selectedMode)) {
    return (
      <Card className="border-border/70 bg-card/95 shadow-sm">
        <CardHeader>
          <CardTitle className="text-2xl tracking-normal">設定家庭分享 / Set up family sharing</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Button asChild size="lg" className="min-h-14 rounded-xl text-lg font-bold">
            <Link href="/family">去家庭分享 / Family</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="min-h-14 rounded-xl text-lg font-bold">
            <Link href="/pricing">睇 Family Care / See Family Care</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/70 bg-card/95 shadow-sm">
      <CardHeader>
        <CardTitle className="text-3xl tracking-normal">你係邊位？</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">
        {choices.map((choice) => (
          <Button
            key={choice.mode}
            type="button"
            size="lg"
            variant={choice.mode === "self" ? "default" : "outline"}
            className="min-h-16 justify-start rounded-xl px-5 text-left text-xl font-bold"
            onClick={() => chooseMode(choice.mode)}
          >
            {choice.label}
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}
