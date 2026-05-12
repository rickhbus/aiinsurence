"use client";

import { BigButton } from "./big-button";
import { simpleMoodChoices } from "@/lib/health-app/senior-mode";

export type SimpleMood = "good" | "okay" | "not-good";

export function SimpleMoodPicker({
  disabled,
  onSelect,
}: {
  disabled?: boolean;
  onSelect: (mood: SimpleMood) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {simpleMoodChoices.map((choice) => (
        <BigButton
          key={choice.mood}
          emoji={choice.emoji}
          tone={choice.mood === "not-good" ? "warning" : "soft"}
          disabled={disabled}
          onClick={() => onSelect(choice.mood as SimpleMood)}
        >
          {choice.label}
        </BigButton>
      ))}
    </div>
  );
}
