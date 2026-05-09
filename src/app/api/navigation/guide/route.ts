import { generateGuideMessage } from "@/lib/ai/health-guide";
import type { NavigationGuideRequest, NavigationGuideResponse } from "@/lib/ai/types";
import { analyzeIntake, type IntakeMode } from "@/lib/navigation-engine";

const intakeModes = new Set<IntakeMode>(["medical", "insurance", "policy"]);

export async function POST(request: Request) {
  const body = await readBody(request);

  if (!body) {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const input = typeof body.input === "string" ? body.input.trim() : "";
  const mode = typeof body.mode === "string" && intakeModes.has(body.mode as IntakeMode)
    ? (body.mode as IntakeMode)
    : null;

  if (!input || !mode) {
    return Response.json({ error: "Input and valid mode are required." }, { status: 400 });
  }

  const baseRecommendation = analyzeIntake(mode, input);
  const guide = await generateGuideMessage({
    input,
    mode,
    recommendation: baseRecommendation,
  });

  const response: NavigationGuideResponse = {
    recommendation: {
      ...baseRecommendation,
      assistantMessage: guide.message,
      ai: guide.ai,
      audit: [
        ...baseRecommendation.audit,
        `AI provider configured: ${guide.ai.provider}/${guide.ai.model}`,
        `AI guide status: ${guide.ai.status}`,
      ],
    },
    ai: guide.ai,
  };

  return Response.json(response);
}

async function readBody(request: Request): Promise<Partial<NavigationGuideRequest> | null> {
  try {
    return (await request.json()) as Partial<NavigationGuideRequest>;
  } catch {
    return null;
  }
}
