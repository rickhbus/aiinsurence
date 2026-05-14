import { z } from "zod";
import { updateCoachStyle } from "@/lib/health-quest/profile";
import { getAuthenticatedSupabase, readValidatedJson } from "@/lib/server/persistence-auth";
import { getRequestId, jsonWithRequestId } from "@/lib/server/request-context";

export const dynamic = "force-dynamic";

const coachStyleSchema = z.object({
  coachStyle: z.enum(["gentle", "direct", "family_doctor", "gym", "calm", "bilingual"]),
});

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  const parsed = await readValidatedJson(request, coachStyleSchema);

  if (!parsed.ok) {
    return parsed.response;
  }

  const auth = await getAuthenticatedSupabase(request);

  if (!auth.ok) {
    return auth.response;
  }

  try {
    const profile = await updateCoachStyle(auth.supabase, auth.user.id, parsed.data.coachStyle);
    return jsonWithRequestId({ profile }, undefined, requestId);
  } catch {
    return jsonWithRequestId({ error: "Coach style could not be saved." }, { status: 500 }, requestId);
  }
}
