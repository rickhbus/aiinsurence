import { buildFamilyWeeklyPreview, buildFamilyWeeklyReport, getWeekStart } from "@/lib/family/family-weekly-report";
import { planEntitlements } from "@/lib/payments/entitlements";
import { getAuthenticatedSupabase } from "@/lib/server/persistence-auth";
import { getRequestId, jsonWithRequestId } from "@/lib/server/request-context";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestId = getRequestId(request);
  const auth = await getAuthenticatedSupabase(request);

  if (!auth.ok) {
    return auth.response;
  }

  const weekStart = getWeekStart();
  const weekEnd = new Date(weekStart);
  weekEnd.setUTCDate(weekEnd.getUTCDate() + 7);

  const [entitlement, checkins, alerts, appointments] = await Promise.all([
    auth.supabase
      .from("subscription_entitlements")
      .select("plan,status,features")
      .eq("user_id", auth.user.id)
      .maybeSingle(),
    auth.supabase
      .from("daily_checkins")
      .select("checkin_type,label,note,metadata,created_at")
      .eq("user_id", auth.user.id)
      .gte("created_at", weekStart.toISOString())
      .lt("created_at", weekEnd.toISOString()),
    auth.supabase
      .from("family_alerts")
      .select("alert_type,created_at")
      .eq("user_id", auth.user.id)
      .gte("created_at", weekStart.toISOString())
      .lt("created_at", weekEnd.toISOString()),
    auth.supabase
      .from("doctor_appointments")
      .select("appointment_date")
      .eq("user_id", auth.user.id)
      .gte("appointment_date", weekStart.toISOString())
      .lt("appointment_date", weekEnd.toISOString()),
  ]);

  const error = checkins.error ?? alerts.error ?? appointments.error;

  if (error) {
    return jsonWithRequestId({ error: "暫時未能載入家庭週報。" }, { status: 500 }, requestId);
  }

  const report = buildFamilyWeeklyReport({
    checkins: checkins.data ?? [],
    alerts: alerts.data ?? [],
    appointments: appointments.data ?? [],
    weekStart,
  });
  const plan = String(entitlement.data?.plan ?? "free");
  const features = planEntitlements[plan as keyof typeof planEntitlements] ?? planEntitlements.free;
  const canViewFull = entitlement.data?.status === "active" && features.familyWeeklyReport === true;

  if (!canViewFull) {
    return jsonWithRequestId({
      paid: false,
      preview: buildFamilyWeeklyPreview(report),
      report: {
        checkInDays: report.checkInDays,
      },
    }, undefined, requestId);
  }

  return jsonWithRequestId({ paid: true, report }, undefined, requestId);
}
