import { trackServerEvent } from "@/lib/analytics/events";
import { saveSymptomCheck, routeSymptoms } from "@/lib/health-data/symptoms";
import { symptomRoutingInputSchema } from "@/lib/health-data/validation";
import { readValidatedJson } from "@/lib/server/persistence-auth";
import { checkIpRateLimit, getRequestIp } from "@/lib/server/rate-limit";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const parsed = await readValidatedJson(request, symptomRoutingInputSchema);

  if (!parsed.ok) {
    return parsed.response;
  }

  const response = routeSymptoms(parsed.data);

  if (!response.redFlagDetected) {
    const limit = checkIpRateLimit({
      ip: getRequestIp(request),
      route: "/api/symptom-routing",
      limit: 30,
      windowMs: 24 * 60 * 60 * 1000,
    });

    if (!limit.allowed) {
      return Response.json(
        { error: limit.message },
        { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
      );
    }
  }

  const supabase = await createClient();

  if (supabase) {
    const { data } = await supabase.auth.getUser();

    if (data.user) {
      void saveSymptomCheck(
        supabase,
        data.user.id,
        parsed.data.input,
        response,
      ).catch(() => undefined);
      void trackServerEvent({
        supabase,
        userId: data.user.id,
        event: "symptom_routing_completed",
        metadata: {
          redFlag: response.redFlagDetected,
          careLevel: response.careLevel,
        },
      }).catch(() => undefined);
    }
  }

  return Response.json(response);
}
