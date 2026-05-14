import { z } from "zod";
import { trackHealthQuestEvent } from "@/lib/health-quest/analytics";
import { explainQuest } from "@/lib/health-quest/quest-explanations";
import { getAuthenticatedSupabase, readValidatedJson } from "@/lib/server/persistence-auth";
import { getRequestId, jsonWithRequestId } from "@/lib/server/request-context";

export const dynamic = "force-dynamic";

const whyThisSchema = z.object({
  questId: z.string().trim().min(1).optional(),
  questType: z.enum([
    "wake",
    "water",
    "meal",
    "movement",
    "mood",
    "toilet_optional",
    "sleep_prep",
    "health_review",
    "doctor_prep",
    "recovery",
    "learn",
  ]),
});

export async function GET(request: Request) {
  const requestId = getRequestId(request);
  const url = new URL(request.url);
  const questType = url.searchParams.get("questType");
  const parsed = whyThisSchema.pick({ questType: true }).safeParse({ questType });

  if (!parsed.success) {
    return jsonWithRequestId({ error: "Invalid quest type." }, { status: 400 }, requestId);
  }

  return jsonWithRequestId({ explanation: explainQuest(parsed.data.questType) }, undefined, requestId);
}

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  const parsed = await readValidatedJson(request, whyThisSchema);

  if (!parsed.ok) {
    return parsed.response;
  }

  const auth = await getAuthenticatedSupabase(request);

  if (!auth.ok) {
    return auth.response;
  }

  try {
    await trackHealthQuestEvent(auth.supabase, {
      userId: auth.user.id,
      eventName: "quest_why_this_opened",
      properties: { questType: parsed.data.questType },
    });

    return jsonWithRequestId({ explanation: explainQuest(parsed.data.questType) }, undefined, requestId);
  } catch {
    return jsonWithRequestId({ error: "Quest explanation is temporarily unavailable." }, { status: 500 }, requestId);
  }
}
