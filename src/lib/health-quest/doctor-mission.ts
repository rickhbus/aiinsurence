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

export function buildDoctorVisitPlainText(answers: Record<string, string>) {
  const summary = buildDoctorVisitSummary(answers);

  return [
    summary.title,
    `Main concern: ${summary.mainConcern}`,
    `Timeline: ${summary.timeline}`,
    `Pattern: ${summary.patternSummary}`,
    `Tried: ${summary.tried}`,
    summary.questions.length > 0 ? `Questions: ${summary.questions.join(" | ")}` : null,
    summary.disclaimer.en,
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildDoctorVisitPrintableHtml(answers: Record<string, string>) {
  const summary = buildDoctorVisitSummary(answers);
  const questions = summary.questions.length > 0
    ? summary.questions.map((question) => `<li>${escapeHtml(question)}</li>`).join("")
    : "<li>No questions entered.</li>";

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(summary.title)}</title>
  <style>
    body { font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #111827; line-height: 1.55; padding: 32px; }
    main { max-width: 760px; margin: 0 auto; }
    h1 { font-size: 28px; margin-bottom: 8px; }
    section { border-top: 1px solid #d1d5db; padding-top: 18px; margin-top: 18px; }
    .label { color: #4b5563; font-size: 12px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; }
    .disclaimer { background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 14px; }
    @media print { body { padding: 0; } button { display: none; } }
  </style>
</head>
<body>
  <main>
    <button onclick="window.print()">Print / Save as PDF</button>
    <h1>${escapeHtml(summary.title)}</h1>
    <p class="disclaimer">${escapeHtml(summary.disclaimer.en)}<br />${escapeHtml(summary.disclaimer.zh)}</p>
    <section><p class="label">Main concern</p><p>${escapeHtml(summary.mainConcern || "Not entered.")}</p></section>
    <section><p class="label">Timeline</p><p>${escapeHtml(summary.timeline || "Not entered.")}</p></section>
    <section><p class="label">Better or worse</p><p>${escapeHtml(summary.patternSummary || "Not entered.")}</p></section>
    <section><p class="label">Tried</p><p>${escapeHtml(summary.tried || "Not entered.")}</p></section>
    <section><p class="label">Questions</p><ul>${questions}</ul></section>
  </main>
</body>
</html>`;
}

export function containsEmergencyRedFlag(text: string) {
  return /(chest pain|severe breathing|cannot breathe|can't breathe|stroke|heavy bleeding|blood in stool|fainting|self-harm|suicide|abuse|violence|嚴重|胸痛|呼吸困難|唞唔到氣|中風|大量出血|大便有血|暈倒|自殺|自殘|虐待|暴力)/iu.test(text);
}

function splitQuestions(value: string) {
  return value
    .split(/\n|;|；/u)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 3);
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
