import { PlayMascotPlaceholder, type MascotMood } from "../play/play-mascot-placeholder";

export function Mascot({ mood = "idle", size = "md" }: { mood?: MascotMood; size?: "sm" | "md" | "lg" }) {
  return <PlayMascotPlaceholder mood={mood} size={size} />;
}

