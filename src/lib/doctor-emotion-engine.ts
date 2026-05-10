import type {
  DoctorEmotion,
  HumanDoctor3DState,
} from "@/components/human-doctor-3d";
import { analyzeIntake, type IntakeMode, type Recommendation } from "./navigation-engine";

export type DoctorEmotionCue =
  | "idle"
  | "greeting"
  | "typing"
  | "typing_risk"
  | "recording"
  | "checking"
  | "urgent"
  | "same_day"
  | "care_route"
  | "planning";

export type DoctorAffect = {
  state: HumanDoctor3DState;
  emotion: DoctorEmotion;
  cue: DoctorEmotionCue;
  intensity: number;
};

export function deriveDoctorAffect({
  input,
  isRecording,
  isSubmitting,
  mode,
  result,
  showGreeting,
}: {
  input: string;
  isRecording: boolean;
  isSubmitting: boolean;
  mode: IntakeMode;
  result: Recommendation | null;
  showGreeting: boolean;
}): DoctorAffect {
  const trimmedInput = input.trim();
  const pendingRisk =
    trimmedInput.length > 0 && !result ? analyzeIntake(mode, trimmedInput) : null;

  if (result?.urgency.level === 1) {
    return {
      state: "emergency",
      emotion: "urgent",
      cue: "urgent",
      intensity: 1,
    };
  }

  if (isSubmitting) {
    return {
      state: "thinking",
      emotion: "focused",
      cue: "checking",
      intensity: 0.46,
    };
  }

  if (result?.urgency.level === 2) {
    return {
      state: "explaining",
      emotion: "concerned",
      cue: "same_day",
      intensity: 0.56,
    };
  }

  if (result) {
    return {
      state: "explaining",
      emotion: "reassuring",
      cue: result.urgency.level === 4 ? "planning" : "care_route",
      intensity: result.urgency.level === 4 ? 0.24 : 0.32,
    };
  }

  if (showGreeting) {
    return {
      state: "explaining",
      emotion: "warm",
      cue: "greeting",
      intensity: 0.2,
    };
  }

  if (isRecording) {
    return {
      state: "listening",
      emotion: "listening",
      cue: "recording",
      intensity: 0.34,
    };
  }

  if (pendingRisk && pendingRisk.urgency.level <= 2) {
    return {
      state: "listening",
      emotion: "concerned",
      cue: "typing_risk",
      intensity: pendingRisk.urgency.level === 1 ? 0.44 : 0.36,
    };
  }

  if (trimmedInput.length > 0) {
    return {
      state: "listening",
      emotion: "listening",
      cue: "typing",
      intensity: 0.22,
    };
  }

  return {
    state: "ready",
    emotion: "warm",
    cue: "idle",
    intensity: 0.12,
  };
}
