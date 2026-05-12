import { analyzeMood } from "@/lib/health-os/mood";
import { moodLogSchema } from "@/lib/health-os/validators";
import { readValidatedJson } from "@/lib/server/persistence-auth";
import { getRequestId, jsonWithRequestId } from "@/lib/server/request-context";

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  const parsed = await readValidatedJson(request, moodLogSchema);

  if (!parsed.ok) {
    return parsed.response;
  }

  return jsonWithRequestId({ analysis: analyzeMood({ ...parsed.data, locale: parsed.data.language }) }, undefined, requestId);
}
