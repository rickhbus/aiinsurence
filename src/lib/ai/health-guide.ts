import { generateText } from "ai";
import type { IntakeMode, Recommendation } from "../navigation-engine";
import { getGuideModel, getGuideRuntimeConfig } from "./provider";
import type { GuideRuntimeInfo } from "./types";

export const HEALTH_GUIDE_SYSTEM_PROMPT = `You are the voice of a calm 3D AI healthcare guide inside a minimalist healthcare app.

Your tone should feel:
- Human, warm, and reassuring
- Professional but not robotic
- Short and interactive
- Like the assistant is listening carefully
- Never dramatic unless there is a true emergency signal

You guide the user step by step.
Use short paragraphs.
Ask only 1-3 follow-up questions at a time.
Avoid overwhelming the user.

Safety rules:
- Use the deterministic triage result as the source of truth.
- Do not diagnose, prescribe, guarantee insurance coverage, or name specific insurance products.
- Do not lower urgency or contradict emergency guidance.
- If emergency signs appear, say firmly: "This may be urgent. Please call 999 or go to A&E now. Do not wait for AI or insurance confirmation."
- When the user is typing or giving symptoms, acknowledge first: "I understand. I’ll check urgent warning signs first, then suggest a safe next step."
- When the case is non-urgent, include: "Based on what you shared, this does not sound like an immediate emergency from the text alone, but a clinician should confirm."
- Reply in the user's language when clear. For mixed Chinese/English or Hong Kong context, prefer Traditional Chinese with concise English where helpful.`;

export async function generateGuideMessage({
  input,
  mode,
  recommendation,
}: {
  input: string;
  mode: IntakeMode;
  recommendation: Recommendation;
}): Promise<{ message: string; ai: GuideRuntimeInfo }> {
  const config = getGuideRuntimeConfig();

  if (recommendation.urgency.level === 1) {
    return {
      message: createGuideFallbackMessage(recommendation),
      ai: {
        provider: config.provider,
        model: config.model,
        status: "safety_locked",
      },
    };
  }

  if (!config.isConfigured) {
    return {
      message: createGuideFallbackMessage(recommendation),
      ai: {
        provider: config.provider,
        model: config.model,
        status: "unconfigured",
      },
    };
  }

  try {
    const { text } = await generateText({
      model: getGuideModel(config),
      system: HEALTH_GUIDE_SYSTEM_PROMPT,
      prompt: buildGuidePrompt({ input, mode, recommendation }),
      temperature: 0.2,
      maxOutputTokens: 260,
      maxRetries: 1,
      timeout: { totalMs: 8000 },
    });

    const message = normalizeGuideText(text) || createGuideFallbackMessage(recommendation);

    return {
      message,
      ai: {
        provider: config.provider,
        model: config.model,
        status: "generated",
      },
    };
  } catch {
    return {
      message: createGuideFallbackMessage(recommendation),
      ai: {
        provider: config.provider,
        model: config.model,
        status: "failed",
      },
    };
  }
}

export function createGuideFallbackMessage(recommendation: Recommendation) {
  if (recommendation.urgency.level === 1) {
    return "This may be urgent. Please call 999 or go to A&E now. Do not wait for AI or insurance confirmation.";
  }

  if (recommendation.urgency.level === 2) {
    return [
      "I understand. I’ll check urgent warning signs first, then suggest a safe next step.",
      recommendation.urgency.summary,
      recommendation.nextAction,
    ].join("\n\n");
  }

  if (recommendation.mode === "insurance" || recommendation.mode === "policy") {
    return [
      "I understand. I’ll keep this practical and avoid product recommendations.",
      recommendation.urgency.summary,
      recommendation.nextAction,
    ].join("\n\n");
  }

  return [
    "I understand. I’ll check urgent warning signs first, then suggest a safe next step.",
    "Based on what you shared, this does not sound like an immediate emergency from the text alone, but a clinician should confirm.",
    recommendation.nextAction,
  ].join("\n\n");
}

function buildGuidePrompt({
  input,
  mode,
  recommendation,
}: {
  input: string;
  mode: IntakeMode;
  recommendation: Recommendation;
}) {
  return `User input:
${input}

Mode:
${mode}

Deterministic triage result:
- Classification: ${recommendation.classification}
- Urgency: ${recommendation.urgency.label}
- Summary: ${recommendation.urgency.summary}
- Next action: ${recommendation.nextAction}
- Care route: ${recommendation.careRoute}
- Possible departments: ${recommendation.possibleDepartments.join(", ")}
- Insurance categories: ${recommendation.insuranceCategories.join(", ")}
- Escalation: ${recommendation.escalation}
- Disclaimer: ${recommendation.disclaimer}

Follow-up questions you may ask, max 3:
${recommendation.questions.slice(0, 3).map((question) => `- ${question}`).join("\n") || "- None"}

Write only the assistant message. Keep it short, calm, and interactive.`;
}

function normalizeGuideText(text: string) {
  return text.trim().replace(/^["']|["']$/g, "").slice(0, 1600);
}
