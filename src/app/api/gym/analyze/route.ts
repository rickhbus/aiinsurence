import { analyzeGymWorkout } from "@/lib/health-os/gym-coach";
import { gymWorkoutSchema } from "@/lib/health-os/validators";
import { readValidatedJson } from "@/lib/server/persistence-auth";
import { getRequestId, jsonWithRequestId } from "@/lib/server/request-context";

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  const parsed = await readValidatedJson(request, gymWorkoutSchema);

  if (!parsed.ok) {
    return parsed.response;
  }

  return jsonWithRequestId({ analysis: analyzeGymWorkout(parsed.data) }, undefined, requestId);
}
