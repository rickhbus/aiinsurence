"use client";

import { BigButton } from "./big-button";

export type SimpleMood = "good" | "okay" | "not-good";

const moodChoices: Array<{
  mood: SimpleMood;
  emoji: string;
  label: string;
}> = [
  { mood: "good", emoji: "😊", label: "好 / Good" },
  { mood: "okay", emoji: "😐", label: "一般 / Okay" },
  { mood: "not-good", emoji: "😣", label: "唔舒服 / Not good" },
];

export function SimpleMoodPicker({
  disabled,
  onSelect,
}: {
  disabled?: boolean;
  onSelect: (mood: SimpleMood) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {moodChoices.map((choice) => (
        <BigButton
          key={choice.mood}
          emoji={choice.emoji}
          tone={choice.mood === "not-good" ? "warning" : "soft"}
          disabled={disabled}
          onClick={() => onSelect(choice.mood)}
        >
          {choice.label}
        </BigButton>
      ))}
    </div>
  );
}
