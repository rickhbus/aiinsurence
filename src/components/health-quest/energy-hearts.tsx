import { PlayEnergyHeart } from "./play/play-energy-heart";
import { PlayBadge } from "./play/play-badge";
import { deriveEnergyHearts } from "@/lib/health-quest/energy-hearts";
import { questText } from "@/lib/health-quest/play-system";
import type { DailyQuestState, QuestLocale } from "@/lib/health-quest/types";

export function EnergyHearts({ state, locale }: { state: DailyQuestState; locale: QuestLocale }) {
  const energy = deriveEnergyHearts({
    battery: state.energyBattery,
    adaptivePlan: state.adaptivePlan,
    mode: state.mode,
  });

  return (
    <PlayBadge tone={energy.recoverySuggested ? "recovery" : "primary"} className="gap-1.5">
      <span className="sr-only">{questText(energy.label, locale)}</span>
      {Array.from({ length: 5 }, (_, index) => (
        <PlayEnergyHeart key={index} filled={index < energy.hearts} recovery={energy.recoverySuggested} />
      ))}
    </PlayBadge>
  );
}

