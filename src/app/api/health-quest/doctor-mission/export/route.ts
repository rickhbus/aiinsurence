import { z } from "zod";
import {
  buildDoctorVisitPlainText,
  buildDoctorVisitPrintableHtml,
  buildDoctorVisitSummary,
} from "@/lib/health-quest/doctor-mission";
import { getAuthenticatedSupabase } from "@/lib/server/persistence-auth";
import { getRequestId, jsonWithRequestId } from "@/lib/server/request-context";

export const dynamic = "force-dynamic";

const exportQuerySchema = z.object({
  missionId: z.string().uuid(),
  format: z.enum(["json", "html"]).default("json"),
});

export async function GET(request: Request) {
  const requestId = getRequestId(request);
  const auth = await getAuthenticatedSupabase(request);

  if (!auth.ok) {
    return auth.response;
  }

  const url = new URL(request.url);
  const parsed = exportQuerySchema.safeParse({
    missionId: url.searchParams.get("missionId"),
    format: url.searchParams.get("format") ?? "json",
  });

  if (!parsed.success) {
    return jsonWithRequestId({ error: "Valid missionId is required." }, { status: 400 }, requestId);
  }

  const { data, error } = await auth.supabase
    .from("doctor_prep_answers")
    .select("step_key,answer_text")
    .eq("user_id", auth.user.id)
    .eq("mission_id", parsed.data.missionId);

  if (error) {
    return jsonWithRequestId({ error: "Doctor summary is temporarily unavailable." }, { status: 500 }, requestId);
  }

  const answers = Object.fromEntries((data ?? []).map((row) => [row.step_key, row.answer_text]));
  if (parsed.data.format === "html") {
    return new Response(buildDoctorVisitPrintableHtml(answers), {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "x-request-id": requestId,
      },
    });
  }

  return jsonWithRequestId(
    {
      summary: buildDoctorVisitSummary(answers),
      plainText: buildDoctorVisitPlainText(answers),
    },
    undefined,
    requestId,
  );
}
