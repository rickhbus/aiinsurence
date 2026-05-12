import { analyzeIntake } from "@/lib/navigation-engine";
import type { SafetyStatus, ToiletContext, GymWorkoutContext } from "./types";

const gymEmergencyTerms = [
  "chest pain",
  "胸痛",
  "胸口痛",
  "fainting",
  "昏厥",
  "severe dizziness",
  "嚴重暈眩",
  "shortness of breath",
  "呼吸困難",
  "severe sudden pain",
  "突然劇痛",
  "neurological",
  "中風",
  "半身無力",
  "口齒不清",
];

const crisisTerms = [
  "自殺",
  "自殘",
  "傷害自己",
  "suicidal",
  "self harm",
  "hurt myself",
  "kill myself",
  "abuse",
  "violence",
  "家暴",
  "暴力",
];

export function detectEmergencyFromText(text: string | null | undefined) {
  const trimmed = text?.trim();

  if (!trimmed) {
    return [];
  }

  const result = analyzeIntake("medical", trimmed);

  return result.urgency.level === 1 ? result.matchedSignals : [];
}

export function detectCrisisFromText(text: string | null | undefined) {
  const normalized = text?.toLowerCase() ?? "";

  return crisisTerms.filter((term) => normalized.includes(term.toLowerCase()));
}

export function detectGymSafetyFlags(workout: GymWorkoutContext) {
  const notes = [
    workout.notes,
    ...(workout.redFlagSymptoms ?? []),
    ...(workout.sets ?? []).map((set) => set.formNote),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  const termFlags = gymEmergencyTerms.filter((term) => notes.includes(term.toLowerCase()));
  const movementPain = (workout.sets ?? []).some((set) => set.painFlag) || workout.painFlag;

  return {
    emergencyFlags: Array.from(new Set([...termFlags, ...detectEmergencyFromText(notes)])),
    movementPain,
  };
}

export function detectToiletSafety(toilet: ToiletContext) {
  const notes = toilet.notes ?? "";
  const emergencyText = detectEmergencyFromText(notes);
  const flags: string[] = [];

  if (toilet.bloodFlag) {
    flags.push("blood_in_stool_or_urine");
  }

  if (toilet.painFlag && /severe|劇痛|嚴重|不能站|右下腹/iu.test(notes)) {
    flags.push("severe_abdominal_or_urinary_pain");
  }

  if (toilet.dehydrationConcern && /dizz|confus|暈|混亂|神志/iu.test(notes)) {
    flags.push("dehydration_with_dizziness_or_confusion");
  }

  if (toilet.feverFlag && toilet.painFlag) {
    flags.push("fever_with_pain");
  }

  return {
    flags: Array.from(new Set([...flags, ...emergencyText])),
    status: flags.length > 0 || emergencyText.length > 0 ? "red" as SafetyStatus : toilet.painFlag ? "yellow" as SafetyStatus : "green" as SafetyStatus,
  };
}

export function statusFromFlags(flags: string[]): SafetyStatus {
  if (flags.some((flag) => /999|emergency|chest|stroke|self|blood|severe|劇痛|胸痛|中風/iu.test(flag))) {
    return "red";
  }

  return flags.length > 0 ? "yellow" : "green";
}

export function emergencyGuidanceZh() {
  return "如有胸痛、呼吸困難、嚴重暈眩、中風徵兆、自殘念頭或其他緊急情況，請立即致電 999 或前往急症室，不要等待 AI 或保險確認。";
}

export function emergencyGuidanceEn() {
  return "If you have chest pain, difficulty breathing, severe dizziness, stroke-like symptoms, thoughts of self-harm, or another emergency, call 999 or go to Accident & Emergency now.";
}
