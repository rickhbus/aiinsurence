import { insuranceMissionSchema, sanitizeInsuranceMissionInput } from "@/lib/health-quest/insurance-mission";
import { getAuthenticatedSupabase, readValidatedJson } from "@/lib/server/persistence-auth";
import { getRequestId, jsonWithRequestId } from "@/lib/server/request-context";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestId = getRequestId(request);
  const auth = await getAuthenticatedSupabase(request);

  if (!auth.ok) {
    return auth.response;
  }

  const { data, error } = await auth.supabase
    .from("user_preferences")
    .select("*")
    .eq("user_id", auth.user.id)
    .eq("preference_key", "health_quest_insurance_mission")
    .maybeSingle();

  if (error) {
    return jsonWithRequestId({ error: "Insurance mission is temporarily unavailable." }, { status: 500 }, requestId);
  }

  return jsonWithRequestId({ mission: data?.preference_value ?? null }, undefined, requestId);
}

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  const parsed = await readValidatedJson(request, insuranceMissionSchema);

  if (!parsed.ok) {
    return parsed.response;
  }

  const auth = await getAuthenticatedSupabase(request);

  if (!auth.ok) {
    return auth.response;
  }

  const sanitized = sanitizeInsuranceMissionInput(parsed.data);
  const { data, error } = await auth.supabase
    .from("user_preferences")
    .upsert({
      user_id: auth.user.id,
      preference_key: "health_quest_insurance_mission",
      preference_value: {
        ...sanitized,
        boundary: "education_only_no_eligibility_pricing_coverage_claim_or_care_access_decisions",
      },
      source: "explicit_user_choice",
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id,preference_key" })
    .select("*")
    .single();

  if (error) {
    return jsonWithRequestId({ error: "Insurance mission could not be saved." }, { status: 500 }, requestId);
  }

  return jsonWithRequestId({ mission: data.preference_value }, undefined, requestId);
}
