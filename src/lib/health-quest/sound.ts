export const healthQuestSounds = [
  "quest_complete",
  "streak_protected",
  "chest_open",
  "lesson_correct",
  "lesson_complete",
  "gentle_recovery",
] as const;

export type HealthQuestSound = typeof healthQuestSounds[number];

export function soundAllowed(input: {
  enabled: boolean;
  reducedMotion?: boolean;
  mode?: "normal" | "recovery" | "safety";
  sound: HealthQuestSound;
}) {
  if (!input.enabled || input.reducedMotion || input.mode === "safety") {
    return false;
  }

  return true;
}

export function playHealthQuestSound(input: {
  enabled: boolean;
  reducedMotion?: boolean;
  mode?: "normal" | "recovery" | "safety";
  sound: HealthQuestSound;
}) {
  if (!soundAllowed(input) || typeof window === "undefined") {
    return;
  }

  const audioContext = new AudioContext();
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  const frequency = input.sound === "chest_open" ? 660 : input.sound === "gentle_recovery" ? 330 : 520;

  oscillator.frequency.value = frequency;
  oscillator.type = "sine";
  gain.gain.value = 0.025;
  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start();
  oscillator.stop(audioContext.currentTime + 0.08);
}

