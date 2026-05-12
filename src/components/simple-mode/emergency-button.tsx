"use client";

import { BigButton } from "./big-button";
import type { SimpleSuggestionState } from "./simple-suggestion";

export const simpleEmergencyCopy =
  "如有胸痛、呼吸困難、嚴重暈眩、中風徵兆、自殘念頭或其他緊急情況，請立即致電 999 或前往急症室。";

export function EmergencyButton({
  onEmergency,
}: {
  onEmergency: (result: SimpleSuggestionState) => void;
}) {
  return (
    <BigButton
      emoji="🚨"
      tone="danger"
      onClick={() =>
        onEmergency({
          confirmation: "緊急 / Emergency",
          suggestion: simpleEmergencyCopy,
          tone: "danger",
        })
      }
    >
      緊急 999
    </BigButton>
  );
}
