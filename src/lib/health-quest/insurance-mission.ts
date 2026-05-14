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
  zh: "整理你嘅保險問題。呢個唔係保險建議。我哋不會決定資格、定價、保障、索償結果或醫療服務取用。",
  en: "Organize your insurance questions. This is not insurance advice. We do not decide eligibility, pricing, coverage, claim outcomes, or care access.",
};

const forbiddenGuaranteePattern = /(you are covered|will be approved|claim should pass|premium|insurer must pay|decides your eligibility|一定受保|一定批核|索償會成功|保費改善|必須賠|決定資格)/iu;
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
