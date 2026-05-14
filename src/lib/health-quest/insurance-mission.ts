import { z } from "zod";
import type { LocalizedText } from "./types";

export const insuranceMissionSchema = z.object({
  policyType: z.string().trim().max(120).optional().nullable(),
  preparingFor: z.string().trim().max(240).optional().nullable(),
  documents: z.array(z.string().trim().max(80)).max(20).default([]),
  questions: z.array(z.string().trim().max(180)).max(10).default([]),
  explicitSensitiveTextSaveConsent: z.boolean().default(false),
});

export const insuranceBoundary: LocalizedText = {
  zh: "整理想問保險公司、經紀、僱主或持牌顧問嘅問題。整理問題，不作保險建議。本功能不決定保障、定價、索償、資格或醫療服務取用。",
  en: "Prepare clear questions for your insurer, broker, employer, or licensed adviser. Organize questions, not insurance advice. This does not decide coverage, pricing, claims, eligibility, or care access.",
};

const forbiddenGuaranteePattern = /(you are covered|will be approved|claim (should|will) pass|premium|insurer must pay|decides? (your )?eligibility|一定受保|一定批核|索償會成功|保費改善|必須賠|決定資格)/iu;
const sensitiveInsurancePattern = /(policy text|claim text|保單全文|索償全文|hkid|身份證|phone|電話|email|電郵)/iu;

export function sanitizeInsuranceMissionInput(input: z.infer<typeof insuranceMissionSchema>) {
  return {
    policyType: sanitizeShort(input.policyType),
    preparingFor: sanitizeShort(input.preparingFor),
    documents: input.documents.filter((item) => !sensitiveInsurancePattern.test(item)).slice(0, 20),
    questions: input.questions.filter((item) => !forbiddenGuaranteePattern.test(item)).slice(0, 10),
  };
}

export function containsInsuranceGuarantee(text: string) {
  return forbiddenGuaranteePattern.test(text);
}

function sanitizeShort(value: string | null | undefined) {
  if (!value || sensitiveInsurancePattern.test(value) || forbiddenGuaranteePattern.test(value)) {
    return null;
  }

  return value.slice(0, 240);
}
