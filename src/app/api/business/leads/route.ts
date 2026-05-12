import { businessLeadSchema } from "@/lib/health-os/validators";
import { readValidatedJson } from "@/lib/server/persistence-auth";
import { getRequestId, jsonWithRequestId } from "@/lib/server/request-context";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  const parsed = await readValidatedJson(request, businessLeadSchema);

  if (!parsed.ok) {
    return parsed.response;
  }

  const supabase = await createClient();

  if (!supabase) {
    return jsonWithRequestId(
      { error: "Lead capture is temporarily unavailable." },
      { status: 503 },
      requestId,
    );
  }

  const { error } = await supabase
    .from("business_leads")
    .insert({
      lead_type: parsed.data.leadType,
      company_name: parsed.data.companyName,
      contact_name: parsed.data.contactName,
      email: parsed.data.email,
      phone: parsed.data.phone,
      message: parsed.data.message,
      consent_to_contact: parsed.data.consentToContact,
    });

  if (error) {
    return jsonWithRequestId(
      { error: "Lead capture is temporarily unavailable." },
      { status: 500 },
      requestId,
    );
  }

  return jsonWithRequestId({ ok: true }, undefined, requestId);
}
