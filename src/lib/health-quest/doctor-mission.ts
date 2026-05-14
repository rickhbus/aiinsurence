import { z } from "zod";
import type { LocalizedText } from "./types";

export const doctorMissionSteps = [
  "what_changed",
  "when_started",
  "better_or_worse",
  "tried",
  "top_questions",
  "export_summary",
] as const;

export const doctorMissionSchema = z.object({
  missionId: z.string().uuid().optional(),
  title: z.string().trim().max(120).optional().nullable(),
  answers: z.array(z.object({
    stepKey: z.enum(doctorMissionSteps),
    answerText: z.string().trim().max(1000),
  })).max(8).default([]),
});

export const doctorMissionDisclaimer: LocalizedText = {
  zh: "呢個係面診準備摘要，唔係診斷、治療建議或用藥建議。如有緊急或嚴重症狀，請立即致電 999 或前往急症室。",
  en: "This is a visit preparation summary, not a diagnosis, treatment advice, or medication advice. For urgent or severe symptoms, call 999 or go to Accident & Emergency now.",
};

export function buildDoctorVisitSummary(answers: Record<string, string>) {
  return {
    title: answers.what_changed?.slice(0, 120) || "Doctor visit preparation",
    mainConcern: answers.what_changed ?? "",
    timeline: answers.when_started ?? "",
    patternSummary: answers.better_or_worse ?? "",
    tried: answers.tried ?? "",
    questions: splitQuestions(answers.top_questions ?? ""),
    disclaimer: doctorMissionDisclaimer,
  };
}

export function containsEmergencyRedFlag(text: string) {
  return /(chest pain|severe breathing|stroke|heavy bleeding|fainting|self-harm|suicide|abuse|violence|嚴重|胸痛|呼吸困難|中風|大量出血|暈倒|自殺|自殘|虐待|暴力)/iu.test(text);
}

function splitQuestions(value: string) {
  return value
    .split(/\n|;|；/u)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 3);
}
