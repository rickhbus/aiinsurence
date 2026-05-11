import { trackServerEvent } from "@/lib/analytics/events";
import {
  buildInsuranceHelper,
  saveInsuranceNote,
} from "@/lib/health-data/insurance";
import { insuranceHelperInputSchema } from "@/lib/health-data/validation";
import { readValidatedJson } from "@/lib/server/persistence-auth";
import { checkIpRateLimit, getRequestIp } from "@/lib/server/rate-limit";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const parsed = await readValidatedJson(request, insuranceHelperInputSchema);

  if (!parsed.ok) {
    return parsed.response;
  }

  const limit = checkIpRateLimit({
    ip: getRequestIp(request),
    route: "/api/insurance-helper",
    limit: 20,
    windowMs: 24 * 60 * 60 * 1000,
  });

  if (!limit.allowed) {
    return Response.json(
      { error: limit.message },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  const response = buildInsuranceHelper(parsed.data);
  const supabase = await createClient();

  if (supabase) {
    const { data } = await supabase.auth.getUser();

    if (data.user) {
      void saveInsuranceNote(supabase, data.user.id, parsed.data, response).catch(
        () => undefined,
      );
      void trackServerEvent({
        supabase,
        userId: data.user.id,
        event: "insurance_helper_used",
        metadata: { insuranceType: parsed.data.insurance_type },
      }).catch(() => undefined);
    }
  }

  return Response.json(response);
}
