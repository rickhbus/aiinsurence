import { z } from "zod";
import { getAuthenticatedSupabase, readValidatedJson } from "@/lib/server/persistence-auth";
import { getRequestId, jsonWithRequestId } from "@/lib/server/request-context";

export const dynamic = "force-dynamic";

const appointmentSchema = z.object({
  appointmentDate: z.string().datetime(),
  clinicName: z.string().trim().max(160).optional().nullable(),
  doctorName: z.string().trim().max(160).optional().nullable(),
  reason: z.string().trim().max(500).optional().nullable(),
  questions: z.array(z.string().trim().min(1).max(200)).max(12).default([]),
  documentsToBring: z.array(z.string().trim().min(1).max(200)).max(12).default([]),
});

export async function GET(request: Request) {
  const requestId = getRequestId(request);
  const auth = await getAuthenticatedSupabase(request);

  if (!auth.ok) {
    return auth.response;
  }

  const { data, error } = await auth.supabase
    .from("doctor_appointments")
    .select("id,appointment_date,clinic_name,doctor_name,reason,questions,documents_to_bring,created_at,updated_at")
    .eq("user_id", auth.user.id)
    .order("appointment_date", { ascending: true })
    .limit(20);

  if (error) {
    return jsonWithRequestId({ error: "暫時未能載入覆診資料。" }, { status: 500 }, requestId);
  }

  return jsonWithRequestId({ appointments: data ?? [] }, undefined, requestId);
}

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  const parsed = await readValidatedJson(request, appointmentSchema);

  if (!parsed.ok) {
    return parsed.response;
  }

  const auth = await getAuthenticatedSupabase(request);

  if (!auth.ok) {
    return auth.response;
  }

  const { data, error } = await auth.supabase
    .from("doctor_appointments")
    .insert({
      user_id: auth.user.id,
      appointment_date: parsed.data.appointmentDate,
      clinic_name: parsed.data.clinicName ?? null,
      doctor_name: parsed.data.doctorName ?? null,
      reason: parsed.data.reason ?? null,
      questions: parsed.data.questions,
      documents_to_bring: parsed.data.documentsToBring,
    })
    .select("id,appointment_date,clinic_name,doctor_name,reason,questions,documents_to_bring,created_at,updated_at")
    .single();

  if (error) {
    return jsonWithRequestId({ error: "暫時未能保存覆診資料。" }, { status: 500 }, requestId);
  }

  return jsonWithRequestId({ appointment: data }, undefined, requestId);
}
