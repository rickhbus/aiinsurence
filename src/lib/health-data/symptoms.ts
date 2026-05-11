import { analyzeIntake } from "@/lib/navigation-engine";
import {
  assertUserId,
  throwIfSupabaseError,
  type HealthDataClient,
} from "./common";
import {
  EMERGENCY_COPY_ZH,
  MEDICAL_DISCLAIMER_ZH,
  type SymptomRoutingResponse,
} from "./types";
import { symptomRoutingInputSchema } from "./validation";

export function routeSymptoms(input: unknown): SymptomRoutingResponse {
  const payload = symptomRoutingInputSchema.parse(input);
  const recommendation = analyzeIntake("medical", payload.input);
  const redFlagDetected = recommendation.urgency.level === 1;

  return {
    redFlagDetected,
    careLevel: redFlagDetected
      ? "emergency"
      : recommendation.urgency.level === 2
        ? "gp"
        : recommendation.possibleDepartments.some((department) => /special|專科|orthopaedics|dermatology|ophthalmology/iu.test(department))
          ? "specialist"
          : "self-care-education",
    summary: recommendation.urgency.summary,
    reason: recommendation.audit.join(" "),
    nextStep: redFlagDetected ? EMERGENCY_COPY_ZH : recommendation.nextAction,
    safetyNote: redFlagDetected ? EMERGENCY_COPY_ZH : MEDICAL_DISCLAIMER_ZH,
    notDiagnosis: "這不是診斷。",
  };
}

export async function saveSymptomCheck(
  supabase: HealthDataClient,
  userId: string,
  input: string,
  response: SymptomRoutingResponse,
) {
  assertUserId(userId);

  const { data, error } = await supabase
    .from("symptom_checks")
    .insert({
      user_id: userId,
      symptom_text: input.slice(0, 180),
      red_flags: response.redFlagDetected ? ["red_flag_detected"] : [],
      suggested_next_step:
        response.careLevel === "emergency"
          ? "ae_emergency"
          : response.careLevel === "gp"
            ? "gp_family_doctor"
            : response.careLevel === "specialist"
              ? "specialist"
              : "self_care_education",
      safety_locked: response.redFlagDetected,
      disclaimer: response.notDiagnosis,
    })
    .select("*")
    .single();

  throwIfSupabaseError(error, "save symptom check");

  return data;
}
